import './ui/styles.css';
import klasse12 from './data/wordlists/klasse-1-2.json';
import { parseWordList } from './logic/wordlist';
import { createRepository } from './state/repository';
import { defaultSettings } from './state/settings';
import { createIdbStore, createMemoryStore, type KeyValueStore } from './state/storage';
import { mountApp } from './ui/app';
import { texts } from './ui/texts';

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

async function start(root: HTMLElement): Promise<void> {
  // Bis Phase 6 nur Tastatur-Modus. Der Bausteine-Modus (inputMode "tiles") folgt dort.
  const list = parseWordList(klasse12);
  const { store, persistent } = await openStore();
  await mountApp(root, {
    list,
    settings: defaultSettings,
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
