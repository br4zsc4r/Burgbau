import './ui/styles.css';
import klasse12 from './data/wordlists/klasse-1-2.json';
import { parseWordList } from './logic/wordlist';
import { defaultSettings } from './state/settings';
import { mountQuiz } from './ui/quizView';
import { texts } from './ui/texts';

const root = document.querySelector<HTMLElement>('#app');
if (root === null) throw new Error('#app fehlt');

try {
  // Phase 1: nur Tastatur-Modus. Der Bausteine-Modus (inputMode "tiles") folgt in Phase 6.
  const list = parseWordList(klasse12);
  mountQuiz(root, list, defaultSettings, Math.random);
} catch (error) {
  console.error(error);
  root.textContent = texts.loadError;
}
