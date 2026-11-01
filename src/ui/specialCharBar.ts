import { specialChars } from '../logic/specialChars';
import { texts } from './texts';

/**
 * Bildschirmleiste mit Ä Ö Ü ß. Fügt an der Cursorposition ein,
 * ohne dass das Eingabefeld den Fokus verliert (Tablet-Tastatur bleibt offen).
 */
export function createSpecialCharBar(input: HTMLInputElement): {
  element: HTMLElement;
  setEnabled: (enabled: boolean) => void;
} {
  const element = document.createElement('div');
  element.className = 'special-char-bar';
  element.setAttribute('role', 'group');
  element.setAttribute('aria-label', texts.specialCharsLabel);

  const buttons = specialChars(0).map(() => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'special-char';
    // Fokus im Eingabefeld halten.
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
    });
    button.addEventListener('click', () => {
      const char = button.dataset['char'] ?? '';
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? start;
      input.focus();
      input.setRangeText(char, start, end, 'end');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    element.append(button);
    return button;
  });

  const updateLabels = (): void => {
    const chars = specialChars(input.selectionStart ?? input.value.length);
    buttons.forEach((button, i) => {
      const char = chars[i] ?? '';
      button.dataset['char'] = char;
      button.textContent = char;
      button.setAttribute('aria-label', texts.insertChar(char));
    });
  };

  for (const type of ['input', 'keyup', 'pointerup', 'focus', 'select']) {
    input.addEventListener(type, updateLabels);
  }
  document.addEventListener('selectionchange', () => {
    if (document.activeElement === input) updateLabels();
  });
  updateLabels();

  return {
    element,
    setEnabled: (enabled) => {
      for (const button of buttons) button.disabled = !enabled;
    },
  };
}
