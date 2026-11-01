import { GRID_SIZE_BY_TASKS } from '../data/grid';
import type { Cell, GameState, PieceId, RandomFn, Settings, Word } from '../types';
import { createGrid, isPlaceable, placeOnGrid, placementAt, removeFromGrid } from './grid';
import { offerPieces } from './offers';
import { startTask, submitAnswer } from './quiz';
import { updateStreak } from './streak';
import { createPicker, pickWord, scheduleRetry } from './wordPicker';

export function createGame(
  wordIds: readonly string[],
  settings: Settings,
  random: RandomFn,
): GameState {
  if (wordIds.length === 0) throw new Error('Partie braucht mindestens ein Wort');
  const first = pickWord(createPicker(), wordIds, 1, random);
  return {
    tasksTotal: settings.tasksPerCastle,
    taskNumber: 1,
    quiz: startTask(first.wordId),
    picker: first.picker,
    streak: 0,
    offers: [],
    pendingPiece: null,
    grid: createGrid(GRID_SIZE_BY_TASKS[settings.tasksPerCastle]),
    step: 'task',
    lastPlacement: null,
  };
}

/** Antwort prüfen. Steht das Ergebnis fest, werden Serie und Wiederholung angepasst. */
export function answerTask(
  state: GameState,
  word: Word,
  input: string,
  settings: Settings,
  random: RandomFn,
): GameState {
  if (state.step !== 'task') return state;
  const quiz = submitAnswer(state.quiz, word, input, settings);
  if (quiz.phase !== 'feedback') return { ...state, quiz };

  const correct = quiz.lastResult?.status === 'correct';
  return {
    ...state,
    quiz,
    streak: updateStreak(state.streak, correct),
    picker: correct
      ? state.picker
      : scheduleRetry(state.picker, quiz.wordId, state.taskNumber, random),
  };
}

function nextTaskOrFinish(state: GameState, wordIds: readonly string[], random: RandomFn): GameState {
  const base = { ...state, offers: [], pendingPiece: null, lastPlacement: null };
  if (state.taskNumber >= state.tasksTotal) return { ...base, step: 'finished' };

  const taskNumber = state.taskNumber + 1;
  const next = pickWord(state.picker, wordIds, taskNumber, random, state.quiz.wordId);
  return { ...base, taskNumber, quiz: startTask(next.wordId), picker: next.picker, step: 'task' };
}

/** Nach dem Feedback: 1 aus 3 anbieten. Passt gar nichts mehr hin, geht es direkt weiter. */
export function finishTask(
  state: GameState,
  wordIds: readonly string[],
  random: RandomFn,
): GameState {
  if (state.step !== 'task' || state.quiz.phase !== 'feedback') return state;
  const correct = state.quiz.lastResult?.status === 'correct';
  const offers = offerPieces(correct, state.streak, random, (id) => isPlaceable(state.grid, id));
  if (offers.length === 0) return nextTaskOrFinish(state, wordIds, random);
  return { ...state, step: 'choosing', offers };
}

export function choosePiece(state: GameState, piece: PieceId): GameState {
  if (state.step !== 'choosing' || !state.offers.includes(piece)) return state;
  return { ...state, step: 'placing', pendingPiece: piece };
}

/** Setzt das gewählte Teil mit dieser Ankerzelle; ungültige Plätze ändern nichts. */
export function placeAt(state: GameState, anchor: Cell): GameState {
  const piece = state.pendingPiece;
  if (state.step !== 'placing' || piece === null) return state;
  if (placementAt(state.grid, piece, anchor) === null) return state;
  return {
    ...state,
    grid: placeOnGrid(state.grid, piece, anchor),
    step: 'placed',
    pendingPiece: null,
    lastPlacement: { piece, anchor },
  };
}

/** Nimmt das zuletzt gesetzte Teil zurück in die Ablage. */
export function undoPlacement(state: GameState): GameState {
  if (state.step !== 'placed' || state.lastPlacement === null) return state;
  const { piece, anchor } = state.lastPlacement;
  return {
    ...state,
    grid: removeFromGrid(state.grid, piece, anchor),
    step: 'placing',
    pendingPiece: piece,
    lastPlacement: null,
  };
}

/** Nächste Aufgabe oder Burg fertig; ab hier ist das gesetzte Teil fest. */
export function continueAfterPlacement(
  state: GameState,
  wordIds: readonly string[],
  random: RandomFn,
): GameState {
  if (state.step !== 'placed') return state;
  return nextTaskOrFinish(state, wordIds, random);
}

export function isLastTask(state: GameState): boolean {
  return state.taskNumber >= state.tasksTotal;
}

/** Beendete Aufgaben für die Fortschrittsanzeige – egal ob richtig oder falsch. */
export function completedTasks(state: GameState): number {
  if (state.step === 'finished') return state.tasksTotal;
  const current = state.step === 'task' && state.quiz.phase === 'answering' ? 0 : 1;
  return state.taskNumber - 1 + current;
}

/**
 * Gespeicherte Partie an die aktuelle Wortliste anpassen: Wörter, die es nicht mehr gibt,
 * werden aus Wiederholungen entfernt, ein unbekanntes aktuelles Wort wird ersetzt.
 * Die Burg selbst bleibt unverändert.
 */
export function withKnownWords(
  state: GameState,
  wordIds: readonly string[],
  random: RandomFn,
): GameState {
  const known = (id: string): boolean => wordIds.includes(id);
  const picker = {
    used: state.picker.used.filter(known),
    retries: state.picker.retries.filter((retry) => known(retry.wordId)),
  };
  if (known(state.quiz.wordId)) return { ...state, picker };
  const next = pickWord(picker, wordIds, state.taskNumber, random);
  return { ...state, quiz: { ...state.quiz, wordId: next.wordId }, picker: next.picker };
}
