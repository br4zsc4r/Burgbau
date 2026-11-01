import type { AnswerResult, Settings, Word } from '../types';
import { levenshtein } from './levenshtein';

/** Einheitliche Form für Vergleiche: NFC (Umlaute) und ohne Rand-Leerzeichen. */
export function normalizeAnswer(text: string): string {
  return text.normalize('NFC').trim();
}

function lower(text: string): string {
  return text.toLocaleLowerCase('de-DE');
}

/**
 * Prüft eine getippte Pluralform.
 * - exakt eine erlaubte Form → richtig
 * - nur Groß-/Kleinschreibung falsch → richtig mit Hinweis, oder (wenn Großschreibung
 *   verpflichtend ist) „fast“ mit Groß-Hinweis
 * - Levenshtein-Abstand 1 → „fast“ (nur im ersten Versuch)
 * - sonst falsch
 */
export function checkAnswer(
  input: string,
  word: Word,
  settings: Settings,
  attempt: 1 | 2,
): AnswerResult {
  const answer = normalizeAnswer(input);
  const forms = word.plural.map(normalizeAnswer);
  const wrong: AnswerResult = { status: 'wrong', solution: forms[0] ?? '' };

  if (forms.includes(answer)) return { status: 'correct', capitalizationHint: false };

  const answerLower = lower(answer);
  if (forms.some((form) => lower(form) === answerLower)) {
    if (!settings.requireCapitalization) return { status: 'correct', capitalizationHint: true };
    return attempt === 1 ? { status: 'almost', reason: 'capitalization' } : wrong;
  }

  const isNear = forms.some((form) => levenshtein(lower(form), answerLower) === 1);
  if (isNear && attempt === 1) return { status: 'almost', reason: 'typo' };

  return wrong;
}
