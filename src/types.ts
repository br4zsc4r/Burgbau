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

export type PieceCategory =
  | 'basic'
  | 'finish'
  | 'decoration'
  | 'premium'
  | 'damaged'
  | 'environment';

export type NormalPieceId =
  // Grundbauteile
  | 'wall'
  | 'tower'
  | 'gate'
  | 'windowWall'
  | 'wallWide'
  | 'towerTall'
  | 'wallBig'
  | 'gateBig'
  // Abschlüsse
  | 'battlements'
  | 'pointedRoof'
  | 'coneRoof'
  | 'pointedRoofTall'
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
  | 'dragon'
  // Umgebung
  | 'tree'
  | 'well'
  | 'moat'
  | 'drawbridge';

export type DamagedPieceId =
  | 'crumblingWall'
  | 'holeWall'
  | 'crackedWall'
  | 'chippedTower'
  | 'crookedRoof'
  | 'tornFlag'
  | 'plankPatch'
  | 'rubble'
  | 'crumblingWallWide'
  | 'chippedTowerTall'
  | 'ruinWall';

export type PieceId = NormalPieceId | DamagedPieceId;

/**
 * block = belegt Zellen, man kann darauf bauen; cap = belegt Zellen, oben ist Schluss (Dächer);
 * ground = nur auf dem Boden (Umgebung); attachment = dockt an ein bestehendes Teil an.
 */
export type PieceKind = 'block' | 'cap' | 'ground' | 'attachment';

/** Andockstelle einer Dekoration: Bewuchs, Vorderseite oder oben drauf. */
export type AttachSlot = 'growth' | 'front' | 'top';

/** Material eines Blocks: gleiches Material verschmilzt beim Autotiling. */
export type Material = 'stone' | 'towerStone';

/** Vorderseite eines Blocks: was dort andocken darf. */
export type FrontType = 'plain' | 'window' | 'none';

export interface PieceDef {
  id: PieceId;
  category: PieceCategory;
  kind: PieceKind;
  /** Größe in Zellen (Dekorationen: 1 × 1). */
  width: number;
  height: number;
  /** Blöcke: Material für Textur und Autotiling. */
  material?: Material;
  /** Blöcke: welche Front-Dekoration passt. */
  front?: FrontType;
  /** Blöcke und Abschlüsse: Fahne, Wimpel oder Drache können oben drauf. */
  topMount?: boolean;
  /** Dekorationen: wo sie andocken. */
  slot?: AttachSlot;
  /** Front-Dekorationen: an welche Vorderseite sie passen. */
  fits?: Exclude<FrontType, 'none'>;
  /** Große Teile: ab welcher Serie sie angeboten werden. */
  minStreak?: number;
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

/** Gesetztes Teil; col/row ist die Zelle unten links. */
export interface PlacedPiece extends Cell {
  piece: PieceId;
}

/** Angedockte Dekoration; col/row ist die Zelle des Teils, an dem sie hängt. */
export interface PlacedAttachment extends Cell {
  piece: PieceId;
}

export interface GridState extends GridSize {
  pieces: PlacedPiece[];
  attachments: PlacedAttachment[];
}

/** Ein möglicher Platz für das wartende Teil: Ankerzelle und alle Zellen, die es bedeckt. */
export interface Placement {
  anchor: Cell;
  cells: Cell[];
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
  /** Die angebotenen Teile (nur im Schritt choosing). */
  offers: PieceId[];
  /** Gewähltes Teil, das auf das Setzen wartet. */
  pendingPiece: PieceId | null;
  grid: GridState;
  step: GameStep;
  /** Zuletzt gesetztes Teil, solange es noch rückgängig gemacht werden darf. */
  lastPlacement: { piece: PieceId; anchor: Cell } | null;
}
