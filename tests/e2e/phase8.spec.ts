import { expect, test } from '@playwright/test';
import { wordImageUrl } from '../../src/data/wordImages';
import { currentWord, openTeacher, startGame } from './helpers';

test('die Aufgabe zeigt das Bild zum Wort, sonst den Anfangsbuchstaben', async ({ page }) => {
  await startGame(page, 'Lena', 'klasse-4');
  const word = await currentWord(page);
  const picture = page.locator('.word-picture');
  if (word.image === undefined) {
    await expect(picture).toHaveCount(0);
    await expect(page.locator('.word-image')).toHaveText(word.singular.charAt(0));
  } else {
    await expect(picture).toHaveAttribute('src', wordImageUrl(word.image));
    // Das Bild ist wirklich geladen (liegt lokal vor).
    await expect.poll(() => picture.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  }
});

test('richtige Antwort: kleiner Sternenregen um das Wort', async ({ page }) => {
  await startGame(page, 'Lena', 'klasse-4');
  const word = await currentWord(page);
  await page.getByLabel('Mehrzahl eintippen').fill(word.plural[0] ?? '');
  await page.keyboard.press('Enter');
  await expect(page.locator('.word-card.cheer')).toBeVisible();
  await expect(page.locator('.burst-star').first()).toBeAttached();
});

test('Bildnachweis für OpenMoji und Ton-Schalter im Lehrkraft-Bereich', async ({ page }) => {
  await page.goto('/');
  await openTeacher(page);
  await expect(page.getByText(/OpenMoji/)).toBeVisible();
  await expect(page.getByLabel('Leise Töne bei Erfolgen')).toBeChecked();
});
