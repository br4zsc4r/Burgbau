import { CODE_PICTURES } from '../data/codePictures';
import type { PictureCode, PieceId, Profile } from '../types';
import { element } from './dom';
import { createPieceIcon } from './pieceIcon';
import { createSymbolBadge } from './profileSymbol';
import { texts } from './texts';

/** Bild-Code: beim ersten Mal zwei Bilder aussuchen, danach zum Anmelden antippen. */
export function createPictureCodeScreen(callbacks: {
  onChosen: (code: PictureCode) => void;
  onEntered: (code: PictureCode) => void;
  onBack: () => void;
}): {
  element: HTMLElement;
  render: (profile: Profile, mode: 'choose' | 'enter', wrong: boolean) => void;
} {
  const screen = element('section', 'screen picture-code');
  const badge = element('div', 'home-badge');
  const title = element('h1', 'screen-title');
  const slots = element('div', 'code-slots');
  const message = element('p', 'code-message');
  message.setAttribute('aria-live', 'polite');
  const grid = element('div', 'code-grid');
  const confirmRow = element('div', 'code-confirm');
  const confirm = element('button', 'primary-button', texts.codeConfirm);
  confirm.type = 'button';
  const again = element('button', 'secondary-button', texts.codeAgain);
  again.type = 'button';
  confirmRow.append(confirm, again);
  const back = element('button', 'secondary-button', texts.back);
  back.type = 'button';
  screen.append(badge, title, slots, message, grid, confirmRow, back);

  let mode: 'choose' | 'enter' = 'enter';
  let picked: PieceId[] = [];

  const renderSlots = (): void => {
    slots.replaceChildren(
      ...[0, 1].map((i) => {
        const slot = element('span', 'code-slot');
        const id = picked[i];
        if (id !== undefined) slot.append(createPieceIcon(id));
        return slot;
      }),
    );
    const complete = picked.length === 2;
    grid.hidden = complete && mode === 'choose';
    confirmRow.hidden = !(complete && mode === 'choose');
    if (complete && mode === 'choose') message.textContent = texts.codeRemember;
  };

  grid.append(
    ...CODE_PICTURES.map((id) => {
      const button = element('button', 'code-picture');
      button.type = 'button';
      button.dataset['piece'] = id;
      button.setAttribute('aria-label', texts.codePictureLabel(texts.pieceNames[id]));
      button.append(createPieceIcon(id));
      button.addEventListener('click', () => {
        if (picked.length >= 2) return;
        picked = [...picked, id];
        renderSlots();
        const [first, second] = picked;
        if (mode === 'enter' && first !== undefined && second !== undefined) {
          callbacks.onEntered([first, second]);
        }
      });
      return button;
    }),
  );

  confirm.addEventListener('click', () => {
    const [first, second] = picked;
    if (first !== undefined && second !== undefined) callbacks.onChosen([first, second]);
  });
  again.addEventListener('click', () => {
    picked = [];
    message.textContent = '';
    renderSlots();
  });
  back.addEventListener('click', callbacks.onBack);

  return {
    element: screen,
    render: (profile, nextMode, wrong) => {
      mode = nextMode;
      picked = [];
      badge.replaceChildren(createSymbolBadge(profile.symbol));
      title.textContent = mode === 'choose' ? texts.codeChooseTitle : texts.codeEnterTitle;
      message.textContent = wrong ? texts.codeWrong : '';
      renderSlots();
    },
  };
}
