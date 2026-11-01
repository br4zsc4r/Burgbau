import { describe, expect, it } from 'vitest';
import { shuffle } from '../src/logic/random';
import { seededRandom } from './helpers';

describe('shuffle', () => {
  it('enthält dieselben Elemente', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(shuffle(items, seededRandom(1)).sort((a, b) => a - b)).toEqual(items);
  });

  it('verändert das Original nicht', () => {
    const items = [1, 2, 3];
    shuffle(items, seededRandom(1));
    expect(items).toEqual([1, 2, 3]);
  });

  it('ist mit gleicher Zufallsfolge deterministisch', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    expect(shuffle(items, seededRandom(42))).toEqual(shuffle(items, seededRandom(42)));
  });

  it('kommt mit Zufallswerten nahe 1 zurecht', () => {
    expect(shuffle([1, 2, 3], () => 0.999999).sort()).toEqual([1, 2, 3]);
  });
});
