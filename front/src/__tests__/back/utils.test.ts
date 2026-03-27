import { describe, it, expect, vi } from 'vitest';
import { shuffle, generatePseudonym, generateHostId } from '../../../../back/utils';
import { ADJECTIVES, NOUNS } from '../../../../back/constants';

// ── shuffle ───────────────────────────────────────────────────────────────────

describe('shuffle', () => {
  it('returns an array with the same elements', () => {
    const original = [1, 2, 3, 4, 5];
    const result = shuffle(original);
    expect(result).toHaveLength(original.length);
    expect(result.sort()).toEqual([...original].sort());
  });

  it('does not mutate the original array', () => {
    const original = ['a', 'b', 'c'];
    const copy = [...original];
    shuffle(original);
    expect(original).toEqual(copy);
  });

  it('returns an empty array unchanged', () => {
    expect(shuffle([])).toEqual([]);
  });

  it('returns a single-element array unchanged', () => {
    expect(shuffle([42])).toEqual([42]);
  });

  it('produces a different order with high probability over many runs', () => {
    // With 5 elements there are 120 permutations; the chance of keeping the
    // original order every time over 20 runs is (1/120)^20 ≈ 10^-42.
    const original = [1, 2, 3, 4, 5];
    let sameCount = 0;
    for (let i = 0; i < 20; i++) {
      if (shuffle(original).join(',') === original.join(',')) sameCount++;
    }
    expect(sameCount).toBeLessThan(20);
  });
});

// ── generatePseudonym ─────────────────────────────────────────────────────────

describe('generatePseudonym', () => {
  it('returns a string not already in usedPseudonyms', () => {
    const used = new Set<string>();
    const result = generatePseudonym(used);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(used.has(result)).toBe(false);
  });

  it('returns a pseudonym that is the concatenation of an adjective and a noun', () => {
    const used = new Set<string>();
    const result = generatePseudonym(used);
    const matchesFormat = ADJECTIVES.some((adj) =>
      NOUNS.some((noun) => result === `${adj}${noun}`),
    );
    expect(matchesFormat).toBe(true);
  });

  it('avoids a pseudonym already in the used set', () => {
    // Pre-fill all but one possible combination.
    const used = new Set<string>();
    for (const adj of ADJECTIVES) {
      for (const noun of NOUNS) {
        used.add(`${adj}${noun}`);
      }
    }
    // Remove one so there is exactly one valid result.
    const remaining = `${ADJECTIVES[0]}${NOUNS[0]}`;
    used.delete(remaining);

    // The function may return the remaining combo or fall back to "Wine####".
    const result = generatePseudonym(used);
    // It must not be one of the entries still in `used`.
    expect(used.has(result)).toBe(false);
  });

  it('returns a fallback "Wine####" string when all 400 combinations are used', () => {
    // Fill all 400 combinations (20 adjectives × 20 nouns).
    const used = new Set<string>();
    for (const adj of ADJECTIVES) {
      for (const noun of NOUNS) {
        used.add(`${adj}${noun}`);
      }
    }
    const result = generatePseudonym(used);
    // Fallback pattern: "Wine" followed by 4 digits.
    expect(result).toMatch(/^Wine\d{4}$/);
  });

  it('returns unique pseudonyms across multiple calls with the same used set', () => {
    const used = new Set<string>();
    const results = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const p = generatePseudonym(used);
      used.add(p);
      results.add(p);
    }
    expect(results.size).toBe(10);
  });
});

// ── generateHostId ────────────────────────────────────────────────────────────

describe('generateHostId', () => {
  it('returns a string in ADJECTIVE-NOUN format (uppercase, hyphen-separated)', () => {
    const result = generateHostId();
    expect(result).toMatch(/^[A-Z]+-[A-Z]+$/);
  });

  it('consists of a valid adjective and a valid noun from the vocabulary lists', () => {
    const result = generateHostId();
    const [adj, noun] = result.split('-');
    expect(ADJECTIVES.map((a) => a.toUpperCase())).toContain(adj);
    expect(NOUNS.map((n) => n.toUpperCase())).toContain(noun);
  });

  it('produces diverse results across multiple calls', () => {
    const results = new Set<string>();
    for (let i = 0; i < 30; i++) {
      results.add(generateHostId());
    }
    // Very unlikely to get all 30 identical with 400 combinations.
    expect(results.size).toBeGreaterThan(1);
  });
});
