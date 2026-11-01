import type { ExerciseId, Settings } from '../../types';
import { EXERCISE_IDS } from './taskId';

/** Spielarten, die das Kind im freien Spiel wählen kann – in fester Reihenfolge. */
export function freeExercises(settings: Settings): ExerciseId[] {
  return EXERCISE_IDS.filter((exercise) => settings.freeExercises.includes(exercise));
}

/** Ein- oder ausschalten; das letzte eingeschaltete bleibt an (sonst gäbe es nichts zu spielen). */
export function toggleKeepingOne<T>(values: readonly T[], value: T, on: boolean): T[] {
  if (on) return values.includes(value) ? [...values] : [...values, value];
  const next = values.filter((v) => v !== value);
  return next.length === 0 ? [...values] : next;
}
