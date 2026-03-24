---
id: contributing
title: Contributing
sidebar_label: Contributing
---

# Contributing

## Branch strategy

| Branch | Purpose |
|--------|---------|
| `main` | Legacy/stable branch (v1.0) |
| `cloudflare-migration` | Active development — PartyKit stack (v2.0) |

All feature work for v2.0 goes on `cloudflare-migration` or a feature branch off it.

## Dev workflow (Mode A)

```bash
git checkout cloudflare-migration
git pull

# Terminal 1
npx partykit dev

# Terminal 2
cd front && npm run dev
```

## Running tests before a PR

```bash
# Frontend unit tests (must all pass)
cd front && npm test

# TypeScript check (frontend)
cd front && npx tsc --noEmit
```

## Code conventions

| Concern | Convention |
|---------|-----------|
| Business logic | `back/game.ts` only — never in frontend |
| Frontend state | Zustand stores — never `useState` for global state |
| Event shapes | Defined in `front/src/types/events.ts` — keep in sync with `back/game.ts` |
| Component naming | `Host*` for host-side, `Participant*` for participant-side, no prefix for shared |
| Tests | Mirror `src/` structure in `src/__tests__/`; target ≥ 80% coverage |

## Adding a new event type

1. Add the message handler in `back/game.ts`
2. Add the payload interface in `front/src/types/events.ts`
3. Handle the event in `useHostSocket.ts` or `useParticipantSocket.ts`
4. Update `event-reference.md`

## Commit message format

```
<scope>: <short description>

<body if needed>

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

Common scopes: `party`, `front`, `docs`, `e2e`, `infra`

## PR checklist

- [ ] `cd front && npm test` — all pass
- [ ] `cd front && npx tsc --noEmit` — clean
- [ ] New events documented in `event-reference.md`
- [ ] No `console.log` left in production code

---

## Documentation versioning

This repo uses Docusaurus versioning:

- **`docs/`** = current documentation (v2.0 PartyKit) — **edit these files for all ongoing work**
- **`versioned_docs/version-1.0-nestjs/`** = frozen snapshot of the v1.0 NestJS docs — read-only, do not edit
- **`versions.json`** = `["1.0-nestjs"]` — list of frozen versions
- **`versioned_sidebars/`** = sidebar config for each frozen version

To snapshot the current docs into a new frozen version (e.g. when v3.0 ships):
```bash
cd docs-site && npm run docusaurus docs:version 2.0-partykit
```

> In this repo, v1.0 docs are frozen and preserved for historical reference. All active documentation work goes in `docs/`.
