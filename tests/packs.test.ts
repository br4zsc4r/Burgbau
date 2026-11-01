import { describe, expect, it } from 'vitest';
import { createGame, finishTask } from '../src/logic/game';
import {
  packExercises,
  packProblems,
  packTasks,
  removePack,
  startOptions,
  upsertPack,
  withoutMissingLists,
} from '../src/logic/packs';
import { exerciseOf } from '../src/logic/exercises/taskId';
import { createPicker, pickTask } from '../src/logic/taskPicker';
import { createRepository } from '../src/state/repository';
import { defaultSettings, parseSettings } from '../src/state/settings';
import { createMemoryStore } from '../src/state/storage';
import { parseGameState, parsePack } from '../src/state/validate';
import type { ExercisePack, WordList } from '../src/types';
import { makeWord, seededRandom, testSettings } from './helpers';

const tiere: WordList = {
  id: 'tiere',
  name: 'Tiere',
  inputMode: 'keyboard',
  words: [makeWord({ id: 'hund', singular: 'Hund', plural: ['Hunde'] }), makeWord({ id: 'fisch', singular: 'Fisch', plural: ['Fische'] })],
};

const mixed: ExercisePack = {
  id: 'p1',
  name: 'Wochenplan',
  contents: { plural: { listIds: ['tiere'] }, multiplication: { rows: [7] } },
};
const timesOnly: ExercisePack = { id: 'p2', name: 'Nur 1×1', contents: { multiplication: { rows: [2, 3] } } };
const empty: ExercisePack = { id: 'p3', name: 'Leer', contents: { plural: { listIds: [] } } };

describe('Übungspakete', () => {
  it('kennen ihre Spielarten (leere Inhalte zählen nicht)', () => {
    expect(packExercises(mixed)).toEqual(['plural', 'multiplication']);
    expect(packExercises(timesOnly)).toEqual(['multiplication']);
    expect(packExercises(empty)).toEqual([]);
  });

  it('mischen Aufgaben aus mehreren Spielarten', () => {
    const tasks = packTasks(mixed, [tiere], testSettings);
    expect(tasks.map((t) => t.id)).toEqual([
      'plural:hund',
      'plural:fisch',
      ...Array.from({ length: 10 }, (_, i) => `multiplication:${String(i + 1)}x7`),
    ]);
  });

  it('übergehen gelöschte Wortlisten und unbekannte Reihen', () => {
    const broken: ExercisePack = { ...mixed, contents: { plural: { listIds: ['weg'] }, multiplication: { rows: [7, 12] } } };
    expect(packTasks(broken, [tiere], testSettings)).toHaveLength(10);
  });

  it('eine Burg aus einem gemischten Paket zieht aus beiden Spielarten', () => {
    const ids = packTasks(mixed, [tiere], testSettings).map((t) => t.id);
    let picker = createPicker();
    const exercises = new Set<string>();
    const random = seededRandom(5);
    for (let n = 1; n <= 12; n++) {
      const next = pickTask(picker, ids, n, random);
      picker = next.picker;
      exercises.add(exerciseOf(next.taskId) ?? '');
    }
    expect([...exercises].sort()).toEqual(['multiplication', 'plural']);
  });

  it('eine Paket-Burg bekommt nach der Antwort ihre Angebote', () => {
    const game = createGame(['multiplication:3x7'], testSettings, seededRandom(1), {}, { kind: 'pack', packId: 'p1' });
    const answered = { ...game, quiz: { ...game.quiz, phase: 'feedback' as const, lastResult: { status: 'correct' as const, capitalizationHint: false } } };
    expect(finishTask(answered, ['multiplication:3x7'], seededRandom(2)).step).toBe('choosing');
  });

  it('brauchen einen Namen und mindestens eine Wortliste oder Reihe', () => {
    expect(packProblems(mixed)).toEqual([]);
    expect(packProblems({ ...mixed, name: '  ' })).toEqual(['name']);
    expect(packProblems(empty)).toEqual(['empty']);
  });

  it('anlegen, ändern, löschen; gelöschte Listen fallen heraus', () => {
    let packs = upsertPack([], { ...mixed, name: ' Wochenplan ' });
    expect(packs).toEqual([mixed]);
    packs = upsertPack(packs, { ...mixed, name: 'Neu' });
    expect(packs.map((p) => p.name)).toEqual(['Neu']);
    packs = upsertPack(packs, timesOnly);
    expect(removePack(packs, 'p1')).toEqual([timesOnly]);
    expect(withoutMissingLists([mixed], [])[0]?.contents.plural).toEqual({ listIds: [] });
    expect(withoutMissingLists([timesOnly], [])).toEqual([timesOnly]);
  });
});

describe('Was das Kind bei „Neue Burg bauen“ wählen kann', () => {
  const hasTasks = (pack: ExercisePack): boolean => packExercises(pack).length > 0;

  it('erst die Pakete (nur mit Aufgaben), dann die freien Spielarten', () => {
    expect(startOptions(testSettings, [mixed, empty, timesOnly], hasTasks)).toEqual([
      { kind: 'pack', packId: 'p1' },
      { kind: 'pack', packId: 'p2' },
      { kind: 'free', exercise: 'plural' },
      { kind: 'free', exercise: 'multiplication' },
    ]);
  });

  it('ohne freies Spiel nur die Pakete; ohne beides gar nichts', () => {
    const noFree = { ...testSettings, freePlay: false };
    expect(startOptions(noFree, [timesOnly], hasTasks)).toEqual([{ kind: 'pack', packId: 'p2' }]);
    expect(startOptions(noFree, [], hasTasks)).toEqual([]);
  });
});

describe('Speichern der Pakete', () => {
  it('speichert und lädt Pakete, Kaputtes fällt weg', async () => {
    const store = createMemoryStore();
    const repo = createRepository(store);
    expect(await repo.loadPacks()).toEqual([]);
    await repo.savePacks([mixed, timesOnly]);
    expect(await repo.loadPacks()).toEqual([mixed, timesOnly]);
    expect(parsePack({ id: 'x', name: '' })).toBeNull();
    expect(parsePack({ id: 'x', name: 'A', contents: { multiplication: { rows: [3, 'drei'] } } })).toEqual({
      id: 'x',
      name: 'A',
      contents: { multiplication: { rows: [3] } },
    });
  });

  it('eine Burg merkt sich ihr Paket', () => {
    const game = createGame(['plural:hund'], testSettings, seededRandom(1), {}, { kind: 'pack', packId: 'p1' });
    expect(parseGameState(JSON.parse(JSON.stringify(game)))).toEqual(game);
    expect(parseGameState({ ...game, selection: { kind: 'pack', packId: '' } })).toBeNull();
  });

  it('freies Spiel ist standardmäßig erlaubt', () => {
    expect(defaultSettings.freePlay).toBe(true);
    expect(parseSettings({ ...defaultSettings, freePlay: false }).freePlay).toBe(false);
  });
});
