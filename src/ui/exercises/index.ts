import type { Task } from '../../types';
import { element } from '../dom';
import type { ExercisePanel, ExercisePanelCallbacks } from './panel';
import { createPluralPanel } from './pluralPanel';

export type { ExercisePanelCallbacks } from './panel';

/**
 * Alle Aufgaben-Panels der Spielarten in einem Bereich. Sichtbar ist immer das Panel der
 * aktuellen Aufgabe – bei gemischten Übungspaketen wechselt es von Aufgabe zu Aufgabe.
 */
export function createTaskArea(callbacks: ExercisePanelCallbacks): ExercisePanel<Task> {
  const panels = { plural: createPluralPanel(callbacks) } as const;
  const area = element('div', 'task-area');
  area.append(...Object.values(panels).map((panel) => panel.element));
  // Ohne render: Panels verschiedener Spielarten nehmen verschiedene Aufgaben entgegen.
  let active: Omit<ExercisePanel<Task>, 'render'> = panels.plural;

  return {
    element: area,
    render: (quiz, task) => {
      // Jedes Panel gehört zu genau einer Spielart; task.exercise wählt also das passende.
      const panel = panels[task.exercise];
      panel.render(quiz, task);
      active = panel;
      for (const other of Object.values(panels)) other.element.hidden = other !== panel;
    },
    startNewTask: () => {
      active.startNewTask();
    },
    focusForPhase: (quiz) => {
      active.focusForPhase(quiz);
    },
    celebrate: () => {
      active.celebrate();
    },
  };
}
