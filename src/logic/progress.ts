import type { WordBoxes } from '../types';

/** Höchstes Fach im leichten Leitner-System (0–4). */
export const MAX_BOX = 4;
/** Wörter bis zu diesem Fach gelten als „zu üben“. */
export const PRACTICE_MAX_BOX = 2;
/** Anteil der Aufgaben aus zu übenden Wörtern; der Rest sind neue oder sichere Wörter. */
export const PRACTICE_SHARE = 0.6;

/** Falsch → Fach 0, richtig → ein Fach höher (höchstens 4). Neue Wörter starten bei 0. */
export function updateBoxes(boxes: WordBoxes, wordId: string, correct: boolean): WordBoxes {
  const box = correct ? Math.min((boxes[wordId] ?? 0) + 1, MAX_BOX) : 0;
  return { ...boxes, [wordId]: box };
}

/** Schon geübt, aber noch nicht sicher. */
export function isPractice(boxes: WordBoxes, wordId: string): boolean {
  const box = boxes[wordId];
  return box !== undefined && box <= PRACTICE_MAX_BOX;
}
