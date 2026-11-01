import { describe, expect, it } from 'vitest';
import { createPicker, pickWord, scheduleRetry } from '../src/logic/wordPicker';
import { seededRandom } from './helpers';

const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

describe('wordPicker', () => {
  it('stellt kein Wort doppelt, solange die Liste reicht', () => {
    const random = seededRandom(4);
    let picker = createPicker();
    const picked: string[] = [];
    for (let task = 1; task <= ids.length; task++) {
      const result = pickWord(picker, ids, task, random);
      picked.push(result.wordId);
      picker = result.picker;
    }
    expect([...picked].sort()).toEqual(ids);
  });

  it('plant falsche Wörter 3–5 Aufgaben später ein', () => {
    for (let seed = 0; seed < 50; seed++) {
      const picker = scheduleRetry(createPicker(), 'a', 4, seededRandom(seed));
      const due = picker.retries[0]?.dueTask ?? 0;
      expect(due).toBeGreaterThanOrEqual(7);
      expect(due).toBeLessThanOrEqual(9);
    }
  });

  it('stellt ein fälliges Wort vor neuen Wörtern', () => {
    let picker = { used: ['a'], retries: [{ wordId: 'a', dueTask: 5 }] };
    const early = pickWord(picker, ids, 4, seededRandom(1));
    expect(early.wordId).not.toBe('a');

    picker = early.picker;
    const due = pickWord(picker, ids, 5, seededRandom(1));
    expect(due.wordId).toBe('a');
    expect(due.picker.retries).toEqual([]);
  });

  it('nimmt bei mehreren fälligen Wörtern das älteste zuerst', () => {
    const picker = {
      used: ['a', 'b'],
      retries: [
        { wordId: 'b', dueTask: 6 },
        { wordId: 'a', dueTask: 5 },
      ],
    };
    expect(pickWord(picker, ids, 6, seededRandom(1)).wordId).toBe('a');
  });

  it('wiederholt erst, wenn alle Wörter gestellt sind, und nie direkt hintereinander', () => {
    const picker = { used: ['a', 'b'], retries: [] };
    for (let seed = 0; seed < 50; seed++) {
      const result = pickWord(picker, ['a', 'b'], 3, seededRandom(seed), 'b');
      expect(result.wordId).toBe('a');
    }
  });

  it('kommt mit einer Liste aus einem einzigen Wort zurecht', () => {
    const picker = { used: ['a'], retries: [] };
    expect(pickWord(picker, ['a'], 2, seededRandom(1), 'a').wordId).toBe('a');
  });
});
