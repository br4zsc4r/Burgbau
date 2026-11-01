import { expect, test, type Page } from '@playwright/test';
import { currentWord, startGame } from './helpers';

async function currentPlural(page: Page): Promise<string> {
  return (await currentWord(page)).plural[0] ?? '';
}

// Tastatur-Modus: Klasse 4 ist darauf voreingestellt.
test.beforeEach(async ({ page }) => {
  await startGame(page, 'Lena', 'klasse-4');
});

test('richtige Antwort führt zur Bauteil-Auswahl', async ({ page }) => {
  await page.getByLabel('Mehrzahl eintippen').fill(await currentPlural(page));
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.getByText('Richtig!')).toBeVisible();

  await page.getByRole('button', { name: 'Weiter' }).click();
  await expect(page.getByText('Such dir ein Bauteil aus!')).toBeVisible();
  await expect(page.getByLabel('Mehrzahl eintippen')).toBeHidden();
});

test('Kleinschreibung zählt mit Hinweis', async ({ page }) => {
  await page.getByLabel('Mehrzahl eintippen').fill((await currentPlural(page)).toLowerCase());
  await page.keyboard.press('Enter');
  await expect(page.getByText('Richtig!')).toBeVisible();
  await expect(page.getByText('Nomen schreibt man groß!')).toBeVisible();
});

test('fast richtig gibt einen zweiten Versuch', async ({ page }) => {
  const input = page.getByLabel('Mehrzahl eintippen');
  const plural = await currentPlural(page);
  await input.fill(`${plural}q`);
  await page.keyboard.press('Enter');
  await expect(page.getByText('Fast! Schau noch mal genau.')).toBeVisible();
  await expect(input).toHaveValue(`${plural}q`);

  await input.fill(plural);
  await page.keyboard.press('Enter');
  await expect(page.getByText('Richtig!')).toBeVisible();
});

test('falsche Antwort zeigt die Lösung freundlich', async ({ page }) => {
  const plural = await currentPlural(page);
  await page.getByLabel('Mehrzahl eintippen').fill('Xyzxyz');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Gut versucht! So heißt es richtig:')).toBeVisible();
  await expect(page.locator('.solution:visible')).toHaveText(`die ${plural}`);
  await expect(page.getByRole('button', { name: 'Weiter' })).toBeFocused();
});

test('Sonderzeichen-Leiste fügt an der Cursorposition ein', async ({ page }) => {
  const input = page.getByLabel('Mehrzahl eintippen');
  await input.focus();
  await page.getByRole('button', { name: 'Ä einfügen' }).click();
  await expect(input).toHaveValue('Ä');
  await expect(input).toBeFocused();

  await page.keyboard.type('pfel');
  await page.getByRole('button', { name: 'ß einfügen' }).click();
  await expect(input).toHaveValue('Äpfelß');

  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowRight');
  await page.getByRole('button', { name: 'ö einfügen' }).click();
  await expect(input).toHaveValue('Äöpfelß');
});

test('Tasten der Aufgabe sind mindestens 64 × 64 px groß', async ({ page }) => {
  for (const button of await page.locator('.task-panel:visible button:visible').all()) {
    const box = await button.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(64);
    expect(box?.height).toBeGreaterThanOrEqual(64);
  }
});
