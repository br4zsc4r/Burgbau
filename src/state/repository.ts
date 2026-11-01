import { addCastle, newestFirst } from '../logic/collection';
import type { Castle, GameState, Profile, Settings, TaskBoxes, WordList } from '../types';
import { validateWordList } from '../logic/wordlist';
import { parseSettings } from './settings';
import { migrate, withVersion } from './migrations';
import type { KeyValueStore } from './storage';
import { parseCastle, parseGameState, parseProfile, sanitizeBoxes } from './validate';

const PROFILES_KEY = 'profiles';
const SETTINGS_KEY = 'settings';
const WORDLISTS_KEY = 'wordlists';
const gameKey = (profileId: string): string => `game:${profileId}`;
const castlesKey = (profileId: string): string => `castles:${profileId}`;
const progressKey = (profileId: string): string => `progress:${profileId}`;
const PIN_KEY = 'teacherPin';

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

  async function saveCastles(profileId: string, castles: readonly Castle[]): Promise<void> {
    await store.set(castlesKey(profileId), withVersion('castles', { castles }));
  }

  return {
    async loadSettings(): Promise<Settings> {
      const record = migrate('settings', await store.get(SETTINGS_KEY));
      return parseSettings(record?.['settings']);
    },

    saveSettings(settings: Settings): Promise<void> {
      return store.set(SETTINGS_KEY, withVersion('settings', { settings }));
    },

    /** Eigene (per CSV importierte) Wortlisten; ungültige werden übersprungen. */
    async loadCustomLists(): Promise<WordList[]> {
      const record = migrate('wordlists', await store.get(WORDLISTS_KEY));
      return listOf(record, 'lists', (raw) => (validateWordList(raw).length === 0 ? (raw as WordList) : null));
    },

    saveCustomLists(lists: readonly WordList[]): Promise<void> {
      return store.set(WORDLISTS_KEY, withVersion('wordlists', { lists }));
    },

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
      await saveCastles(castle.profileId, castles);
      return castles;
    },

    async deleteCastle(profileId: string, castleId: string): Promise<void> {
      const castles = await loadCastles(profileId);
      await saveCastles(profileId, castles.filter((c) => c.id !== castleId));
    },

    clearCastles(profileId: string): Promise<void> {
      return store.del(castlesKey(profileId));
    },

    /** Alles, was zu einem Profil gehört: laufende Burg, Sammlung, Lernfortschritt. */
    async deleteProfileData(profileId: string): Promise<void> {
      await Promise.all([
        store.del(gameKey(profileId)),
        store.del(castlesKey(profileId)),
        store.del(progressKey(profileId)),
      ]);
    },

    /** Alles auf dem Gerät löschen (Schuljahresende). */
    resetAll(): Promise<void> {
      return store.clear();
    },

    /** Lernfortschritt eines Profils: Fach je Aufgabe, über alle Spielarten. */
    async loadBoxes(profileId: string): Promise<TaskBoxes> {
      const record = migrate('progress', await store.get(progressKey(profileId)));
      return sanitizeBoxes(record?.['boxes']);
    },

    async saveBoxes(profileId: string, boxes: TaskBoxes): Promise<void> {
      await store.set(progressKey(profileId), withVersion('progress', { boxes }));
    },

    /** Hash der Lehrkraft-PIN; null, solange keine festgelegt ist. */
    async loadPinHash(): Promise<string | null> {
      const record = migrate('pin', await store.get(PIN_KEY));
      const hash = record?.['hash'];
      return typeof hash === 'string' && hash !== '' ? hash : null;
    },

    savePinHash(hash: string): Promise<void> {
      return store.set(PIN_KEY, withVersion('pin', { hash }));
    },

    /** Burgen aller Profile, neueste zuerst. */
    async loadAllCastles(profiles: readonly Profile[]): Promise<Castle[]> {
      const lists = await Promise.all(profiles.map((profile) => loadCastles(profile.id)));
      return newestFirst(lists.flat());
    },
  };
}

export type Repository = ReturnType<typeof createRepository>;
