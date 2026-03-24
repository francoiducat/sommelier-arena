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
npm start
# → http://localhost:3002
```

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
