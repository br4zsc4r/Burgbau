import './ui/styles.css';
import klasse12 from './data/wordlists/klasse-1-2.json';
import { parseWordList } from './logic/wordlist';
import { defaultSettings } from './state/settings';
import { mountApp } from './ui/app';
import { texts } from './ui/texts';

const root = document.querySelector<HTMLElement>('#app');
if (root === null) throw new Error('#app fehlt');

try {
  // Bis Phase 6 nur Tastatur-Modus. Der Bausteine-Modus (inputMode "tiles") folgt dort.
  const list = parseWordList(klasse12);
  mountApp(root, list, defaultSettings, Math.random);
} catch (error) {
  console.error(error);
  root.textContent = texts.loadError;
}
