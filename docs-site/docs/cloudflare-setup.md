---
id: cloudflare-setup
title: Cloudflare Dashboard Setup
sidebar_label: Cloudflare Setup
---

# Cloudflare Dashboard Setup

Step-by-step guide for setting up Sommelier Arena through the Cloudflare web UI. No Wrangler CLI needed (except for initial `partykit deploy`).

---

## 1. Create the KV namespace (precise steps)

Goal: create a Cloudflare KV namespace and bind it to the worker as `HOSTS_KV` so the backend can store cross-session host lists.

Two equivalent ways: (A) Cloudflare Dashboard (GUI) — easiest; (B) Wrangler CLI — scriptable. Choose one.

A) Dashboard (GUI) — recommended
1. Open https://dash.cloudflare.com and sign in to the Cloudflare account that will host the Pages / Workers.
2. Select the account (top-left) and click **Workers & Pages** in the left nav.
3. Click the **KV** tab near the top.
4. Click **Create namespace** (top-right).
5. For the *Name* enter: SOMMELIER_HOSTS and click **Add**.
6. The new namespace will appear in the list. Click it and copy the shown **Namespace ID** value.

B) Wrangler CLI (scriptable)
1. Install wrangler if you don't have it: `npm install -g wrangler` (or use `npx wrangler`).
2. Authenticate: `npx wrangler login` and follow the browser flow.
3. Create the namespace (returns an ID):

   npx wrangler kv:namespace create "SOMMELIER_HOSTS"

   The CLI will print the Namespace ID; copy it.

Bind the namespace to the project

1. Use the template-based workflow to avoid committing environment-specific files. The repository contains `partykit.json.template` with a placeholder for the KV namespace ID.
2. Locally, create a working `partykit.json` from the template and paste the Namespace ID you copied when creating the KV namespace:

```bash
cp partykit.json.template partykit.json
# Edit partykit.json and replace PASTE_NAMESPACE_ID_HERE with the Namespace ID you copied
```

3. Add `partykit.json` to your local `.gitignore` if you haven't already so local copies are not committed.

Template & CI workflow (recommended)

To keep CI and local workflows reproducible and avoid committing environment-specific values, prefer injecting the Namespace ID at build/deploy time:

- Keep `partykit.json.template` committed in the repo. It should contain the `bindings` entry for `HOSTS_KV` with the placeholder value `PASTE_NAMESPACE_ID_HERE`.
- In CI (the app/deploy workflow that performs `npx partykit deploy`), generate `partykit.json` from the template and replace the placeholder with the secret value (example below).
- Keep docs-only CI (docs-ci) separate — docs builds do not need the KV binding injected.

CI & deploy notes

- This repo uses two GitHub Actions workflows:
  - `docs-ci.yml` — docs-only workflow. Runs when files under `docs-site/**` change. It builds the Docusaurus site and uploads the `docs-site/build` artifact. It does NOT perform any PartyKit or Cloudflare deploys and does NOT inject KV IDs.
  - `app-ci.yml` — app-focused workflow. Responsible for E2E, PartyKit deploy, and Wrangler publish. It is triggered on pushes to `main` and `cloudflare-migration` and can be started manually via `workflow_dispatch`.

Prepare partykit.json in your app/deploy workflow

Place the following steps in your *app* deploy workflow (e.g. `app-ci.yml`) — do NOT add this to `docs-ci.yml`:

```yaml
- name: Prepare partykit.json from template
  env:
    CF_HOSTS_NAMESPACE_ID: ${{ secrets.CF_HOSTS_NAMESPACE_ID }}
  run: |
    cp partykit.json.template partykit.json
    node -e "let fs=require('fs');let p='partykit.json';let c=fs.readFileSync(p,'utf8');c=c.replace('PASTE_NAMESPACE_ID_HERE', process.env.CF_HOSTS_NAMESPACE_ID);fs.writeFileSync(p,c);"

- name: Deploy PartyKit
  env:
    CF_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
  run: |
    npm ci
    npx partykit deploy

- name: Publish proxy worker via Wrangler
  if: ${{ secrets.CF_API_TOKEN != '' }}
  env:
    CF_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
  run: npx wrangler publish proxy-worker/index.ts --name sommelier-arena-proxy
```

Required GitHub Secrets for app-ci

