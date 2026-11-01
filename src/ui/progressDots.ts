import { element } from './dom';
import { texts } from './texts';

/** Fortschritt der Burg: ein Punkt je Aufgabe, gefüllt sobald die Aufgabe beendet ist. */
export function createProgressDots(): {
  element: HTMLElement;
  render: (completed: number, total: number) => void;
} {
  const bar = element('div', 'progress-dots');
  bar.setAttribute('role', 'img');
  let dots: HTMLElement[] = [];

  return {
    element: bar,
    render: (completed, total) => {
      if (dots.length !== total) {
        dots = Array.from({ length: total }, () => element('span', 'progress-dot'));
        bar.replaceChildren(...dots);
      }
      dots.forEach((dot, i) => dot.classList.toggle('done', i < completed));
      bar.dataset['done'] = String(completed);
      bar.setAttribute('aria-label', texts.progressLabel(completed, total));
    },
  };
}
