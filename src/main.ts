import './ui/styles.css';
import { parseWordList } from './logic/wordlist';
import { createRepository } from './state/repository';
import { defaultSettings } from './state/settings';
import { createIdbStore, createMemoryStore, type KeyValueStore } from './state/storage';
import { mountApp } from './ui/app';
import { texts } from './ui/texts';
import type { WordList } from './types';

/** IndexedDB, wenn verfügbar; sonst (z. B. privates Fenster) nur im Speicher. */
async function openStore(): Promise<{ store: KeyValueStore; persistent: boolean }> {
  try {
    const store = createIdbStore();
    await store.get('profiles');
    return { store, persistent: true };
  } catch (error) {
    console.warn('IndexedDB nicht verfügbar, speichere nur im Speicher', error);
    return { store: createMemoryStore(), persistent: false };
  }
}

function newId(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

const WORD_LISTS = Object.values(
  import.meta.glob<unknown>('./data/wordlists/*.json', { eager: true, import: 'default' }),
).map(parseWordList);

/**
 * Aktive Wortliste. Bis zu den Lehrkraft-Einstellungen (Phase 7) lässt sie sich zum
 * Ausprobieren über die Adresse wählen, z. B. ?liste=klasse-3.
 */
function activeWordList(): WordList {
  const requested = new URLSearchParams(window.location.search).get('liste') ?? defaultSettings.wordListId;
  const list =
    WORD_LISTS.find((l) => l.id === requested) ??
    WORD_LISTS.find((l) => l.id === defaultSettings.wordListId);
  if (list === undefined) throw new Error('Keine Wortliste gefunden');
  return list;
}

async function start(root: HTMLElement): Promise<void> {
  const list = activeWordList();
  const { store, persistent } = await openStore();
  await mountApp(root, {
    list,
    settings: { ...defaultSettings, wordListId: list.id },
    random: Math.random,
    repository: createRepository(store),
    newId,
    now: () => new Date(),
    persistent,
  });
}

const root = document.querySelector<HTMLElement>('#app');
if (root === null) throw new Error('#app fehlt');

start(root).catch((error: unknown) => {
  console.error(error);
  root.textContent = texts.loadError;
});
