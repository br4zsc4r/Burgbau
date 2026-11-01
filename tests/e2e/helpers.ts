import { expect, type Locator, type Page } from '@playwright/test';
import { GRID_SIZE_BY_TASKS } from '../../src/data/grid';
import { getPiece } from '../../src/data/pieces';
import { cellCenter, worldLayout } from '../../src/logic/gridLayout';
import { CURRENT_VERSION } from '../../src/state/migrations';
import { defaultSettings } from '../../src/state/settings';
import type { Cell, PieceCategory, PieceDef, PieceId, Settings } from '../../src/types';
import klasse12 from '../../src/data/wordlists/klasse-1-2.json' with { type: 'json' };
import klasse3 from '../../src/data/wordlists/klasse-3.json' with { type: 'json' };
import klasse4 from '../../src/data/wordlists/klasse-4.json' with { type: 'json' };

const ALL_WORDS = [...klasse12.words, ...klasse3.words, ...klasse4.words];

/** Das Wort der aktuellen Aufgabe (aus allen Listen gesucht). */
export async function currentWord(page: Page) {
  const text = (await page.locator('.singular').textContent()) ?? '';
  const singular = text.replace(/^(der|die|das)\s+/, '').trim();
  const word = ALL_WORDS.find((w) => w.singular === singular);
  if (word === undefined) throw new Error(`Unbekanntes Wort: ${singular}`);
  return word;
}

export const size = GRID_SIZE_BY_TASKS[15];
export const layout = worldLayout(size);

/** Weltkoordinaten → Bildschirmkoordinaten des skalierten Canvas. */
export async function toScreen(page: Page, point: { x: number; y: number }) {
  const box = await page.locator('canvas').boundingBox();
  if (box === null) throw new Error('Canvas nicht sichtbar');
  const scale = box.width / layout.width;
  return { x: box.x + point.x * scale, y: box.y + point.y * scale };
}

export async function tapCell(page: Page, cell: Cell): Promise<void> {
  const { x, y } = await toScreen(page, cellCenter(layout, cell));
  await page.mouse.click(x, y);
}

/** Neues Profil anlegen (erstes freies Symbol) und auf dessen Startseite landen. */
export async function createProfile(page: Page, nickname: string): Promise<void> {
  await page.getByRole('button', { name: 'Ich bin neu' }).click();
  await page.locator('.symbol-option').first().click();
  await page.getByLabel('Wie heißt du?').fill(nickname);
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.getByRole('heading', { name: `Hallo ${nickname}!` })).toBeVisible();
}

/**
 * Lehrkraft-Einstellungen direkt in IndexedDB setzen (schneller als über die Oberfläche)
 * und die Seite neu laden.
 */
export async function setSettings(page: Page, change: Partial<Settings>): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Wer spielt?' })).toBeVisible();
  const settings = { ...defaultSettings, ...change };
  await page.evaluate(async ({ value, version }) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('burgbau');
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(new Error('IndexedDB'));
      };
    });
    await new Promise<void>((resolve) => {
      const tx = db.transaction('data', 'readwrite');
      tx.objectStore('data').put({ version, settings: value }, 'settings');
      tx.oncomplete = () => {
        resolve();
      };
    });
  }, { value: settings, version: CURRENT_VERSION.settings });
  await page.reload();
}

/** Seite öffnen (optional mit anderer Wortliste), Profil anlegen und eine neue Burg beginnen. */
export async function startGame(page: Page, nickname = 'Lena', list?: string): Promise<void> {
  if (list === undefined) await page.goto('/');
  else await setSettings(page, { activeListIds: [list] });
  await createProfile(page, nickname);
  await page.getByRole('button', { name: 'Neue Burg bauen' }).click();
  await chooseExercise(page);
  await expect(page.locator('.task-panel:visible')).toBeVisible();
}

/** Auf „Was möchtest du üben?“ eine Spielart wählen (standardmäßig sind alle frei). */
export async function chooseExercise(page: Page, name = 'Mehrzahl'): Promise<void> {
  await page.locator('.exercise-card', { hasText: name }).click();
}

export const undoButton = (page: Page): Locator => page.getByRole('button', { name: 'Rückgängig' });

/** Bausteine legen: Pünktchen (falls nötig) und Endung. */
export async function buildWithTiles(page: Page, umlautIndex: number | null, ending: string): Promise<void> {
  if (umlautIndex !== null) await page.locator(`.tile-letter[data-index="${String(umlautIndex)}"]`).click();
  await page.locator(`.ending-tile[data-ending="${ending}"]`).click();
}

