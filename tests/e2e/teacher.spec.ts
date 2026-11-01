import { expect, test, type Page } from '@playwright/test';
import { createProfile, setSettings, startGame } from './helpers';

const PIN = '2468';

/** Zahnrad antippen und PIN eingeben (beim ersten Mal festlegen). */
async function openTeacher(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Einstellungen für Lehrkräfte' }).click();
  // Der Dialog öffnet erst, wenn der gespeicherte PIN-Hash geladen ist.
  await expect(page.locator('.teacher-gate')).toBeVisible();
  if (await page.getByRole('heading', { name: 'PIN festlegen' }).isVisible()) {
    await page.getByLabel('Neue PIN').fill(PIN);
    await page.getByLabel('PIN wiederholen').fill(PIN);
  } else {
    await page.getByLabel('PIN eingeben').fill(PIN);
  }
  await page.getByRole('button', { name: 'Öffnen' }).click();
  await expect(page.getByRole('heading', { name: 'Einstellungen für Lehrkräfte' })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('PIN: beim ersten Mal festlegen, danach nur mit richtiger PIN', async ({ page }) => {
  await page.getByRole('button', { name: 'Einstellungen für Lehrkräfte' }).click();
  await expect(page.getByRole('heading', { name: 'PIN festlegen' })).toBeVisible();
  await page.getByLabel('Neue PIN').fill('12');
  await page.getByLabel('PIN wiederholen').fill('12');
  await page.getByRole('button', { name: 'Öffnen' }).click();
  await expect(page.getByText('4 bis 8 Ziffern', { exact: false }).last()).toBeVisible();
  await page.getByLabel('Neue PIN').fill(PIN);
  await page.getByLabel('PIN wiederholen').fill('1357');
  await page.getByRole('button', { name: 'Öffnen' }).click();
  await expect(page.getByText('stimmen nicht überein', { exact: false })).toBeVisible();
  await page.getByLabel('PIN wiederholen').fill(PIN);
  await page.getByRole('button', { name: 'Öffnen' }).click();
  await expect(page.getByRole('heading', { name: 'Einstellungen für Lehrkräfte' })).toBeVisible();
  await page.getByRole('button', { name: 'Fertig' }).click();

  await page.getByRole('button', { name: 'Einstellungen für Lehrkräfte' }).click();
  await page.getByLabel('PIN eingeben').fill('0000');
  await page.getByRole('button', { name: 'Öffnen' }).click();
  await expect(page.getByText('Falsche PIN.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Einstellungen für Lehrkräfte' })).toBeHidden();
  await page.getByLabel('PIN eingeben').fill(PIN);
  await page.getByRole('button', { name: 'Öffnen' }).click();
  await expect(page.getByRole('heading', { name: 'Einstellungen für Lehrkräfte' })).toBeVisible();
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

test('eigene Wortliste per CSV importieren und einschalten: gilt für alle Kinder', async ({ page }) => {
  await openTeacher(page);
  await page.getByLabel('Klasse anlegen').fill('Lena');
  await page.getByRole('button', { name: 'Profile anlegen' }).click();

  await page.getByLabel(/CSV-Datei/).setInputFiles('tests/e2e/fixtures/tiere.csv');
  await expect(page.getByText('2 Wörter erkannt.')).toBeVisible();
  await expect(page.getByText('Zeile 4: Artikel muss der, die oder das sein')).toBeVisible();
  await page.getByRole('button', { name: 'Als neue Liste übernehmen' }).click();
  await page.getByLabel('tiere einschalten').check();
  await page.getByLabel('Klasse 1/2 – Grundwortschatz einschalten').uncheck();
  await page.getByRole('button', { name: 'Fertig' }).click();

  await page.getByRole('button', { name: /Lena/ }).click();
  await page.getByRole('button', { name: 'Neue Burg bauen' }).click();
  await expect(page.locator('.singular')).toHaveText(/^der (Igel|Wal)$/);
});

test('die letzte eingeschaltete Liste lässt sich nicht ausschalten', async ({ page }) => {
  await openTeacher(page);
  const k12 = page.getByLabel('Klasse 1/2 – Grundwortschatz einschalten');
  await expect(k12).toBeChecked();
  await k12.click();
  await expect(k12).toBeChecked();
});

test('Liste bearbeiten: Wort ändern, hinzufügen, Fehler markieren, Original wiederherstellen', async ({ page }) => {
  await openTeacher(page);
  const k12 = page.locator('.list-row', { hasText: 'Klasse 1/2' });
  await expect(k12).toContainText('61 Wörter, 61 ungeprüft');
  await k12.getByRole('button', { name: 'Bearbeiten' }).click();

  // Erste Zeile ist „der Hund“: als geprüft markieren.
  const first = page.locator('.editor-row').first();
  await expect(first.getByLabel('Einzahl')).toHaveValue('Hund');
  await first.getByLabel('geprüft').check();

  await page.getByRole('button', { name: 'Wort hinzufügen' }).click();
  const added = page.locator('.editor-row').last();
  await added.getByLabel('Einzahl').fill('Wal');
  await page.getByRole('button', { name: 'Speichern' }).first().click();
  await expect(page.getByText('Bitte die markierten Zeilen korrigieren.').first()).toBeVisible();
  await expect(added).toHaveClass(/has-error/);

  await added.getByLabel('Mehrzahl', { exact: false }).fill('Wale');
  await page.getByRole('button', { name: 'Speichern' }).first().click();
  const edited = page.locator('.list-row', { hasText: 'Klasse 1/2' });
  // „Hund“ ist jetzt geprüft, „Wal“ wurde von der Lehrkraft eingetragen.
  await expect(edited).toContainText('62 Wörter, 60 ungeprüft');
  await expect(edited).toContainText('bearbeitet');

  await edited.getByRole('button', { name: 'Original wiederherstellen' }).click();
  await edited.getByRole('button', { name: 'Ja, löschen' }).click();
  await expect(page.locator('.list-row', { hasText: 'Klasse 1/2' })).toContainText('61 Wörter, 61 ungeprüft');
});

test('neue Liste anlegen und mehrere Listen gemeinsam nutzen', async ({ page }) => {
  await openTeacher(page);
  await page.getByRole('button', { name: 'Neue Liste', exact: true }).click();
  await page.getByLabel('Name der Liste').fill('Meer');
  await page.getByRole('button', { name: 'Wort hinzufügen' }).click();
  const row = page.locator('.editor-row').last();
  await row.getByLabel('Artikel').selectOption('der');
  await row.getByLabel('Einzahl').fill('Krake');
  await row.getByLabel('Mehrzahl', { exact: false }).fill('Kraken');
  await page.getByRole('button', { name: 'Speichern' }).first().click();
  await page.getByLabel('Meer einschalten').check();
  await page.getByRole('button', { name: 'Fertig' }).click();

  // Klasse 1/2 bleibt an, „Meer“ kommt dazu: beide Listen zusammen im Topf.
  await createProfile(page, 'Lena');
  await page.getByRole('button', { name: 'Neue Burg bauen' }).click();
  await expect(page.locator('.task-panel')).toBeVisible();
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
