import { expect, test } from '@playwright/test';
import { createProfile } from './helpers';

test('eine laufende Burg aus der Zeit vor den Spielarten lässt sich weiterbauen', async ({ page }) => {
  await page.goto('/');
  await createProfile(page, 'Lena');
  // Spielstand im Format vor Phase 9a (Version 3: Wort-IDs ohne Präfix) und alter Lernstand.
  await page.evaluate(async () => {
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
    const game = {
      tasksTotal: 15,
      taskNumber: 2,
      quiz: { wordId: 'hund', attempt: 1, phase: 'answering', lastResult: null },
      picker: { used: ['katze', 'hund'], retries: [] },
      streak: 1,
      offers: [],
      pendingPiece: null,
      pendingFlipped: false,
      grid: { cols: 12, rows: 8, pieces: [{ piece: 'tower', col: 3, row: 0 }], attachments: [] },
      step: 'task',
      lastPlacement: null,
      stash: [],
      boxes: { katze: 1 },
    };
    await new Promise<void>((resolve) => {
      const tx = db.transaction('data', 'readwrite');
      tx.objectStore('data').put({ version: 3, game }, `game:${id}`);
      tx.objectStore('data').put({ version: 1, lists: { alle: { katze: 1 } } }, `progress:${id}`);
      tx.oncomplete = () => {
        resolve();
      };
    });
  });
  await page.reload();
  await page.locator('.profile-tile').first().click();
  await page.getByRole('button', { name: 'Weiterbauen' }).click();
  await expect(page.locator('.singular')).toHaveText('der Hund');
  await expect(page.getByRole('img', { name: '1 von 15 Wörtern geschafft' })).toBeVisible();
});
