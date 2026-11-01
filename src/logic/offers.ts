import { isLarge, isStackable, piecesOf } from '../data/pieces';
import type { PieceCategory, PieceDef, PieceId, RandomFn } from '../types';
import { randomInt, shuffle } from './random';

/** Wie oft ein Teil im Angebot durch eine große Variante ersetzt wird (Startwert). */
export const LARGE_CHANCE = 1 / 3;
/** Wie oft bei richtiger Antwort ein Grundbauteil durch ein Umgebungsteil ersetzt wird. */
export const ENVIRONMENT_CHANCE = 1 / 4;

/** Welche Kategorien die drei Angebote haben (Spezifikation Abschnitt 4). */
export function offerCategories(correct: boolean, streak: number, random: RandomFn): PieceCategory[] {
  if (!correct) return ['damaged', 'damaged', 'damaged'];
  if (streak <= 2) return ['basic', 'basic', 'basic'];
  if (streak <= 4) return ['basic', 'basic', 'decoration'];
  if (streak <= 9) return ['basic', 'decoration', 'finish'];
  // Serie 10+: ein Premium-Teil, dazu immer ein Grundbauteil zum Weiterbauen.
  return ['premium', 'basic', randomInt(2, random) === 0 ? 'decoration' : 'finish'];
}

function smallOf(category: PieceCategory): PieceDef[] {
  return piecesOf(category).filter((piece) => !isLarge(piece));
}

function largeOf(category: PieceCategory, streak: number): PieceDef[] {
  return piecesOf(category).filter((piece) => isLarge(piece) && (piece.minStreak ?? 0) <= streak);
}

/** Falls in einer Kategorie nichts passt: Ersatz, ohne Premium oder Schaden zu verschenken. */
function fallbackCategories(correct: boolean): PieceCategory[] {
  return correct ? ['basic', 'decoration', 'finish', 'environment'] : ['damaged'];
}

/**
 * Bis zu drei verschiedene Bauteile, die gerade irgendwo hinpassen.
 * Ein Teil kann eine große Variante sein, bei richtiger Antwort ein Grundbauteil
 * auch ein Umgebungsteil. Wenn möglich ist immer eines dabei, auf dem man weiterbauen kann.
 */
export function offerPieces(
  correct: boolean,
  streak: number,
  random: RandomFn,
  placeable: (id: PieceId) => boolean = () => true,
): PieceId[] {
  const categories = offerCategories(correct, streak, random);
  const pools = categories.map(smallOf);

  const largeSlots = categories.flatMap((c, i) => (largeOf(c, streak).length > 0 ? [i] : []));
  let largeSlot = -1;
  if (largeSlots.length > 0 && random() < LARGE_CHANCE) {
    largeSlot = largeSlots[randomInt(largeSlots.length, random)] ?? -1;
    pools[largeSlot] = largeOf(categories[largeSlot] ?? 'basic', streak);
  }

  const basicSlots = categories.flatMap((c, i) => (c === 'basic' && i !== largeSlot ? [i] : []));
  if (correct && basicSlots.length > 0 && random() < ENVIRONMENT_CHANCE) {
    pools[basicSlots[randomInt(basicSlots.length, random)] ?? 0] = piecesOf('environment');
  }

  const chosen: PieceDef[] = [];
  const pick = (candidates: PieceDef[]): PieceDef | undefined => {
    const open = candidates.filter((piece) => !chosen.includes(piece) && placeable(piece.id));
    return open[randomInt(open.length, random)];
  };

  pools.forEach((pool, i) => {
    const piece =
      pick(pool) ??
      pick(smallOf(categories[i] ?? 'basic')) ??
      pick(fallbackCategories(correct).flatMap(smallOf));
    if (piece !== undefined) chosen.push(piece);
  });

  if (chosen.length > 0 && !chosen.some(isStackable)) {
    const stackable = pick(smallOf(correct ? 'basic' : 'damaged').filter(isStackable));
    if (stackable !== undefined) {
      const replace = chosen.findIndex((piece) => piece.category !== 'premium');
      chosen[replace === -1 ? chosen.length - 1 : replace] = stackable;
    }
  }

  return shuffle(
    chosen.map((piece) => piece.id),
    random,
  );
}
