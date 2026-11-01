import type { GameSelection } from '../types';
import { element } from './dom';
import { texts } from './texts';

/** Eine Karte auf „Was möchtest du üben?“: Übungspaket oder Spielart im freien Spiel. */
export interface StartChoice {
  selection: GameSelection;
  name: string;
  /** Beispiel (Spielart) oder enthaltene Spielarten (Paket). */
  detail: string;
}

/** „Was möchtest du üben?“: große Karten, zuerst die Pakete der Lehrkraft. */
export function createExerciseSelect(callbacks: {
  onChoose: (selection: GameSelection) => void;
  onBack: () => void;
}): { element: HTMLElement; render: (choices: readonly StartChoice[]) => void } {
  const screen = element('section', 'screen exercise-select');
  const title = element('h1', 'screen-title', texts.chooseExerciseTitle);
  const cards = element('div', 'exercise-cards');
  const back = element('button', 'secondary-button', texts.back);
  back.type = 'button';
  back.addEventListener('click', callbacks.onBack);
  screen.append(title, cards, back);

  return {
    element: screen,
    render: (choices) => {
      cards.replaceChildren(
        ...choices.map(({ selection, name, detail }) => {
          const card = element('button', 'exercise-card');
          card.type = 'button';
          if (selection.kind === 'pack') {
            card.classList.add('pack-card');
            card.dataset['pack'] = selection.packId;
            card.append(element('span', 'pack-badge', texts.packBadge));
          } else {
            card.dataset['exercise'] = selection.exercise;
          }
          card.append(element('span', 'exercise-sample', detail), element('span', 'exercise-name', name));
          card.addEventListener('click', () => {
            callbacks.onChoose(selection);
          });
          return card;
        }),
      );
    },
  };
}
