---
id: quick-start
title: Quick Start
sidebar_label: Quick Start
---

# Quick Start

Three development modes depending on what you're testing.

## Prerequisites

- Node.js 20+
- `git clone` the repo and `cd SommelierArena`

## Mode A — Fast daily dev (recommended)

Best for feature work. No Docker needed.

```bash
# Terminal 1 — PartyKit backend (port 1999)
npx partykit dev
```

:::tip No Cloudflare account needed for local dev
`npx partykit dev` runs a **local in-memory simulator** — it emulates Cloudflare Durable Objects entirely on your machine with no internet connection required. Note: Cloudflare KV (`HOSTS_KV`) is not available locally; session history comes from browser localStorage only. See [Local vs Production](./local-vs-prod) for the full comparison.
:::

# Terminal 2 — Astro frontend (port 4321)
cd front
cp .env.local.example .env.local   # PUBLIC_PARTYKIT_HOST=localhost:1999
npm run dev
```

Open `http://localhost:4321/host` (host) and `http://localhost:4321/play` (participant).

## Mode B — Full integration (Docker)

Best for E2E tests and nginx/proxy validation.

```bash
docker-compose --profile full up --build
```

| Service | URL |
|---------|-----|
| Frontend (nginx) | `http://localhost:4321` |
| PartyKit backend | `http://localhost:1999` |
| Docs (Docusaurus) | `http://localhost:3002` |

### Docker cheat sheet

```bash
# Start the full stack
docker-compose --profile full up --build -d

# Stop the full stack (MUST use --profile full)
docker-compose --profile full down

# Rebuild a single service
docker-compose --profile full up --build -d front

# View logs
docker-compose --profile full logs -f
```

> ⚠️ **Important:** Running `docker-compose down` (without `--profile full`) does **not** stop containers started with `--profile full`. Always include `--profile full` in both `up` and `down` commands.

## Mode C — Docs only

```bash
cd docs-site
npm run start:local
# → http://localhost:3002
```

### Docs site — local search

This project uses a local, file-based search plugin for Docusaurus to provide a search box in the docs navbar.

Quick start (local):

1. Install dependencies:

   ```bash
   cd docs-site
   npm ci
   ```

2. Start the dev server:

   ```bash
   npm run start:local
   ```

3. Open http://localhost:3002 (or your DOCS_BASE_URL) and use the search box in the navbar.

Preview built site:

```bash
npm run serve
```

This serves the built static site on port 3002 by default.

Notes
- The plugin dependency (@cmfcmf/docusaurus-search-local) is declared in package.json and will be installed by `npm ci`.
- The site configuration in docusaurus.config.ts will load the plugin if installed. If you build the docs inside Docker or CI, `npm ci` in the Dockerfile will ensure the plugin is available at build time.
- If `npm ci` fails in your environment, inspect the npm logs and ensure a network/proxy is configured correctly.

## Run tests

```bash
# Frontend unit tests (Vitest + RTL)
cd front && npm test

# E2E tests (requires Mode B Docker stack running)
cd e2e && npm test -- --project=chromium
```

## Environment variables

| Variable | Where | Value |
|----------|-------|-------|
| `PUBLIC_PARTYKIT_HOST` | `front/.env.local` | `localhost:1999` (local) |
| `PUBLIC_PARTYKIT_HOST` | Cloudflare Pages dashboard | `sommelier-arena.USERNAME.partykit.dev` (prod) |

See `front/.env.local.example` for a template.

> **Note:** Sessions persist in your browser's localStorage. Use the 🗑 button on the Host Dashboard to clean up old sessions.
