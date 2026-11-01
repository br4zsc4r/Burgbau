import type { RandomFn, TaskBoxes, TaskPickerState } from '../types';
import { PRACTICE_SHARE, isPractice } from './progress';
import { randomInt } from './random';

export const RETRY_MIN_DISTANCE = 3;
export const RETRY_MAX_DISTANCE = 5;

export function createPicker(): TaskPickerState {
  return { used: [], retries: [] };
}

/**
 * Aufgabe Nummer taskNumber: zuerst eine fällige Wiederholung, sonst eine in dieser
 * Partie noch nicht gestellte Aufgabe – zu etwa 60 % aus den zu übenden Aufgaben des Profils,
 * sonst aus neuen oder sicheren (leichtes Leitner-System). Gilt für alle Spielarten.
 */
export function pickTask(
  picker: TaskPickerState,
  taskIds: readonly string[],
  taskNumber: number,
  random: RandomFn,
  previousTaskId?: string,
  boxes: TaskBoxes = {},
): { taskId: string; picker: TaskPickerState } {
  const due = picker.retries
    .filter((retry) => retry.dueTask <= taskNumber && retry.taskId !== previousTaskId)
    .sort((a, b) => a.dueTask - b.dueTask)[0];
  if (due !== undefined) {
    return {
      taskId: due.taskId,
      picker: { ...picker, retries: picker.retries.filter((retry) => retry !== due) },
    };
  }

  const unused = taskIds.filter((id) => !picker.used.includes(id));
  const practice = unused.filter((id) => isPractice(boxes, id));
  const fresh = unused.filter((id) => !isPractice(boxes, id));
  const preferred = random() < PRACTICE_SHARE ? practice : fresh;
  const fromList = preferred.length > 0 ? preferred : unused;
  // Weniger Aufgaben als die Partie: dann dürfen sie wiederkommen, nur nicht direkt hintereinander.
  const pool =
    fromList.length > 0
      ? fromList
      : taskIds.filter((id) => id !== previousTaskId || taskIds.length === 1);
  const taskId = pool[randomInt(pool.length, random)];
  if (taskId === undefined) throw new Error('Keine Aufgaben zur Auswahl');
  return { taskId, picker: { ...picker, used: [...picker.used, taskId] } };
}

/** Falsch beantwortete Aufgabe kommt 3–5 Aufgaben später wieder. */
export function scheduleRetry(
  picker: TaskPickerState,
  taskId: string,
  taskNumber: number,
  random: RandomFn,
): TaskPickerState {
  const distance =
    RETRY_MIN_DISTANCE + randomInt(RETRY_MAX_DISTANCE - RETRY_MIN_DISTANCE + 1, random);
  return { ...picker, retries: [...picker.retries, { taskId, dueTask: taskNumber + distance }] };
}
