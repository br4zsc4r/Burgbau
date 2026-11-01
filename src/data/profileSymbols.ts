import type { Animal, ProfileSymbol, SymbolColor } from '../types';

export const ANIMALS: readonly Animal[] = [
  'fox',
  'owl',
  'dragon',
  'lion',
  'bear',
  'cat',
  'rabbit',
  'frog',
  'hedgehog',
  'fish',
];

export const SYMBOL_COLORS: readonly SymbolColor[] = ['blue', 'yellow', 'pink'];

/** Alle 30 Symbole, nach Farbe gruppiert (erst alle blauen, dann gelbe, dann rosa). */
export const ALL_SYMBOLS: readonly ProfileSymbol[] = SYMBOL_COLORS.flatMap((color) =>
  ANIMALS.map((animal) => ({ animal, color })),
);

/** Platzhalter-Grafik des Tiers (bis Phase 8). */
export function animalArtUrl(animal: Animal): string {
  return `assets/placeholder/symbols/${animal}.svg`;
}

export function sameSymbol(a: ProfileSymbol, b: ProfileSymbol): boolean {
  return a.animal === b.animal && a.color === b.color;
}
