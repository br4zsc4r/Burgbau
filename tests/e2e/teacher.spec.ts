import { expect, test, type Page } from '@playwright/test';
import { createProfile, setSettings, startGame } from './helpers';

/** Zahnrad 3 Sekunden halten und die Rechenaufgabe lösen. */
async function openTeacher(page: Page): Promise<void> {
  const gear = page.getByRole('button', { name: /Einstellungen für Lehrkräfte/ });
  const box = await gear.boundingBox();
  if (box === null) throw new Error('Zahnrad nicht sichtbar');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(3200);
  await page.mouse.up();
  const task = (await page.locator('.gate-task').textContent()) ?? '';
  const [a, b] = (task.match(/\d+/g) ?? []).map(Number);
  await page.getByLabel(task).fill(String((a ?? 0) * (b ?? 0)));
  await page.getByRole('button', { name: 'Öffnen' }).click();
  await expect(page.getByRole('heading', { name: 'Einstellungen für Lehrkräfte' })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('kurzes Antippen des Zahnrads öffnet nichts, eine falsche Rechnung auch nicht', async ({ page }) => {
  await page.getByRole('button', { name: /Einstellungen für Lehrkräfte/ }).click();
  await expect(page.locator('.teacher-gate')).toBeHidden();

  const gear = page.getByRole('button', { name: /Einstellungen für Lehrkräfte/ });
  const box = await gear.boundingBox();
  if (box === null) throw new Error('Zahnrad nicht sichtbar');
  await page.mouse.move(box.x + 10, box.y + 10);
  await page.mouse.down();
  await page.waitForTimeout(3200);
  await page.mouse.up();
  const task = (await page.locator('.gate-task').textContent()) ?? '';
  await page.getByLabel(task).fill('1');
  await page.getByRole('button', { name: 'Öffnen' }).click();
  await expect(page.getByText('Leider falsch', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Einstellungen für Lehrkräfte' })).toBeHidden();
});

test('Klasse anlegen: Profile erscheinen auf dem Startbildschirm', async ({ page }) => {
  await openTeacher(page);
  await page.getByLabel('Klasse anlegen').fill('Lena\nMax\n\nAli');
  await page.getByRole('button', { name: 'Profile anlegen' }).click();
  await expect(page.getByText('3 Profile angelegt.')).toBeVisible();
  await page.getByRole('button', { name: 'Fertig' }).click();
  for (const name of ['Lena', 'Max', 'Ali']) {
    await expect(page.getByRole('button', { name: new RegExp(name) })).toBeVisible();
  }
});

test('Einstellungen wirken: Tastatur statt Bausteine, „Ich bin neu“ aus, „Alle Burgen“ aus', async ({ page }) => {
  await openTeacher(page);
  await page.getByLabel('Eingabemodus').selectOption('keyboard');
  await page.getByLabel('Klasse anlegen').fill('Lena');
  await page.getByRole('button', { name: 'Profile anlegen' }).click();
  await page.getByText('Kinder dürfen selbst Profile anlegen', { exact: false }).click();
  await page.getByText('Button „Alle Burgen“', { exact: false }).click();
  await page.getByRole('button', { name: 'Fertig' }).click();

  await expect(page.getByRole('button', { name: 'Ich bin neu' })).toBeHidden();
  await page.getByRole('button', { name: /Lena/ }).click();
  await page.getByRole('button', { name: 'Meine Burgen' }).click();
  await expect(page.getByRole('button', { name: 'Alle Burgen' })).toBeHidden();
  await page.getByRole('button', { name: 'Zurück' }).click();
  await page.getByRole('button', { name: 'Neue Burg bauen' }).click();
  await expect(page.locator('.task-panel')).toHaveAttribute('data-mode', 'keyboard');
});

test('eigene Wortliste per CSV importieren und einem Kind zuweisen', async ({ page }) => {
  await openTeacher(page);
  await page.getByLabel('Klasse anlegen').fill('Lena');
  await page.getByRole('button', { name: 'Profile anlegen' }).click();

  await page.getByLabel('Name der Liste').fill('Tiere');
  await page.getByLabel(/CSV-Datei/).setInputFiles('tests/e2e/fixtures/tiere.csv');
  await expect(page.getByText('2 Wörter erkannt.')).toBeVisible();
  await expect(page.getByText('Zeile 4: Artikel muss der, die oder das sein')).toBeVisible();
  await page.getByRole('button', { name: 'Liste importieren' }).click();
  await expect(page.getByText('Tiere · 2 Wörter')).toBeVisible();

  await page.locator('.teacher-profile').getByLabel('Wortliste').selectOption({ label: 'Tiere' });
  await page.getByRole('button', { name: 'Fertig' }).click();
  await page.getByRole('button', { name: /Lena/ }).click();
  await page.getByRole('button', { name: 'Neue Burg bauen' }).click();
  await expect(page.locator('.singular')).toHaveText(/^der (Igel|Wal)$/);
});

test('Bild-Code: Kind wählt zwei Bilder und braucht sie beim nächsten Mal', async ({ page }) => {
  await setSettings(page, { pictureCode: true });
  // Mit Bild-Code geht es nach dem Anlegen erst zur Code-Wahl (nicht direkt zu „Hallo Lena!“).
  await page.getByRole('button', { name: 'Ich bin neu' }).click();
  await page.locator('.symbol-option').first().click();
  await page.getByLabel('Wie heißt du?').fill('Lena');
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.getByRole('heading', { name: 'Such dir deinen Geheim-Code aus', exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Bild Baum' }).click();
  await page.getByRole('button', { name: 'Bild Fackel' }).click();
  await page.getByRole('button', { name: 'Das ist mein Code' }).click();
  await expect(page.getByRole('heading', { name: 'Hallo Lena!' })).toBeVisible();

  await page.getByRole('button', { name: 'Anderes Kind' }).click();
  await page.getByRole('button', { name: /Lena/ }).click();
  await page.getByRole('button', { name: 'Bild Fackel' }).click();
  await page.getByRole('button', { name: 'Bild Baum' }).click();
  await expect(page.getByText('Das war nicht dein Code.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Bild Baum' }).click();
  await page.getByRole('button', { name: 'Bild Fackel' }).click();
  await expect(page.getByRole('heading', { name: 'Hallo Lena!' })).toBeVisible();
});

test('20 Aufgaben: größeres Raster (14 × 9) und 20 Fortschrittspunkte', async ({ page }) => {
  await setSettings(page, { tasksPerCastle: 20 });
  await createProfile(page, 'Lena');
  await page.getByRole('button', { name: 'Neue Burg bauen' }).click();
  await expect(page.locator('.progress-dot')).toHaveCount(20);
  const box = await page.locator('canvas').boundingBox();
  // Welt 14 × 96 + 48 = 1392 breit, 144 + 9 × 96 + 72 = 1080 hoch.
  expect((box?.width ?? 0) / (box?.height ?? 1)).toBeCloseTo(1392 / 1080, 1);
});

test('Alles zurücksetzen löscht Profile', async ({ page }) => {
  await startGame(page);
  await page.getByRole('button', { name: 'Pause' }).click();
  await page.getByRole('button', { name: 'Anderes Kind' }).click();
  await openTeacher(page);
  await page.getByRole('button', { name: 'Alles zurücksetzen' }).click();
  await page.getByRole('button', { name: 'Ja, alles löschen' }).click();
  await expect(page.getByRole('heading', { name: 'Wer spielt?' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Lena/ })).toBeHidden();
});

test('offline: nach dem ersten Laden startet die App ohne Netz', async ({ page, context }) => {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // Warten, bis der Service Worker die Seite steuert.
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, { timeout: 15_000 }).catch(
    async () => {
      await page.reload();
      await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    },
  );
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Wer spielt?' })).toBeVisible();
  await createProfile(page, 'Lena');
  await page.getByRole('button', { name: 'Neue Burg bauen' }).click();
  await expect(page.locator('canvas')).toBeVisible();
  await context.setOffline(false);
});
