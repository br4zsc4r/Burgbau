import type { GameStep } from '../types';
import { element } from './dom';
import { texts } from './texts';

export interface BuildControlsCallbacks {
  onUndo: () => void;
  onNextTask: () => void;
}

/** Hinweis und Buttons über der Bauszene, während ein Teil gesetzt wird. */
export function createBuildControls(callbacks: BuildControlsCallbacks): {
  element: HTMLElement;
  render: (step: GameStep) => void;
} {
  const bar = element('div', 'build-controls');
  const hint = element('p', 'build-hint', texts.placeHint);
  hint.setAttribute('aria-live', 'polite');
  const undo = element('button', 'secondary-button', texts.undo);
  undo.type = 'button';
  const next = element('button', 'primary-button', texts.nextTask);
  next.type = 'button';
  bar.append(hint, undo, next);

  undo.addEventListener('click', callbacks.onUndo);
  next.addEventListener('click', callbacks.onNextTask);

  return {
    element: bar,
    render: (step) => {
      bar.hidden = step === 'task';
      hint.hidden = step !== 'placing';
      undo.hidden = step !== 'placed';
      next.hidden = step !== 'placed';
    },
  };
}
