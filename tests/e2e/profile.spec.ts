import { expect, test, type Page } from '@playwright/test';
import {
  answer,
  buildWholeCastle,
  chooseOffer,
  createProfile,
  placeAnywhere,
  startGame,
  undoButton,
} from './helpers';

const switchProfile = (page: Page) => page.getByRole('button', { name: 'Anderes Kind' });

test('Profile erscheinen auf dem Startbildschirm, jedes Symbol nur einmal', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Wer spielt?' })).toBeVisible();
  await createProfile(page, 'Lena');
  await switchProfile(page).click();

  await expect(page.getByRole('button', { name: /Lena/ })).toBeVisible();
  await page.getByRole('button', { name: 'Ich bin neu' }).click();
  await expect(page.locator('.symbol-option')).toHaveCount(29);
});

test('leerer Spitzname geht nicht', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ich bin neu' }).click();
  await page.locator('.symbol-option').first().click();
  await page.getByLabel('Wie heißt du?').fill('   ');
  await expect(page.getByRole('button', { name: 'Fertig' })).toBeDisabled();
});

test('die laufende Burg wird gespeichert und lässt sich nach dem Neuladen weiterbauen', async ({ page }) => {
  await startGame(page);
  await answer(page, true);
  await chooseOffer(page, (piece) => piece.kind === 'block');
  await placeAnywhere(page);
  await page.getByRole('button', { name: 'Nächstes Wort' }).click();
  await answer(page, false);

  await page.reload();
  await page.getByRole('button', { name: /Lena/ }).click();
  await page.getByRole('button', { name: 'Weiterbauen' }).click();
  await expect(page.locator('.offer-card')).toHaveCount(3);
  await expect(page.getByRole('img', { name: '2 von 15 Wörtern geschafft' })).toBeVisible();
  await expect(page.getByRole('img', { name: '0 Fackeln leuchten' })).toBeAttached();
});

test('Pause führt zur Profilseite, Weiterbauen zurück ins Spiel', async ({ page }) => {
  await startGame(page);
  await answer(page, false);
  await chooseOffer(page, (piece) => piece.kind === 'block');
  await placeAnywhere(page);

  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('heading', { name: 'Hallo Lena!' })).toBeVisible();
  await page.getByRole('button', { name: 'Weiterbauen' }).click();
  await expect(undoButton(page)).toBeVisible();
});

test('neue Burg bei laufender Burg fragt nach', async ({ page }) => {
  await startGame(page);
  await answer(page, true);
  await page.getByRole('button', { name: 'Pause' }).click();

  await page.getByRole('button', { name: 'Neue Burg bauen' }).click();
  await expect(page.getByText('Wirklich neu anfangen?', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Nein, weiterbauen' }).click();
  await expect(page.locator('.offer-card')).toHaveCount(3);

  await page.getByRole('button', { name: 'Pause' }).click();
  await page.getByRole('button', { name: 'Neue Burg bauen' }).click();
  await page.getByRole('button', { name: 'Ja, neue Burg' }).click();
  await expect(page.getByRole('img', { name: '0 von 15 Wörtern geschafft' })).toBeAttached();
});

test('Sammlung: eigene Burgen, alle Burgen und Ansicht in voller Größe', async ({ page }) => {
  test.setTimeout(90_000);
  await startGame(page, 'Lena');
  await buildWholeCastle(page);
  await page.getByRole('button', { name: 'In die Sammlung' }).click();

  const card = page.locator('.castle-card');
  await expect(card).toHaveCount(1);
  await expect(card).toContainText('Lenas Fuchsburg');
  // Vorschaubild wird mit der Bau-Render-Funktion gezeichnet.
  await expect(card.locator('img')).toHaveAttribute('src', /^data:image\/png/);

  await card.click();
  await expect(page.getByRole('heading', { name: 'Lenas Fuchsburg' })).toBeVisible();
  await page.getByRole('button', { name: 'Zurück' }).click();
  await expect(page.getByRole('heading', { name: 'Meine Burgen' })).toBeVisible();

  // Anderes Kind: eigene Sammlung leer, unter „Alle Burgen“ steht Lenas Burg.
  await page.getByRole('button', { name: 'Zurück' }).click();
  await switchProfile(page).click();
  await createProfile(page, 'Max');
  await page.getByRole('button', { name: 'Meine Burgen' }).click();
  await expect(page.getByText('Hier ist noch keine Burg.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Alle Burgen' }).click();
  await expect(page.locator('.castle-card')).toHaveCount(1);
  await expect(page.locator('.castle-card')).toContainText('von Lena');
});
