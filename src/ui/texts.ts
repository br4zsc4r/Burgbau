import type { Animal, PieceId, PluralPattern, SymbolColor } from '../types';

const pieceNames: Readonly<Record<PieceId, string>> = {
  wall: 'Mauerblock',
  tower: 'Turmblock',
  gate: 'Tor',
  windowWall: 'Mauer mit Fenster',
  wallWide: 'Lange Mauer',
  towerTall: 'Hoher Turm',
  wallBig: 'Große Mauer',
  gateBig: 'Großes Burgtor',
  towerBig: 'Großer Turm',
  windowWallBig: 'Große Fenstermauer',
  battlements: 'Zinnen',
  pointedRoof: 'Spitzdach',
  coneRoof: 'Kegeldach',
  pointedRoofTall: 'Hohes Spitzdach',
  roofBig: 'Großes Dach',
  flag: 'Fahne',
  pennant: 'Wimpel',
  balcony: 'Balkon',
  coatOfArms: 'Wappen',
  torch: 'Fackel',
  ivy: 'Efeu',
  flowerBox: 'Blumenkasten',
  goldenRoof: 'Goldenes Dach',
  banner: 'Bannerfahne',
  stainedGlass: 'Buntglasfenster',
  dragon: 'Drache',
  tree: 'Baum',
  well: 'Brunnen',
  moat: 'Wassergraben',
  drawbridge: 'Zugbrücke',
  fireDragon: 'Feuerdrache',
  giantFlag: 'Riesenfahne',
  crystal: 'Funkelkristall',
  windmill: 'Windmühle',
  crumblingWall: 'Bröckelmauer',
  holeWall: 'Mauer mit Loch',
  crackedWall: 'Mauer mit Riss',
  plankPatch: 'Holzbretter-Flickwerk',
  rubble: 'Steinhaufen',
  chippedTower: 'Turmblock mit fehlender Ecke',
  crookedRoof: 'Schiefes Dach',
  tornFlag: 'Zerrissene Fahne',
  crumblingWallWide: 'Lange Bröckelmauer',
  chippedTowerTall: 'Hoher Turm mit fehlender Ecke',
  ruinWall: 'Ruinenmauer',
  ruinTower: 'Turmruine',
};

const animalNames: Readonly<Record<Animal, string>> = {
  fox: 'Fuchs',
  owl: 'Eule',
  dragon: 'Drache',
  lion: 'Löwe',
  bear: 'Bär',
  cat: 'Katze',
  rabbit: 'Hase',
  frog: 'Frosch',
  hedgehog: 'Igel',
  fish: 'Fisch',
};

/** Für Namensvorschläge: „Lenas Fuchsburg“. */
const castleWords: Readonly<Record<Animal, string>> = {
  fox: 'Fuchsburg',
  owl: 'Eulenburg',
  dragon: 'Drachenburg',
  lion: 'Löwenburg',
  bear: 'Bärenburg',
  cat: 'Katzenburg',
  rabbit: 'Hasenburg',
  frog: 'Froschburg',
  hedgehog: 'Igelburg',
  fish: 'Fischburg',
};

const colorNames: Readonly<Record<SymbolColor, string>> = {
  blue: 'Blau',
  yellow: 'Gelb',
  pink: 'Rosa',
};

const endingLabels: Readonly<Record<PluralPattern, string>> = {
  e: '-e',
  er: '-er',
  n: '-n',
  en: '-en',
  s: '-s',
  none: '–',
};

