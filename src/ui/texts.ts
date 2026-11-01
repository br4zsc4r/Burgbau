// Alle sichtbaren Texte zentral an einer Stelle.
export const texts = {
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
} as const;
