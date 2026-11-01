import { expect, test, type Page } from '@playwright/test';
import { getPiece } from '../../src/data/pieces';
import type { PieceId } from '../../src/types';
import {
  answer,
  buildWithTiles,
  chooseOffer,
  currentWord,
  placeAnywhere,
  placeInEditing,
  startGame,
  tapCell,
  undoButton,
} from './helpers';

const submit = (page: Page) => page.getByRole('button', { name: 'Fertig' });

async function offerIds(page: Page): Promise<PieceId[]> {
  await expect(page.locator('.offer-card').first()).toBeVisible();
  return page.locator('.offer-card').evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset['piece'] as PieceId));
}

test.describe('Bausteine-Modus (Klasse 1/2)', () => {
  test.beforeEach(async ({ page }) => {
    await startGame(page);
    await expect(page.locator('.task-panel:visible')).toHaveAttribute('data-mode', 'tiles');
  });

  test('Endung und Pünktchen ergeben das richtige Wort', async ({ page }) => {
    await expect(submit(page)).toBeDisabled();
    await answer(page, true);
    await expect(page.locator('.offer-card').first()).toBeVisible();
  });

  test('alle Bausteine und Vokale sind mindestens 64 × 64 px groß', async ({ page }) => {
    for (const button of await page.locator('.task-panel:visible button:visible').all()) {
      const box = await button.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(64);
      expect(box?.height).toBeGreaterThanOrEqual(64);
    }
  });

  test('Endung lässt sich an das Wort ziehen', async ({ page }) => {
    const tile = page.locator('.ending-tile[data-ending="er"]');
    const slot = page.locator('.ending-slot');
    const from = await tile.boundingBox();
    const to = await slot.boundingBox();
    if (from === null || to === null) throw new Error('nicht sichtbar');
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
    await page.mouse.up();
    await expect(slot).toHaveText('-er');
    await expect(submit(page)).toBeEnabled();
  });
});

test('ohne nötige Pünktchen heißt es „Fast!“ (Klasse 3, viele Umlaute)', async ({ page }) => {
  test.setTimeout(90_000);
  await startGame(page, 'Lena', 'klasse-3');
  for (let i = 0; i < 12 && !(await currentWord(page)).umlaut; i++) {
    await answer(page, true);
    await chooseOffer(page, (piece) => piece.kind === 'block');
    await placeAnywhere(page);
    await page.getByRole('button', { name: 'Nächste Aufgabe' }).click();
  }
  const word = await currentWord(page);
  expect(word.umlaut).toBe(true);
  await buildWithTiles(page, null, word.pattern);
  await submit(page).click();
  await expect(page.getByText('Fast! Schau noch mal genau.')).toBeVisible();
});

test('ohne Stimmen gibt es keinen Vorlese-Knopf', async ({ page }) => {
  await page.addInitScript(() => {
    window.speechSynthesis.getVoices = () => [];
  });
  await startGame(page);
  await expect(page.locator('.word-card:visible')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Vorlesen' })).toBeHidden();
});

test('Vorlesen liest das Wort auf Deutsch vor', async ({ page }) => {
  await page.addInitScript(() => {
    const spoken: { text: string; lang: string }[] = [];
    (window as unknown as { spoken: typeof spoken }).spoken = spoken;
    window.speechSynthesis.speak = (u: SpeechSynthesisUtterance) => {
      spoken.push({ text: u.text, lang: u.lang });
    };
    // Headless-Chromium hat oft keine Stimmen: eine deutsche Stimme vortäuschen. Echte
    // Utterances nehmen nur echte Stimmen an, daher auch die Utterance ersetzen.
    window.speechSynthesis.getVoices = () => [{ lang: 'de-DE', name: 'Test' } as SpeechSynthesisVoice];
    class FakeUtterance {
      lang = '';
      rate = 1;
      voice: SpeechSynthesisVoice | null = null;
      constructor(public text: string) {}
    }
    (window as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance = FakeUtterance;
  });
  await startGame(page);
  const word = await currentWord(page);
  await page.getByRole('button', { name: 'Vorlesen' }).click();
  const spoken = await page.evaluate(() => (window as unknown as { spoken: { text: string; lang: string }[] }).spoken);
  expect(spoken).toEqual([{ text: `Wie heißt die Mehrzahl? ${word.article} ${word.singular}.`, lang: 'de-DE' }]);
});

test('Zwischenspeicher: ablegen, rückgängig, tauschen', async ({ page }) => {
  await startGame(page);
  await answer(page, false);
  const first = await chooseOffer(page, (piece) => piece.kind === 'block');
  await page.getByRole('button', { name: 'In den Speicher' }).click();
  await expect(page.locator('.stash-item')).toHaveCount(1);
  await expect(undoButton(page)).toBeVisible();

  await undoButton(page).click();
  await expect(page.locator('.stash-item')).toHaveCount(0);
  await page.getByRole('button', { name: 'In den Speicher' }).click();
  await page.getByRole('button', { name: 'Nächste Aufgabe' }).click();

  await answer(page, false);
  const second = await chooseOffer(page, (piece) => piece.id !== first.id);
  await page.locator('.stash-item').first().click();
  // Getauscht: jetzt liegt das zweite Teil im Speicher.
  await expect(page.locator('.stash-item').first()).toHaveAttribute('data-piece', second.id);
});

test('letzte Aufgaben: Dach im Angebot, danach Bearbeitungsmodus', async ({ page }) => {
  test.setTimeout(150_000);
  await startGame(page);
  for (let n = 0; n < 15; n++) {
    await answer(page, n % 3 !== 1);
    const offers = await offerIds(page);
    if (n >= 13) expect(offers.some((id) => getPiece(id).roof === true)).toBe(true);
    await chooseOffer(page, (piece) => piece.kind === 'block');
    if (n === 4) {
      await page.getByRole('button', { name: 'In den Speicher' }).click();
    } else if (n < 14) {
      await placeAnywhere(page);
    } else {
      await placeInEditing(page);
      continue;
    }
    await page.getByRole('button', { name: 'Nächste Aufgabe' }).click();
  }

  // Nach dem letzten Teil automatisch im Bearbeitungsmodus; fertig erst, wenn alles gesetzt ist.
  const done = page.getByRole('button', { name: 'Burg ist fertig' });
  await expect(page.getByText('Setz noch alle Teile aus dem Speicher', { exact: false })).toBeVisible();
  await expect(done).toBeDisabled();

  // Teil aufnehmen und wieder ablegen.
  await tapCell(page, { col: 0, row: 0 });
  await expect(page.getByText('Setz das Teil auf ein leuchtendes Feld', { exact: false })).toBeVisible();
  await expect(done).toBeDisabled();
  await page.getByRole('button', { name: 'In den Speicher' }).click();

  // Alles aus dem Speicher setzen, dann geht „fertig“.
  while ((await page.locator('.stash-item').count()) > 0) {
    await page.locator('.stash-item').first().click();
    await placeInEditing(page);
  }
  await expect(done).toBeEnabled();
  await done.click();
  await expect(page.getByText('Deine Burg ist fertig!')).toBeVisible();
});
