import PartySocket from 'partysocket';

// In Docker/production: PUBLIC_PARTYKIT_HOST is set via build arg or Pages dashboard.
// In local dev (Mode A): front/.env.local sets PUBLIC_PARTYKIT_HOST=localhost:1999.
const PARTYKIT_HOST =
  (import.meta as ImportMeta & { env: Record<string, string> }).env.PUBLIC_PARTYKIT_HOST ||
  'localhost:1999';

/**
 * Creates a PartySocket connected to a specific game session room.
 * The room ID is the 4-digit session code — one Durable Object per session.
 */
export function createSocket(room: string): PartySocket {
  return new PartySocket({
    host: PARTYKIT_HOST,
    room,
    party: 'main',
  });
}
