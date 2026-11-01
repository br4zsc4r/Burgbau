import type { PluralPattern, SolutionSegment, Word } from '../types';

const UMLAUT_OF: Readonly<Record<string, string>> = {
  a: 'ä',
  o: 'ö',
  u: 'ü',
  A: 'Ä',
  O: 'Ö',
  U: 'Ü',
};

const PATTERN_OF_ENDING: Readonly<Record<string, PluralPattern>> = {
  '': 'none',
  e: 'e',
  er: 'er',
  n: 'n',
  en: 'en',
  s: 's',
};

export interface PluralAnalysis {
  pattern: PluralPattern;
  /** Codepoint-Index des Umlauts im Plural, null wenn kein Umlaut entsteht. */
  umlautIndex: number | null;
  /** Codepoint-Index, an dem die Endung beginnt (= Länge des Singulars). */
  endingStart: number;
}

/**
 * Zerlegt einen Plural in Singular + höchstens einen Umlaut + Endung.
 * Liefert null, wenn die Form keinem der fünf regelmäßigen Muster folgt
 * (z. B. Museum → Museen).
 */
export function analyzePlural(singular: string, plural: string): PluralAnalysis | null {
  const s = Array.from(singular.normalize('NFC'));
  const p = Array.from(plural.normalize('NFC'));
  if (p.length < s.length) return null;

  let umlautIndex: number | null = null;
  for (let i = 0; i < s.length; i++) {
    const sc = s[i] ?? '';
    const pc = p[i];
    if (sc === pc) continue;
    if (umlautIndex === null && UMLAUT_OF[sc] === pc) {
      umlautIndex = i;
      continue;
    }
    return null;
  }

  const pattern = PATTERN_OF_ENDING[p.slice(s.length).join('')];
  if (pattern === undefined) return null;
  return { pattern, umlautIndex, endingStart: s.length };
}

/** Teilt die Hauptform des Plurals in Stücke; Umlaut und Endung werden hervorgehoben. */
export function solutionSegments(word: Word): SolutionSegment[] {
  const plural = (word.plural[0] ?? '').normalize('NFC');
  const analysis = analyzePlural(word.singular, plural);
  if (analysis === null) return [{ text: plural, highlight: false }];

  const chars = Array.from(plural);
  const { umlautIndex, endingStart } = analysis;
  const segments: SolutionSegment[] = [];
  const push = (from: number, to: number, highlight: boolean): void => {
    if (to > from) segments.push({ text: chars.slice(from, to).join(''), highlight });
  };

  if (umlautIndex === null) {
    push(0, endingStart, false);
  } else {
    push(0, umlautIndex, false);
    push(umlautIndex, umlautIndex + 1, true);
    push(umlautIndex + 1, endingStart, false);
  }
  push(endingStart, chars.length, true);
  return segments;
}
