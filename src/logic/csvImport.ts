import type { Article, PluralPattern, Word, WordList } from '../types';
import { analyzePlural } from './pluralPattern';

export interface CsvError {
  line: number;
  reason: 'columns' | 'article' | 'singular' | 'plural' | 'duplicate';
}

export interface CsvResult {
  list: WordList | null;
  errors: CsvError[];
}

const ARTICLES: readonly Article[] = ['der', 'die', 'das'];
/** Längere Endungen zuerst, damit „-en“ nicht als „-n“ erkannt wird. */
const ENDINGS: readonly Exclude<PluralPattern, 'none'>[] = ['er', 'en', 'e', 'n', 's'];

/** Stabile ID aus dem Singular (nur Kleinbuchstaben, Umlaute umschrieben). */
export function wordId(singular: string): string {
  return singular
    .toLocaleLowerCase('de-DE')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Muster und Umlaut aus Singular und erstem Plural ableiten. Lässt sich der Plural nicht aus
 * dem Singular bauen (Museum → Museen), wird ein eigener Pluralstamm gesetzt.
 */
export function deriveWord(article: Article, singular: string, plural: string[]): Word {
  const first = plural[0] ?? '';
  const base = { id: wordId(singular), singular, article, plural, verified: true };
  const analysis = analyzePlural(singular, first);
  if (analysis !== null) {
    return { ...base, pattern: analysis.pattern, umlaut: analysis.umlautIndex !== null };
  }
  const ending = ENDINGS.find((e) => first.endsWith(e) && first.length > e.length);
  const stem = ending === undefined ? first : first.slice(0, -ending.length);
  const word: Word = { ...base, pattern: ending ?? 'none', umlaut: false };
  return stem === singular ? word : { ...word, stem };
}

export type WordInputError = Exclude<CsvError['reason'], 'columns'>;

/**
 * Ein Wort aus Eingabefeldern (Wortlisten-Editor): Artikel, Singular und Plurale mit „|“.
 * Liefert das Wort oder den Fehlergrund.
 */
export function wordFromInput(
  articleText: string,
  singularText: string,
  pluralText: string,
): { word: Word } | { error: WordInputError } {
  const article = articleText.trim().toLocaleLowerCase('de-DE') as Article;
  const singular = singularText.normalize('NFC').trim();
  const plural = pluralText
    .normalize('NFC')
    .split('|')
    .map((p) => p.trim())
    .filter((p) => p !== '');
  if (!ARTICLES.includes(article)) return { error: 'article' };
  if (singular === '' || /\s/.test(singular)) return { error: 'singular' };
  if (plural.length === 0) return { error: 'plural' };
  return { word: deriveWord(article, singular, plural) };
}

/**
 * Eigene Wortliste aus CSV: „Artikel;Singular;Plural“, mehrere Plurale mit „|“.
 * Eine Kopfzeile wird übersprungen, fehlerhafte Zeilen werden gemeldet und ausgelassen.
 */
export function parseCsvWordList(text: string, id: string, name: string): CsvResult {
  const errors: CsvError[] = [];
  const words: Word[] = [];
  const lines = text.replace(/^\uFEFF/, '').normalize('NFC').split(/\r?\n/);

  lines.forEach((raw, index) => {
    const line = index + 1;
    if (raw.trim() === '') return;
    const cells = raw.split(';').map((cell) => cell.trim());
    if (index === 0 && cells[0]?.toLocaleLowerCase('de-DE') === 'artikel') return;
    if (cells.length !== 3) {
      errors.push({ line, reason: 'columns' });
      return;
    }
    const [article = '', singular = '', plural = ''] = cells;
    const result = wordFromInput(article, singular, plural);
    if ('error' in result) errors.push({ line, reason: result.error });
    else if (words.some((w) => w.id === result.word.id)) errors.push({ line, reason: 'duplicate' });
    else words.push(result.word);
  });

  return {
    list: words.length === 0 ? null : { id, name, inputMode: 'keyboard', words },
    errors,
  };
}
