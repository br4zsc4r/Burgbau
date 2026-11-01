import { describe, expect, it } from 'vitest';
import {
  answerTask,
  choosePiece,
  continueAfterPlacement,
  createGame,
  finishTask,
  isLastTask,
  placeAt,
  undoPlacement,
} from '../src/logic/game';
import { getPiece } from '../src/data/pieces';
import { getCell, validCells } from '../src/logic/grid';
import type { GameState, Settings, Word } from '../src/types';
import { makeWord, seededRandom, testSettings } from './helpers';

const words: Word[] = ['Hund', 'Tisch', 'Fisch', 'Schaf', 'Pferd', 'Zelt'].map((singular) =>
  makeWord({ id: singular.toLowerCase(), singular, plural: [`${singular}e`] }),
);
const ids = words.map((word) => word.id);
const random = seededRandom(7);

function wordOf(state: GameState): Word {
  const word = words.find((w) => w.id === state.quiz.wordId);
  if (word === undefined) throw new Error('unbekanntes Wort');
  return word;
}

function answer(state: GameState, correct: boolean, settings: Settings = testSettings): GameState {
  const word = wordOf(state);
  const input = correct ? (word.plural[0] ?? '') : 'Xyzxyz';
  return answerTask(state, word, input, settings, random);
}

/** Antwort → Angebot → erstes Angebot → erste gültige Zelle. */
function playTask(state: GameState, correct: boolean): GameState {
  let next = finishTask(answer(state, correct), ids, random);
  next = choosePiece(next, next.offers[0] ?? 'wall');
  const cell = validCells(next.grid)[0];
  if (cell === undefined) throw new Error('kein Platz');
  return placeAt(next, cell);
}