/** Aufgabe beantworten (Tastatur oder Bausteine) und zur Bauteil-Auswahl weitergehen. */
export async function answer(page: Page, correct: boolean): Promise<void> {
  const word = await currentWord(page);
  const plural = word.plural[0] ?? '';
  const mode = await page.locator('.task-panel:visible').getAttribute('data-mode');
  const submit = page.getByRole('button', { name: 'Fertig' });

  if (mode === 'tiles') {
    const singular = Array.from(word.singular);
    const umlaut = word.umlaut ? singular.findIndex((c, i) => c !== Array.from(plural)[i]) : null;
    if (correct) {
      await buildWithTiles(page, umlaut, word.pattern);
      await submit.click();
    } else {
      // Falsche Endung; ist das nur „fast“ falsch, zählt der zweite Versuch.
      await buildWithTiles(page, null, word.pattern === 'er' ? 's' : 'er');
      await submit.click();
      if ((await page.locator('.feedback:visible').getAttribute('data-status')) === 'almost') await submit.click();
    }
  } else {
    await page.getByLabel('Mehrzahl eintippen').fill(correct ? plural : 'Xyzxyz');
    await page.keyboard.press('Enter');
  }
  await page.getByRole('button', { name: 'Weiter' }).click();
}

async function offeredPieces(page: Page): Promise<{ card: Locator; piece: PieceDef }[]> {
  const cards = page.locator('.offer-card');
  await expect(cards.first()).toBeVisible();
  return Promise.all(
    (await cards.all()).map(async (card) => ({
      card,
      piece: getPiece((await card.getAttribute('data-piece')) as PieceId),
    })),
  );
}

export async function offerCategories(page: Page): Promise<PieceCategory[]> {
  return (await offeredPieces(page)).map(({ piece }) => piece.category).sort();
}

/** Erstes Angebot wählen, auf das die Bedingung passt. */
export async function chooseOffer(page: Page, predicate: (piece: PieceDef) => boolean): Promise<PieceDef> {
  const match = (await offeredPieces(page)).find(({ piece }) => predicate(piece));
  if (match === undefined) throw new Error('kein passendes Angebot');
  await match.card.click();
  return match.piece;
}

export const isSmallBlock = (piece: PieceDef): boolean =>
  piece.kind === 'block' && piece.width === 1 && piece.height === 1;

/** Setzt das wartende Teil auf die erste Zelle (von unten links), an die es passt. */
export async function placeAnywhere(page: Page): Promise<void> {
  for (let row = 0; row < size.rows; row++) {
    for (let col = 0; col < size.cols; col++) {
      await tapCell(page, { col, row });
      if (await undoButton(page).isVisible()) return;
    }
  }
  throw new Error('Teil passt nirgends');
}

/** Alle 15 Aufgaben spielen (jede vierte falsch), immer einen Block setzen. */
export async function buildWholeCastle(page: Page, tasks = 15): Promise<void> {
  for (let n = 0; n < tasks; n++) {
    await answer(page, n % 4 !== 3);
    await chooseOffer(page, (piece) => piece.kind === 'block');
    if (n < tasks - 1) {
      await placeAnywhere(page);
      await page.getByRole('button', { name: 'Nächste Aufgabe' }).click();
    } else {
      await placeInEditing(page);
    }
  }
  // Nach dem letzten Teil direkt im Bearbeitungsmodus.
  await expect(page.getByRole('button', { name: 'Burg ist fertig' })).toBeEnabled();
}

/** Setzt das gehaltene Teil auf die erste passende Zelle, ohne auf „Rückgängig“ zu warten. */
export async function placeInEditing(page: Page): Promise<void> {
  const holding = page.locator('.build-hint', { hasText: /leuchtendes Feld/ });
  for (let row = 0; row < size.rows; row++) {
    for (let col = 0; col < size.cols; col++) {
      await tapCell(page, { col, row });
      if (!(await holding.isVisible())) return;
    }
  }
  throw new Error('Teil passt nirgends');
}

export const PIN = '2468';

/** Zahnrad antippen und PIN eingeben (beim ersten Mal festlegen). */
export async function openTeacher(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Einstellungen für Lehrkräfte' }).click();
  // Der Dialog öffnet erst, wenn der gespeicherte PIN-Hash geladen ist.
  await expect(page.locator('.teacher-gate')).toBeVisible();
  if (await page.getByRole('heading', { name: 'PIN festlegen' }).isVisible()) {
    await page.getByLabel('Neue PIN').fill(PIN);
    await page.getByLabel('PIN wiederholen').fill(PIN);
  } else {
    await page.getByLabel('PIN eingeben').fill(PIN);
  }
  await page.getByRole('button', { name: 'Öffnen' }).click();
  await expect(page.getByRole('heading', { name: 'Einstellungen für Lehrkräfte' })).toBeVisible();
}

/** Zahnrad einer Spielart im Lehrkraft-Bereich antippen: öffnet das Popup mit ihren Einstellungen. */
export async function openExerciseSettings(page: Page, name: string): Promise<Locator> {
  await page.getByRole('button', { name: `Einstellungen: ${name}` }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  return dialog;
}

/** Offenes Popup im Lehrkraft-Bereich schließen. */
export async function closeDialog(page: Page): Promise<void> {
  await page.getByRole('dialog').getByRole('button', { name: 'Schließen' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
}
