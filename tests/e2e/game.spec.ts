import { expect, test, type Page } from '@playwright/test';
import { answer, chooseOffer, offerCategories, placeAnywhere } from './helpers';

const finishButton = (page: Page) => page.locator('.build-controls .primary-button');

/** Einen Block wählen, irgendwo setzen und weiter zur nächsten Aufgabe. */
async function buildBlock(page: Page): Promise<void> {
  await chooseOffer(page, (piece) => piece.kind === 'block');
  await placeAnywhere(page);
  await finishButton(page).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('falsche Antwort: drei beschädigte Teile mit freundlichem Hinweis', async ({ page }) => {
  await answer(page, false);
  expect(await offerCategories(page)).toEqual(['damaged', 'damaged', 'damaged']);
  await expect(page.getByText('Diesmal sind die Teile etwas bröckelig.', { exact: false })).toBeVisible();
});

test('richtige Antwort: Grundbauteile, eine Fackel leuchtet', async ({ page }) => {
  await answer(page, true);
  const categories = await offerCategories(page);
  expect(categories).toContain('basic');
  for (const category of categories) expect(['basic', 'environment']).toContain(category);
  await expect(page.getByText('Diesmal sind die Teile etwas bröckelig.', { exact: false })).toBeHidden();
  await expect(page.getByRole('img', { name: '1 Fackel leuchtet' })).toBeVisible();
});

test('Fortschritt: nach jeder Aufgabe füllt sich ein Punkt', async ({ page }) => {
  await expect(page.getByRole('img', { name: '0 von 15 Wörtern geschafft' })).toBeAttached();
  await answer(page, false);
  await expect(page.getByRole('img', { name: '1 von 15 Wörtern geschafft' })).toBeVisible();
  await buildBlock(page);
  await answer(page, true);
  await expect(page.getByRole('img', { name: '2 von 15 Wörtern geschafft' })).toBeVisible();
});

test('Serie 3 bringt eine Dekoration, die an einem Bauteil andockt', async ({ page }) => {
  for (let n = 0; n < 2; n++) {
    await answer(page, true);
    await buildBlock(page);
  }
  await answer(page, true);
  const categories = await offerCategories(page);
  expect(categories).toContain('decoration');
  expect(categories).toContain('basic');

  await chooseOffer(page, (piece) => piece.category === 'decoration');
  await expect(page.getByText('Häng die Verzierung an ein leuchtendes Bauteil!')).toBeVisible();
  await placeAnywhere(page);
  await finishButton(page).click();

  await answer(page, false);
  await expect(page.getByRole('img', { name: '1 Fackel leuchtet' })).toBeVisible();
});

test('nach 15 Aufgaben ist die Burg fertig, danach beginnt eine neue', async ({ page }) => {
  for (let n = 0; n < 15; n++) {
    await answer(page, n % 4 !== 3);
    if (n === 14) {
      await chooseOffer(page, (piece) => piece.kind === 'block');
      await placeAnywhere(page);
      await expect(page.getByRole('button', { name: 'Burg fertig!' })).toBeVisible();
      await finishButton(page).click();
    } else {
      await buildBlock(page);
    }
  }
  await expect(page.getByText('Deine Burg ist fertig!')).toBeVisible();
  await expect(page.getByRole('img', { name: '15 von 15 Wörtern geschafft' })).toBeVisible();

  await page.getByRole('button', { name: 'Neue Burg bauen' }).click();
  await expect(page.getByLabel('Mehrzahl eintippen')).toBeVisible();
  await expect(page.getByRole('img', { name: '0 Fackeln leuchten' })).toBeAttached();
  await expect(page.getByRole('img', { name: '0 von 15 Wörtern geschafft' })).toBeAttached();
});
