import { describe, expect, it } from 'vitest';
import {
  answerTask,
  continueAfterPlacement,
  createGame,
  finishTask,
  placeAt,
  undoPlacement,
} from '../src/logic/game';
import { getCell } from '../src/logic/grid';
import type { GameState, Settings } from '../src/types';
import { makeWord, seededRandom } from './helpers';

const settings: Settings = { requireCapitalization: false };
const hund = makeWord({ id: 'hund', singular: 'Hund', plural: ['Hunde'] });

function answered(gridSize = { cols: 3, rows: 2 }): GameState {
  const state = createGame(['hund'], gridSize, seededRandom(1));
  return answerTask(state, hund, 'Hunde', settings);
}

describe('game', () => {
  it('startet mit einer Aufgabe und leerem Raster', () => {
    const state = createGame(['hund'], { cols: 3, rows: 2 }, seededRandom(1));
    expect(state.step).toBe('task');
    expect(state.grid.cells.every((cell) => cell === null)).toBe(true);
  });

  it('wechselt erst nach dem Feedback zum Setzen', () => {
    const state = createGame(['hund'], { cols: 3, rows: 2 }, seededRandom(1));
    expect(finishTask(state, seededRandom(1))).toBe(state);
    expect(finishTask(answered(), seededRandom(1)).step).toBe('placing');
  });

  it('gibt auch nach falscher Antwort ein Teil', () => {
    const state = answerTask(
      createGame(['hund'], { cols: 3, rows: 2 }, seededRandom(1)),
      hund,
      'Katzen',
      settings,
    );
    expect(finishTask(state, seededRandom(1)).step).toBe('placing');
  });

  it('setzt das Teil nur auf gültige Zellen', () => {
    const placing = finishTask(answered(), seededRandom(1));
    expect(placeAt(placing, { col: 0, row: 1 })).toBe(placing);

    const placed = placeAt(placing, { col: 0, row: 0 });
    expect(placed.step).toBe('placed');
    expect(placed.lastPlacement).toEqual({ col: 0, row: 0 });
    expect(getCell(placed.grid, { col: 0, row: 0 })).toBe('block');
  });

  it('setzt nur ein Teil pro Aufgabe', () => {
    const placed = placeAt(finishTask(answered(), seededRandom(1)), { col: 0, row: 0 });
    expect(placeAt(placed, { col: 1, row: 0 })).toBe(placed);
  });

  it('nimmt das letzte Teil zurück', () => {
    const placed = placeAt(finishTask(answered(), seededRandom(1)), { col: 0, row: 0 });
    const undone = undoPlacement(placed);
    expect(undone.step).toBe('placing');
    expect(undone.lastPlacement).toBeNull();
    expect(getCell(undone.grid, { col: 0, row: 0 })).toBeNull();
  });

  it('erlaubt kein Rückgängig mehr nach Beginn der nächsten Aufgabe', () => {
    const placed = placeAt(finishTask(answered(), seededRandom(1)), { col: 0, row: 0 });
    const next = continueAfterPlacement(placed, seededRandom(1));
    expect(next).toMatchObject({ step: 'task', lastPlacement: null });
    expect(next.quiz).toMatchObject({ phase: 'answering', attempt: 1 });
    expect(undoPlacement(next)).toBe(next);
    expect(getCell(next.grid, { col: 0, row: 0 })).toBe('block');
  });

  it('überspringt das Setzen, wenn das Raster voll ist', () => {
    let state = answered({ cols: 1, rows: 1 });
    state = placeAt(finishTask(state, seededRandom(1)), { col: 0, row: 0 });
    state = continueAfterPlacement(state, seededRandom(1));
    state = answerTask(state, hund, 'Hunde', settings);
    const next = finishTask(state, seededRandom(1));
    expect(next.step).toBe('task');
    expect(next.quiz.phase).toBe('answering');
  });

  it('bleibt als JSON serialisierbar', () => {
    const placed = placeAt(finishTask(answered(), seededRandom(1)), { col: 0, row: 0 });
    expect(JSON.parse(JSON.stringify(placed))).toEqual(placed);
  });
});
