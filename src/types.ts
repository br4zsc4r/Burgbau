// Zentrale Typen für Wortlisten, Einstellungen und Spielzustand.
// Alle Zustandsobjekte sind reine JSON-Daten (serialisierbar).

export type InputMode = 'tiles' | 'keyboard';

export type PluralPattern = 'e' | 'er' | 'n' | 'en' | 's' | 'none';

export type Article = 'der' | 'die' | 'das';

export interface Word {
  id: string;
  singular: string;
  article: Article;
  /** Erlaubte Pluralformen; die erste ist die Hauptform (für Lösung und Muster). */
  plural: string[];
  pattern: PluralPattern;
  umlaut: boolean;
  image?: string;
  /** false = noch nicht gegen Duden/Wiktionary geprüft. */
  verified: boolean;
}

export interface WordList {
  id: string;
  name: string;
  inputMode: InputMode;
  words: Word[];
}

export interface Settings {
  /** Großschreibung verpflichtend (Lehrkraft-Einstellung). */
  requireCapitalization: boolean;
}

/** Zufallsfunktion im Stil von Math.random: liefert [0, 1). */
export type RandomFn = () => number;

export type AnswerResult =
  /** capitalizationHint: Antwort zählt, war aber nicht korrekt groß geschrieben. */
  | { status: 'correct'; capitalizationHint: boolean }
  /** Zweiter Versuch erlaubt. reason sagt, welcher Hinweis gezeigt wird. */
  | { status: 'almost'; reason: 'typo' | 'capitalization' }
  | { status: 'wrong'; solution: string };

/** Ein Textstück der Lösung; highlight = Umlaut oder Endung, farbig hervorgehoben. */
export interface SolutionSegment {
  text: string;
  highlight: boolean;
}

export type QuizPhase = 'answering' | 'feedback';

export interface QuizState {
  /** Reihenfolge der Wort-IDs der aktuellen Runde. */
  order: string[];
  position: number;
  /** 1 = erster Versuch, 2 = zweiter Versuch nach „Fast!“. */
  attempt: 1 | 2;
  phase: QuizPhase;
  lastResult: AnswerResult | null;
}
