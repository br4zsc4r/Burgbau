import type { ExerciseId } from '../../types';

/** Alle Spielarten in der Reihenfolge, in der sie angeboten werden. */
export const EXERCISE_IDS: readonly ExerciseId[] = ['plural', 'multiplication'];

/** Aufgaben-ID mit Präfix der Spielart: „plural:hund“. So sind IDs über alle Spielarten eindeutig. */
export function taskId(exercise: ExerciseId, localId: string): string {
  return `${exercise}:${localId}`;
}

/** Spielart einer Aufgaben-ID; null bei unbekanntem Präfix. */
export function exerciseOf(id: string): ExerciseId | null {
  const prefix = id.slice(0, id.indexOf(':'));
  return EXERCISE_IDS.find((exercise) => exercise === prefix) ?? null;
}

/** Teil nach dem Präfix (bei der Mehrzahl die Wort-ID). */
export function localId(id: string): string {
  return id.slice(id.indexOf(':') + 1);
}

export function isExerciseId(value: unknown): value is ExerciseId {
  return EXERCISE_IDS.includes(value as ExerciseId);
}
