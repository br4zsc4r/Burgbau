import './ui/styles.css';
import { parseWordList } from './logic/wordlist';
import { createRepository } from './state/repository';
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

const BUILTIN_LISTS = Object.values(
  import.meta.glob<unknown>('./data/wordlists/*.json', { eager: true, import: 'default' }),
).map(parseWordList);

async function start(root: HTMLElement): Promise<void> {
  const { store, persistent } = await openStore();
  const repository = createRepository(store);
  const [settings, customLists, packs] = await Promise.all([
    repository.loadSettings(),
    repository.loadCustomLists(),
    repository.loadPacks(),
  ]);
  await mountApp(root, {
    builtinLists: BUILTIN_LISTS,
    customLists,
    packs,
    settings,
    random: Math.random,
    repository,
    newId,
    now: () => new Date(),
    persistent,
    reload: () => {
      window.location.reload();
    },
  });
}

const root = document.querySelector<HTMLElement>('#app');
if (root === null) throw new Error('#app fehlt');

start(root).catch((error: unknown) => {
  console.error(error);
  root.textContent = texts.loadError;
});
