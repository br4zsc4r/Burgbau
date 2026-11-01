import { GRID_SIZE_BY_TASKS } from '../data/grid';
import { isMirrorable } from '../data/pieces';
import type { Cell, GameSelection, GameState, PieceId, RandomFn, Settings, Task, TaskBoxes } from '../types';
import {
  createGrid,
  isPlaceable,
  pickUpAt,
  placeOnGrid,
  placementAt,
  removeFromGrid,
} from './grid';
import { offerPieces } from './offers';
import { updateBoxes } from './progress';
import { startTask, submitAnswer } from './quiz';
import { updateStreak } from './streak';
import { createPicker, pickTask, scheduleRetry } from './taskPicker';
import { exerciseOf } from './exercises/taskId';

/** In so vielen letzten Aufgaben ist immer ein Dach im Angebot. */
export const ROOF_GUARANTEE_TASKS = 2;

/** Ohne andere Wahl: freies Spiel der Mehrzahl (bis Phase 9b die einzige Spielart). */
export const DEFAULT_SELECTION: GameSelection = { kind: 'free', exercise: 'plural' };

export function createGame(
  taskIds: readonly string[],
  settings: Settings,
  random: RandomFn,
  boxes: TaskBoxes = {},
  selection: GameSelection = DEFAULT_SELECTION,
): GameState {
  if (taskIds.length === 0) throw new Error('Partie braucht mindestens eine Aufgabe');
  const first = pickTask(createPicker(), taskIds, 1, random, undefined, boxes);
  return {
    tasksTotal: settings.tasksPerCastle,
    taskNumber: 1,
    selection,
    quiz: startTask(first.taskId),
    picker: first.picker,
    streak: 0,
    offers: [],
    pendingPiece: null,
    pendingFlipped: false,
    grid: createGrid(GRID_SIZE_BY_TASKS[settings.tasksPerCastle]),
    step: 'task',
    lastPlacement: null,
    stash: [],
    boxes,
  };
}

/** Antwort prüfen. Steht das Ergebnis fest: Serie, Wiederholung und Lernfach anpassen. */
export function answerTask(
  state: GameState,
  task: Task,
  input: string,
  settings: Settings,
  random: RandomFn,
): GameState {
  if (state.step !== 'task' || task.id !== state.quiz.taskId) return state;
  const quiz = submitAnswer(state.quiz, task, input, settings);
  if (quiz.phase !== 'feedback') return { ...state, quiz };

  const correct = quiz.lastResult?.status === 'correct';
  return {
    ...state,
    quiz,
    streak: updateStreak(state.streak, correct),
    picker: correct
      ? state.picker
      : scheduleRetry(state.picker, quiz.taskId, state.taskNumber, random),
    boxes: updateBoxes(state.boxes, quiz.taskId, correct),
  };
}

/** Nächste Aufgabe – oder nach der letzten Aufgabe in den Bearbeitungsmodus. */
function nextTaskOrEdit(state: GameState, taskIds: readonly string[], random: RandomFn): GameState {
  const base = { ...state, offers: [], pendingPiece: null, pendingFlipped: false, lastPlacement: null };
  if (state.taskNumber >= state.tasksTotal) return { ...base, step: 'editing' };

  const taskNumber = state.taskNumber + 1;
  const next = pickTask(state.picker, taskIds, taskNumber, random, state.quiz.taskId, state.boxes);
  return { ...base, taskNumber, quiz: startTask(next.taskId), picker: next.picker, step: 'task' };
}

/** Nach dem Feedback: 1 aus 3 anbieten. Passt gar nichts mehr hin, geht es direkt weiter. */
export function finishTask(
  state: GameState,
  taskIds: readonly string[],
  random: RandomFn,
): GameState {
  if (state.step !== 'task' || state.quiz.phase !== 'feedback') return state;
  const correct = state.quiz.lastResult?.status === 'correct';
  const offers = offerPieces(
    correct,
    state.streak,
    random,
    (id) => isPlaceable(state.grid, id),
    {
      needsRoof: state.taskNumber > state.tasksTotal - ROOF_GUARANTEE_TASKS,
      // Exklusive Bauteile gibt es nur nach Aufgaben ihrer Spielart.
      exercise: exerciseOf(state.quiz.taskId),
    },
  );
  if (offers.length === 0) return nextTaskOrEdit(state, taskIds, random);
  return { ...state, step: 'choosing', offers };
}

export function choosePiece(state: GameState, piece: PieceId): GameState {
  if (state.step !== 'choosing' || !state.offers.includes(piece)) return state;
  return { ...state, step: 'placing', pendingPiece: piece, pendingFlipped: false };
}

/** Wartendes Teil spiegeln (nur unsymmetrische Teile). */
export function flipPending(state: GameState): GameState {
  const piece = state.pendingPiece;
  if (piece === null || !isMirrorable(piece)) return state;
  return { ...state, pendingFlipped: !state.pendingFlipped };
}

/** Setzt das wartende Teil mit dieser Ankerzelle; ungültige Plätze ändern nichts. */
export function placeAt(state: GameState, anchor: Cell): GameState {
  const piece = state.pendingPiece;
  if ((state.step !== 'placing' && state.step !== 'editing') || piece === null) return state;
  if (placementAt(state.grid, piece, anchor) === null) return state;
  const grid = placeOnGrid(state.grid, piece, anchor, state.pendingFlipped);
  if (state.step === 'editing') return { ...state, grid, pendingPiece: null, pendingFlipped: false };
  // Nach dem letzten Teil geht es direkt in den Bearbeitungsmodus.
  if (isLastTask(state)) return toEditing({ ...state, grid });
  return {
    ...state,
    grid,
    step: 'placed',
    pendingPiece: null,
    pendingFlipped: false,
    lastPlacement: { piece, anchor },
  };
}

