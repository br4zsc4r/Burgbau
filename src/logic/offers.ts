import { isLarge, isOffered, isStackable, piecesOf, rarityOf } from '../data/pieces';
import type { ExerciseId, PieceCategory, PieceDef, PieceId, RandomFn, Rarity } from '../types';
import { randomInt, shuffle } from './random';

/** Wie oft ein Teil im Angebot durch eine große Variante ersetzt wird (Startwert). */
export const LARGE_CHANCE = 0.4;
/** Wie oft bei richtiger Antwort ein Grundbauteil durch ein Umgebungsteil ersetzt wird. */
export const ENVIRONMENT_CHANCE = 1 / 4;
/** Ab dieser Serie ist eine Seltenheitsstufe im Topf. */
export const RARITY_MIN_STREAK: Readonly<Record<Rarity, number>> = {
  common: 0,
  rare: 5,
  epic: 8,
  legendary: 10,
};
/**
 * Gewicht einer Stufe beim Ziehen: Erst wird unter den vorhandenen Stufen gewählt,
 * dann gleich verteilt ein Teil daraus. So bleibt Legendäres selten, egal wie viele Teile es gibt.
 */
export const RARITY_WEIGHT: Readonly<Record<Rarity, number>> = {
  common: 12,
  rare: 4,
  epic: 2,
  legendary: 1,
};
const RARITIES: readonly Rarity[] = ['common', 'rare', 'epic', 'legendary'];

export interface OfferOptions {
  /** Letzte Aufgaben: Ein Dach muss dabei sein, damit die Burg noch abgeschlossen werden kann. */
  needsRoof?: boolean;
  /** Spielart der gerade gelösten Aufgabe: Nur ihre exklusiven Teile kommen in Frage. */
  exercise?: ExerciseId | null;
}

/** Was gerade im Topf ist: Serie (Größe, Seltenheit) und Spielart (exklusive Teile). */
interface PoolContext {
  streak: number;
  exercise: ExerciseId | null;
}

/** Welche Kategorien die drei Angebote haben (Spezifikation Abschnitt 4). */
export function offerCategories(correct: boolean, streak: number, random: RandomFn): PieceCategory[] {
  if (!correct) return ['damaged', 'damaged', 'damaged'];
  if (streak <= 2) return ['basic', 'basic', 'basic'];
  if (streak <= 4) return ['basic', 'basic', 'decoration'];
  if (streak < RARITY_MIN_STREAK.epic) return ['basic', 'decoration', 'finish'];
  // Ab der epischen Stufe: ein Premium-Teil, dazu immer ein Grundbauteil zum Weiterbauen.
  return ['premium', 'basic', randomInt(2, random) === 0 ? 'decoration' : 'finish'];
}

/** Ab welcher Serie ein Teil angeboten wird (Größe und Seltenheit). */
export function unlockStreak(piece: PieceDef): number {
  return Math.max(piece.minStreak ?? 0, RARITY_MIN_STREAK[rarityOf(piece)]);
}

/** Exklusive Teile nur bei ihrer Spielart; alle anderen überall. */
export function fitsExercise(piece: PieceDef, exercise: ExerciseId | null): boolean {
  return piece.exercises === undefined || (exercise !== null && piece.exercises.includes(exercise));
}

/** Teile einer Kategorie, die gerade im Topf sind. */
function unlockedOf(category: PieceCategory, ctx: PoolContext): PieceDef[] {
  return piecesOf(category).filter(
    (piece) => isOffered(piece) && unlockStreak(piece) <= ctx.streak && fitsExercise(piece, ctx.exercise),
  );
}

function smallOf(category: PieceCategory, ctx: PoolContext): PieceDef[] {
  return unlockedOf(category, ctx).filter((piece) => !isLarge(piece));
}

function largeOf(category: PieceCategory, ctx: PoolContext): PieceDef[] {
  return unlockedOf(category, ctx).filter(isLarge);
}

