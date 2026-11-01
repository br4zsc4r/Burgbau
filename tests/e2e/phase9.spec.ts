import { expect, test, type Page } from '@playwright/test';
import { chooseExercise, createProfile, openTeacher, setSettings } from './helpers';

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
  await expect(page.getByRole('img', { name: '1 von 15 Aufgaben geschafft' })).toBeVisible();
});

/** Die aktuelle 1×1-Aufgabe aus der Anzeige lesen. */
async function currentProduct(page: Page): Promise<{ factor: number; row: number }> {
  const label = (await page.locator('.equation').getAttribute('aria-label')) ?? '';
  const match = /^(\d+) mal (\d+)$/.exec(label);
  if (match === null) throw new Error(`Unbekannte Aufgabe: ${label}`);
  return { factor: Number(match[1]), row: Number(match[2]) };
}

async function tapNumber(page: Page, value: number): Promise<void> {
  for (const digit of String(value)) {
    await page.locator('.numpad').getByRole('button', { name: digit, exact: true }).click();
  }
}

test('Neue Burg: Kind wählt das kleine 1×1 und rechnet mit dem Ziffernfeld', async ({ page }) => {
  await page.goto('/');
  await createProfile(page, 'Lena');
  await page.getByRole('button', { name: 'Neue Burg bauen' }).click();
  await expect(page.getByRole('heading', { name: 'Was möchtest du üben?' })).toBeVisible();
  await chooseExercise(page, 'Kleines 1×1');

  const { factor, row } = await currentProduct(page);
  await expect(page.locator('.equation-answer')).toHaveText('?');
  await tapNumber(page, 9);
  await page.getByRole('button', { name: 'Löschen' }).click();
  await tapNumber(page, factor * row);
  await expect(page.locator('.equation-answer')).toHaveText(String(factor * row));
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.getByText('Richtig!')).toBeVisible();
  await page.getByRole('button', { name: 'Weiter' }).click();
  await expect(page.locator('.offer-card')).toHaveCount(3);
});

test('falsche 1×1-Antwort zeigt die Lösung, am PC geht auch die Tastatur', async ({ page }) => {
  await setSettings(page, { freeExercises: ['multiplication'] });
  await createProfile(page, 'Lena');
  // Nur eine Spielart frei: keine Auswahl, es geht direkt los.
  await page.getByRole('button', { name: 'Neue Burg bauen' }).click();
  const { factor, row } = await currentProduct(page);
  const wrong = factor * row === 1 ? 2 : 1;
  await page.keyboard.type(String(wrong));
  await page.keyboard.press('Enter');
  await expect(page.locator('.solution')).toHaveText(`${String(factor)} · ${String(row)} = ${String(factor * row)}`);
});

test('Lehrkraft schaltet Reihen aus: es kommt nur noch die 7er-Reihe', async ({ page }) => {
  await setSettings(page, { freeExercises: ['multiplication'], multiplicationRows: [7] });
  await createProfile(page, 'Lena');
  await page.getByRole('button', { name: 'Neue Burg bauen' }).click();
  expect((await currentProduct(page)).row).toBe(7);
});

test('Lehrkraft: Spielarten und Reihen ein- und ausschalten', async ({ page }) => {
  await page.goto('/');
  await openTeacher(page);
  await page.getByRole('checkbox', { name: 'Mehrzahl' }).uncheck();
  await page.getByRole('button', { name: '3er-Reihe' }).click();
  await expect(page.getByRole('button', { name: '3er-Reihe' })).toHaveAttribute('aria-pressed', 'false');
  // Die letzte Spielart bleibt an.
  await page.getByRole('checkbox', { name: 'Kleines 1×1' }).click();
  await expect(page.getByRole('checkbox', { name: 'Kleines 1×1' })).toBeChecked();
  await page.getByRole('button', { name: 'Fertig' }).click();
  await createProfile(page, 'Lena');
  await page.getByRole('button', { name: 'Neue Burg bauen' }).click();
  await expect(page.locator('.equation')).toBeVisible();
});

test('Tablet 1024 × 690: 1×1 mit Ziffernfeld passt ohne Scrollen', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 690 });
  await setSettings(page, { freeExercises: ['multiplication'] });
  await createProfile(page, 'Lena');
  await page.getByRole('button', { name: 'Neue Burg bauen' }).click();
  await expect(page.locator('.task-panel:visible .primary-button')).toBeInViewport({ ratio: 1 });
  expect(await page.locator('.overlay').evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(false);
});
