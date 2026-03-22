---
id: contributing
title: Contributing
sidebar_label: Contributing
---

# Contributing

## Branch strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable NestJS + Docker stack (v1.0) |
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

# Backend unit tests
cd back && npm test

# TypeScript check (frontend)
cd front && npx tsc --noEmit
```

## Code conventions

| Concern | Convention |
|---------|-----------|
| Business logic | `party/game.ts` only — never in frontend |
| Frontend state | Zustand stores — never `useState` for global state |
| Event shapes | Defined in `front/src/types/events.ts` — keep in sync with `party/game.ts` |
| Component naming | `Host*` for host-side, `Participant*` for participant-side, no prefix for shared |
| Tests | Mirror `src/` structure in `src/__tests__/`; target ≥ 80% coverage |

## Adding a new event type

1. Add the message handler in `party/game.ts`
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
- [ ] `cd back && npm test` — all pass
- [ ] `cd front && npx tsc --noEmit` — clean
- [ ] New events documented in `event-reference.md`
- [ ] No `console.log` left in production code
