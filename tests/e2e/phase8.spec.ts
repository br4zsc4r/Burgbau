import { expect, test, type Page } from '@playwright/test';
import { wordImageUrl } from '../../src/data/wordImages';
import { answer, chooseOffer, currentWord, openTeacher, placeAnywhere, startGame } from './helpers';

test('die Aufgabe zeigt das Bild zum Wort, sonst den Anfangsbuchstaben', async ({ page }) => {
  await startGame(page, 'Lena', 'klasse-4');
  const word = await currentWord(page);
  const picture = page.locator('.word-picture');
  if (word.image === undefined) {
    await expect(picture).toHaveCount(0);
    await expect(page.locator('.word-image:visible')).toHaveText(word.singular.charAt(0));
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
  await expect(page.locator('.word-card.cheer:visible')).toBeVisible();
  await expect(page.locator('.burst-star').first()).toBeAttached();
});

test('Bildnachweis für OpenMoji und Ton-Schalter im Lehrkraft-Bereich', async ({ page }) => {
  await page.goto('/');
  await openTeacher(page);
  await expect(page.getByText(/OpenMoji/)).toBeVisible();
  await expect(page.getByLabel('Leise Töne bei Erfolgen')).toBeChecked();
});

/** Gespeicherte Partie direkt ändern (schneller, als bis zu einem bestimmten Teil zu spielen). */
async function patchGame(page: Page, patch: Record<string, unknown>): Promise<void> {
  await page.evaluate(async (change) => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const request = indexedDB.open('burgbau');
      request.onsuccess = () => {
        resolve(request.result);
      };
    });
    const get = (key: string) =>
      new Promise<unknown>((resolve) => {
        const request = db.transaction('data').objectStore('data').get(key);
        request.onsuccess = () => {
          resolve(request.result);
        };
      });
    const profiles = (await get('profiles')) as { profiles: { id: string }[] };
    const id = profiles.profiles[0]?.id ?? '';
    const record = (await get(`game:${id}`)) as { game: Record<string, unknown> };
    record.game = { ...record.game, ...change };
    await new Promise<void>((resolve) => {
      const tx = db.transaction('data', 'readwrite');
      tx.objectStore('data').put(record, `game:${id}`);
      tx.oncomplete = () => {
        resolve();
      };
    });
  }, patch);
}

async function savedGame(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const request = indexedDB.open('burgbau');
      request.onsuccess = () => {
        resolve(request.result);
      };
    });
    const get = (key: string) =>
      new Promise<unknown>((resolve) => {
        const request = db.transaction('data').objectStore('data').get(key);
        request.onsuccess = () => {
          resolve(request.result);
        };
      });
    const profiles = (await get('profiles')) as { profiles: { id: string }[] };
    const record = (await get(`game:${profiles.profiles[0]?.id ?? ''}`)) as { game: Record<string, unknown> };
    return record.game;
  });
}

test('unsymmetrische Teile lassen sich vor dem Setzen spiegeln', async ({ page }) => {
  await startGame(page);
  await page.getByRole('button', { name: 'Pause' }).click();
  await patchGame(page, { step: 'placing', pendingPiece: 'stairs', pendingFlipped: false });
  await page.reload();
  await page.locator('.profile-tile').first().click();
  await page.getByRole('button', { name: 'Weiterbauen' }).click();

  const mirror = page.getByRole('button', { name: 'Spiegeln' });
  await expect(mirror).toBeVisible();
  await mirror.click();
  await expect.poll(async () => (await savedGame(page))['pendingFlipped']).toBe(true);
  await placeAnywhere(page);
  await expect
    .poll(async () => ((await savedGame(page))['grid'] as { pieces: unknown[] }).pieces)
    .toContainEqual(expect.objectContaining({ piece: 'stairs', flipped: true }));
});

test('symmetrische Teile haben keinen Spiegeln-Knopf', async ({ page }) => {
  await startGame(page);
  await answer(page, true);
  await chooseOffer(page, (piece) => piece.id === 'wall' || piece.id === 'tower' || piece.id === 'gate');
  await expect(page.getByRole('button', { name: 'In den Speicher' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Spiegeln' })).toBeHidden();
});

for (const [width, height, list] of [
  [1024, 690, 'klasse-1-2'],
  [1024, 690, 'klasse-4'],
  [1280, 400, 'klasse-4'],
] as const) {
  test(`Tablet ${String(width)} × ${String(height)} (${list}): „Fertig“ ohne Scrollen sichtbar`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await startGame(page, 'Lena', list);
    const button = page.locator('.task-panel:visible .primary-button');
    await expect(button).toBeInViewport({ ratio: 1 });
    const scrolls = await page.locator('.overlay').evaluate((el) => el.scrollHeight > el.clientHeight);
    expect(scrolls).toBe(false);
  });
}
