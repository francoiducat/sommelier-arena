---
id: cloudflare-wrangler
title: Cloudflare & Wrangler — CLI-first deploy
sidebar_label: Wrangler & Cloudflare
audience: developer
tags: [cloudflare, wrangler, ci, deploy]
---

# Cloudflare & Wrangler — CLI-first deploy

This guide shows reproducible, scriptable commands to manage Cloudflare resources for Sommelier Arena using Wrangler and the Cloudflare API. Prefer CLI automation over Dashboard steps for CI and reproducibility.

## Prerequisites

- `npx wrangler` available (no global install required)
- `CF_API_TOKEN` with permissions for Pages, Workers, KV, and Routes (store in GitHub Actions secrets)
- `CF_ACCOUNT_ID` and `ZONE_ID` for your Cloudflare account
- `PARTYKIT` credentials: ability to run `npx partykit deploy` (CI must have access)

## Create a KV namespace with Wrangler

```bash
# Create KV namespace and capture id (requires CF_ACCOUNT_ID env)
npx wrangler kv:namespace create "SOMMELIER_HOSTS" --account-id $CF_ACCOUNT_ID
# Wrangler prints: Created namespace with id: xxxxxxxx
```

Add the namespace id to `partykit.json` (or manage it via wrangler bindings):

```json
{ "binding": "HOSTS_KV", "id": "YOUR_KV_NAMESPACE_ID" }
```

Alternatively, declare the KV namespace in `wrangler.toml` and use `kv_namespaces` bindings.

## Deploy PartyKit in CI and capture the URL

In CI (or locally) run PartyKit deploy and extract the published host. The PartyKit deploy step prints the URL (e.g., `https://sommelier-arena.YOURNAME.partykit.dev`). Use that as `PUBLIC_PARTYKIT_HOST` when building the frontend.

Example (bash):

```bash
# Run PartyKit deploy and capture the URL
PARTYKIT_OUTPUT=$(npx partykit deploy 2>&1)
# Extract hostname (simple grep; adjust if PartyKit output changes)
PARTYKIT_URL=$(echo "$PARTYKIT_OUTPUT" | grep -oE "https?://[a-zA-Z0-9.-]+\.partykit\.dev")
PARTYKIT_HOST=${PARTYKIT_URL#https://}
echo "PARTYKIT_HOST=$PARTYKIT_HOST"
```

## Build frontend with the baked-in host

The Astro frontend bakes `PUBLIC_PARTYKIT_HOST` at build time. In CI, set it when building.

```bash
# Build front with the correct host baked into the static assets
PUBLIC_PARTYKIT_HOST=$PARTYKIT_HOST npm --prefix front run build
```

## Publish frontend to Cloudflare Pages (two options)

Option A — wrangler pages publish (publish built static files):

```bash
# Publish built frontend directory to Pages (requires project name configured in wrangler.toml)
npx wrangler pages publish ./front/dist --project-name $CF_PAGES_PROJECT_NAME --branch main
```

Option B — Use Pages REST API to create a deployment (more steps but avoids needing wrangler pages): build and then call the Pages API to upload the asset manifest and static files. See Cloudflare Pages API docs.

## Deploy the Proxy Worker with environment variables

Use Wrangler to compile and publish the TypeScript worker and inject runtime variables like `DOCS_ORIGIN`:

```bash
# Deploy proxy worker and set DOCS_ORIGIN so the worker knows where to fetch docs
npx wrangler deploy --account-id $CF_ACCOUNT_ID --var DOCS_ORIGIN=https://$CF_PAGES_PROJECT_NAME.pages.dev
```

If you need to create a route programmatically (e.g., `/docs*`), use the Cloudflare REST API:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/workers/routes" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{ "pattern": "sommelier-arena.ducatillon.net/docs*", "script": "sommelier-arena-proxy" }'
```

## Recommended GitHub Actions CI snippet

Below is a compact example workflow that:
1. Runs `npx partykit deploy` to publish PartyKit and capture the host
2. Builds the frontend with the captured host
3. Publishes the frontend to Pages using `wrangler pages publish`
4. Deploys the proxy worker with `wrangler deploy`

Save as `.github/workflows/deploy-example.yml` (example):

```yaml
name: Deploy to Cloudflare (example)
on:
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      CF_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
      CF_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }}
      CF_PAGES_PROJECT_NAME: ${{ secrets.CF_PAGES_PROJECT_NAME }}
      ZONE_ID: ${{ secrets.ZONE_ID }}
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install deps
        run: |
          npm ci
      - name: Deploy PartyKit (publish DOs) and capture host
        run: |
          set -euo pipefail
          PARTYKIT_OUTPUT=$(npx partykit deploy 2>&1)
          echo "$PARTYKIT_OUTPUT"
          PARTYKIT_URL=$(echo "$PARTYKIT_OUTPUT" | grep -oE "https?://[a-zA-Z0-9.-]+\.partykit\.dev" || true)
          if [ -z "$PARTYKIT_URL" ]; then echo "PartyKit deploy did not return a URL"; exit 1; fi
          PARTYKIT_HOST=${PARTYKIT_URL#https://}
          echo "PARTYKIT_HOST=$PARTYKIT_HOST" >> $GITHUB_ENV
      - name: Build frontend
        run: |
          PUBLIC_PARTYKIT_HOST=$PARTYKIT_HOST npm --prefix front run build
      - name: Publish frontend to Pages
        run: |
          npx wrangler pages publish ./front/dist --project-name $CF_PAGES_PROJECT_NAME
      - name: Deploy proxy worker
        run: |
          npx wrangler deploy --account-id $CF_ACCOUNT_ID --var DOCS_ORIGIN=https://${CF_PAGES_PROJECT_NAME}.pages.dev
```

Notes:
- Store `CF_API_TOKEN`, `CF_ACCOUNT_ID`, `CF_PAGES_PROJECT_NAME`, and `ZONE_ID` in GitHub Secrets.
- The PartyKit deploy step requires credentials. If PartyKit cannot run in CI (e.g., needs interactive login), consider running PartyKit deploy outside CI and set `PUBLIC_PARTYKIT_HOST` via Pages Environment Variables instead.

## Automating Routes and Environment Variables via API (optional)

If you prefer to avoid `wrangler deploy --var`, use the Pages and Workers REST APIs to programmatically upsert environment variables and create routes. This requires a `CF_API_TOKEN` with appropriate scopes. See Cloudflare API docs for `Pages` and `Workers` endpoints.

## Troubleshooting

- If `wrangler deploy` fails with permission errors, ensure the `CF_API_TOKEN` has `Workers:Edit` and `Account:Read` scopes.
- If Pages publish fails, verify `CF_PAGES_PROJECT_NAME` and that the token has Pages permissions.
- When testing locally, run `npx wrangler whoami` to confirm authentication.

<!-- End Cloudflare Wrangler guidance -->
