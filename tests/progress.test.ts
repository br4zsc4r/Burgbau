import { describe, expect, it } from 'vitest';
import { MAX_BOX, isPractice, updateBoxes } from '../src/logic/progress';
import { createPicker, pickWord } from '../src/logic/wordPicker';
import type { WordBoxes } from '../src/types';
import { seededRandom } from './helpers';

describe('Leitner-Fächer', () => {
  it('richtig → ein Fach höher, höchstens 4', () => {
    expect(updateBoxes({}, 'hund', true)).toEqual({ hund: 1 });
    expect(updateBoxes({ hund: 3 }, 'hund', true)).toEqual({ hund: 4 });
    expect(updateBoxes({ hund: MAX_BOX }, 'hund', true)).toEqual({ hund: 4 });
  });

  it('falsch → Fach 0', () => {
    expect(updateBoxes({ hund: 3 }, 'hund', false)).toEqual({ hund: 0 });
    expect(updateBoxes({}, 'hund', false)).toEqual({ hund: 0 });
  });

  it('Fach 0–2 gilt als zu üben, neue und sichere Wörter nicht', () => {
    expect(isPractice({ a: 0, b: 2, c: 3 }, 'a')).toBe(true);
    expect(isPractice({ a: 0, b: 2, c: 3 }, 'b')).toBe(true);
    expect(isPractice({ a: 0, b: 2, c: 3 }, 'c')).toBe(false);
    expect(isPractice({}, 'neu')).toBe(false);
  });
});

describe('Wortauswahl nach Lernfortschritt', () => {
  const ids = Array.from({ length: 20 }, (_, i) => `w${String(i)}`);
  // w0–w4 sind Problemwörter, w5–w9 sicher, der Rest neu.
  const boxes: WordBoxes = Object.fromEntries([
    ...ids.slice(0, 5).map((id): [string, number] => [id, 0]),
    ...ids.slice(5, 10).map((id): [string, number] => [id, 4]),
  ]);

  it('nimmt etwa 60 % der ersten Wörter aus den Problemwörtern', () => {
    let practice = 0;
    const runs = 500;
    for (let seed = 0; seed < runs; seed++) {
      const { wordId } = pickWord(createPicker(), ids, 1, seededRandom(seed), undefined, boxes);
      if (ids.slice(0, 5).includes(wordId)) practice++;
    }
    expect(practice / runs).toBeGreaterThan(0.5);
    expect(practice / runs).toBeLessThan(0.7);
  });

  it('ohne Fortschritt zählt jedes Wort gleich', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 300; seed++) seen.add(pickWord(createPicker(), ids, 1, seededRandom(seed)).wordId);
    expect(seen.size).toBe(ids.length);
  });
});
