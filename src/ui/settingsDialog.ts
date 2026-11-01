import { element } from './dom';
import { button } from './settingsControls';
import { texts } from './texts';

/**
 * Popup im Lehrkraft-Bereich (modales <dialog>): Kopf mit Titel und „Schließen“, darunter ein
 * scrollbarer Inhalt, den render füllt. Esc schließt ebenfalls; danach wird onClose aufgerufen.
 */
export function openSettingsDialog(
  title: string,
  render: (body: HTMLElement) => void,
  onClose: () => void,
): void {
  const dialog = element('dialog', 'settings-dialog');
  dialog.setAttribute('aria-label', title);
  const header = element('div', 'dialog-header');
  header.append(
    element('h2', 'section-title', title),
    button(texts.dialogClose, 'primary-button', () => {
      dialog.close();
    }),
  );
  const body = element('div', 'dialog-body');
  dialog.append(header, body);
  dialog.addEventListener('close', () => {
    dialog.remove();
    onClose();
  });
  document.body.append(dialog);
  render(body);
  dialog.showModal();
}
