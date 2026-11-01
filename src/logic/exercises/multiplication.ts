import type { AnswerResult, MultiplicationTask } from '../../types';
import type { ExerciseLogic } from './exercise';
import { taskId } from './taskId';

/** Die Reihen des kleinen 1×1. */
export const MULTIPLICATION_ROWS: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function multiplicationTask(factor: number, row: number): MultiplicationTask {
  return { exercise: 'multiplication', id: taskId('multiplication', `${String(factor)}x${String(row)}`), factor, row };
}

/** Alle Aufgaben der eingeschalteten Reihen: 1 · r bis 10 · r. */
export function multiplicationTasks(rows: readonly number[]): MultiplicationTask[] {
  return MULTIPLICATION_ROWS.filter((row) => rows.includes(row)).flatMap((row) =>
    MULTIPLICATION_ROWS.map((factor) => multiplicationTask(factor, row)),
  );
}

export function product(task: MultiplicationTask): number {
  return task.factor * task.row;
}

/** Nur Ziffern zählen (Leerzeichen egal); führende Nullen sind egal. */
function digitsOf(input: string): string | null {
  const trimmed = input.normalize('NFC').replace(/\s+/g, '');
  if (!/^\d+$/.test(trimmed)) return null;
  return trimmed.replace(/^0+(?=\d)/, '');
}

/**
 * Prüfung: Zahlvergleich. Ein Zahlendreher (65 statt 56) gibt beim ersten Versuch „Fast!“,
 * sonst zählt die Antwort sofort.
 */
export function checkMultiplication(task: MultiplicationTask, input: string, attempt: 1 | 2): AnswerResult {
  const solution = String(product(task));
  const answer = digitsOf(input);
  if (answer === solution) return { status: 'correct', capitalizationHint: false };
  const swapped = Array.from(solution).reverse().join('');
  if (attempt === 1 && solution.length > 1 && swapped !== solution && answer === swapped) {
    return { status: 'almost', reason: 'digits' };
  }
  return { status: 'wrong', solution };
}

export const multiplicationExercise: ExerciseLogic<MultiplicationTask> = {
  check: (task, input, _settings, attempt) => checkMultiplication(task, input, attempt),
};
