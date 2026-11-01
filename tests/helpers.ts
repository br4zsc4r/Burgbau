import type { RandomFn, Word } from '../src/types';

export function makeWord(overrides: Partial<Word> & Pick<Word, 'singular' | 'plural'>): Word {
  return {
    id: overrides.singular.toLowerCase(),
    article: 'der',
    pattern: 'e',
    umlaut: false,
    verified: true,
    ...overrides,
  };
}

/** Deterministische Zufallsfolge (LCG), für reproduzierbare Tests. */
export function seededRandom(seed: number): RandomFn {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}
