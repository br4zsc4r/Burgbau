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

export type TasksPerCastle = 10 | 15 | 20;

export interface Settings {
  /** Großschreibung verpflichtend (Lehrkraft-Einstellung). */
  requireCapitalization: boolean;
  /** Aufgaben pro Burg (Lehrkraft-Einstellung). */
  tasksPerCastle: TasksPerCastle;
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

/** Zustand der laufenden Aufgabe. */
export interface QuizState {
  wordId: string;
  /** 1 = erster Versuch, 2 = zweiter Versuch nach „Fast!“. */
  attempt: 1 | 2;
  phase: QuizPhase;
  lastResult: AnswerResult | null;
}

export interface WordPickerState {
  /** Wörter, die in dieser Partie schon gestellt wurden. */
  used: string[];
  /** Falsch beantwortete Wörter, die ab Aufgabe dueTask wiederkommen. */
  retries: { wordId: string; dueTask: number }[];
}

export type PieceCategory = 'basic' | 'finish' | 'decoration' | 'premium' | 'damaged';

export type NormalPieceId =
  // Grundbauteile
  | 'wall'
  | 'tower'
  | 'gate'
  | 'windowWall'
  // Abschlüsse
  | 'battlements'
  | 'pointedRoof'
  | 'coneRoof'
  // Dekorationen
  | 'flag'
  | 'pennant'
  | 'balcony'
  | 'coatOfArms'
  | 'torch'
  | 'ivy'
  | 'flowerBox'
  // Premium
  | 'goldenRoof'
  | 'banner'
  | 'stainedGlass'
  | 'dragon';

export type DamagedPieceId =
  | 'crumblingWall'
  | 'holeWall'
  | 'crackedWall'
  | 'chippedTower'
  | 'crookedRoof'
  | 'tornFlag'
  | 'plankPatch'
  | 'rubble';

export type PieceId = NormalPieceId | DamagedPieceId;

export interface PieceDef {
  id: PieceId;
  category: PieceCategory;
  /** Man kann darauf weiterbauen (Blöcke ja, Dächer und Dekorationen nein). */
  stackable: boolean;
  /** Nur beschädigte Teile: das normale Teil, auf dem sie beruhen. */
  base?: NormalPieceId;
}

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

/**
 * task = Aufgabe läuft, choosing = 1 aus 3 wählen, placing = Teil wartet aufs Setzen,
 * placed = gesetzt (Rückgängig möglich), finished = Burg fertig.
 */
export type GameStep = 'task' | 'choosing' | 'placing' | 'placed' | 'finished';

export interface GameState {
  tasksTotal: number;
  /** Nummer der aktuellen Aufgabe, ab 1. */
  taskNumber: number;
  quiz: QuizState;
  picker: WordPickerState;
  /** Richtige Antworten in Folge; eine falsche halbiert sie. */
  streak: number;
  /** Die drei angebotenen Teile (nur im Schritt choosing). */
  offers: PieceId[];
  /** Gewähltes Teil, das auf das Setzen wartet. */
  pendingPiece: PieceId | null;
  grid: GridState;
  step: GameStep;
  /** Zuletzt gesetztes Teil, solange es noch rückgängig gemacht werden darf. */
  lastPlacement: { cell: Cell; piece: PieceId } | null;
}