function toEditing(state: GameState): GameState {
  return { ...state, step: 'editing', offers: [], pendingPiece: null, pendingFlipped: false, lastPlacement: null };
}

/** Wartendes Teil in den Speicher legen – zählt wie gesetzt (beim Bearbeiten: einfach ablegen). */
export function stashPending(state: GameState): GameState {
  const piece = state.pendingPiece;
  if (piece === null) return state;
  if (state.step === 'editing') {
    return { ...state, pendingPiece: null, pendingFlipped: false, stash: [...state.stash, piece] };
  }
  if (state.step !== 'placing') return state;
  const stash = [...state.stash, piece];
  if (isLastTask(state)) return toEditing({ ...state, stash });
  return {
    ...state,
    step: 'placed',
    pendingPiece: null,
    pendingFlipped: false,
    stash,
    lastPlacement: { piece, anchor: null },
  };
}

/**
 * Teil aus dem Speicher nehmen. Wartet schon ein Teil, wird getauscht:
 * Das wartende Teil kommt an seine Stelle in den Speicher.
 */
export function takeFromStash(state: GameState, index: number): GameState {
  if (state.step !== 'placing' && state.step !== 'editing') return state;
  const taken = state.stash[index];
  if (taken === undefined) return state;
  const stash = [...state.stash];
  if (state.pendingPiece === null) stash.splice(index, 1);
  else stash[index] = state.pendingPiece;
  return { ...state, pendingPiece: taken, pendingFlipped: false, stash };
}

/** Nimmt das zuletzt gesetzte (oder abgelegte) Teil zurück in die Ablage. */
export function undoPlacement(state: GameState): GameState {
  if (state.step !== 'placed' || state.lastPlacement === null) return state;
  const { piece, anchor } = state.lastPlacement;
  let { grid, stash } = state;
  let flipped = false;
  if (anchor === null) {
    const index = stash.lastIndexOf(piece);
    if (index === -1) return state;
    stash = stash.filter((_, i) => i !== index);
  } else {
    // Das Teil kommt so zurück, wie es gesetzt war (auch gespiegelt).
    const placed = [...grid.pieces, ...grid.attachments].find(
      (entry) => entry.piece === piece && entry.col === anchor.col && entry.row === anchor.row,
    );
    flipped = placed?.flipped === true;
    grid = removeFromGrid(grid, piece, anchor);
  }
  return { ...state, grid, stash, step: 'placing', pendingPiece: piece, pendingFlipped: flipped, lastPlacement: null };
}

/** Nächste Aufgabe oder Bearbeitungsmodus; ab hier ist das gesetzte Teil fest. */
export function continueAfterPlacement(
  state: GameState,
  taskIds: readonly string[],
  random: RandomFn,
): GameState {
  if (state.step !== 'placed') return state;
  return nextTaskOrEdit(state, taskIds, random);
}

/**
 * Bearbeitungsmodus: Teil (oder Dekoration) an einer Zelle aufnehmen. Was dadurch keinen
 * Halt mehr hat, fällt in den Speicher.
 */
export function pickUp(state: GameState, cell: Cell): GameState {
  if (state.step !== 'editing' || state.pendingPiece !== null) return state;
  const { grid, picked, flipped, fallen } = pickUpAt(state.grid, cell);
  if (picked === null) return state;
  return { ...state, grid, pendingPiece: picked, pendingFlipped: flipped, stash: [...state.stash, ...fallen] };
}

/** Teile im Speicher, die gerade nirgends mehr hinpassen. */
export function unplaceableStash(state: GameState): PieceId[] {
  return state.stash.filter((id) => !isPlaceable(state.grid, id));
}

/**
 * Fertig erst, wenn alle Teile gesetzt sind: nichts in der Hand, nichts im Speicher –
 * außer Teilen, die nirgends mehr hinpassen (sonst säße das Kind fest).
 */
export function canFinishEditing(state: GameState): boolean {
  return (
    state.step === 'editing' &&
    state.pendingPiece === null &&
    unplaceableStash(state).length === state.stash.length
  );
}

/** Bearbeitung beenden; nicht mehr setzbare Reste im Speicher entfallen. */
export function finishEditing(state: GameState): GameState {
  if (!canFinishEditing(state)) return state;
  return { ...state, step: 'finished', stash: [] };
}

export function isLastTask(state: GameState): boolean {
  return state.taskNumber >= state.tasksTotal;
}

/** Beendete Aufgaben für die Fortschrittsanzeige – egal ob richtig oder falsch. */
export function completedTasks(state: GameState): number {
  if (state.step === 'finished' || state.step === 'editing') return state.tasksTotal;
  const current = state.step === 'task' && state.quiz.phase === 'answering' ? 0 : 1;
  return state.taskNumber - 1 + current;
}

/**
 * Gespeicherte Partie an die aktuellen Aufgaben anpassen (z. B. nach geänderten Wortlisten):
 * Aufgaben, die es nicht mehr gibt, fallen aus den Wiederholungen, eine unbekannte aktuelle
 * Aufgabe wird ersetzt. Die Burg selbst bleibt unverändert.
 */
export function withKnownTasks(
  state: GameState,
  taskIds: readonly string[],
  random: RandomFn,
): GameState {
  const known = (id: string): boolean => taskIds.includes(id);
  const picker = {
    used: state.picker.used.filter(known),
    retries: state.picker.retries.filter((retry) => known(retry.taskId)),
  };
  if (known(state.quiz.taskId)) return { ...state, picker };
  const next = pickTask(picker, taskIds, state.taskNumber, random, undefined, state.boxes);
  return { ...state, quiz: { ...state.quiz, taskId: next.taskId }, picker: next.picker };
}
