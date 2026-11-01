import type { PluralPattern, Word } from '../types';
import { analyzePlural } from './pluralPattern';

/** Endungs-Bausteine in fester Reihenfolge; „none“ = keine Endung. */
export const ENDING_TILES: readonly PluralPattern[] = ['e', 'er', 'n', 'en', 's', 'none'];

const UMLAUT_OF: Readonly<Record<string, string>> = {
  a: 'ä',
  o: 'ö',
  u: 'ü',
  A: 'Ä',
  O: 'Ö',
  U: 'Ü',
};

export function endingText(ending: PluralPattern): string {
  return ending === 'none' ? '' : ending;
}

/** Buchstaben, auf die Umlautpünktchen passen (a, o, u – auch in „au“). */
export function umlautTargets(singular: string): number[] {
  return Array.from(singular.normalize('NFC')).flatMap((char, i) =>
    UMLAUT_OF[char] === undefined ? [] : [i],
  );
}

/** Wort aus Stamm, optionalen Pünktchen und Endung zusammensetzen: Hand + ¨ + e → Hände. */
export function buildPlural(singular: string, umlautIndex: number | null, ending: PluralPattern): string {
  const chars = Array.from(singular.normalize('NFC'));
  if (umlautIndex !== null) {
    const umlaut = UMLAUT_OF[chars[umlautIndex] ?? ''];
    if (umlaut !== undefined) chars[umlautIndex] = umlaut;
  }
  return chars.join('') + endingText(ending);
}

/** Bausteine gehen nur, wenn sich der Plural aus Singular + Pünktchen + Endung bauen lässt. */
export function canUseTiles(word: Word): boolean {
  return word.stem === undefined && analyzePlural(word.singular, word.plural[0] ?? '') !== null;
}
