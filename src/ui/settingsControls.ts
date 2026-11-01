import { element } from './dom';
import { GEAR_ICON } from './teacherGate';
import { texts } from './texts';

/** Fehler beim Speichern im Lehrkraft-Bereich: nur protokollieren, die Oberfläche bleibt bedienbar. */
export const report = (error: unknown): void => {
  console.error(error);
};

export function button(label: string, className: string, onClick: () => void): HTMLButtonElement {
  const b = element('button', className, label);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

/** Zahnrad-Knopf, der die Einstellungen einer Spielart oder eines Aufgabenbereichs öffnet. */
export function gearButton(label: string, onClick: () => void): HTMLButtonElement {
  const b = element('button', 'settings-gear');
  b.type = 'button';
  b.innerHTML = GEAR_ICON;
  b.setAttribute('aria-label', label);
  b.addEventListener('click', onClick);
  return b;
}

/** Knopf, der vor dem Ausführen einmal nachfragt. */
export function confirmButton(label: string, question: string, yes: string, onConfirm: () => void): HTMLElement {
  const box = element('span', 'confirm-inline');
  const start = button(label, 'secondary-button', () => {
    start.hidden = true;
    ask.hidden = false;
  });
  const ask = element('span', 'confirm-ask');
  ask.hidden = true;
  ask.append(
    element('span', 'confirm-question', question),
    button(yes, 'danger-button', onConfirm),
    button(texts.cancel, 'secondary-button', () => {
      ask.hidden = true;
      start.hidden = false;
    }),
  );
  box.append(start, ask);
  return box;
}

export function labelled(text: string, control: HTMLElement): HTMLElement {
  const label = element('label', 'setting-row');
  label.append(element('span', 'setting-label', text), control);
  return label;
}

export function select<T extends string>(
  options: readonly { value: T; label: string }[],
  value: T,
  onChange: (value: T) => void,
): HTMLSelectElement {
  const el = element('select', 'setting-select');
  for (const option of options) {
    const opt = element('option', '', option.label);
    opt.value = option.value;
    opt.selected = option.value === value;
    el.append(opt);
  }
  el.addEventListener('change', () => {
    onChange(el.value as T);
  });
  return el;
}

export function checkbox(text: string, checked: boolean, onChange: (checked: boolean) => void): HTMLElement {
  const label = element('label', 'setting-check');
  const input = element('input', '');
  input.type = 'checkbox';
  input.checked = checked;
  input.addEventListener('change', () => {
    onChange(input.checked);
  });
  label.append(input, element('span', '', text));
  return label;
}

/** Große Umschalt-Knöpfe, z. B. für die Reihen des 1×1. */
export function toggleButtons(
  values: readonly number[],
  isOn: (value: number) => boolean,
  label: (value: number) => string,
  onToggle: (value: number) => void,
): HTMLElement {
  const box = element('div', 'row-toggles');
  for (const value of values) {
    const on = isOn(value);
    const toggle = element('button', `row-toggle${on ? ' on' : ''}`, String(value));
    toggle.type = 'button';
    toggle.setAttribute('aria-pressed', String(on));
    toggle.setAttribute('aria-label', label(value));
    toggle.addEventListener('click', () => {
      onToggle(value);
    });
    box.append(toggle);
  }
  return box;
}
