import type { AnswerResult, ExerciseId, Settings, Task } from '../../types';
import { multiplicationExercise } from './multiplication';
import { pluralExercise } from './plural';

/**
 * Schnittstelle einer Spielart (Spezifikation Abschnitt 14). Die Oberfläche dazu liegt in
 * src/ui/exercises/. Eine neue Spielart = Logik hier + Panel dort + Inhalts-Einstellung + Texte.
 */
export interface ExerciseLogic<T extends Task> {
  /** Antwort prüfen; attempt 2 = zweiter Versuch nach „Fast!“. */
  check: (task: T, input: string, settings: Settings, attempt: 1 | 2) => AnswerResult;
}

type TaskOf<E extends ExerciseId> = Extract<Task, { exercise: E }>;

const EXERCISES: { readonly [E in ExerciseId]: ExerciseLogic<TaskOf<E>> } = {
  plural: pluralExercise,
  multiplication: multiplicationExercise,
};

/** Antwort mit der Prüfung der passenden Spielart auswerten. */
export function checkTask(task: Task, input: string, settings: Settings, attempt: 1 | 2): AnswerResult {
  // Die Tabelle ordnet jeder Spielart ihre Aufgaben zu; task.exercise wählt also die passende Prüfung.
  const logic = EXERCISES[task.exercise] as ExerciseLogic<Task>;
  return logic.check(task, input, settings, attempt);
}
