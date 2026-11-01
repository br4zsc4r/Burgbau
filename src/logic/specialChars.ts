/**
 * Zeichen der Bildschirmleiste. Am Wortanfang groß (Nomen: Äpfel),
 * sonst klein (Hände). ß kommt am Wortanfang nicht vor und bleibt klein.
 */
export function specialChars(caretPosition: number): string[] {
  return caretPosition === 0 ? ['Ä', 'Ö', 'Ü', 'ß'] : ['ä', 'ö', 'ü', 'ß'];
}