/** Erst eine Seltenheitsstufe nach Gewicht, dann ein Teil daraus. */
export function pickByRarity(candidates: readonly PieceDef[], random: RandomFn): PieceDef | undefined {
  if (candidates.length === 0) return undefined;
  const tiers = RARITIES.filter((rarity) => candidates.some((piece) => rarityOf(piece) === rarity));
  const total = tiers.reduce((sum, rarity) => sum + RARITY_WEIGHT[rarity], 0);
  let roll = random() * total;
  const tier = tiers.find((rarity) => (roll -= RARITY_WEIGHT[rarity]) < 0) ?? tiers[tiers.length - 1];
  const inTier = candidates.filter((piece) => rarityOf(piece) === tier);
  return inTier[randomInt(inTier.length, random)];
}

/** Falls in einer Kategorie nichts passt: Ersatz, ohne Premium oder Schaden zu verschenken. */
function fallbackCategories(correct: boolean): PieceCategory[] {
  return correct ? ['basic', 'decoration', 'finish', 'environment'] : ['damaged'];
}

/**
 * Bis zu drei verschiedene Bauteile, die gerade irgendwo hinpassen.
 * Ein Teil kann eine große Variante sein, bei richtiger Antwort ein Grundbauteil
 * auch ein Umgebungsteil. Seltene Teile gibt es erst ab ihrer Serie, und sie kommen seltener.
 * Wenn möglich ist immer eines dabei, auf dem man weiterbauen kann.
 */
export function offerPieces(
  correct: boolean,
  streak: number,
  random: RandomFn,
  placeable: (id: PieceId) => boolean = () => true,
  options: OfferOptions = {},
): PieceId[] {
  const ctx: PoolContext = { streak, exercise: options.exercise ?? null };
  const categories = offerCategories(correct, streak, random);
  const pools = categories.map((category) => smallOf(category, ctx));

  const largeSlots = categories.flatMap((c, i) => (largeOf(c, ctx).length > 0 ? [i] : []));
  let largeSlot = -1;
  if (largeSlots.length > 0 && random() < LARGE_CHANCE) {
    largeSlot = largeSlots[randomInt(largeSlots.length, random)] ?? -1;
    pools[largeSlot] = largeOf(categories[largeSlot] ?? 'basic', ctx);
  }

  const basicSlots = categories.flatMap((c, i) => (c === 'basic' && i !== largeSlot ? [i] : []));
  if (correct && basicSlots.length > 0 && random() < ENVIRONMENT_CHANCE) {
    pools[basicSlots[randomInt(basicSlots.length, random)] ?? 0] = unlockedOf('environment', ctx);
  }

  const chosen: PieceDef[] = [];
  const pick = (candidates: PieceDef[]): PieceDef | undefined => {
    const open = candidates.filter((piece) => !chosen.includes(piece) && placeable(piece.id));
    return pickByRarity(open, random);
  };

  pools.forEach((pool, i) => {
    const piece =
      pick(pool) ??
      pick(smallOf(categories[i] ?? 'basic', ctx)) ??
      pick(fallbackCategories(correct).flatMap((category) => smallOf(category, ctx)));
    if (piece !== undefined) chosen.push(piece);
  });

  if (chosen.length > 0 && !chosen.some(isStackable)) {
    const stackable = pick(smallOf(correct ? 'basic' : 'damaged', ctx).filter(isStackable));
    if (stackable !== undefined) {
      const replace = chosen.findIndex((piece) => piece.category !== 'premium');
      chosen[replace === -1 ? chosen.length - 1 : replace] = stackable;
    }
  }

  if (options.needsRoof === true && !chosen.some((piece) => piece.roof === true)) {
    const roofs = correct
      ? [...smallOf('finish', ctx), ...largeOf('finish', ctx)].filter((piece) => piece.roof === true)
      : smallOf('damaged', ctx).filter((piece) => piece.roof === true);
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
