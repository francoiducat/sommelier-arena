---
id: config-comparison
title: Configuration Comparison — Local vs Production
sidebar_label: Config Comparison
audience: developer
tags: [config, deployment, env]
---

# Configuration Comparison — Local vs Production

This table shows where key configuration values live and how they differ between local development modes and production (Cloudflare) deployments.

| Layer | Setting | Local (Mode A) | Docker (Mode B) | Production (Cloudflare) |
|-------|---------|----------------|-----------------|-------------------------|
| Frontend | `PUBLIC_PARTYKIT_HOST` | front/.env.local (`localhost:1999`) | Docker build arg / env `localhost:4321` | Cloudflare Pages env or baked at build (e.g. `sommelier-arena.<username>.partykit.dev`) |
| Docs | Docs base URL | docs-site dev (`http://localhost:3002`) | docs container (`http://localhost:3002`) | Cloudflare Pages (`https://<project>.pages.dev` or custom domain `/docs`) |
| Backend | PartyKit host | `npx partykit dev` (localhost:1999) | PartyKit container (internal) | Cloudflare Workers (Durable Objects) |
| KV | `HOSTS_KV` binding | Not available (local) | Not available (docker-mode without binding) | Cloudflare KV namespace bound via partykit.json or Wrangler |
| Proxy Worker | DOCS_ORIGIN | N/A | N/A | `DOCS_ORIGIN` injected via Wrangler `--var` or Worker env var (points to Pages project) |
| Docker | Compose file | N/A | `docker-compose.yml` (services: nginx, back, front, docs) | N/A |
| Deployment | Deploy command | `npx partykit deploy` for PartyKit local/test | `docker-compose up --build` for integration testing | Git push / Pages auto-deploy; `npx partykit deploy` for PartyKit; `npx wrangler deploy` for Worker |

## Notes
- `PUBLIC_PARTYKIT_HOST` is baked into the frontend at build time. For Cloudflare Pages, choose either to set it as a Pages Environment Variable or bake it into the artifact during CI and deploy the artifact to Pages.
- `HOSTS_KV` must be created in the Cloudflare account and the namespace id added to `partykit.json` (or managed via Wrangler KV namespace bindings).
- The proxy worker's `DOCS_ORIGIN` should be provided by CI after docs Pages deploys and returns its pages.dev URL.

<!-- End of config comparison -->
