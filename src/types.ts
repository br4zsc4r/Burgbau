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
  /**
   * Pluralstamm, wenn er sich vom Singular unterscheidet (Museum → Muse-en, Bus → Buss-e).
   * Solche Wörter gibt es nur im Tastatur-Modus.
   */
  stem?: string;
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

/** Eingabemodus aus der Wortliste übernehmen oder für alle Listen festlegen. */
export type InputModeSetting = 'list' | InputMode;

/** Lehrkraft-Einstellungen des Geräts (Spezifikation Abschnitt 8). */
export interface Settings {
  /** Eingeschaltete Wortlisten; ihre Wörter kommen gemeinsam für alle Kinder dran. */
  activeListIds: string[];
  inputMode: InputModeSetting;
  /** Großschreibung verpflichtend. */
  requireCapitalization: boolean;
  /** Vorlese-Knopf anzeigen (Web Speech API). */
  readAloud: boolean;
  /** Leise Töne bei Erfolgen (nie bei Fehlern). */
  sound: boolean;
  tasksPerCastle: TasksPerCastle;
  /** Kinder dürfen über „Ich bin neu“ selbst Profile anlegen. */
  allowSelfRegistration: boolean;
  /** Profile mit Bild-Code aus zwei Bildern schützen. */
  pictureCode: boolean;
  /** Button „Alle Burgen“ in der Sammlung zeigen. */
  showAllCastles: boolean;
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

/** Spielart: welche Art von Aufgabe (Spezifikation Abschnitt 14). */
export type ExerciseId = 'plural';

/** Aufgabe der Spielart Mehrzahl: ein Wort und wie es eingegeben wird. */
export interface PluralTask {
  exercise: 'plural';
  /** Aufgaben-ID mit Präfix, z. B. „plural:hund“. */
  id: string;
  word: Word;
  inputMode: InputMode;
}

/** Eine Aufgabe irgendeiner Spielart. */
export type Task = PluralTask;

/** Woraus die Aufgaben einer Burg kommen: freies Spiel einer Spielart (Pakete ab Phase 9c). */
export interface GameSelection {
  kind: 'free';
  exercise: ExerciseId;
}

/** Zustand der laufenden Aufgabe. */
export interface QuizState {
  /** Aufgaben-ID mit Präfix der Spielart. */
  taskId: string;
  /** 1 = erster Versuch, 2 = zweiter Versuch nach „Fast!“. */
  attempt: 1 | 2;
  phase: QuizPhase;
  lastResult: AnswerResult | null;
}

export interface TaskPickerState {
  /** Aufgaben, die in dieser Partie schon gestellt wurden. */
  used: string[];
  /** Falsch beantwortete Aufgaben, die ab Aufgabe dueTask wiederkommen. */
  retries: { taskId: string; dueTask: number }[];
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
  | 'towerBig'
  | 'windowWallBig'
  | 'arch'
  | 'portcullis'
  // Abschlüsse
  | 'battlements'
  | 'pointedRoof'
  | 'coneRoof'
  | 'pointedRoofTall'
  | 'roofBig'
  | 'bellRoof'
  // Dekorationen
  | 'flag'
  | 'pennant'
  | 'balcony'
  | 'coatOfArms'
  | 'torch'
  | 'ivy'
  | 'flowerBox'
  | 'stairs'
  // Selten in ihrer Kategorie
  | 'goldenRoof'
  | 'banner'
  | 'stainedGlass'
  // Umgebung
  | 'tree'
  | 'well'
  | 'moat'
  | 'drawbridge'
  | 'barrels'
  | 'fountain'
  // Premium (episch und legendär)
  | 'dragon'
  | 'fireDragon'
  | 'giantFlag'
  | 'crystal'
  | 'windmill'
  | 'ghost'
  | 'treasureChest'
  | 'balloon'
  | 'observatory'
  | 'unicorn';

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
  | 'ruinWall'
  | 'ruinTower';

export type PieceId = NormalPieceId | DamagedPieceId;

/**
 * block = belegt Zellen, man kann darauf bauen; cap = belegt Zellen, oben ist Schluss (Dächer);
 * ground = nur auf dem Boden (Umgebung); attachment = dockt an ein bestehendes Teil an.
 */
export type PieceKind = 'block' | 'cap' | 'ground' | 'attachment';

/**
 * Wie besonders ein Teil ist. Seltenere Teile gibt es erst ab einer längeren Serie,
 * und sie werden seltener gezogen (Spezifikation Abschnitt 4).
 */
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

/** Andockstelle einer Dekoration: Bewuchs, Vorderseite oder oben drauf. */
export type AttachSlot = 'growth' | 'front' | 'top';

/** Material eines Blocks: gleiches Material verschmilzt beim Autotiling. */
export type Material = 'stone';

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
  /**
   * Nur eine Spitze bei breiten Dächern: In welcher Spalte (ab Ankerzelle) die Deko
   * angedockt wird. Fehlt = auf jeder obersten Zelle.
   */
  mountDx?: number;
  /** Nicht symmetrisch: lässt sich vor dem Setzen spiegeln. */
  mirror?: boolean;
  /** Exklusiv: nur nach Aufgaben dieser Spielarten im Angebot. Fehlt = überall. */
  exercises?: ExerciseId[];
  /** Dekorationen: wo sie andocken. */
  slot?: AttachSlot;
  /** Front-Dekorationen: an welche Vorderseite sie passen. */
  fits?: Exclude<FrontType, 'none'>;
  /** Große Teile: ab welcher Serie sie angeboten werden. */
  minStreak?: number;
  /** Nur beschädigte Teile: das normale Teil, auf dem sie beruhen. */
  base?: NormalPieceId;
  /** Dach: wird in den letzten Aufgaben garantiert angeboten. */
  roof?: boolean;
  /** Fehlt = gewöhnlich. */
  rarity?: Rarity;
  /** Wird nicht mehr angeboten, bleibt aber für gespeicherte Burgen darstellbar. */
  retired?: boolean;
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
  /** Gespiegelt (nur Teile mit mirror). Fehlt = nicht gespiegelt. */
  flipped?: boolean;
}

/** Angedockte Dekoration; col/row ist die Zelle des Teils, an dem sie hängt. */
export interface PlacedAttachment extends Cell {
  piece: PieceId;
  flipped?: boolean;
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
 * placed = gesetzt oder in den Speicher gelegt (Rückgängig möglich),
 * editing = Bearbeitungsmodus nach der letzten Aufgabe, finished = Burg fertig (Name).
 */
export type GameStep = 'task' | 'choosing' | 'placing' | 'placed' | 'editing' | 'finished';

/** Lernfortschritt eines Profils: Fach 0–4 je Aufgaben-ID (leichtes Leitner-System). */
export type TaskBoxes = Record<string, number>;

export interface GameState {
  tasksTotal: number;
  /** Nummer der aktuellen Aufgabe, ab 1. */
  taskNumber: number;
  /** Woraus die Aufgaben dieser Burg kommen. */
  selection: GameSelection;
  quiz: QuizState;
  picker: TaskPickerState;
  /** Richtige Antworten in Folge; eine falsche halbiert sie. */
  streak: number;
  /** Die angebotenen Teile (nur im Schritt choosing). */
  offers: PieceId[];
  /** Gewähltes Teil, das auf das Setzen wartet. */
  pendingPiece: PieceId | null;
  /** Das wartende Teil ist gespiegelt. */
  pendingFlipped: boolean;
  grid: GridState;
  step: GameStep;
  /**
   * Zuletzt gesetztes Teil, solange es noch rückgängig gemacht werden darf.
   * anchor = null: Das Teil wurde in den Speicher gelegt.
   */
  lastPlacement: { piece: PieceId; anchor: Cell | null } | null;
  /** Zwischenspeicher: Teile, die später gesetzt werden sollen. */
  stash: PieceId[];
  /** Lernfortschritt des Profils (steuert die Aufgabenauswahl). */
  boxes: TaskBoxes;
}

export type Animal =
  | 'fox'
  | 'owl'
  | 'dragon'
  | 'lion'
  | 'bear'
  | 'cat'
  | 'rabbit'
  | 'frog'
  | 'hedgehog'
  | 'fish';

export type SymbolColor = 'blue' | 'yellow' | 'pink';

/** Profil-Symbol: Tier auf farbigem Grund. Jede Kombination gibt es nur einmal pro Gerät. */
export interface ProfileSymbol {
  animal: Animal;
  color: SymbolColor;
}

/** Bild-Code: zwei Bilder in fester Reihenfolge. */
export type PictureCode = [PieceId, PieceId];

export interface Profile {
  id: string;
  /** Nur Spitzname oder Vorname. */
  nickname: string;
  symbol: ProfileSymbol;
  /** Bild-Code, sobald das Kind einen gewählt hat (nur wenn Bild-Codes eingeschaltet sind). */
  code?: PictureCode;
  /** ISO-Datum. */
  createdAt: string;
}

/** Fertige Burg in der Sammlung: gespeichert werden Rasterdaten, keine Bilder. */
export interface Castle {
  id: string;
  profileId: string;
  name: string;
  /** ISO-Datum. */
  createdAt: string;
  grid: GridState;
}
