import { ENDING_TILES, buildPlural, umlautTargets } from '../logic/tiles';
import type { PluralPattern, Word } from '../types';
import { element } from './dom';
import { texts } from './texts';

const UMLAUT_SHOWN: Readonly<Record<string, string>> = { a: 'ä', o: 'ö', u: 'ü', A: 'Ä', O: 'Ö', U: 'Ü' };
const DRAG_THRESHOLD = 8;

/**
 * Macht ein Element zieh- und antippbar (Maus, Finger, Stift). Beim Loslassen über einem
 * Element mit data-drop wird onDrop aufgerufen, ein kurzes Antippen ruft onTap auf.
 */
function makeDraggable(
  tile: HTMLElement,
  onTap: () => void,
  onDrop: (target: HTMLElement) => void,
): void {
  let start: { x: number; y: number } | null = null;
  let ghost: HTMLElement | null = null;

  tile.addEventListener('pointerdown', (event) => {
    if ((tile as HTMLButtonElement).disabled) return;
    start = { x: event.clientX, y: event.clientY };
    tile.setPointerCapture(event.pointerId);
  });
  tile.addEventListener('pointermove', (event) => {
    if (start === null) return;
    const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y) > DRAG_THRESHOLD;
    if (ghost === null && moved) {
      ghost = tile.cloneNode(true) as HTMLElement;
      ghost.classList.add('tile-ghost');
      document.body.append(ghost);
    }
    if (ghost !== null) {
      ghost.style.left = `${String(event.clientX)}px`;
      ghost.style.top = `${String(event.clientY)}px`;
    }
  });
  const end = (event: PointerEvent): void => {
    if (start === null) return;
    start = null;
    if (ghost === null) {
      onTap();
      return;
    }
    ghost.remove();
    ghost = null;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-drop]');
    if (target !== null && target !== undefined) onDrop(target);
  };
  tile.addEventListener('pointerup', end);
  // Tastatur (Enter/Leertaste) löst nur ein click ohne Zeigerereignis aus.
  tile.addEventListener('click', (event) => {
    if (event.detail === 0) onTap();
  });
  tile.addEventListener('pointercancel', () => {
    start = null;
    ghost?.remove();
    ghost = null;
  });
}

/** Bausteine-Modus: Wortstamm vorgegeben, Endung anlegen, bei Bedarf Pünktchen setzen. */
export function createTilesInput(onChange: () => void): {
  element: HTMLElement;
  render: (word: Word) => void;
  /** Gebautes Wort, oder null solange noch keine Endung gewählt ist. */
  value: () => string | null;
  reset: () => void;
  setEnabled: (enabled: boolean) => void;
} {
  const root = element('div', 'tiles-input');
  const wordRow = element('div', 'tiles-word');
  const tray = element('div', 'tiles-tray');
  const hint = element('p', 'tiles-hint', texts.tilesHint);
  root.append(wordRow, tray, hint);

  let word: Word | null = null;
  let umlaut: number | null = null;
  let ending: PluralPattern | null = null;
  let enabled = true;
  const letters: HTMLElement[] = [];
  const slot = element('button', 'ending-slot');
  slot.type = 'button';
  slot.dataset['drop'] = 'ending';
  slot.setAttribute('aria-label', texts.endingSlotLabel);
  slot.addEventListener('click', () => {
    if (!enabled) return;
    ending = null;
    update();
  });

  const toggleUmlaut = (index: number): void => {
    if (!enabled) return;
    umlaut = umlaut === index ? null : index;
    update();
  };

  const umlautTile = element('button', 'tile umlaut-tile', texts.umlautTile);
  umlautTile.type = 'button';
  umlautTile.setAttribute('aria-label', texts.umlautTileLabel);
  makeDraggable(
    umlautTile,
    () => {
      // Antippen: zeigt kurz, wohin Pünktchen passen.
      root.classList.remove('show-targets');
      // Neu anstoßen, damit die Animation bei jedem Antippen wieder läuft.
      requestAnimationFrame(() => {
        root.classList.add('show-targets');
      });
    },
    (target) => {
      const index = Number(target.dataset['index']);
      if (target.dataset['drop'] === 'umlaut' && Number.isInteger(index)) {
        umlaut = index;
        update();
      }
    },
  );

  const endingTiles = ENDING_TILES.map((option) => {
    const tile = element('button', 'tile ending-tile', texts.endingLabels[option]);
    tile.type = 'button';
    tile.dataset['ending'] = option;
    tile.setAttribute('aria-label', texts.endingTileLabel(option));
    const choose = (): void => {
      if (!enabled) return;
      ending = option;
      update();
    };
    makeDraggable(tile, choose, (target) => {
      if (target.dataset['drop'] !== undefined) choose();
    });
    return tile;
  });
  tray.append(umlautTile, ...endingTiles);

  function update(): void {
    if (word === null) return;
    const chars = Array.from(word.singular);
    letters.forEach((letter, i) => {
      const char = chars[i] ?? '';
      const dotted = umlaut === i;
      letter.textContent = dotted ? (UMLAUT_SHOWN[char] ?? char) : char;
      letter.classList.toggle('dotted', dotted);
      if (letter instanceof HTMLButtonElement) letter.setAttribute('aria-label', texts.letterLabel(char, dotted));
    });
    slot.textContent = ending === null ? '' : texts.endingLabels[ending];
    slot.classList.toggle('filled', ending !== null);
    for (const tile of endingTiles) tile.classList.toggle('chosen', tile.dataset['ending'] === ending);
    onChange();
  }

  return {
    element: root,
    render: (next) => {
      if (word?.id === next.id) return;
      word = next;
      umlaut = null;
      ending = null;
      const targets = umlautTargets(next.singular);
      letters.length = 0;
      const chars = Array.from(next.singular);
      for (let i = 0; i < chars.length; i++) {
        if (targets.includes(i)) {
          const letter = element('button', 'tile-letter target');
          letter.type = 'button';
          letter.dataset['drop'] = 'umlaut';
          letter.dataset['index'] = String(i);
          letter.addEventListener('click', () => {
            toggleUmlaut(i);
          });
          letters.push(letter);
        } else {
          letters.push(element('span', 'tile-letter'));
        }
      }
      const article = element('span', 'article tiles-article', texts.pluralArticle);
      wordRow.replaceChildren(article, ...letters, slot);
      update();
    },
    value: () => (word === null || ending === null ? null : buildPlural(word.singular, umlaut, ending)),
    reset: () => {
      umlaut = null;
      ending = null;
      update();
    },
    setEnabled: (next) => {
      enabled = next;
      root.classList.toggle('disabled', !next);
      for (const el of [slot, umlautTile, ...endingTiles, ...letters]) {
        if (el instanceof HTMLButtonElement) el.disabled = !next;
      }
    },
  };
}
