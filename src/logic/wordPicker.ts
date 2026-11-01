import type { RandomFn, WordPickerState } from '../types';
import { randomInt } from './random';

export const RETRY_MIN_DISTANCE = 3;
export const RETRY_MAX_DISTANCE = 5;

export function createPicker(): WordPickerState {
  return { used: [], retries: [] };
}

/**
 * Wort für Aufgabe taskNumber: zuerst ein fälliges Wiederholungswort,
 * sonst ein zufälliges, in dieser Partie noch nicht gestelltes Wort.
 */
export function pickWord(
  picker: WordPickerState,
  wordIds: readonly string[],
  taskNumber: number,
  random: RandomFn,
  previousWordId?: string,
): { wordId: string; picker: WordPickerState } {
  const due = picker.retries
    .filter((retry) => retry.dueTask <= taskNumber && retry.wordId !== previousWordId)
    .sort((a, b) => a.dueTask - b.dueTask)[0];
  if (due !== undefined) {
    return {
      wordId: due.wordId,
      picker: { ...picker, retries: picker.retries.filter((retry) => retry !== due) },
    };
  }

  const unused = wordIds.filter((id) => !picker.used.includes(id));
  // Liste kürzer als die Partie: dann dürfen Wörter wiederkommen, nur nicht direkt hintereinander.
  const pool =
    unused.length > 0 ? unused : wordIds.filter((id) => id !== previousWordId || wordIds.length === 1);
  const wordId = pool[randomInt(pool.length, random)];
  if (wordId === undefined) throw new Error('Keine Wörter zur Auswahl');
  return { wordId, picker: { ...picker, used: [...picker.used, wordId] } };
}

/** Falsch beantwortetes Wort kommt 3–5 Aufgaben später wieder. */
export function scheduleRetry(
  picker: WordPickerState,
  wordId: string,
  taskNumber: number,
  random: RandomFn,
): WordPickerState {
  const distance =
    RETRY_MIN_DISTANCE + randomInt(RETRY_MAX_DISTANCE - RETRY_MIN_DISTANCE + 1, random);
  return { ...picker, retries: [...picker.retries, { wordId, dueTask: taskNumber + distance }] };
}
