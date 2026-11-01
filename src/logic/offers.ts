import { isLarge, isOffered, isStackable, piecesOf } from '../data/pieces';
import type { PieceCategory, PieceDef, PieceId, RandomFn } from '../types';
import { randomInt, shuffle } from './random';

/** Wie oft ein Teil im Angebot durch eine große Variante ersetzt wird (Startwert). */
export const LARGE_CHANCE = 0.4;
/** Wie oft bei richtiger Antwort ein Grundbauteil durch ein Umgebungsteil ersetzt wird. */
export const ENVIRONMENT_CHANCE = 1 / 4;
/** Ab dieser Serie ist das Premium-Teil ein animiertes Teil. */
export const ANIMATED_MIN_STREAK = 12;

export interface OfferOptions {
  /** Letzte Aufgaben: Ein Dach muss dabei sein, damit die Burg noch abgeschlossen werden kann. */
  needsRoof?: boolean;
}

/** Welche Kategorien die drei Angebote haben (Spezifikation Abschnitt 4). */
export function offerCategories(correct: boolean, streak: number, random: RandomFn): PieceCategory[] {
  if (!correct) return ['damaged', 'damaged', 'damaged'];
  if (streak <= 2) return ['basic', 'basic', 'basic'];
  if (streak <= 4) return ['basic', 'basic', 'decoration'];
  if (streak <= 9) return ['basic', 'decoration', 'finish'];
  // Serie 10+: ein Premium-Teil, dazu immer ein Grundbauteil zum Weiterbauen.
  return ['premium', 'basic', randomInt(2, random) === 0 ? 'decoration' : 'finish'];
}

/** Normale (nicht animierte, nicht stillgelegte) Teile einer Kategorie. */
function regularOf(category: PieceCategory): PieceDef[] {
  return piecesOf(category).filter((piece) => isOffered(piece) && piece.animated !== true);
}

function smallOf(category: PieceCategory): PieceDef[] {
  return regularOf(category).filter((piece) => !isLarge(piece));
}

function largeOf(category: PieceCategory, streak: number): PieceDef[] {
  return regularOf(category).filter((piece) => isLarge(piece) && (piece.minStreak ?? 0) <= streak);
}

function animatedPieces(): PieceDef[] {
  return piecesOf('premium').filter((piece) => isOffered(piece) && piece.animated === true);
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
  options: OfferOptions = {},
): PieceId[] {
  const categories = offerCategories(correct, streak, random);
  const pools = categories.map(smallOf);
  if (streak >= ANIMATED_MIN_STREAK) {
    categories.forEach((category, i) => {
      if (category === 'premium') pools[i] = animatedPieces();
    });
  }

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

  if (options.needsRoof === true && !chosen.some((piece) => piece.roof === true)) {
    const roofs = correct
      ? [...smallOf('finish'), ...largeOf('finish', streak)].filter((piece) => piece.roof === true)
      : smallOf('damaged').filter((piece) => piece.roof === true);
    const roof = pick(roofs);
    if (roof !== undefined) {
      if (chosen.length < 3) {
        chosen.push(roof);
      } else {
        // Ersetzt wird kein Premium-Teil und nicht das einzige Teil zum Weiterbauen.
        const stackables = chosen.filter(isStackable).length;
        const replaceable = (piece: PieceDef): boolean =>
          piece.category !== 'premium' && (!isStackable(piece) || stackables > 1);
        const index = chosen.findIndex((piece) => replaceable(piece) && !isStackable(piece));
        const fallback = chosen.findIndex(replaceable);
        const target = index !== -1 ? index : fallback;
        if (target !== -1) chosen[target] = roof;
      }
    }
  }

  return shuffle(
    chosen.map((piece) => piece.id),
    random,
  );
}
