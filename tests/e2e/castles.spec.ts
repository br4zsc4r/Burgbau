import { expect, test } from '@playwright/test';
import { buildWholeCastle, chooseExercise, createProfile, setSettings } from './helpers';

test('zwei Burgen hintereinander lassen sich speichern (ohne Neuladen)', async ({ page }) => {
  // Zwei ganze Burgen: unter der Last der ganzen Suite braucht das seine Zeit.
  test.setTimeout(300_000);
  await setSettings(page, { tasksPerCastle: 10 });
  await createProfile(page, 'Lena');
  for (const name of ['Erste Burg', 'Zweite Burg']) {
    await page.getByRole('button', { name: 'Neue Burg bauen' }).click();
    await chooseExercise(page);
    await buildWholeCastle(page, 10);
    await page.getByRole('button', { name: 'Burg ist fertig' }).click();
    await page.getByLabel('Wie soll deine Burg heißen?').fill(name);
    await page.getByRole('button', { name: 'In die Sammlung' }).click();
    await expect(page.getByRole('heading', { name: 'Meine Burgen' })).toBeVisible();
    await page.getByRole('button', { name: 'Zurück' }).click();
  }
  await page.getByRole('button', { name: 'Meine Burgen' }).click();
  await expect(page.locator('.castle-card')).toHaveCount(2);
});
