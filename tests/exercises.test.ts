import { describe, expect, it } from 'vitest';
import { getPiece, PIECES } from '../src/data/pieces';
import { checkTask } from '../src/logic/exercises/exercise';
import { pluralTasks } from '../src/logic/exercises/plural';
import { exerciseOf, isExerciseId, localId, taskId } from '../src/logic/exercises/taskId';
import { fitsExercise } from '../src/logic/offers';
import type { PieceDef } from '../src/types';
import { makeWord, pluralTask, testSettings } from './helpers';

const hund = makeWord({ id: 'hund', singular: 'Hund', plural: ['Hunde'] });
const museum = makeWord({ id: 'museum', singular: 'Museum', plural: ['Museen'], pattern: 'en', stem: 'Muse' });

describe('Aufgaben-IDs', () => {
  it('haben das Präfix ihrer Spielart', () => {
    expect(taskId('plural', 'hund')).toBe('plural:hund');
    expect(exerciseOf('plural:hund')).toBe('plural');
    expect(localId('plural:hund')).toBe('hund');
  });

  it('unbekannte Spielarten werden erkannt', () => {
    expect(exerciseOf('hund')).toBeNull();
    expect(exerciseOf('zaubern:hut')).toBeNull();
    expect(isExerciseId('plural')).toBe(true);
    expect(isExerciseId('zaubern')).toBe(false);
  });
});

describe('Spielart Mehrzahl', () => {
  const pool = { words: [hund, museum], inputModes: { hund: 'tiles', museum: 'tiles' } as const };

  it('macht aus jedem Wort eine Aufgabe mit Präfix', () => {
    expect(pluralTasks(pool, testSettings).map((task) => task.id)).toEqual(['plural:hund', 'plural:museum']);
  });

  it('Bausteine nur, wenn die Liste sie vorsieht und das Wort sich damit bauen lässt', () => {
    const [h, m] = pluralTasks(pool, testSettings);
    expect(h?.inputMode).toBe('tiles');
    // Museum → Museen braucht einen eigenen Stamm: nur Tastatur.
    expect(m?.inputMode).toBe('keyboard');
    expect(pluralTasks(pool, { ...testSettings, inputMode: 'keyboard' })[0]?.inputMode).toBe('keyboard');
  });

  it('prüft Antworten wie bisher', () => {
    const task = pluralTask(hund);
    expect(checkTask(task, 'Hunde', testSettings, 1)).toEqual({ status: 'correct', capitalizationHint: false });
    expect(checkTask(task, 'Hunte', testSettings, 1)).toEqual({ status: 'almost', reason: 'typo' });
    expect(checkTask(task, 'Katzen', testSettings, 2)).toEqual({ status: 'wrong', solution: 'Hunde' });
  });
});

describe('Exklusive Bauteile', () => {
  const exclusive: PieceDef = { ...getPiece('flag'), exercises: ['plural'] };

  it('normale Teile passen zu jeder Spielart', () => {
    expect(fitsExercise(getPiece('flag'), 'plural')).toBe(true);
    expect(fitsExercise(getPiece('flag'), null)).toBe(true);
  });

  it('exklusive Teile nur nach Aufgaben ihrer Spielart', () => {
    expect(fitsExercise(exclusive, 'plural')).toBe(true);
    expect(fitsExercise(exclusive, null)).toBe(false);
  });

  it('exklusive Teile im Katalog nennen nur bekannte Spielarten', () => {
    for (const piece of PIECES) {
      for (const exercise of piece.exercises ?? []) expect(isExerciseId(exercise), piece.id).toBe(true);
    }
  });
});
