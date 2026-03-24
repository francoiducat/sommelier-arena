import { describe, it, expect, beforeEach } from 'vitest';
import { saveSession, loadSessions, mergeSession, deleteSession } from '../../lib/sessionStorage';
import type { SessionListEntry } from '../../types/events';

const HOST = 'TEST-HOST';

function makeSession(code: string, overrides: Partial<SessionListEntry> = {}): SessionListEntry {
  return {
    code,
    title: `Session ${code}`,
    createdAt: '2024-01-01T00:00:00.000Z',
    status: 'waiting',
    participantCount: 0,
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe('saveSession', () => {
  it('saves a new session', () => {
    saveSession(HOST, makeSession('1234'));
    const all = loadSessions(HOST);
    expect(all).toHaveLength(1);
    expect(all[0].code).toBe('1234');
  });

  it('replaces an existing session with the same code', () => {
    saveSession(HOST, makeSession('1234', { title: 'Old' }));
    saveSession(HOST, makeSession('1234', { title: 'New' }));
    const all = loadSessions(HOST);
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe('New');
  });

  it('keeps other sessions when saving a new one', () => {
    saveSession(HOST, makeSession('1111'));
    saveSession(HOST, makeSession('2222'));
    const all = loadSessions(HOST);
    expect(all).toHaveLength(2);
  });
});

describe('loadSessions', () => {
  it('returns empty array when nothing is stored', () => {
    expect(loadSessions(HOST)).toEqual([]);
  });

  it('returns all saved sessions', () => {
    saveSession(HOST, makeSession('1111'));
    saveSession(HOST, makeSession('2222'));
    expect(loadSessions(HOST)).toHaveLength(2);
  });
});

describe('mergeSession', () => {
  it('patches only specified fields, preserving title and createdAt', () => {
    saveSession(HOST, makeSession('1234', { title: 'My Wine Night', createdAt: '2024-01-01T00:00:00.000Z' }));
    mergeSession(HOST, '1234', { status: 'ended', participantCount: 5 });
    const session = loadSessions(HOST)[0];
    expect(session.title).toBe('My Wine Night');
    expect(session.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(session.status).toBe('ended');
    expect(session.participantCount).toBe(5);
  });

  it('creates a new entry if session does not exist', () => {
    mergeSession(HOST, '9999', { status: 'ended' });
    const all = loadSessions(HOST);
    expect(all).toHaveLength(1);
    expect(all[0].code).toBe('9999');
  });
});

describe('deleteSession', () => {
  it('removes the session with the given code', () => {
    saveSession(HOST, makeSession('1111'));
    saveSession(HOST, makeSession('2222'));
    deleteSession(HOST, '1111');
    const all = loadSessions(HOST);
    expect(all).toHaveLength(1);
    expect(all[0].code).toBe('2222');
  });

  it('leaves other sessions intact', () => {
    saveSession(HOST, makeSession('1111'));
    saveSession(HOST, makeSession('2222'));
    saveSession(HOST, makeSession('3333'));
    deleteSession(HOST, '2222');
    const codes = loadSessions(HOST).map((s) => s.code);
    expect(codes).toContain('1111');
    expect(codes).toContain('3333');
    expect(codes).not.toContain('2222');
  });

  it('is a no-op when the code does not exist', () => {
    saveSession(HOST, makeSession('1111'));
    deleteSession(HOST, '9999');
    expect(loadSessions(HOST)).toHaveLength(1);
  });

  it('handles empty storage without throwing', () => {
    expect(() => deleteSession(HOST, '1234')).not.toThrow();
    expect(loadSessions(HOST)).toEqual([]);
  });
});