- `CF_HOSTS_NAMESPACE_ID` — the KV namespace ID used to populate `partykit.json`. This value is non-secret but is convenient to keep in secrets to avoid committing local files.
- `CF_API_TOKEN` — Cloudflare API token with permissions to deploy Workers/Pages and manage routes. Required for `npx partykit deploy` and `wrangler publish`.

Important

- Do NOT inject KV IDs in `docs-ci.yml`. The docs build should remain independent and only produce the docs artifact. The app/deploy workflow (app-ci) is the correct place for `partykit.json` generation and PartyKit/wrangler deploys.
- The `app-ci.yml` workflow can be triggered via `workflow_dispatch` for manual deploys, or runs automatically on pushes to the configured branches.
- If you need to run `npx partykit deploy` locally, run it from the repo root (where `partykit.json` lives):

```bash
cd /path/to/SommelierArena
cp partykit.json.template partykit.json
# edit partykit.json to replace placeholder if needed
npx partykit deploy
```




Where `npx partykit deploy` runs (locally vs CI)

- CI (recommended): The preferred approach is to let `app-ci.yml` perform `npx partykit deploy` in GitHub Actions after tests pass. The app workflow prepares `partykit.json` from `partykit.json.template` using the `CF_HOSTS_NAMESPACE_ID` secret and runs the deploy with `CF_API_TOKEN` available in the environment.

- Locally (for manual deploys): Run from the repository root where `partykit.json` lives:

```bash
cd /path/to/SommelierArena
cp partykit.json.template partykit.json
# Edit partykit.json and replace PASTE_NAMESPACE_ID_HERE with your Namespace ID
npx partykit deploy
```

Before running deploy (CI or local)

- Ensure the KV namespace exists (you created it earlier and have its Namespace ID).
- Ensure you are authenticated with Cloudflare locally (`npx wrangler login`) or have a valid `CF_API_TOKEN` stored in GitHub Secrets for CI.

Why this order matters

- The KV namespace must exist before deploy so PartyKit can bind the namespace ID to `HOSTS_KV` during deployment.
- `partykit.json` contains the binding information used by the deploy step. The CI flow injects the Namespace ID into the template at runtime so the repo never contains environment-specific files.

Verification

1. After `npx partykit deploy` succeeds (CI or local), open Cloudflare Dashboard → Workers & Pages → your Worker and confirm the binding `HOSTS_KV` appears under **Settings / Variables & Bindings**.
2. In CI logs you should see the deploy command run; inspect output for binding confirmation or errors.


Troubleshooting

- If `npx partykit deploy` errors with authentication issues, run `npx wrangler login` and retry.
- If you accidentally created the namespace in a different Cloudflare account, delete and recreate it in the intended account, then update `partykit.json` and re-deploy.

Security note

- Do not commit secrets or account tokens to git. The namespace ID is non-secret (safe to commit), but API keys or account tokens must not be committed.

---

## 2. Deploy the frontend to Cloudflare Pages

**Workers & Pages → Create application → Pages**

1. Click **Workers & Pages** → **Create application** → **Pages** tab → **Connect to Git**
2. Authorize Cloudflare to access your GitHub account if prompted
3. Select your repository → click **Begin setup**
4. Configure:
   - **Project name**: `sommelier-arena`
   - **Production branch**: `cloudflare-migration`
   - **Root directory**: `front`
   - **Framework preset**: None (Astro builds to static)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Click **Environment variables (advanced)** → **Add variable**:
   - Variable name: `PUBLIC_PARTYKIT_HOST`
   - Value: `sommelier-arena.USERNAME.partykit.dev` (your PartyKit project URL)
6. Click **Save and Deploy**

---

## 3. Deploy the docs to Cloudflare Pages

Repeat Step 2 with different settings:

- **Project name**: `sommelier-arena-docs`
- **Root directory**: `docs-site`
- **Build command**: `npm run build`
- **Build output directory**: `build`
- No environment variables needed

---

## 4. Add a custom domain

**Cloudflare Pages → sommelier-arena → Custom domains**

1. Click your `sommelier-arena` Pages project
2. Click **Custom domains** tab
3. Click **Set up a custom domain**
4. Enter: `sommelier-arena.ducatillon.net` → click **Continue**
5. Cloudflare will add the required DNS CNAME automatically (since `ducatillon.net` is already managed on Cloudflare)
6. Wait for **Active** status (usually < 1 minute)

