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

/**
 * Teilt die Hauptform des Plurals in Stücke; Umlaut und Endung werden hervorgehoben.
 * Bei Sonderfällen (eigener Pluralstamm) auch der Teil des Stamms, der neu dazukommt
 * (Freundin → Freundin|n|en).
 */
export function solutionSegments(word: Word): SolutionSegment[] {
  const plural = (word.plural[0] ?? '').normalize('NFC');
  const base = (word.stem ?? word.singular).normalize('NFC');
  const analysis = analyzePlural(base, plural);
  if (analysis === null) return [{ text: plural, highlight: false }];

  const chars = Array.from(plural);
  const singular = Array.from(word.singular.normalize('NFC'));
  let common = 0;
  while (common < analysis.endingStart && singular[common] === chars[common]) common++;
  // Ohne eigenen Stamm ist der ganze Stamm „bekannt“ (bis auf einen Umlaut).
  const known = word.stem === undefined ? analysis.endingStart : common;

  const segments: SolutionSegment[] = [];
  const push = (from: number, to: number, highlight: boolean): void => {
    if (to <= from) return;
    const text = chars.slice(from, to).join('');
    const last = segments[segments.length - 1];
    if (last?.highlight === highlight) last.text += text;
    else segments.push({ text, highlight });
  };

  for (let i = 0; i < analysis.endingStart; i++) {
    push(i, i + 1, i === analysis.umlautIndex || i >= known);
  }
  push(analysis.endingStart, chars.length, true);
  return segments;
}
