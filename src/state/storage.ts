import { clear, createStore, del, get, set } from 'idb-keyval';

/** Minimaler Schlüssel-Wert-Speicher; im Browser IndexedDB, in Tests im Speicher. */
export interface KeyValueStore {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<void>;
  del: (key: string) => Promise<void>;
  /** Alles löschen (Lehrkraft: „Alles zurücksetzen“). */
  clear: () => Promise<void>;
}

export function createIdbStore(): KeyValueStore {
  const store = createStore('burgbau', 'data');
  return {
    get: (key) => get<unknown>(key, store),
    set: (key, value) => set(key, value, store),
    del: (key) => del(key, store),
    clear: () => clear(store),
  };
}

export function createMemoryStore(): KeyValueStore {
  const data = new Map<string, unknown>();
  return {
    get: (key) => Promise.resolve(structuredClone(data.get(key))),
    set: (key, value) => {
      data.set(key, structuredClone(value));
      return Promise.resolve();
    },
    del: (key) => {
      data.delete(key);
      return Promise.resolve();
    },
    clear: () => {
      data.clear();
      return Promise.resolve();
    },
  };
}