describe('game', () => {
  it('startet mit Aufgabe 1, Serie 0 und leerem Raster in der passenden Größe', () => {
    const state = createGame(ids, testSettings, random);
    expect(state).toMatchObject({ step: 'task', taskNumber: 1, tasksTotal: 15, streak: 0 });
    expect(state.grid).toMatchObject({ cols: 12, rows: 8 });
    expect(state.grid.cells.every((cell) => cell === null)).toBe(true);
  });

  it('nutzt für 20 Aufgaben ein größeres Raster', () => {
    const state = createGame(ids, { ...testSettings, tasksPerCastle: 20 }, random);
    expect(state.grid).toMatchObject({ cols: 14, rows: 9 });
  });

  it('erhöht die Serie bei richtiger Antwort', () => {
    const state = answer(createGame(ids, testSettings, random), true);
    expect(state.streak).toBe(1);
  });

  it('halbiert die Serie bei falscher Antwort und plant das Wort neu ein', () => {
    let state = createGame(ids, testSettings, random);
    state = { ...state, streak: 6 };
    const wordId = state.quiz.wordId;
    state = answer(state, false);
    expect(state.streak).toBe(3);
    expect(state.picker.retries.map((retry) => retry.wordId)).toEqual([wordId]);
  });

  it('ändert die Serie bei „fast“ noch nicht', () => {
    let state = createGame(ids, testSettings, random);
    state = answerTask(state, wordOf(state), `${wordOf(state).plural[0] ?? ''}x`, testSettings, random);
    expect(state.quiz.phase).toBe('answering');
    expect(state.streak).toBe(0);
  });

  it('bietet nach falscher Antwort drei beschädigte Teile an', () => {
    const state = finishTask(answer(createGame(ids, testSettings, random), false), ids, random);
    expect(state.step).toBe('choosing');
    expect(state.offers.map((id) => getPiece(id).category)).toEqual(['damaged', 'damaged', 'damaged']);
  });

  it('bietet nach richtiger Antwort Grundbauteile an', () => {
    const state = finishTask(answer(createGame(ids, testSettings, random), true), ids, random);
    expect(state.offers.map((id) => getPiece(id).category)).toEqual(['basic', 'basic', 'basic']);
  });

  it('nimmt nur angebotene Teile an', () => {
    const state = finishTask(answer(createGame(ids, testSettings, random), true), ids, random);
    expect(choosePiece(state, 'dragon')).toBe(state);
    const offer = state.offers[1] ?? 'wall';
    expect(choosePiece(state, offer)).toMatchObject({ step: 'placing', pendingPiece: offer });
  });

  it('setzt das gewählte Teil nur auf gültige Zellen', () => {
    let state = finishTask(answer(createGame(ids, testSettings, random), true), ids, random);
    const piece = state.offers[0] ?? 'wall';
    state = choosePiece(state, piece);
    expect(placeAt(state, { col: 0, row: 1 })).toBe(state);

    const placed = placeAt(state, { col: 0, row: 0 });
    expect(placed).toMatchObject({ step: 'placed', pendingPiece: null });
    expect(placed.lastPlacement).toEqual({ cell: { col: 0, row: 0 }, piece });
    expect(getCell(placed.grid, { col: 0, row: 0 })).toBe(piece);
  });

  it('Rückgängig legt das gewählte Teil zurück in die Ablage', () => {
    const placed = playTask(createGame(ids, testSettings, random), true);
    const piece = placed.lastPlacement?.piece;
    const undone = undoPlacement(placed);
    expect(undone).toMatchObject({ step: 'placing', pendingPiece: piece, lastPlacement: null });
    expect(undone.grid.cells.every((cell) => cell === null)).toBe(true);
  });

  it('erlaubt kein Rückgängig mehr nach Beginn der nächsten Aufgabe', () => {
    const placed = playTask(createGame(ids, testSettings, random), true);
    const next = continueAfterPlacement(placed, ids, random);
    expect(next).toMatchObject({ step: 'task', taskNumber: 2, lastPlacement: null, offers: [] });
    expect(next.quiz).toMatchObject({ phase: 'answering', attempt: 1 });
    expect(next.quiz.wordId).not.toBe(placed.quiz.wordId);
    expect(undoPlacement(next)).toBe(next);
  });

  it('ist nach X Aufgaben fertig', () => {
    let state = createGame(ids, { ...testSettings, tasksPerCastle: 10 }, random);
    for (let task = 1; task <= 10; task++) {
      expect(state).toMatchObject({ step: 'task', taskNumber: task });
      expect(isLastTask(state)).toBe(task === 10);
      state = continueAfterPlacement(playTask(state, task % 3 !== 0), ids, random);
    }
    expect(state.step).toBe('finished');
    expect(state.grid.cells.filter((cell) => cell !== null)).toHaveLength(10);
  });

  it('stellt ein falsch beantwortetes Wort 3–5 Aufgaben später erneut', () => {
    let state = createGame(ids, testSettings, random);
    const missed = state.quiz.wordId;
    state = continueAfterPlacement(playTask(state, false), ids, random);
    const askedAt: number[] = [];
    while (state.step === 'task' && state.taskNumber <= 7) {
      if (state.quiz.wordId === missed) askedAt.push(state.taskNumber);
      state = continueAfterPlacement(playTask(state, true), ids, random);
    }
    expect(askedAt).toHaveLength(1);
    expect(askedAt[0]).toBeGreaterThanOrEqual(4);
    expect(askedAt[0]).toBeLessThanOrEqual(6);
  });

  it('überspringt die Angebote, wenn kein Platz mehr frei ist', () => {
    let state = createGame(ids, testSettings, random);
    state = { ...state, grid: { ...state.grid, cells: state.grid.cells.map(() => 'pointedRoof' as const) } };
    const next = finishTask(answer(state, true), ids, random);
    expect(next).toMatchObject({ step: 'task', taskNumber: 2 });
  });

  it('bleibt als JSON serialisierbar', () => {
    const placed = playTask(createGame(ids, testSettings, random), true);
    expect(JSON.parse(JSON.stringify(placed))).toEqual(placed);
  });
});
