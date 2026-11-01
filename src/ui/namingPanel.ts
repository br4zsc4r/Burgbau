import { element } from './dom';
import { texts } from './texts';

/** „Burg fertig!“: Namen eingeben (freiwillig, sonst gilt der Vorschlag). */
export function createNamingPanel(onSave: (name: string) => void): {
  element: HTMLElement;
  render: (suggestion: string) => void;
  focus: () => void;
} {
  const panel = element('form', 'finished-panel');
  panel.noValidate = true;
  const label = element('label', 'castle-name-label', texts.castleNameLabel);
  const input = element('input', 'castle-name-input');
  input.id = 'castle-name';
  label.htmlFor = 'castle-name';
  input.type = 'text';
  input.maxLength = 40;
  input.autocomplete = 'off';
  input.spellcheck = false;
  const save = element('button', 'primary-button', texts.saveCastle);
  save.type = 'submit';
  panel.append(element('h2', 'finished-title', texts.finishedTitle), label, input, save);

  let suggestion = '';
  panel.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = input.value.normalize('NFC').trim();
    save.disabled = true;
    onSave(name === '' ? suggestion : name);
  });

  return {
    element: panel,
    render: (next) => {
      if (next === suggestion) return;
      suggestion = next;
      input.value = '';
      input.placeholder = next;
      save.disabled = false;
    },
    focus: () => {
      input.focus();
    },
  };
}
