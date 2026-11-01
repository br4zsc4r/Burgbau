import { element } from './dom';
import { texts } from './texts';

/** „Burg fertig!“ – Name und Sammlung folgen in Phase 5. */
export function createFinishedPanel(onNewCastle: () => void): HTMLElement {
  const panel = element('section', 'finished-panel');
  const button = element('button', 'primary-button', texts.newCastle);
  button.type = 'button';
  button.addEventListener('click', onNewCastle);
  panel.append(element('h2', 'finished-title', texts.finishedTitle), button);
  return panel;
}
