import type { ExerciseId } from '../types';
import { element } from './dom';
import { texts } from './texts';

/** „Was möchtest du üben?“: große Karten für die Spielarten im freien Spiel. */
export function createExerciseSelect(callbacks: {
  onChoose: (exercise: ExerciseId) => void;
  onBack: () => void;
}): { element: HTMLElement; render: (exercises: readonly ExerciseId[]) => void } {
  const screen = element('section', 'screen exercise-select');
  const title = element('h1', 'screen-title', texts.chooseExerciseTitle);
  const cards = element('div', 'exercise-cards');
  const back = element('button', 'secondary-button', texts.back);
  back.type = 'button';
  back.addEventListener('click', callbacks.onBack);
  screen.append(title, cards, back);

  return {
    element: screen,
    render: (exercises) => {
      cards.replaceChildren(
        ...exercises.map((exercise) => {
          const card = element('button', 'exercise-card');
          card.type = 'button';
          card.dataset['exercise'] = exercise;
          card.append(
            element('span', 'exercise-sample', texts.exerciseSamples[exercise]),
            element('span', 'exercise-name', texts.exerciseNames[exercise]),
          );
          card.addEventListener('click', () => {
            callbacks.onChoose(exercise);
          });
          return card;
        }),
      );
    },
  };
}
