---
id: deployment
title: Deployment
sidebar_label: Deployment
deprecated: true
redirect_to: deployment-and-deploy
---

> **This page has been consolidated.** All deployment steps are now in the canonical guide:
> → [Deployment & Deploy](./deployment-and-deploy)

<!-- Deprecated page preserved for history. -->

# Deployment

The production stack runs entirely on Cloudflare's free tier.

## Services

| Service | Platform | Deploy command |
|---------|----------|---------------|
| Frontend | Cloudflare Pages (`front/`) | Git push → auto-deploy |
| Backend | PartyKit (Cloudflare Workers) | `npx partykit deploy` |
| Docs | Cloudflare Pages (`docs-site/`) | Git push → auto-deploy |
| Proxy Worker | Cloudflare Workers | Deploy via Wrangler (see below) |

## Step 1 — PartyKit deploy (Backend)

```bash
# From repo root
npx partykit deploy
```

This deploys `back/game.ts` as a Durable Object class to `sommelier-arena.francoiducat.partykit.dev` using the `partykit.json` file.

> **First time**: `npx partykit login` to authenticate with your Cloudflare account.

## Step 2 — Create Cloudflare KV namespace

In the Cloudflare dashboard:
1. Workers & Pages → KV → **Create namespace**
2. Name: `SOMMELIER_HOSTS`
3. Copy the namespace ID
4. Update `partykit.json`:
   ```json
   { "binding": "HOSTS_KV", "id": "YOUR_KV_NAMESPACE_ID" }
   ```
5. Re-deploy PartyKit
```bash
# From repo root
npx partykit deploy
```

## Step 3 — Frontend on Cloudflare Pages

1. Workers & Pages → **Create application** → Pages → Connect to Git
2. Select repository, branch: `main`
3. Build settings:
   - Root directory: `front`
   - Build command: `npm run build`
   - Output directory: `dist`
4. Environment variables:
   - `PUBLIC_PARTYKIT_HOST` = `sommelier-arena.francoiducat.partykit.dev`
5. Deploy

## Step 4 — Docs on Cloudflare Pages

Same as Step 3 but:
- Root directory: `docs-site`
- Build command: `npm run build`
- Output directory: `build`
- Project name: `sommelier-arena-docs`

## Step 5 — Custom domain

In Cloudflare Pages → front/docs project → **Custom domains** → Add domain → `sommelier-arena.ducatillon.net`

## Step 6 — Proxy Worker for /docs route

Wrangler required.

Create a simple `wrangler.toml` at the repo root:

```toml
name = "sommelier-arena-proxy"
main = "proxy-worker/index.ts"
compatibility_date = "2026-03-24"
```

Then publish from the repo root:

```bash
npx wrangler whoami   # verify auth
npx wrangler deploy --var DOCS_ORIGIN=https://sommelier-arena-docs.pages.dev
```

After the worker exists, create the route:
- Cloudflare Dashboard → Workers → `sommelier-arena-proxy` → Triggers → Add route:
  - Route: `sommelier-arena.ducatillon.net/docs*`
  - Zone: `ducatillon.net`

Verification:
- Open https://sommelier-arena.ducatillon.net/docs and confirm the docs site loads.

Notes and CI recommendation:
- `DOCS_ORIGIN` must match the Pages project deployed in Step 4.
- Recommended: capture Pages URL in CI after docs deploy and publish the worker with `DOCS_ORIGIN` injected.
- Manual quick fix: deploy docs Pages project, copy pages.dev URL, then `npx wrangler deploy --var DOCS_ORIGIN=<URL>`.

The proxy worker also routes `/docs/*` to the Docusaurus Pages project, keeping everything under one domain. See [Proxy Worker](proxy-worker) for full details.

> See [Deployment & Deploy](./deployment-and-deploy) for a step-by-step guide and CLI-first instructions.

## Rollback

Cloudflare Pages keeps deployment history. Roll back via dashboard → Deployments → select older deployment → **Rollback to this deployment**.

For PartyKit, there is no built-in rollback — redeploy the previous git commit.
