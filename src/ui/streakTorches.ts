import { TORCH_LIT_URL, TORCH_UNLIT_URL } from '../data/pieceArt';
import { element } from './dom';
import { texts } from './texts';

/** Ab Serie 10 gibt es Premium-Teile; mehr Fackeln braucht es nicht. */
const TORCH_COUNT = 10;

/** Serie als Fackeln, die nacheinander aufleuchten. */
export function createStreakTorches(): { element: HTMLElement; render: (streak: number) => void } {
  const bar = element('div', 'streak-torches');
  bar.setAttribute('role', 'img');
  const torches = Array.from({ length: TORCH_COUNT }, () => {
    const img = element('img', 'torch');
    img.alt = '';
    img.src = TORCH_UNLIT_URL;
    bar.append(img);
    return img;
  });
  let lit = -1;

  return {
    element: bar,
    render: (streak) => {
      const next = Math.min(streak, TORCH_COUNT);
      if (next === lit) return;
      torches.forEach((torch, i) => {
        const on = i < next;
        torch.src = on ? TORCH_LIT_URL : TORCH_UNLIT_URL;
        torch.classList.toggle('lit', on);
        // Nur die neu entzündete Fackel flackert kurz auf.
        torch.classList.toggle('just-lit', on && i >= lit && lit >= 0);
      });
      lit = next;
      bar.dataset['lit'] = String(next);
      bar.setAttribute('aria-label', texts.streakLabel(next));
    },
  };
}
