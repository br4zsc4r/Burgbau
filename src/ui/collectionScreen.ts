import type { Castle, Profile } from '../types';
import { element } from './dom';
import { createSymbolBadge } from './profileSymbol';
import { texts } from './texts';

export type CollectionScope = 'mine' | 'all';

/** Galerie: Vorschaubilder, Antippen öffnet die Burg in voller Größe (nur anschauen). */
export function createCollectionScreen(callbacks: {
  onScope: (scope: CollectionScope) => void;
  onOpen: (castle: Castle) => void;
  onBack: () => void;
}): {
  element: HTMLElement;
  render: (
    scope: CollectionScope,
    castles: readonly Castle[],
    profiles: readonly Profile[],
    showAllToggle: boolean,
  ) => void;
  setThumbnail: (castleId: string, url: string) => void;
} {
  const screen = element('section', 'screen collection');
  const header = element('div', 'collection-header');
  const title = element('h1', 'screen-title');
  const toggle = element('button', 'secondary-button');
  toggle.type = 'button';
  const back = element('button', 'secondary-button', texts.back);
  back.type = 'button';
  header.append(back, title, toggle);
  const empty = element('p', 'collection-empty');
  const grid = element('div', 'castle-grid');
  screen.append(header, empty, grid);

  let scope: CollectionScope = 'mine';
  const images = new Map<string, HTMLImageElement>();

  toggle.addEventListener('click', () => {
    callbacks.onScope(scope === 'mine' ? 'all' : 'mine');
  });
  back.addEventListener('click', callbacks.onBack);

  return {
    element: screen,
    render: (nextScope, castles, profiles, showAllToggle) => {
      scope = nextScope;
      // Die Lehrkraft kann „Alle Burgen“ ausblenden.
      toggle.hidden = !showAllToggle;
      title.textContent = scope === 'mine' ? texts.myCastles : texts.allCastles;
      toggle.textContent = scope === 'mine' ? texts.allCastles : texts.myCastles;
      empty.textContent = scope === 'mine' ? texts.noCastlesMine : texts.noCastlesAll;
      empty.hidden = castles.length > 0;
      images.clear();
      grid.replaceChildren(
        ...castles.map((castle) => {
          const card = element('button', 'castle-card');
          card.type = 'button';
          card.dataset['castle'] = castle.id;
          const img = element('img', 'castle-thumb');
          img.alt = '';
          images.set(castle.id, img);
          card.append(img, element('span', 'castle-name', castle.name));
          if (scope === 'all') {
            const owner = profiles.find((p) => p.id === castle.profileId);
            if (owner !== undefined) {
              const by = element('span', 'castle-owner');
              by.append(createSymbolBadge(owner.symbol, 'small'), texts.castleBy(owner.nickname));
              card.append(by);
            }
          }
          card.append(element('span', 'castle-date', texts.formatDate(castle.createdAt)));
          card.addEventListener('click', () => {
            callbacks.onOpen(castle);
          });
          return card;
        }),
      );
    },
    setThumbnail: (castleId, url) => {
      const img = images.get(castleId);
      if (img !== undefined) img.src = url;
    },
  };
}
