import type { TaskBoxes } from '../types';

/** Höchstes Fach im leichten Leitner-System (0–4). */
export const MAX_BOX = 4;
/** Aufgaben bis zu diesem Fach gelten als „zu üben“. */
export const PRACTICE_MAX_BOX = 2;
/** Anteil der Aufgaben aus zu übenden; der Rest sind neue oder sichere Aufgaben. */
export const PRACTICE_SHARE = 0.6;

/** Falsch → Fach 0, richtig → ein Fach höher (höchstens 4). Neue Aufgaben starten bei 0. */
export function updateBoxes(boxes: TaskBoxes, taskId: string, correct: boolean): TaskBoxes {
  const box = correct ? Math.min((boxes[taskId] ?? 0) + 1, MAX_BOX) : 0;
  return { ...boxes, [taskId]: box };
}

/** Schon geübt, aber noch nicht sicher. */
export function isPractice(boxes: TaskBoxes, taskId: string): boolean {
  const box = boxes[taskId];
  return box !== undefined && box <= PRACTICE_MAX_BOX;
}
