import { expect, test, type Page } from '@playwright/test';
import { cellCenter } from '../../src/logic/gridLayout';
import {
  answer,
  chooseOffer,
  isSmallBlock,
  layout,
  startGame,
  tapCell,
  toScreen,
  undoButton,
} from './helpers';

const placeHint = (page: Page) => page.getByText('Setz dein Bauteil auf ein leuchtendes Feld!');
const nextButton = (page: Page) => page.getByRole('button', { name: 'Nächste Aufgabe' });

/** Falsch antworten (Serie 0: nur kleine Teile) und einen 1 × 1-Block wählen. */
async function getSmallBlock(page: Page): Promise<void> {
  await answer(page, false);
  await chooseOffer(page, isSmallBlock);
  await expect(placeHint(page)).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await startGame(page);
  await getSmallBlock(page);
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

test('nach „Nächste Aufgabe“ kommt die nächste Aufgabe', async ({ page }) => {
  await tapCell(page, { col: 2, row: 0 });
  await nextButton(page).click();
  await expect(page.locator('.task-panel:visible')).toBeVisible();
  await expect(page.locator('.ending-slot')).toHaveText('');
  await expect(page.getByRole('button', { name: 'Fertig' })).toBeDisabled();
  await expect(undoButton(page)).toBeHidden();
});

test('Blöcke lassen sich stapeln', async ({ page }) => {
  await tapCell(page, { col: 2, row: 0 });
  await nextButton(page).click();
  await getSmallBlock(page);

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
