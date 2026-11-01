import type { Article, InputMode, PluralPattern, Word, WordList } from '../types';
import { analyzePlural } from './pluralPattern';

const INPUT_MODES: readonly InputMode[] = ['tiles', 'keyboard'];
const PATTERNS: readonly PluralPattern[] = ['e', 'er', 'n', 'en', 's', 'none'];
const ARTICLES: readonly Article[] = ['der', 'die', 'das'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

function validateWord(raw: unknown, index: number): string[] {
  const at = `words[${index}]`;
  if (!isRecord(raw)) return [`${at}: kein Objekt`];

  const errors: string[] = [];
  if (!isNonEmptyString(raw['id'])) errors.push(`${at}: id fehlt`);
  if (!isNonEmptyString(raw['singular'])) errors.push(`${at}: singular fehlt`);
  if (!isOneOf(raw['article'], ARTICLES)) errors.push(`${at}: article ungültig`);
  if (!isOneOf(raw['pattern'], PATTERNS)) errors.push(`${at}: pattern ungültig`);
  if (typeof raw['umlaut'] !== 'boolean') errors.push(`${at}: umlaut muss boolean sein`);
  if (typeof raw['verified'] !== 'boolean') errors.push(`${at}: verified muss boolean sein`);
  if (raw['image'] !== undefined && !isNonEmptyString(raw['image'])) {
    errors.push(`${at}: image ungültig`);
  }
  if (raw['stem'] !== undefined && (!isNonEmptyString(raw['stem']) || raw['stem'] === raw['singular'])) {
    errors.push(`${at}: stem muss sich vom Singular unterscheiden`);
  }
  const plural = raw['plural'];
  if (!Array.isArray(plural) || plural.length === 0 || !plural.every(isNonEmptyString)) {
    errors.push(`${at}: plural muss eine nicht-leere Liste von Wörtern sein`);
  }
  return errors;
}

/** Prüft, ob pattern und umlaut zur ersten Pluralform passen (bei Sonderfällen ab dem Pluralstamm). */
export function checkWordConsistency(word: Word): string[] {
  const first = word.plural[0] ?? '';
  const analysis = analyzePlural(word.stem ?? word.singular, first);
  if (analysis === null) {
    return [`${word.id}: „${first}“ folgt keinem regelmäßigen Muster`];
  }
  const errors: string[] = [];
  if (analysis.pattern !== word.pattern) {
    errors.push(`${word.id}: pattern ist „${word.pattern}“, „${first}“ hat aber „${analysis.pattern}“`);
  }
  const hasUmlaut = analysis.umlautIndex !== null;
  if (hasUmlaut !== word.umlaut) {
    errors.push(`${word.id}: umlaut ist ${String(word.umlaut)}, „${first}“ hat aber ${String(hasUmlaut)}`);
  }
  return errors;
}

/** Liefert alle Fehler einer Wortliste; leere Liste = gültig. */
export function validateWordList(data: unknown): string[] {
  if (!isRecord(data)) return ['Wortliste ist kein Objekt'];

  const errors: string[] = [];
  if (!isNonEmptyString(data['id'])) errors.push('id fehlt');
  if (!isNonEmptyString(data['name'])) errors.push('name fehlt');
  if (!isOneOf(data['inputMode'], INPUT_MODES)) errors.push('inputMode ungültig');

  const words = data['words'];
  if (!Array.isArray(words) || words.length === 0) {
    errors.push('words muss eine nicht-leere Liste sein');
    return errors;
  }

  const wordErrors = words.flatMap((raw, i) => validateWord(raw, i));
  errors.push(...wordErrors);
  if (wordErrors.length > 0) return errors;

  const valid = words as Word[];
  const seen = new Set<string>();
  for (const word of valid) {
    if (seen.has(word.id)) errors.push(`doppelte id „${word.id}“`);
    seen.add(word.id);
    errors.push(...checkWordConsistency(word));
  }
  return errors;
}

export function parseWordList(data: unknown): WordList {
  const errors = validateWordList(data);
  if (errors.length > 0) throw new Error(`Ungültige Wortliste:\n${errors.join('\n')}`);
  return data as WordList;
}
