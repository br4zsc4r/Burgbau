import { describe, expect, it } from 'vitest';
import { levenshtein } from '../src/logic/levenshtein';

describe('levenshtein', () => {
  it.each([
    ['', '', 0],
    ['Hunde', 'Hunde', 0],
    ['Hunde', 'Hund', 1],
    ['Hunde', 'Hunden', 1],
    ['Hunde', 'Hunte', 1],
    ['Hände', 'Hande', 1],
    ['Kinder', 'Kindr', 1],
    ['Hunde', 'Katzen', 5],
    ['', 'Eier', 4],
  ])('%s ↔ %s = %i', (a, b, expected) => {
    expect(levenshtein(a, b)).toBe(expected);
    expect(levenshtein(b, a)).toBe(expected);
  });

  it('zählt Umlaute als ein Zeichen', () => {
    expect(levenshtein('Äpfel', 'Apfel')).toBe(1);
  });
});
