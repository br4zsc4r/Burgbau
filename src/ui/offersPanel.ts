import { getPiece, rarityOf } from '../data/pieces';
import type { PieceId } from '../types';
import { element } from './dom';
import { createPieceIcon } from './pieceIcon';
import { texts } from './texts';

/** „1 aus 3“: drei große Karten mit Bild und Namen. */
export function createOffersPanel(onChoose: (piece: PieceId) => void): {
  element: HTMLElement;
  render: (offers: readonly PieceId[]) => void;
} {
  const panel = element('section', 'offers-panel');
  const title = element('h2', 'offers-title', texts.offersTitle);
  const hint = element('p', 'offers-hint', texts.offersDamagedHint);
  const list = element('div', 'offers');
  panel.append(title, hint, list);

  let shown: readonly PieceId[] = [];

  return {
    element: panel,
    render: (offers) => {
      if (offers.join() === shown.join()) return;
      shown = offers;
      hint.hidden = !offers.some((id) => getPiece(id).category === 'damaged');
      list.replaceChildren(
        ...offers.map((id) => {
          const card = element('button', 'offer-card');
          card.type = 'button';
          card.dataset['piece'] = id;
          card.dataset['category'] = getPiece(id).category;
          card.dataset['rarity'] = rarityOf(getPiece(id));
          card.append(createPieceIcon(id), element('span', 'offer-name', texts.pieceNames[id]));
          card.addEventListener('click', () => {
            onChoose(id);
          });
          return card;
        }),
      );
    },
  };
}
