---
id: deployment-and-deploy
title: Deployment & Deploy
sidebar_label: Deployment
audience: developer
tags: [deployment, cloudflare, partykit, pages, wrangler]
---

# Deployment & Deploy

This canonical document consolidates deployment and Cloudflare setup steps for Sommelier Arena. It replaces `deployment.md`, `cloudflare-setup.md`, and the deployment sections of `quick-start.md`.

Note: Use the Wrangler CLI for reproducible, scriptable Worker deployments and Cloudflare Pages API for automation. Manual Dashboard steps are referenced for one-off tasks only.

## Architecture

```mermaid
flowchart LR
  Browser -->|HTTPS| Pages[Cloudflare Pages<br/>(Frontend)]
  Browser -->|WSS| PartyKit[PartyKit (Cloudflare Workers Durable Objects)]
  Pages --> Proxy[Proxy Worker]
  Proxy --> Docs[Docs (Docusaurus Pages)]
  PartyKit --> KV[Cloudflare KV (HOSTS_KV)]
  PartyKit -->|Durable Object storage| SQLite[SQLite (Worker DO storage)]
```

## Summary of services

- Frontend: Cloudflare Pages (front/)
- Backend: PartyKit (Cloudflare Workers Durable Objects) — deployed with `npx partykit deploy`
- Docs: Cloudflare Pages (docs-site/)
- Proxy Worker: Cloudflare Worker (proxy-worker/index.ts) — deploy with Wrangler

## Recommended automated flow (CI)

1. Build frontend artifact (`npm --prefix front run build`) and upload to Pages via API or Git push.
2. Build docs (`npm --prefix docs-site run build`) and upload to Pages as a separate Pages project.
3. After Pages projects are deployed, capture their pages.dev URLs and publish the proxy worker with `DOCS_ORIGIN` and other env vars injected via Wrangler or the Pages API.

## PartyKit (backend)

Deploy:

```bash
# From repo root
npx partykit login    # authenticate (first time)
npx partykit deploy
```

Notes:
- PartyKit publishes Durable Objects to a project-specific domain: `sommelier-arena.<your-username>.partykit.dev`.
- Ensure `partykit.json` contains KV namespace bindings where required.

## Cloudflare KV (HOSTS_KV)

Create a KV namespace and bind it to PartyKit/Worker deployments. Using Wrangler (scriptable):

```bash
# Create namespace via Wrangler (requires CF_API_TOKEN)
npx wrangler kv:namespace create "SOMMELIER_HOSTS" --account-id $CF_ACCOUNT_ID
# Wrangler prints the namespace id: add it to partykit.json bindings
```

## Cloudflare Pages (Frontend & Docs)

Frontend (Pages project)

- Root dir: `front`
- Build command: `npm run build`
- Output dir: `dist`
- Env: `PUBLIC_PARTYKIT_HOST` = `sommelier-arena.<username>.partykit.dev`

Docs (Pages project)

- Root dir: `docs-site`
- Build command: `npm run build`
- Output dir: `build` or as configured in docusaurus

## Proxy Worker (wrangler)

Use Wrangler to build & publish the TypeScript proxy worker (recommended):

```toml
# wrangler.toml (example)
name = "sommelier-arena-proxy"
main = "proxy-worker/index.ts"
compatibility_date = "2026-03-24"
```

Publish (example):

```bash
npx wrangler whoami
# Deploy with DOCS_ORIGIN injected (replace with actual pages.dev domain)
npx wrangler deploy --var DOCS_ORIGIN=https://sommelier-arena-docs.pages.dev
```

To create a route for `/docs*` programmatically, use the Cloudflare REST API:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/workers/routes" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{ "pattern": "sommelier-arena.ducatillon.net/docs*", "script": "sommelier-arena-proxy" }'
```

## Verification

- Visit `https://sommelier-arena.ducatillon.net/docs` and confirm the docs load.
- Confirm frontend loads at configured custom domain and connects to PartyKit via `PUBLIC_PARTYKIT_HOST`.

## Rollback

- Cloudflare Pages: rollback via Pages → Deployments.
- Workers: re-deploy previous bundle via Wrangler with the previous commit.

## Notes & CI recommendations

- Do not hard-code `DOCS_ORIGIN`; inject via CI or Wrangler `--var`.
- Store `CF_API_TOKEN`, `CF_ACCOUNT_ID`, `ZONE_ID` in GitHub Actions secrets and use them in CI steps.

<!-- end canonical deployment doc -->
