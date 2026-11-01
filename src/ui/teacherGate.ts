import { hashPin, isValidPin, pinMatches } from '../logic/pin';
import { element } from './dom';
import { texts } from './texts';

const GEAR_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm8.6 4.9-1.7 1 .1 2-2 1.2-1.7-1.1-1.9.8-.3 2h-2.4l-.3-2-1.9-.8-1.7 1.1-2-1.2.1-2-1.7-1v-2.4l1.7-1-.1-2 2-1.2 1.7 1.1 1.9-.8.3-2h2.4l.3 2 1.9.8 1.7-1.1 2 1.2-.1 2 1.7 1z"/></svg>';

export interface PinStore {
  loadPinHash: () => Promise<string | null>;
  savePinHash: (hash: string) => Promise<void>;
}

function pinInput(id: string): HTMLInputElement {
  const input = element('input', 'gate-input');
  input.id = id;
  input.type = 'password';
  input.inputMode = 'numeric';
  input.autocomplete = 'off';
  input.maxLength = 8;
  return input;
}

/**
 * Gesicherter Zugang (Spezifikation Abschnitt 8): Zahnrad antippen, dann PIN eingeben.
 * Beim ersten Mal legt die Lehrkraft die PIN fest.
 */
export function createTeacherGate(pins: PinStore, onUnlock: () => void): {
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
  const title = element('h2', 'screen-title');
  const hint = element('p', 'gate-hint', texts.pinSetHint);
  const firstLabel = element('label', 'gate-task');
  const first = pinInput('pin-first');
  firstLabel.htmlFor = first.id;
  const repeatLabel = element('label', 'gate-task', texts.pinRepeat);
  const repeat = pinInput('pin-repeat');
  repeatLabel.htmlFor = repeat.id;
  const message = element('p', 'gate-message');
  message.setAttribute('aria-live', 'polite');
  const ok = element('button', 'primary-button', texts.teacherGateOk);
  ok.type = 'submit';
  const cancel = element('button', 'secondary-button', texts.cancel);
  cancel.type = 'button';
  dialog.append(title, hint, firstLabel, first, repeatLabel, repeat, message, ok, cancel);

  let storedHash: string | null = null;

  const open = async (): Promise<void> => {
    storedHash = await pins.loadPinHash();
    const setting = storedHash === null;
    title.textContent = setting ? texts.pinSetTitle : texts.teacherGateTitle;
    firstLabel.textContent = setting ? texts.pinNew : texts.pinEnter;
    hint.hidden = !setting;
    repeatLabel.hidden = !setting;
    repeat.hidden = !setting;
    first.value = '';
    repeat.value = '';
    message.textContent = '';
    dialog.hidden = false;
    first.focus();
  };

  gear.addEventListener('click', () => {
    open().catch((error: unknown) => {
      console.error(error);
    });
  });

  const submit = async (): Promise<void> => {
    const pin = first.value.trim();
    if (storedHash === null) {
      if (!isValidPin(pin)) {
        message.textContent = texts.pinInvalid;
        return;
      }
      if (pin !== repeat.value.trim()) {
        message.textContent = texts.pinMismatch;
        return;
      }
      await pins.savePinHash(await hashPin(pin));
    } else if (!(await pinMatches(pin, storedHash))) {
      message.textContent = texts.pinWrong;
      first.value = '';
      first.focus();
      return;
    }
    dialog.hidden = true;
    onUnlock();
  };

  dialog.addEventListener('submit', (event) => {
    event.preventDefault();
    submit().catch((error: unknown) => {
      console.error(error);
      message.textContent = texts.pinFailed;
    });
  });
  cancel.addEventListener('click', () => {
    dialog.hidden = true;
  });

  return { gear, dialog };
}
