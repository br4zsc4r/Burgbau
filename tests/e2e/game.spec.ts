import { expect, test, type Page } from '@playwright/test';
import { GRID_SIZE_BY_TASKS } from '../../src/data/grid';
import { getPiece } from '../../src/data/pieces';
import { cellCenter, worldLayout } from '../../src/logic/gridLayout';
import type { PieceCategory, PieceId } from '../../src/types';
import list from '../../src/data/wordlists/klasse-1-2.json' with { type: 'json' };

const size = GRID_SIZE_BY_TASKS[15];
const layout = worldLayout(size);

async function answer(page: Page, correct: boolean): Promise<void> {
  const text = (await page.locator('.singular').textContent()) ?? '';
  const singular = text.replace(/^(der|die|das)\s+/, '').trim();
  const plural = list.words.find((w) => w.singular === singular)?.plural[0] ?? '';
  await page.getByLabel('Mehrzahl eintippen').fill(correct ? plural : 'Xyzxyz');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Weiter' }).click();
}

async function offerCategories(page: Page): Promise<PieceCategory[]> {
  const cards = page.locator('.offer-card');
  await expect(cards).toHaveCount(3);
  const ids = await cards.evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset['piece']));
  return ids.map((id) => getPiece(id as PieceId).category).sort();
}

/** Stapelbares Angebot wählen und an Position n (spaltenweise von unten) setzen. */
async function chooseAndPlace(page: Page, n: number): Promise<void> {
  for (const card of await page.locator('.offer-card').all()) {
    if (getPiece((await card.getAttribute('data-piece')) as PieceId).stackable) {
      await card.click();
      break;
    }
  }
  const box = await page.locator('canvas').boundingBox();
  if (box === null) throw new Error('Canvas nicht sichtbar');
  const scale = box.width / layout.width;
  const { x, y } = cellCenter(layout, { col: n % size.cols, row: Math.floor(n / size.cols) });
  await page.mouse.click(box.x + x * scale, box.y + y * scale);
  await page.locator('.build-controls .primary-button').click();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('falsche Antwort: drei beschädigte Teile mit freundlichem Hinweis', async ({ page }) => {
  await answer(page, false);
  expect(await offerCategories(page)).toEqual(['damaged', 'damaged', 'damaged']);
  await expect(page.getByText('Diesmal sind die Teile etwas bröckelig.', { exact: false })).toBeVisible();
});

test('richtige Antwort: drei Grundbauteile, eine Fackel leuchtet', async ({ page }) => {
  await answer(page, true);
  expect(await offerCategories(page)).toEqual(['basic', 'basic', 'basic']);
  await expect(page.getByText('Diesmal sind die Teile etwas bröckelig.', { exact: false })).toBeHidden();
  await expect(page.getByRole('img', { name: '1 Fackel leuchtet' })).toBeVisible();
});

test('Serie 3 bringt eine Dekoration, eine falsche Antwort halbiert die Serie', async ({ page }) => {
  for (let n = 0; n < 2; n++) {
    await answer(page, true);
    await chooseAndPlace(page, n);
  }
  await answer(page, true);
  expect(await offerCategories(page)).toEqual(['basic', 'basic', 'decoration']);
  await chooseAndPlace(page, 2);

  await answer(page, false);
  await expect(page.getByRole('img', { name: '1 Fackel leuchtet' })).toBeVisible();
});

test('nach 15 Aufgaben ist die Burg fertig, danach beginnt eine neue', async ({ page }) => {
  for (let n = 0; n < 15; n++) {
    await answer(page, n % 4 !== 3);
    await chooseAndPlace(page, n);
  }
  await expect(page.getByText('Deine Burg ist fertig!')).toBeVisible();

  await page.getByRole('button', { name: 'Neue Burg bauen' }).click();
  await expect(page.getByLabel('Mehrzahl eintippen')).toBeVisible();
  await expect(page.getByRole('img', { name: '0 Fackeln leuchten' })).toBeAttached();
});

test('letzte Aufgabe: Button heißt „Burg fertig!“', async ({ page }) => {
  for (let n = 0; n < 14; n++) {
    await answer(page, true);
    await chooseAndPlace(page, n);
  }
  await answer(page, true);
  await page.locator('.offer-card').first().click();
  const box = await page.locator('canvas').boundingBox();
  if (box === null) throw new Error('Canvas nicht sichtbar');
  const scale = box.width / layout.width;
  const { x, y } = cellCenter(layout, { col: 3, row: 1 });
  await page.mouse.click(box.x + x * scale, box.y + y * scale);
  await expect(page.getByRole('button', { name: 'Burg fertig!' })).toBeVisible();
});
