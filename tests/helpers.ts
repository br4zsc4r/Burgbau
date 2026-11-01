import type { RandomFn, Settings, Word } from '../src/types';

export const testSettings: Settings = {
  wordListId: 'test',
  inputMode: 'list',
  requireCapitalization: false,
  readAloud: false,
  tasksPerCastle: 15,
  allowSelfRegistration: true,
  pictureCode: false,
  showAllCastles: true,
};

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
  // Startwert durchmischen, damit aufeinanderfolgende Seeds nicht ähnlich beginnen.
  let value = (seed * 2654435761 + 12345) % 4294967296;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}
