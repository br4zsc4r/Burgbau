import { MAX_NICKNAME_LENGTH, normalizeNickname } from '../logic/profiles';
import type { ProfileSymbol } from '../types';
import { element } from './dom';
import { createSymbolBadge } from './profileSymbol';
import { texts } from './texts';

/** „Ich bin neu“: erst ein freies Symbol wählen, dann den Spitznamen eintippen. */
export function createNewProfile(callbacks: {
  onCreate: (symbol: ProfileSymbol, nickname: string) => void;
  onCancel: () => void;
}): {
  element: HTMLElement;
  render: (available: readonly ProfileSymbol[]) => void;
  focus: () => void;
} {
  const screen = element('section', 'screen new-profile');
  const symbolTitle = element('h1', 'screen-title', texts.chooseSymbol);
  const symbols = element('div', 'symbol-grid');

  const form = element('form', 'nickname-form');
  form.noValidate = true;
  const chosen = element('div', 'chosen-symbol');
  const label = element('label', 'nickname-label', texts.nicknameLabel);
  const input = element('input', 'nickname-input');
  input.id = 'nickname';
  label.htmlFor = 'nickname';
  input.type = 'text';
  input.maxLength = MAX_NICKNAME_LENGTH;
  input.autocomplete = 'off';
  input.setAttribute('autocapitalize', 'words');
  input.spellcheck = false;
  const hint = element('p', 'nickname-hint', texts.nicknameHint);
  const create = element('button', 'primary-button', texts.createProfile);
  create.type = 'submit';
  form.append(chosen, label, input, hint, create);

  const back = element('button', 'secondary-button', texts.back);
  back.type = 'button';
  screen.append(symbolTitle, symbols, form, back);

  let symbol: ProfileSymbol | null = null;

  const update = (): void => {
    symbolTitle.hidden = symbol !== null;
    symbols.hidden = symbol !== null;
    form.hidden = symbol === null;
    create.disabled = normalizeNickname(input.value) === '';
  };

  input.addEventListener('input', update);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = normalizeNickname(input.value);
    if (symbol !== null && name !== '') callbacks.onCreate(symbol, name);
  });
  back.addEventListener('click', () => {
    if (symbol === null) {
      callbacks.onCancel();
    } else {
      symbol = null;
      update();
    }
  });

  return {
    element: screen,
    render: (available) => {
      symbol = null;
      input.value = '';
      symbols.replaceChildren(
        ...available.map((option) => {
          const button = element('button', 'symbol-option');
          button.type = 'button';
          button.append(createSymbolBadge(option));
          button.addEventListener('click', () => {
            symbol = option;
            chosen.replaceChildren(createSymbolBadge(option));
            update();
            input.focus();
          });
          return button;
        }),
      );
      update();
    },
    focus: () => {
      if (symbol !== null) input.focus();
    },
  };
}
