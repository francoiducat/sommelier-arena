---
id: deployment
title: Deployment
sidebar_label: Deployment
---

# Deployment

The production stack runs entirely on Cloudflare's free tier. No servers to manage.

## Services

| Service | Platform | Deploy command |
|---------|----------|---------------|
| Frontend | Cloudflare Pages (`front/`) | Git push → auto-deploy |
| Backend | PartyKit (Cloudflare Workers) | `npx partykit deploy` |
| Docs | Cloudflare Pages (`docs-site/`) | Git push → auto-deploy |
| Proxy Worker | Cloudflare Workers | Paste `proxy-worker/index.ts` in dashboard |

## Step 1 — PartyKit deploy

```bash
# From repo root
npx partykit deploy
```

This deploys `party/game.ts` as a Durable Object class to `sommelier-arena.USERNAME.partykit.dev`.

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

## Step 3 — Frontend on Cloudflare Pages

1. Workers & Pages → **Create application** → Pages → Connect to Git
2. Select repository, branch: `cloudflare-migration`
3. Build settings:
   - Root directory: `front`
   - Build command: `npm run build`
   - Output directory: `dist`
4. Environment variables:
   - `PUBLIC_PARTYKIT_HOST` = `sommelier-arena.USERNAME.partykit.dev`
5. Deploy

## Step 4 — Docs on Cloudflare Pages

Same as Step 3 but:
- Root directory: `docs-site`
- Build command: `npm run build`
- Output directory: `build`
- Project name: `sommelier-arena-docs`

## Step 5 — Custom domain

In Cloudflare Pages → your front project → **Custom domains** → Add domain → `sommelier-arena.ducatillon.net`

## Step 6 — Proxy Worker for /docs route

1. Workers & Pages → **Create Worker**
2. Paste the contents of `proxy-worker/index.ts`
3. Deploy
4. Go to **Triggers** → **Routes** → Add route: `sommelier-arena.ducatillon.net/docs*`

> See [Cloudflare Setup](cloudflare-setup) for a step-by-step dashboard walkthrough with UI labels.

## Rollback

Cloudflare Pages keeps deployment history. Roll back via dashboard → Deployments → select older deployment → **Rollback to this deployment**.

For PartyKit, there is no built-in rollback — redeploy the previous git commit.
