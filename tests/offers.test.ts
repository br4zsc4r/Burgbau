import { describe, expect, it } from 'vitest';
import { getPiece, isLarge, isStackable } from '../src/data/pieces';
import { ANIMATED_MIN_STREAK, offerCategories, offerPieces, type OfferOptions } from '../src/logic/offers';
import type { PieceCategory, PieceId } from '../src/types';
import { seededRandom } from './helpers';

const SEEDS = Array.from({ length: 300 }, (_, i) => i);

function offersFor(
  correct: boolean,
  streak: number,
  placeable?: (id: PieceId) => boolean,
  options?: OfferOptions,
) {
  return SEEDS.map((seed) => offerPieces(correct, streak, seededRandom(seed), placeable, options));
}

function categoriesOf(offers: PieceId[]): PieceCategory[] {
  return offers.map((id) => getPiece(id).category).sort();
}

describe('offerCategories', () => {
  it.each([
    [false, 0, ['damaged', 'damaged', 'damaged']],
    [false, 12, ['damaged', 'damaged', 'damaged']],
    [true, 1, ['basic', 'basic', 'basic']],
    [true, 2, ['basic', 'basic', 'basic']],
    [true, 3, ['basic', 'basic', 'decoration']],
    [true, 4, ['basic', 'basic', 'decoration']],
    [true, 5, ['basic', 'decoration', 'finish']],
    [true, 9, ['basic', 'decoration', 'finish']],
  ] as const)('richtig=%s, Serie %i → %o', (correct, streak, expected) => {
    expect([...offerCategories(correct, streak, seededRandom(1))].sort()).toEqual(expected);
  });

  it('Serie 10+: Premium, Grundbauteil und Dekoration oder Abschluss', () => {
    for (let seed = 0; seed < 20; seed++) {
      const result = offerCategories(true, 10 + seed, seededRandom(seed));
      expect(result).toContain('premium');
      expect(result).toContain('basic');
      expect(['decoration', 'finish']).toContain(result[2]);
    }
  });
});

describe('offerPieces', () => {
  const situations: [boolean, number][] = [
    [false, 0],
    [false, 7],
    [true, 1],
    [true, 3],
    [true, 6],
    [true, 10],
    [true, 15],
  ];

  it.each(situations)('richtig=%s, Serie %i: drei verschiedene Teile', (correct, streak) => {
    for (const offers of offersFor(correct, streak)) {
      expect(offers).toHaveLength(3);
      expect(new Set(offers).size).toBe(3);
    }
  });

  it.each(situations)('richtig=%s, Serie %i: immer ein Teil zum Weiterbauen', (correct, streak) => {
    for (const offers of offersFor(correct, streak)) {
      expect(offers.some((id) => isStackable(getPiece(id)))).toBe(true);
    }
  });

  it('falsche Antwort: nur beschädigte Teile', () => {
    for (const offers of offersFor(false, 8)) {
      expect(categoriesOf(offers)).toEqual(['damaged', 'damaged', 'damaged']);
    }
  });

  it('richtige Antwort: Umgebungsteile ersetzen ab und zu ein Grundbauteil', () => {
    const all = offersFor(true, 1);
    const withEnvironment = all.filter((offers) => categoriesOf(offers).includes('environment'));
    expect(withEnvironment.length).toBeGreaterThan(20);
    expect(withEnvironment.length).toBeLessThan(150);
    for (const offers of withEnvironment) {
      expect(categoriesOf(offers).filter((c) => c === 'environment')).toHaveLength(1);
    }
    for (const offers of offersFor(false, 1)) {
      expect(categoriesOf(offers)).not.toContain('environment');
    }
  });

  it('große Teile erscheinen ab und zu, höchstens eins je Angebot', () => {
    const all = offersFor(true, 6);
    const withLarge = all.filter((offers) => offers.some((id) => isLarge(getPiece(id))));
    expect(withLarge.length).toBeGreaterThan(50);
    expect(withLarge.length).toBeLessThan(200);
    for (const offers of all) {
      expect(offers.filter((id) => isLarge(getPiece(id))).length).toBeLessThanOrEqual(1);
    }
  });

  it('richtet die Größe nach der Serie: 2 × 2 erst ab Serie 5', () => {
    const big = (offers: PieceId[]) =>
      offers.some((id) => getPiece(id).width === 2 && getPiece(id).height === 2);
    expect(offersFor(true, 1).some(big)).toBe(false);
    expect(offersFor(true, 4).some(big)).toBe(false);
    expect(offersFor(true, 5).some(big)).toBe(true);
    expect(offersFor(false, 0).some((offers) => offers.some((id) => isLarge(getPiece(id))))).toBe(false);
    expect(offersFor(false, 2).some((offers) => offers.some((id) => isLarge(getPiece(id))))).toBe(true);
    expect(offersFor(false, 5).some((offers) => offers.includes('ruinWall'))).toBe(true);
  });

  it('bietet nur Teile an, die irgendwo hinpassen', () => {
    const noDecorations = (id: PieceId) => getPiece(id).kind !== 'attachment';
    for (const offers of offersFor(true, 6, noDecorations)) {
      expect(offers.every(noDecorations)).toBe(true);
      expect(offers).toHaveLength(3);
    }
    for (const offers of offersFor(false, 0, noDecorations)) {
      expect(offers.every(noDecorations)).toBe(true);
    }
  });

  it('verschenkt kein Premium-Teil als Ersatz', () => {
    const onlyBlocks = (id: PieceId) => getPiece(id).kind === 'block';
    for (const offers of offersFor(true, 6, onlyBlocks)) {
      expect(categoriesOf(offers)).not.toContain('premium');
    }
  });

  it('liefert weniger Teile, wenn kaum etwas passt', () => {
    expect(offerPieces(true, 1, seededRandom(1), (id) => id === 'tree')).toEqual(['tree']);
    expect(offerPieces(true, 1, seededRandom(1), () => false)).toEqual([]);
  });

  it('nutzt mit der Zeit alle kleinen beschädigten Teile', () => {
    const seen = new Set(offersFor(false, 0).flat());
    expect(seen.size).toBe(8);
  });

  it('ist mit gleicher Zufallsfolge deterministisch', () => {
    expect(offerPieces(true, 6, seededRandom(9))).toEqual(offerPieces(true, 6, seededRandom(9)));
  });

  it('bietet das stillgelegte Zinnen-Teil nie an', () => {
    for (const streak of [1, 6, 11]) {
      for (const offers of offersFor(true, streak)) expect(offers).not.toContain('battlements');
    }
  });

  it('animierte Teile erst ab Serie 12, dann immer eines', () => {
    const animated = (offers: PieceId[]) => offers.filter((id) => getPiece(id).animated === true);
    for (const offers of offersFor(true, ANIMATED_MIN_STREAK - 1)) expect(animated(offers)).toEqual([]);
    const all = offersFor(true, ANIMATED_MIN_STREAK);
    for (const offers of all) expect(animated(offers)).toHaveLength(1);
    expect(new Set(all.flatMap(animated)).size).toBe(4);
  });

  it('Dach-Garantie: immer ein Dach, ohne das letzte Teil zum Weiterbauen zu verdrängen', () => {
    for (const [correct, streak] of situations) {
      for (const offers of offersFor(correct, streak, undefined, { needsRoof: true })) {
        expect(offers.some((id) => getPiece(id).roof === true)).toBe(true);
        expect(offers.some((id) => isStackable(getPiece(id)))).toBe(true);
        if (!correct) expect(categoriesOf(offers)).toEqual(['damaged', 'damaged', 'damaged']);
      }
    }
  });
});
