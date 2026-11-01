import { expect, test, type Page } from '@playwright/test';
import { GRID_SIZE_BY_TASKS } from '../../src/data/grid';
import { getPiece } from '../../src/data/pieces';
import { cellCenter, worldLayout } from '../../src/logic/gridLayout';
import type { Cell, PieceId } from '../../src/types';

const layout = worldLayout(GRID_SIZE_BY_TASKS[15]);

/** Weltkoordinaten → Bildschirmkoordinaten des skalierten Canvas. */
async function toScreen(page: Page, point: { x: number; y: number }) {
  const box = await page.locator('canvas').boundingBox();
  if (box === null) throw new Error('Canvas nicht sichtbar');
  const scale = box.width / layout.width;
  return { x: box.x + point.x * scale, y: box.y + point.y * scale };
}

async function tapCell(page: Page, cell: Cell): Promise<void> {
  const { x, y } = await toScreen(page, cellCenter(layout, cell));
  await page.mouse.click(x, y);
}

const placeHint = (page: Page) => page.getByText('Setz dein Bauteil auf ein leuchtendes Feld!');

/** Falsch antworten, dann das erste (stapelbare) Angebot wählen. */
async function answerAnything(page: Page): Promise<void> {
  await page.getByLabel('Mehrzahl eintippen').fill('Xyzxyz');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Weiter' }).click();
  await chooseStackable(page);
  await expect(placeHint(page)).toBeVisible();
}

async function chooseStackable(page: Page): Promise<void> {
  const cards = page.locator('.offer-card');
  await expect(cards).toHaveCount(3);
  for (const card of await cards.all()) {
    const id = (await card.getAttribute('data-piece')) as PieceId;
    if (getPiece(id).stackable) {
      await card.click();
      return;
    }
  }
  throw new Error('kein stapelbares Angebot');
}
const undoButton = (page: Page) => page.getByRole('button', { name: 'Rückgängig' });
const nextButton = (page: Page) => page.getByRole('button', { name: 'Nächstes Wort' });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await answerAnything(page);
});

test('Antippen einer Bodenzelle setzt den Block', async ({ page }) => {
  await tapCell(page, { col: 2, row: 0 });
  await expect(undoButton(page)).toBeVisible();
  await expect(nextButton(page)).toBeVisible();
});

test('schwebende Zellen sind gesperrt (Schwerkraft)', async ({ page }) => {
  await tapCell(page, { col: 2, row: 3 });
  await expect(placeHint(page)).toBeVisible();
  await expect(undoButton(page)).toBeHidden();
});

test('Rückgängig legt den Block zurück in die Ablage', async ({ page }) => {
  await tapCell(page, { col: 2, row: 0 });
  await undoButton(page).click();
  await expect(placeHint(page)).toBeVisible();

  await tapCell(page, { col: 5, row: 0 });
  await expect(undoButton(page)).toBeVisible();
});

test('nach „Nächstes Wort“ kommt die nächste Aufgabe', async ({ page }) => {
  await tapCell(page, { col: 2, row: 0 });
  await nextButton(page).click();
  await expect(page.getByLabel('Mehrzahl eintippen')).toBeVisible();
  await expect(page.getByLabel('Mehrzahl eintippen')).toHaveValue('');
  await expect(page.getByLabel('Mehrzahl eintippen')).toBeFocused();
  await expect(undoButton(page)).toBeHidden();
});

test('Blöcke lassen sich stapeln', async ({ page }) => {
  await tapCell(page, { col: 2, row: 0 });
  await nextButton(page).click();
  await answerAnything(page);

  await tapCell(page, { col: 2, row: 1 });
  await expect(undoButton(page)).toBeVisible();
});

test('Ziehen aus der Ablage setzt den Block', async ({ page }) => {
  const from = await toScreen(page, layout.tray);
  const to = await toScreen(page, cellCenter(layout, { col: 4, row: 0 }));
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 10 });
  await page.mouse.up();
  await expect(undoButton(page)).toBeVisible();
});

test('Ziehen auf eine gesperrte Zelle setzt nichts', async ({ page }) => {
  const from = await toScreen(page, layout.tray);
  const to = await toScreen(page, cellCenter(layout, { col: 4, row: 4 }));
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 10 });
  await page.mouse.up();
  await expect(undoButton(page)).toBeHidden();
  await expect(placeHint(page)).toBeVisible();
});

test('Rasterzellen sind mindestens 64 px groß (1280 × 800)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const a = await toScreen(page, { x: 0, y: 0 });
  const b = await toScreen(page, { x: layout.cellSize, y: 0 });
  expect(b.x - a.x).toBeGreaterThanOrEqual(64);
});