// Alle sichtbaren Texte zentral an einer Stelle.
export const texts = {
  endingLabels,
  pieceNames,
  animalNames,
  castleWords,
  symbolLabel: (animal: Animal, color: SymbolColor): string =>
    `${animalNames[animal]} auf ${colorNames[color]}`,
  appTitle: 'Burgbau',
  taskPrompt: 'Wie heißt die Mehrzahl?',
  pluralArticle: 'die',
  answerLabel: 'Mehrzahl eintippen',
  check: 'Fertig',
  next: 'Weiter',
  correct: 'Richtig!',
  capitalizationHint: 'Nomen schreibt man groß!',
  almostTypo: 'Fast! Schau noch mal genau.',
  almostCapitalization: 'Fast! Nomen schreibt man groß!',
  solutionIntro: 'Gut versucht! So heißt es richtig:',
  specialCharsLabel: 'Buchstaben mit Pünktchen',
  insertChar: (char: string): string => `${char} einfügen`,
  imageFallbackLabel: (singular: string): string => `Bild: ${singular}`,
  loadError: 'Die Wörter konnten nicht geladen werden.',

  // Bausteine-Modus
  tilesHint: 'Zieh eine Endung an das Wort. Braucht es Pünktchen? Tipp auf den Buchstaben!',
  umlautTile: '¨',
  umlautTileLabel: 'Pünktchen',
  endingSlotLabel: 'Endung',
  endingTileLabel: (ending: PluralPattern): string =>
    ending === 'none' ? 'keine Endung' : `Endung ${endingLabels[ending]}`,
  letterLabel: (letter: string, dotted: boolean): string =>
    dotted ? `${letter}, Pünktchen wegnehmen` : `${letter}, Pünktchen setzen`,

  // Vorlesen
  readAloud: 'Vorlesen',

  // Zwischenspeicher und Bearbeiten
  stashTitle: 'Speicher',
  stashPiece: 'In den Speicher',
  stashItemLabel: (name: string): string => `${name} aus dem Speicher nehmen`,
  editHint: 'Bau deine Burg fertig! Tipp ein Teil an, um es aufzunehmen.',
  editHintHolding: 'Setz das Teil auf ein leuchtendes Feld – oder leg es in den Speicher.',
  editHintStash: 'Setz noch alle Teile aus dem Speicher – dann ist deine Burg fertig!',
  editHintStuck: 'Die Teile im Speicher passen nirgends mehr hin. Du kannst die Burg trotzdem fertig machen.',
  editDone: 'Burg ist fertig',
  placeHint: 'Setz dein Bauteil auf ein leuchtendes Feld!',
  placeHintDecoration: 'Häng die Verzierung an ein leuchtendes Bauteil!',
  undo: 'Rückgängig',
  nextTask: 'Nächstes Wort',
  offersTitle: 'Such dir ein Bauteil aus!',
  offersDamagedHint: 'Diesmal sind die Teile etwas bröckelig. Mit richtigen Antworten werden sie wieder schön!',
  streakLabel: (lit: number): string =>
    lit === 1 ? '1 Fackel leuchtet' : `${lit} Fackeln leuchten`,
  progressLabel: (done: number, total: number): string =>
    `${String(done)} von ${String(total)} Wörtern geschafft`,
  finishedTitle: 'Deine Burg ist fertig!',
  castleNameLabel: 'Wie soll deine Burg heißen?',
  saveCastle: 'In die Sammlung',
  newCastle: 'Neue Burg bauen',

  // Profile
  whoIsPlaying: 'Wer spielt?',
  newProfile: 'Ich bin neu',
  chooseSymbol: 'Such dir ein Bild aus!',
  nicknameLabel: 'Wie heißt du?',
  nicknameHint: 'Nur dein Spitzname oder Vorname.',
  createProfile: 'Fertig',
  back: 'Zurück',
  hello: (nickname: string): string => `Hallo ${nickname}!`,
  continueCastle: 'Weiterbauen',
  confirmNewCastle: 'Deine angefangene Burg wird dann nicht fertig gebaut. Wirklich neu anfangen?',
  confirmYes: 'Ja, neue Burg',
  confirmNo: 'Nein, weiterbauen',
  switchProfile: 'Anderes Kind',
  pause: 'Pause',

  // Sammlung
  myCastles: 'Meine Burgen',
  allCastles: 'Alle Burgen',
  noCastlesMine: 'Hier ist noch keine Burg. Bau deine erste!',
  noCastlesAll: 'Hier ist noch keine Burg.',
  castleBy: (nickname: string): string => `von ${nickname}`,
  formatDate: (iso: string): string =>
    new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }),
  storageWarning: 'Speichern ist hier nicht möglich. Die Burg geht beim Schließen verloren.',
} as const;
