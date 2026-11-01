import { describe, expect, it } from 'vitest';
import { checkTask } from '../src/logic/exercises/exercise';
import { freeExercises, toggleKeepingOne } from '../src/logic/exercises/freePlay';
import { checkMultiplication, multiplicationTasks, product } from '../src/logic/exercises/multiplication';
import { exerciseOf } from '../src/logic/exercises/taskId';
import { answerTask, createGame } from '../src/logic/game';
import { defaultSettings, parseSettings } from '../src/state/settings';
import type { MultiplicationTask } from '../src/types';
import { seededRandom, testSettings } from './helpers';

const task = (factor: number, row: number): MultiplicationTask => {
  const found = multiplicationTasks([row]).find((t) => t.factor === factor);
  if (found === undefined) throw new Error('keine Aufgabe');
  return found;
};

describe('Kleines 1×1: Aufgaben', () => {
  it('eine Reihe sind 1 · r bis 10 · r, die Reihe ist der zweite Faktor', () => {
    const seven = multiplicationTasks([7]);
    expect(seven).toHaveLength(10);
    expect(seven.map((t) => `${String(t.factor)}·${String(t.row)}`)).toEqual([
      '1·7', '2·7', '3·7', '4·7', '5·7', '6·7', '7·7', '8·7', '9·7', '10·7',
    ]);
    expect(seven[2]?.id).toBe('multiplication:3x7');
    expect(exerciseOf(seven[2]?.id ?? '')).toBe('multiplication');
  });

  it('nur eingeschaltete Reihen, in fester Reihenfolge, 3 · 7 und 7 · 3 sind verschieden', () => {
    const tasks = multiplicationTasks([7, 3]);
    expect(tasks).toHaveLength(20);
    expect(tasks[0]?.row).toBe(3);
    expect(tasks.map((t) => t.id)).toContain('multiplication:3x7');
    expect(tasks.map((t) => t.id)).toContain('multiplication:7x3');
    expect(multiplicationTasks([])).toEqual([]);
  });
});

describe('Kleines 1×1: Prüfung', () => {
  it('richtig ist das Produkt; Leerzeichen und führende Nullen sind egal', () => {
    expect(product(task(7, 8))).toBe(56);
    expect(checkMultiplication(task(7, 8), '56', 1)).toEqual({ status: 'correct', capitalizationHint: false });
    expect(checkMultiplication(task(7, 8), ' 0 56 ', 1).status).toBe('correct');
    expect(checkMultiplication(task(10, 10), '100', 1).status).toBe('correct');
  });

  it('Zahlendreher: beim ersten Versuch „Fast!“, beim zweiten falsch', () => {
    expect(checkMultiplication(task(7, 8), '65', 1)).toEqual({ status: 'almost', reason: 'digits' });
    expect(checkMultiplication(task(7, 8), '65', 2)).toEqual({ status: 'wrong', solution: '56' });
  });

  it('sonst sofort falsch, mit freundlicher Lösung', () => {
    expect(checkMultiplication(task(7, 8), '54', 1)).toEqual({ status: 'wrong', solution: '56' });
    expect(checkMultiplication(task(7, 8), 'abc', 1)).toEqual({ status: 'wrong', solution: '56' });
    // Einstellige Ergebnisse haben keinen Zahlendreher; „1“ ist kein Dreher von 100.
    expect(checkMultiplication(task(2, 3), '9', 1)).toEqual({ status: 'wrong', solution: '6' });
    expect(checkMultiplication(task(10, 10), '1', 1)).toEqual({ status: 'wrong', solution: '100' });
  });

  it('checkTask wählt die Prüfung der Spielart', () => {
    expect(checkTask(task(6, 6), '36', testSettings, 1).status).toBe('correct');
  });
});

describe('Kleines 1×1 in der Partie', () => {
  it('eine Burg mit 1×1-Auswahl stellt nur 1×1-Aufgaben', () => {
    const tasks = multiplicationTasks([2]);
    const game = createGame(
      tasks.map((t) => t.id),
      testSettings,
      seededRandom(1),
      {},
      { kind: 'free', exercise: 'multiplication' },
    );
    expect(game.selection).toEqual({ kind: 'free', exercise: 'multiplication' });
    const current = tasks.find((t) => t.id === game.quiz.taskId);
    if (current === undefined) throw new Error('unbekannte Aufgabe');
    const answered = answerTask(game, current, String(product(current)), testSettings, seededRandom(2));
    expect(answered.quiz.lastResult?.status).toBe('correct');
    expect(answered.boxes[current.id]).toBe(1);
  });
});

describe('Freies Spiel', () => {
  it('Spielarten in fester Reihenfolge, nur freigegebene', () => {
    expect(freeExercises({ ...testSettings, freeExercises: ['multiplication', 'plural'] })).toEqual([
      'plural',
      'multiplication',
    ]);
    expect(freeExercises({ ...testSettings, freeExercises: ['multiplication'] })).toEqual(['multiplication']);
  });

  it('das letzte eingeschaltete bleibt an', () => {
    expect(toggleKeepingOne([1, 2], 2, false)).toEqual([1]);
    expect(toggleKeepingOne([1], 1, false)).toEqual([1]);
    expect(toggleKeepingOne([1], 3, true)).toEqual([1, 3]);
    expect(toggleKeepingOne([1, 3], 3, true)).toEqual([1, 3]);
  });
});

describe('Einstellungen der Spielarten', () => {
  it('Standard: alle Spielarten frei, alle Reihen an', () => {
    expect(defaultSettings.freeExercises).toEqual(['plural', 'multiplication']);
    expect(defaultSettings.multiplicationRows).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('ältere Einstellungen ohne die Felder bekommen den Standard', () => {
    const old: Record<string, unknown> = { ...defaultSettings };
    delete old['freeExercises'];
    delete old['multiplicationRows'];
    expect(parseSettings(old)).toEqual(defaultSettings);
  });

  it('Ungültiges fällt auf den Standard zurück, doppelte Einträge entfallen', () => {
    const parsed = parseSettings({ ...defaultSettings, freeExercises: ['zaubern'], multiplicationRows: [0, 11] });
    expect(parsed.freeExercises).toEqual(defaultSettings.freeExercises);
    expect(parsed.multiplicationRows).toEqual(defaultSettings.multiplicationRows);
    expect(parseSettings({ ...defaultSettings, multiplicationRows: [7, 7, 3], freeExercises: [] })).toMatchObject({
      multiplicationRows: [7, 3],
      freeExercises: defaultSettings.freeExercises,
    });
  });
});
