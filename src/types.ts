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

/** Bisher gibt es nur einen Platzhalter-Block; der Katalog folgt in Phase 3. */
export type PieceId = 'block';

/** Rasterzelle; row 0 ist die unterste Reihe (auf dem Boden). */
export interface Cell {
  col: number;
  row: number;
}

export interface GridSize {
  cols: number;
  rows: number;
}

export interface GridState extends GridSize {
  /** Zeilenweise von unten nach oben: Index = row * cols + col. */
  cells: (PieceId | null)[];
}

/** task = Aufgabe läuft, placing = Teil wartet aufs Setzen, placed = gesetzt, Rückgängig möglich. */
export type GameStep = 'task' | 'placing' | 'placed';

export interface GameState {
  quiz: QuizState;
  grid: GridState;
  step: GameStep;
  /** Zuletzt gesetztes Teil, solange es noch rückgängig gemacht werden darf. */
  lastPlacement: Cell | null;
}
