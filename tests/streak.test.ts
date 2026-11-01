import { describe, expect, it } from 'vitest';
import { updateStreak } from '../src/logic/streak';

describe('updateStreak', () => {
  it('zählt richtige Antworten hoch', () => {
    expect(updateStreak(0, true)).toBe(1);
    expect(updateStreak(9, true)).toBe(10);
  });

  it.each([
    [0, 0],
    [1, 0],
    [2, 1],
    [5, 2],
    [10, 5],
    [11, 5],
  ])('halbiert %i bei falscher Antwort auf %i', (streak, expected) => {
    expect(updateStreak(streak, false)).toBe(expected);
  });
});
