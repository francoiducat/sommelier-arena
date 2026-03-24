import { ADJECTIVES, NOUNS } from './constants';

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generatePseudonym(usedPseudonyms: Set<string>): string {
  for (let i = 0; i < 400; i++) {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const candidate = `${adj}${noun}`;
    if (!usedPseudonyms.has(candidate)) return candidate;
  }
  return `Wine${Math.floor(Math.random() * 9000) + 1000}`;
}

export function generateHostId(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj.toUpperCase()}-${noun.toUpperCase()}`;
}
