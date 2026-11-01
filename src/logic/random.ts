import type { RandomFn } from '../types';

/** Ganzzahl in [0, max). */
export function randomInt(max: number, random: RandomFn): number {
  return Math.floor(random() * max);
}

/** Fisher-Yates; liefert ein neues Array, das Original bleibt unverändert. */
export function shuffle<T>(items: readonly T[], random: RandomFn): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1, random);
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}
