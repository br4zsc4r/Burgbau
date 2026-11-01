import type { QuizState, Task } from '../../types';
import type { Speaker } from '../speech';

export interface ExercisePanelCallbacks {
  onSubmit: (input: string) => void;
  onContinue: () => void;
  /** Vorlesen; null = ausgeschaltet. */
  speaker: Speaker | null;
}

/** Aufgaben-Oberfläche einer Spielart. Hält keinen eigenen Spielzustand. */
export interface ExercisePanel<T extends Task> {
  element: HTMLElement;
  render: (quiz: QuizState, task: T) => void;
  /** Leert die Eingabe und setzt den Fokus hinein (neue Aufgabe). */
  startNewTask: () => void;
  focusForPhase: (quiz: QuizState) => void;
  /** Kleine Feier um die Aufgabe (richtige Antwort). */
  celebrate: () => void;
}
