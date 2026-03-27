---
id: env
title: Environment Variables
sidebar_label: Env
---

Environment variables and .env strategy (full-stack)

This document explains how environment variables are managed across the monorepo (front, back, docs-site) and how to configure them for local development, Docker, and production.

Principles and precedence

- Per-service `.env` files are the primary source for local development. Each service (front/, back/, docs-site/) should include a `.env.example` describing required variables.
- Runtime environment (CI, Docker build args, platform env) overrides per-service `.env` values and is authoritative in production.
- Root `.env` is discouraged and not used; keep per-service examples and copy them to `.env` when developing locally.
- Never commit real secrets. Use CI/Platform secret stores for production values.

Per-service notes

- Frontend (front/)
  - Template: `front/.env.example` → copy to `front/.env.local` for local dev.
  - Key var: PUBLIC_PARTYKIT_HOST (Mode A: localhost:1999; Mode B/Docker: localhost:4321 baked at build time)
  - In Docker mode the build injects the correct host; do not rely on local `.env.local` for Docker builds.

- Backend (back/)
  - The backend is a PartyKit Durable Object (`back/game.ts`). It has no `.env` file — Durable Object bindings (KV, etc.) are configured in `partykit.json` and secrets are created via `wrangler secret put` or set in CI.

- Docs (docs-site/)
  - Template: `docs-site/.env.example` → copy to `docs-site/.env` to mirror production (`DOCS_BASE_URL=/docs`) or set to `/` for root serving.
  - The Dockerfile accepts `--build-arg DOCS_BASE_URL` to bake the base URL at build time.

How to use locally

1. Copy the appropriate example into a `.env` (or `.env.local` for the front) in the service folder:

   cd front && cp .env.example .env.local
   cd docs-site && cp .env.example .env

2. Install dependencies and run the service (example for docs-site):

   cd docs-site
   npm ci
   npm run build:local   # uses DOCS_BASE_URL from .env
   npm run serve:build

Docker and CI

- Docker builds should pass necessary build args or envs explicitly; do not bake secrets into images.
  Example: `docker build --build-arg DOCS_BASE_URL=/docs -t sommelier-docs .`
- CI should set required environment variables via secrets and pass them into build jobs. Runtime envs in CI override `.env` files.

Troubleshooting

- If a local build yields incorrect base paths, ensure `DOCS_BASE_URL` is set in the service's `.env` or passed via the build command.
- To verify which vars are picked up, run a local script that prints key env vars (do not print secrets to logs).

Where to find examples

- front/.env.example
- docs-site/.env.example

Change log

- Consolidated environment guidance into this file; removed redundant CONTRIBUTING.md at repository root to avoid duplication.

If you want this doc promoted into a top-level CONTRIBUTING.md instead, say so and it can replace the deleted file.
