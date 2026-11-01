import { piecesOf } from '../data/pieces';
import type { PieceCategory, PieceDef, PieceId, RandomFn } from '../types';
import { randomInt, shuffle } from './random';

/** Welche Kategorien die drei Angebote haben (Spezifikation Abschnitt 4). */
export function offerCategories(correct: boolean, streak: number, random: RandomFn): PieceCategory[] {
  if (!correct) return ['damaged', 'damaged', 'damaged'];
  if (streak <= 2) return ['basic', 'basic', 'basic'];
  if (streak <= 4) return ['basic', 'basic', 'decoration'];
  if (streak <= 9) return ['basic', 'decoration', 'finish'];
  // Serie 10+: ein Premium-Teil, dazu immer ein Grundbauteil zum Weiterbauen.
  return ['premium', 'basic', randomInt(2, random) === 0 ? 'decoration' : 'finish'];
}

/**
 * Drei verschiedene Bauteile. Mindestens eines ist stapelbar,
 * damit die Burg immer weiter wachsen kann.
 */
export function offerPieces(correct: boolean, streak: number, random: RandomFn): PieceId[] {
  const chosen: PieceDef[] = [];
  for (const category of offerCategories(correct, streak, random)) {
    const candidates = piecesOf(category).filter((piece) => !chosen.includes(piece));
    const needsStackable = chosen.length === 2 && !chosen.some((piece) => piece.stackable);
    const pool = needsStackable ? candidates.filter((piece) => piece.stackable) : candidates;
    const pick = pool[randomInt(pool.length, random)] ?? candidates[0];
    if (pick === undefined) throw new Error(`Keine Bauteile der Kategorie ${category}`);
    chosen.push(pick);
  }
  return shuffle(
    chosen.map((piece) => piece.id),
    random,
  );
}
