import { addCastle, newestFirst } from '../logic/collection';
import type { Castle, GameState, Profile } from '../types';
import { migrate, withVersion } from './migrations';
import type { KeyValueStore } from './storage';
import { parseCastle, parseGameState, parseProfile } from './validate';

const PROFILES_KEY = 'profiles';
const gameKey = (profileId: string): string => `game:${profileId}`;
const castlesKey = (profileId: string): string => `castles:${profileId}`;

function listOf<T>(record: Record<string, unknown> | null, field: string, parse: (v: unknown) => T | null): T[] {
  const raw = record?.[field];
  if (!Array.isArray(raw)) return [];
  return raw.map(parse).filter((item): item is T => item !== null);
}

/** Laden und Speichern von Profilen, laufenden Burgen und Sammlungen (alles lokal). */
export function createRepository(store: KeyValueStore) {
  async function loadCastles(profileId: string): Promise<Castle[]> {
    const record = migrate('castles', await store.get(castlesKey(profileId)));
    return newestFirst(listOf(record, 'castles', parseCastle));
  }

  return {
    async loadProfiles(): Promise<Profile[]> {
      return listOf(migrate('profiles', await store.get(PROFILES_KEY)), 'profiles', parseProfile);
    },

    saveProfiles(profiles: readonly Profile[]): Promise<void> {
      return store.set(PROFILES_KEY, withVersion('profiles', { profiles }));
    },

    /** Laufende Burg; null, wenn keine da ist oder sie nicht mehr lesbar ist. */
    async loadGame(profileId: string): Promise<GameState | null> {
      const record = migrate('game', await store.get(gameKey(profileId)));
      return record === null ? null : parseGameState(record['game']);
    },

    saveGame(profileId: string, game: GameState): Promise<void> {
      return store.set(gameKey(profileId), withVersion('game', { game }));
    },

    deleteGame(profileId: string): Promise<void> {
      return store.del(gameKey(profileId));
    },

    loadCastles,

    /** Fertige Burg in die Sammlung; bei voller Sammlung fällt die älteste heraus. */
    async addCastle(castle: Castle): Promise<Castle[]> {
      const castles = addCastle(await loadCastles(castle.profileId), castle);
      await store.set(castlesKey(castle.profileId), withVersion('castles', { castles }));
      return castles;
    },

    /** Burgen aller Profile, neueste zuerst. */
    async loadAllCastles(profiles: readonly Profile[]): Promise<Castle[]> {
      const lists = await Promise.all(profiles.map((profile) => loadCastles(profile.id)));
      return newestFirst(lists.flat());
    },
  };
}

export type Repository = ReturnType<typeof createRepository>;
