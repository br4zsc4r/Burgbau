import { expect, type Locator, type Page } from '@playwright/test';
import { GRID_SIZE_BY_TASKS } from '../../src/data/grid';
import { getPiece } from '../../src/data/pieces';
import { cellCenter, worldLayout } from '../../src/logic/gridLayout';
import type { Cell, PieceCategory, PieceDef, PieceId } from '../../src/types';
import list from '../../src/data/wordlists/klasse-1-2.json' with { type: 'json' };

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

export const undoButton = (page: Page): Locator => page.getByRole('button', { name: 'Rückgängig' });

/** Aufgabe beantworten und zur Bauteil-Auswahl weitergehen. */
export async function answer(page: Page, correct: boolean): Promise<void> {
  const text = (await page.locator('.singular').textContent()) ?? '';
  const singular = text.replace(/^(der|die|das)\s+/, '').trim();
  const plural = list.words.find((w) => w.singular === singular)?.plural[0] ?? '';
  await page.getByLabel('Mehrzahl eintippen').fill(correct ? plural : 'Xyzxyz');
  await page.keyboard.press('Enter');
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
