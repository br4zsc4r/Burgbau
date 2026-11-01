import { animalArtUrl } from '../data/profileSymbols';
import type { ProfileSymbol } from '../types';
import { element } from './dom';
import { texts } from './texts';

/** Rundes Profil-Symbol: Tier auf farbigem Grund. */
export function createSymbolBadge(symbol: ProfileSymbol, size: 'large' | 'small' = 'large'): HTMLElement {
  const badge = element('span', `symbol-badge symbol-${size}`);
  badge.dataset['color'] = symbol.color;
  badge.setAttribute('role', 'img');
  badge.setAttribute('aria-label', texts.symbolLabel(symbol.animal, symbol.color));
  const img = element('img', 'symbol-animal');
  img.src = animalArtUrl(symbol.animal);
  img.alt = '';
  badge.append(img);
  return badge;
}
