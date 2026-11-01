import { describe, expect, it } from 'vitest';
import { getPiece } from '../src/data/pieces';
import { offerCategories, offerPieces } from '../src/logic/offers';
import type { PieceCategory } from '../src/types';
import { seededRandom } from './helpers';

function categories(correct: boolean, streak: number, seed: number): PieceCategory[] {
  return offerPieces(correct, streak, seededRandom(seed))
    .map((id) => getPiece(id).category)
    .sort();
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

  it('liefert passende Kategorien', () => {
    expect(categories(true, 1, 1)).toEqual(['basic', 'basic', 'basic']);
    expect(categories(true, 6, 1)).toEqual(['basic', 'decoration', 'finish']);
    expect(categories(false, 6, 1)).toEqual(['damaged', 'damaged', 'damaged']);
  });

  it.each(situations)('richtig=%s, Serie %i: drei verschiedene Teile', (correct, streak) => {
    for (let seed = 0; seed < 200; seed++) {
      const offers = offerPieces(correct, streak, seededRandom(seed));
      expect(offers).toHaveLength(3);
      expect(new Set(offers).size).toBe(3);
    }
  });

  it.each(situations)('richtig=%s, Serie %i: immer ein stapelbares Teil', (correct, streak) => {
    for (let seed = 0; seed < 200; seed++) {
      const offers = offerPieces(correct, streak, seededRandom(seed));
      expect(offers.some((id) => getPiece(id).stackable)).toBe(true);
    }
  });

  it('nutzt mit der Zeit alle beschädigten Teile', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 200; seed++) {
      for (const id of offerPieces(false, 0, seededRandom(seed))) seen.add(id);
    }
    expect(seen.size).toBe(8);
  });

  it('ist mit gleicher Zufallsfolge deterministisch', () => {
    expect(offerPieces(true, 6, seededRandom(9))).toEqual(offerPieces(true, 6, seededRandom(9)));
  });
});