---

## 5. Deploy the proxy Worker

**Workers & Pages → Create application → Worker**

There are two repeatable ways to deploy the proxy worker from the repository: (A) Cloudflare Dashboard (manual GUI) — already documented above; (B) Wrangler CLI (scriptable). The Wrangler approach is shown here so deployments can be automated from your machine or CI.

Prerequisites (for CLI)

- `wrangler` available via npx (no global install required): npx wrangler
- A Cloudflare API token (recommended) or global API key with permissions to edit Workers and Routes
- Your Cloudflare Account ID (can be found on the Cloudflare dashboard)

A) Publish the worker script with Wrangler (CLI)

1. Authenticate with Cloudflare if not already authenticated:

   npx wrangler login

   This opens a browser to authenticate and grants wrangler access to your account.

2. From the repository root, publish the worker script located at `proxy-worker/index.ts` and give it the name `sommelier-arena-proxy`:

   cd /Users/mac-FDUCAT18/Workspace/FDUCAT/SommelierArena
   npx wrangler publish proxy-worker/index.ts --name sommelier-arena-proxy

   Successful output will include the worker URL and script name.

B) Create a route for the worker (two options)

Option 1 — Dashboard (manual, reliable)
- After publishing, go to Cloudflare Dashboard → Workers & Pages → your Worker → Triggers and add a route with:
  - Route: `sommelier-arena.ducatillon.net/docs*`
  - Zone: `ducatillon.net`

Option 2 — API (scriptable)

- Use the Cloudflare REST API to create a route programmatically. You need:
  - CF_ACCOUNT_ID (your Cloudflare account id)
  - CF_API_TOKEN (a scoped API token with `Workers:Edit` and `Zone:Edit` on the target zone)

Example (replace placeholders):

```bash
# Create a route that sends /docs* to the worker
CF_ACCOUNT_ID=your_account_id
CF_API_TOKEN=your_api_token
ZONE_ID=ducatillon_net_zone_id   # find this on Cloudflare dashboard under the domain
WORKER_SCRIPT_NAME=sommelier-arena-proxy

curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/workers/routes" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"pattern":"sommelier-arena.ducatillon.net/docs*","script":"sommelier-arena-proxy"}'

# Verify the route was created (response.ok === true)
# Example: list routes for the zone and grep for the pattern
curl -X GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/workers/routes" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" | jq '.result[] | select(.pattern=="sommelier-arena.ducatillon.net/docs*")'

# If you prefer to bind routes to a Worker via wrangler TOML, you can also manage routes in wrangler.toml and use `npx wrangler publish` from the worker directory. See Wrangler docs for `routes` configuration.
---

## 6. Verify DNS records

**ducatillon.net → DNS**

1. In the Cloudflare dashboard, click `ducatillon.net` in your domain list
2. Click **DNS** → **Records**
3. You should see a CNAME record: `sommelier-arena` → `sommelier-arena.pages.dev`
4. Proxy status should be **Proxied** (orange cloud icon)

---

## 7. Set environment variables in Pages

If you need to update `PUBLIC_PARTYKIT_HOST` after initial deploy:

1. Pages → `sommelier-arena` → **Settings** → **Environment variables**
2. Click **Add variable** or edit the existing one
3. Save → then go to **Deployments** → click **⋯** next to the latest deploy → **Retry deployment** to apply the new variable

---

## Checklist

- [ ] KV namespace `SOMMELIER_HOSTS` created; ID in `partykit.json`
- [ ] `npx partykit deploy` completed (no errors)
- [ ] Frontend Pages project deployed (`sommelier-arena`)
- [ ] Docs Pages project deployed (`sommelier-arena-docs`)
- [ ] Custom domain `sommelier-arena.ducatillon.net` active (green)
- [ ] Proxy Worker deployed with `/docs*` route
- [ ] `PUBLIC_PARTYKIT_HOST` env var set in Pages to your partykit.dev URL
- [ ] Navigate to `https://sommelier-arena.ducatillon.net/host` — dashboard loads
- [ ] Navigate to `https://sommelier-arena.ducatillon.net/docs` — docs load
