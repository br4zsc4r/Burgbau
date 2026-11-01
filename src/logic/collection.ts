import type { Castle } from '../types';

/** Obergrenze pro Profil; danach macht die älteste Burg Platz. */
export const MAX_CASTLES = 30;

export function newestFirst(castles: readonly Castle[]): Castle[] {
  return [...castles].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Neue Burg vorne einfügen. Ist die Sammlung voll, fällt die älteste heraus. */
export function addCastle(castles: readonly Castle[], castle: Castle): Castle[] {
  return newestFirst([castle, ...castles]).slice(0, MAX_CASTLES);
}
