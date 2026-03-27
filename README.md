Sommelier Arena

Sommelier Arena is a real-time blind wine tasting quiz (Kahoot-style). Host creates sessions, participants join with a 4-digit code, and compete live.

<https://sommelier-arena.ducatillon.net>

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
3. Run both and open <http://localhost:4321/host> and /play

## Deployment

See docs: docs-site/docs/deployment-and-deploy.md

## Contributing

Please follow the docs in docs-site/ for contribution guidelines and the PRD (docs-site/docs/prd.md).

## License

MIT
