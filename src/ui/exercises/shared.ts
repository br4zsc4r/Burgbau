import type { AnswerResult } from '../../types';
import { element, reducedMotion } from '../dom';
import { texts } from '../texts';

const SPEAKER_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke-width="2" stroke-linecap="round"/></svg>';

/** Lautsprecher-Knopf an der Aufgabenkarte. */
export function createSpeakButton(): HTMLButtonElement {
  const button = element('button', 'speak-button');
  button.type = 'button';
  button.innerHTML = SPEAKER_ICON;
  button.setAttribute('aria-label', texts.readAloud);
  return button;
}

/** Überschrift für „richtig“ und „fast“ (gleich in allen Spielarten). */
export function feedbackTitle(result: Exclude<AnswerResult, { status: 'wrong' }>): HTMLElement {
  if (result.status === 'correct') return element('p', 'feedback-title', texts.correct);
  const title = { typo: texts.almostTypo, capitalization: texts.almostCapitalization, digits: texts.almostDigits };
  return element('p', 'feedback-title', title[result.reason]);
}

/** Die Karte hüpft, ein kleiner Sternenregen geht von ihr aus (richtige Antwort). */
export function celebrateCard(card: HTMLElement): void {
  if (reducedMotion()) return;
  card.classList.remove('cheer');
  // Neu auslösen, auch wenn die Klasse eben noch gesetzt war.
  card.getBoundingClientRect();
  card.classList.add('cheer');
  const burst = element('div', 'star-burst');
  burst.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 10; i++) {
    const star = element('span', 'burst-star');
    star.style.setProperty('--angle', `${String(i * 36)}deg`);
    star.style.setProperty('--delay', `${String((i % 3) * 60)}ms`);
    burst.append(star);
  }
  card.append(burst);
  window.setTimeout(() => {
    burst.remove();
  }, 1200);
}
