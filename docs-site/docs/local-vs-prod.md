---
sidebar_position: 9
---

# Local Dev vs Production

Understanding how the app behaves differently across environments is key to productive development and confident deployment.

## Services at a glance

| | Mode A — Local dev | Mode B — Docker | Production |
|-|--------------------|-----------------|-----------|
| **Frontend** | Astro dev server<br/>`http://localhost:4321` | nginx<br/>`http://localhost:4321` | Cloudflare Pages (CDN) |
| **PartyKit backend** | `npx partykit dev`<br/>`ws://localhost:1999` | PartyKit container<br/>(internal, nginx proxied) | Cloudflare Workers +<br/>Durable Objects |
| **Documentation** | Docusaurus dev<br/>`http://localhost:3002` | Docusaurus container<br/>`http://localhost:3002` | Cloudflare Pages<br/>(separate project) |
| **DO storage** (`room.storage`) | ⚠️ In-memory | ⚠️ In-memory | ✅ SQLite per DO |
| **Cloudflare KV** (`HOSTS_KV`) | ❌ Not available | ❌ Not available | ✅ Real KV namespace |
| **Browser localStorage** | ✅ Works | ✅ Works | ✅ Works |

---

## How `npx partykit dev` works — no Cloudflare needed

When you run `npm run dev` in `back/` (which runs `npx partykit dev --port 1999`), PartyKit starts a **local HTTP + WebSocket server** that emulates Cloudflare Durable Objects entirely on your machine.

- Each game session (`room.id` = 4-digit code) maps to an in-memory "room" on the local process.
- The full `Party.Room` API works: `room.storage.put/get`, `room.broadcast`, `room.storage.setAlarm`, `room.connections`. Your game code (`back/game.ts`) is **identical** in both environments — no environment-specific branches in the app code.
- **No Cloudflare account, no API tokens, no internet connection** is required for local development.

**The key difference: storage is in-memory.**

In production, `room.storage` is backed by SQLite. When a DO is evicted from memory, Cloudflare persists its storage to SQLite and restores it when the DO wakes. The `onStart()` lifecycle hook in `back/game.ts` reads saved state on wake.

In local dev, `room.storage.put(...)` still works — data survives within a session — but restarting `partykit dev` clears everything.

---

## Storage layers demystified

There are three distinct storage layers. Understanding which one does what — and which are unavailable locally — prevents confusion during development.

### 1. Browser `localStorage` — always works

The frontend stores two things in the browser's localStorage:

| localStorage key | Contents | Who uses it |
|------------------|----------|-------------|
| `sommelier-arena-host-{hostId}` | `SessionListEntry[]` — the host's session list | Host dashboard |
| `sommelier-arena-rejoin` | `{ rejoinToken, code, pseudonym }` — participant credentials | Participant rejoin |

Managed by `front/src/lib/sessionStorage.ts`.

**Works identically in local dev and production.** It's just the browser's own storage.

> ⚠️ **Local dev note**: Because Cloudflare KV is not available locally (see below), the Host Dashboard session list is populated **exclusively from localStorage** in local dev. This means session history lives in your browser only — it's not shared across devices or browsers. Use the 🗑 delete button to clean up stale sessions.

### 2. Durable Object storage — `room.storage` — in-memory locally, SQLite in production

The PartyKit backend persists game state per session using `room.storage`:

| Storage key | Contents | Purpose |
|-------------|----------|---------|
| `'state'` | Full `SavedState` snapshot | Restore game state after DO eviction |
| `'hostId'` | String | Host re-authentication after DO restart |
| `'participant:{rejoinToken}'` | `Participant` data | Participant rejoin credentials |
| `'response:{participantId}:{questionId}'` | Answer record | Accurate scoring if DO restarts mid-game |

**Local dev**: In-memory. Data survives while `partykit dev` is running. A process restart (Ctrl+C + re-run) loses all active sessions.

**Production**: SQLite-backed. Data survives DO eviction. `onStart()` is called when the DO wakes from cold storage and reads back the saved state.

### 3. Cloudflare KV — `HOSTS_KV` — not available locally

The backend also writes to a Cloudflare KV namespace (`HOSTS_KV`) to maintain a cross-session index per host.

**KV key structure:**
```
host:{hostId}  →  SessionListEntry[]  (list of all sessions for that host)
```

This is used in `upsertKvSession()` in `back/game.ts` and is called when a session is created, when the game ends, etc.

**Local dev**: The `HOSTS_KV` binding is not defined in `partykit.json`, so `room.context.bindings.HOSTS_KV` is `undefined`. The `upsertKvSession()` function is wrapped in a `try/catch` that silently skips the KV write. **This is intentional and safe** — the app continues working via localStorage.

**Production**: A real Cloudflare KV namespace (see [Cloudflare Setup](./cloudflare-setup.md) for how to create and bind it). Enables a host to see their sessions when opening the app on a new browser or device, since the server can serve the session list from KV independent of localStorage.

---

## How a static Astro site runs multiplayer

This might seem paradoxical: the frontend is a **static site** (no backend, no server-side rendering at request time), yet it powers live multiplayer.

Here's how it works:

1. **Astro builds to pure static files** — HTML, CSS, and JavaScript bundles. No Node.js server runs at request time. Cloudflare Pages serves these files from its CDN globally.

2. **PartySocket is bundled in the JS** — `PartySocket` (the WebSocket client library for PartyKit) is imported in the frontend code and compiled into the static JS bundle.

3. **On page load, the browser establishes a WebSocket connection** to the PartyKit backend:
   ```
   ws://your-domain.com/parties/main/{sessionCode}
   ```
   (In local dev: `ws://localhost:1999/parties/main/{sessionCode}`)

4. **All game state flows over WebSocket events** — there is no REST API. When the host starts the game, sends a `host:start` message. When a participant answers, sends `participant:submit_answer`. The backend broadcasts `game:question`, `game:timer_tick`, `game:answer_revealed`, etc.

5. **React islands handle reactivity** — Astro pages are static shells; the interactive game UI is rendered by React components (hydrated client-side with `client:only="react"`). Zustand stores (`hostStore`, `participantStore`) hold all game state client-side and are updated by socket hook event handlers.

```
Browser                           Cloudflare (production)
  │                                       │
  │  GET https://your-domain.com/host     │
  │ ─────────────────────────────────────>│  Cloudflare Pages CDN
  │ <─────────────────────────────────────│  returns static HTML + JS
  │                                       │
  │  WS wss://your-domain.com/parties/main/1234
  │ ─────────────────────────────────────>│  Cloudflare Workers
  │ <═════════════════════════════════════│  Durable Object (game.ts)
  │     real-time game events (JSON)      │
```

**The static frontend is a WebSocket client application packaged as static files.** This pattern achieves global distribution (CDN) with real-time interactivity (WebSocket) at very low cost.

---

## Quick reference: what to check when things behave differently

| Symptom | Likely cause |
|---------|-------------|
| Session history missing after restart | Expected in dev — DO storage + KV are ephemeral locally |
| Host dashboard shows sessions from previous dev session | localStorage persists across restarts; use 🗑 to clean up |
| Participant can't rejoin after `partykit dev` restart | Expected — rejoin tokens are stored in DO storage (in-memory) |
| Session list only shows in one browser | KV is not available locally; localStorage is per-browser |
| Works locally but missing sessions in prod | `HOSTS_KV` binding not configured — see [Cloudflare Setup](./cloudflare-setup.md) |
