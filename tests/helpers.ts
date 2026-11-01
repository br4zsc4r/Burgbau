import type { InputMode, PluralTask, RandomFn, Settings, Word } from '../src/types';

export const testSettings: Settings = {
  activeListIds: ['test'],
  inputMode: 'list',
  requireCapitalization: false,
  readAloud: false,
  sound: false,
  freeExercises: ['plural', 'multiplication'],
  multiplicationRows: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
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

/** Mehrzahl-Aufgabe zu einem Wort (Aufgaben-ID mit Präfix „plural:“). */
export function pluralTask(word: Word, inputMode: InputMode = 'keyboard'): PluralTask {
  return { exercise: 'plural', id: `plural:${word.id}`, word, inputMode };
}
