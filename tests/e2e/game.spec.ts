import { expect, test, type Page } from '@playwright/test';
import {
  answer,
  buildWholeCastle,
  chooseOffer,
  offerCategories,
  placeAnywhere,
  startGame,
} from './helpers';

const finishButton = (page: Page) => page.getByRole('button', { name: /Nächstes Wort|Burg fertig!/ });

/** Einen Block wählen, irgendwo setzen und weiter zur nächsten Aufgabe. */
async function buildBlock(page: Page): Promise<void> {
  await chooseOffer(page, (piece) => piece.kind === 'block');
  await placeAnywhere(page);
  await finishButton(page).click();
}

test.beforeEach(async ({ page }) => {
  await startGame(page);
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

test('nach 15 Aufgaben ist die Burg fertig und bekommt einen Namen', async ({ page }) => {
  test.setTimeout(150_000);
  await buildWholeCastle(page);
  await page.getByRole('button', { name: 'Burg ist fertig' }).click();
  await expect(page.locator('.celebration-banner')).toHaveText('Burg fertig!');
  await expect(page.getByText('Deine Burg ist fertig!')).toBeVisible();
  await expect(page.getByRole('img', { name: '15 von 15 Wörtern geschafft' })).toBeVisible();
  await expect(page.getByLabel('Wie soll deine Burg heißen?')).toBeFocused();
  await expect(page.getByLabel('Wie soll deine Burg heißen?')).toHaveAttribute('placeholder', 'Lenas Fuchsburg');

  await page.getByLabel('Wie soll deine Burg heißen?').fill('Drachenfels');
  await page.getByRole('button', { name: 'In die Sammlung' }).click();
  await expect(page.getByRole('heading', { name: 'Meine Burgen' })).toBeVisible();
  await expect(page.locator('.castle-card')).toHaveCount(1);
  await expect(page.locator('.castle-card')).toContainText('Drachenfels');
});
