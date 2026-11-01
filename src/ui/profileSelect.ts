import type { Profile } from '../types';
import { element } from './dom';
import { createSymbolBadge } from './profileSymbol';
import { texts } from './texts';

/** Startbildschirm: großes Raster aus Profil-Symbolen, Antippen genügt. */
export function createProfileSelect(callbacks: {
  onSelect: (profile: Profile) => void;
  onNew: () => void;
}): { element: HTMLElement; render: (profiles: readonly Profile[], canCreate: boolean) => void } {
  const screen = element('section', 'screen profile-select');
  const title = element('h1', 'screen-title', texts.whoIsPlaying);
  const grid = element('div', 'profile-grid');
  screen.append(title, grid);

  return {
    element: screen,
    render: (profiles, canCreate) => {
      const tiles = profiles.map((profile) => {
        const tile = element('button', 'profile-tile');
        tile.type = 'button';
        tile.append(createSymbolBadge(profile.symbol), element('span', 'profile-name', profile.nickname));
        tile.addEventListener('click', () => {
          callbacks.onSelect(profile);
        });
        return tile;
      });
      if (canCreate) {
        const add = element('button', 'profile-tile profile-new');
        add.type = 'button';
        add.append(element('span', 'profile-plus', '+'), element('span', 'profile-name', texts.newProfile));
        add.addEventListener('click', callbacks.onNew);
        tiles.push(add);
      }
      grid.replaceChildren(...tiles);
    },
  };
}
