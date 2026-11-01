import type { PieceId } from '../types';
import { element } from './dom';
import { createPieceIcon } from './pieceIcon';
import { texts } from './texts';

/** Zwischenspeicher als Leiste am Rand; Antippen nimmt ein Teil heraus (oder tauscht). */
export function createStashBar(onTake: (index: number) => void): {
  element: HTMLElement;
  render: (stash: readonly PieceId[], interactive: boolean) => void;
} {
  const bar = element('section', 'stash-bar');
  bar.setAttribute('aria-label', texts.stashTitle);
  const title = element('h2', 'stash-title', texts.stashTitle);
  const list = element('div', 'stash-items');
  bar.append(title, list);
  let shown = '';

  return {
    element: bar,
    render: (stash, interactive) => {
      bar.classList.toggle('interactive', interactive);
      const key = `${stash.join()}|${String(interactive)}`;
      if (key === shown) return;
      shown = key;
      list.replaceChildren(
        ...stash.map((id, index) => {
          const item = element('button', 'stash-item');
          item.type = 'button';
          item.dataset['piece'] = id;
          item.disabled = !interactive;
          item.setAttribute('aria-label', texts.stashItemLabel(texts.pieceNames[id]));
          item.append(createPieceIcon(id));
          item.addEventListener('click', () => {
            onTake(index);
          });
          return item;
        }),
      );
    },
  };
}
