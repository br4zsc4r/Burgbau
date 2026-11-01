import type { GameStep } from '../types';
import { element } from './dom';
import { texts } from './texts';

export interface BuildControlsCallbacks {
  onUndo: () => void;
  onNextTask: () => void;
  onStash: () => void;
  onFinishEditing: () => void;
}

export interface BuildControlsState {
  step: GameStep;
  /** Ein Teil wartet aufs Setzen (Ablage). */
  holding: boolean;
  /** Das wartende Teil ist eine Dekoration. */
  decoration: boolean;
  /** Bearbeiten: Im Speicher liegen noch Teile. */
  stashFilled: boolean;
  /** Bearbeiten: Alles ist gesetzt (oder der Rest passt nirgends mehr hin). */
  canFinish: boolean;
}

/** Hinweis und Buttons über der Bauszene: Setzen, Speicher, Rückgängig, Bearbeiten. */
export function createBuildControls(callbacks: BuildControlsCallbacks): {
  element: HTMLElement;
  render: (state: BuildControlsState) => void;
} {
  const bar = element('div', 'build-controls');
  const hint = element('p', 'build-hint');
  hint.setAttribute('aria-live', 'polite');

  const button = (label: string, className: string, onClick: () => void): HTMLButtonElement => {
    const b = element('button', className, label);
    b.type = 'button';
    b.addEventListener('click', onClick);
    return b;
  };
  const stash = button(texts.stashPiece, 'secondary-button', callbacks.onStash);
  const undo = button(texts.undo, 'secondary-button', callbacks.onUndo);
  const next = button(texts.nextTask, 'primary-button', callbacks.onNextTask);
  const done = button(texts.editDone, 'primary-button', callbacks.onFinishEditing);
  bar.append(hint, stash, undo, next, done);

  function editHint({ holding, stashFilled, canFinish }: BuildControlsState): string {
    if (holding) return texts.editHintHolding;
    if (stashFilled) return canFinish ? texts.editHintStuck : texts.editHintStash;
    return texts.editHint;
  }

  return {
    element: bar,
    render: (state) => {
      const { step, holding, decoration, canFinish } = state;
      const editing = step === 'editing';
      bar.hidden = step !== 'placing' && step !== 'placed' && !editing;
      bar.dataset['step'] = step;

      hint.textContent = editing
        ? editHint(state)
        : decoration
          ? texts.placeHintDecoration
          : texts.placeHint;
      hint.hidden = step === 'placed';
      stash.hidden = !holding || (step !== 'placing' && !editing);
      undo.hidden = step !== 'placed';
      next.hidden = step !== 'placed';
      done.hidden = !editing;
      done.disabled = !canFinish;
    },
  };
}
