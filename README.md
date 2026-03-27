Sommelier Arena

Sommelier Arena is a real-time blind wine tasting quiz (Kahoot-style). Host creates sessions, participants join with a 4-digit code, and compete live.

## Quick links
- Docs: docs-site (serve at /docs in production)
- Dev: `cd front && npm run dev`, `npx partykit dev` for backend
- Docker stack: `docker-compose up --build`

## Architecture
- Frontend: Astro + React islands (front/)
- Backend: PartyKit (Cloudflare Workers Durable Objects) (back/)
- Docs: Docusaurus (docs-site/)
- Proxy: Cloudflare Worker (proxy-worker/)

## Getting started (developer)
1. Front local dev
   - cd front && cp .env.local.example .env.local
   - npm ci && npm run dev
2. Backend local dev
   - npx partykit dev
3. Run both and open http://localhost:4321/host and /play

## Deployment
See docs: docs-site/docs/deployment-and-deploy.md

## Contributing
Please follow the docs in docs-site/ for contribution guidelines and the PRD (docs-site/docs/prd.md).

## License
MIT


Sommelier Arena — quick start

Environment files

This repository uses per-service `.env` files for local development (see `front/.env.local.example`, `back/.env.example`, `docs-site/.env.example`).

To avoid accidentally committing secrets, a local Git hook is recommended. Enable the provided hooks with:

  git config core.hooksPath .githooks

Once enabled, the pre-commit hook will prevent committing `.env` or `.env.local` files.

Frontend local setup

  cd front
  cp .env.local.example .env.local
  # edit as needed, then run the dev server
  npm ci
  npm run dev

Docs local setup

  cd docs-site
  cp .env.example .env
  npm ci
  npm run start:local

For full environment guidance see docs-site/docs/env.md
