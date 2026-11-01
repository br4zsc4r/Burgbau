import { element, reducedMotion } from './dom';
import { texts } from './texts';

const COLORS = ['#f2bf2c', '#e0483e', '#3a7bd5', '#5fae4c', '#8a4fbf', '#f28bb0'];
const PIECES = 48;
const DURATION = 3600;

/** „Burg fertig!“: Schriftzug und Konfetti über der Szene, blockiert keine Eingabe. */
export function createCelebration(): { element: HTMLElement; play: () => void } {
  const root = element('div', 'celebration');
  root.setAttribute('aria-hidden', 'true');
  root.hidden = true;
  let timer = 0;

  return {
    element: root,
    play: () => {
      window.clearTimeout(timer);
      const banner = element('p', 'celebration-banner', texts.castleCelebration);
      const confetti = reducedMotion()
        ? []
        : Array.from({ length: PIECES }, (_, i) => {
            const piece = element('span', 'confetti');
            // Gleichmäßig verteilt, aber nicht in Reih und Glied.
            piece.style.left = `${String((i * 37) % 100)}%`;
            piece.style.background = COLORS[i % COLORS.length] ?? '#f2bf2c';
            piece.style.setProperty('--delay', `${String((i * 53) % 900)}ms`);
            piece.style.setProperty('--drift', `${String(((i * 29) % 60) - 30)}px`);
            piece.style.setProperty('--spin', `${String(((i * 71) % 2 === 0 ? 1 : -1) * (360 + ((i * 41) % 360)))}deg`);
            return piece;
          });
      root.replaceChildren(banner, ...confetti);
      root.hidden = false;
      timer = window.setTimeout(() => {
        root.hidden = true;
        root.replaceChildren();
      }, DURATION);
    },
  };
}
