import type { RandomFn } from '../types';
import { element } from './dom';
import { texts } from './texts';

/** So lange muss das Zahnrad gedrückt werden. */
export const HOLD_MS = 3000;

const GEAR_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm8.6 4.9-1.7 1 .1 2-2 1.2-1.7-1.1-1.9.8-.3 2h-2.4l-.3-2-1.9-.8-1.7 1.1-2-1.2.1-2-1.7-1v-2.4l1.7-1-.1-2 2-1.2 1.7 1.1 1.9-.8.3-2h2.4l.3 2 1.9.8 1.7-1.1 2 1.2-.1 2 1.7 1z"/></svg>';

/**
 * Gesicherter Zugang (Spezifikation Abschnitt 8): Zahnrad 3 Sekunden gedrückt halten,
 * dann eine kleine Rechenaufgabe lösen. Kinder öffnen das nicht aus Versehen.
 */
export function createTeacherGate(random: RandomFn, onUnlock: () => void): {
  gear: HTMLElement;
  dialog: HTMLElement;
} {
  const gear = element('button', 'gear-button');
  gear.type = 'button';
  gear.innerHTML = GEAR_ICON;
  gear.setAttribute('aria-label', texts.teacherGear);

  const dialog = element('form', 'teacher-gate');
  dialog.noValidate = true;
  dialog.hidden = true;
  const title = element('h2', 'screen-title', texts.teacherGateTitle);
  const label = element('label', 'gate-task');
  const input = element('input', 'gate-input');
  input.id = 'gate-answer';
  label.htmlFor = 'gate-answer';
  input.type = 'text';
  input.inputMode = 'numeric';
  input.autocomplete = 'off';
  const message = element('p', 'gate-message');
  const ok = element('button', 'primary-button', texts.teacherGateOk);
  ok.type = 'submit';
  const cancel = element('button', 'secondary-button', texts.cancel);
  cancel.type = 'button';
  dialog.append(title, label, input, message, ok, cancel);

  let answer = 0;
  const newTask = (): void => {
    const a = 6 + Math.floor(random() * 4);
    const b = 6 + Math.floor(random() * 4);
    answer = a * b;
    label.textContent = texts.teacherGateTask(a, b);
    input.value = '';
  };

  let timer: number | undefined;
  const release = (): void => {
    window.clearTimeout(timer);
    timer = undefined;
    gear.classList.remove('holding');
  };
  const press = (): void => {
    if (timer !== undefined) return;
    gear.classList.add('holding');
    timer = window.setTimeout(() => {
      release();
      newTask();
      message.textContent = '';
      dialog.hidden = false;
      input.focus();
    }, HOLD_MS);
  };
  gear.addEventListener('pointerdown', press);
  for (const type of ['pointerup', 'pointerleave', 'pointercancel']) gear.addEventListener(type, release);
  // Tastatur: Enter oder Leertaste gedrückt halten.
  gear.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      press();
    }
  });
  gear.addEventListener('keyup', release);
  gear.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });

  dialog.addEventListener('submit', (event) => {
    event.preventDefault();
    if (Number(input.value.trim()) === answer) {
      dialog.hidden = true;
      onUnlock();
    } else {
      message.textContent = texts.teacherGateWrong;
      newTask();
      input.focus();
    }
  });
  cancel.addEventListener('click', () => {
    dialog.hidden = true;
  });

  return { gear, dialog };
}
