import type { Cell, GameState, GridSize, RandomFn, Settings, Word } from '../types';
import { canPlace, createGrid, placePiece, removePiece, validCells } from './grid';
import { createQuiz, nextTask, submitAnswer } from './quiz';

export function createGame(
  wordIds: readonly string[],
  gridSize: GridSize,
  random: RandomFn,
): GameState {
  return {
    quiz: createQuiz(wordIds, random),
    grid: createGrid(gridSize),
    step: 'task',
    lastPlacement: null,
  };
}

export function answerTask(
  state: GameState,
  word: Word,
  input: string,
  settings: Settings,
): GameState {
  if (state.step !== 'task') return state;
  return { ...state, quiz: submitAnswer(state.quiz, word, input, settings) };
}

function startNextTask(state: GameState, random: RandomFn): GameState {
  return { ...state, quiz: nextTask(state.quiz, random), step: 'task', lastPlacement: null };
}

/** Nach dem Feedback: Teil setzen. Ist das Raster voll, geht es direkt weiter. */
export function finishTask(state: GameState, random: RandomFn): GameState {
  if (state.step !== 'task' || state.quiz.phase !== 'feedback') return state;
  if (validCells(state.grid).length === 0) return startNextTask(state, random);
  return { ...state, step: 'placing' };
}

/** Setzt das wartende Teil; ungültige Zellen ändern nichts. */
export function placeAt(state: GameState, cell: Cell): GameState {
  if (state.step !== 'placing' || !canPlace(state.grid, cell)) return state;
  return {
    ...state,
    grid: placePiece(state.grid, cell, 'block'),
    step: 'placed',
    lastPlacement: cell,
  };
}

/** Nimmt das zuletzt gesetzte Teil zurück in die Ablage. */
export function undoPlacement(state: GameState): GameState {
  if (state.step !== 'placed' || state.lastPlacement === null) return state;
  return {
    ...state,
    grid: removePiece(state.grid, state.lastPlacement),
    step: 'placing',
    lastPlacement: null,
  };
}

/** Nächste Aufgabe; ab hier ist das gesetzte Teil fest. */
export function continueAfterPlacement(state: GameState, random: RandomFn): GameState {
  if (state.step !== 'placed') return state;
  return startNextTask(state, random);
}
