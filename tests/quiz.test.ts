import { describe, expect, it } from 'vitest';
import { createQuiz, currentWordId, nextTask, submitAnswer } from '../src/logic/quiz';
import type { Settings } from '../src/types';
import { makeWord, seededRandom } from './helpers';

const settings: Settings = { requireCapitalization: false };
const hund = makeWord({ id: 'hund', singular: 'Hund', plural: ['Hunde'] });
const ids = ['hund', 'katze', 'auto'];

describe('quiz', () => {
  it('startet im ersten Versuch mit einer gemischten Reihenfolge aller Wörter', () => {
    const state = createQuiz(ids, seededRandom(3));
    expect([...state.order].sort()).toEqual([...ids].sort());
    expect(state).toMatchObject({ position: 0, attempt: 1, phase: 'answering', lastResult: null });
  });

  it('lehnt leere Wortlisten ab', () => {
    expect(() => createQuiz([], seededRandom(1))).toThrow();
  });

  it('wechselt nach richtiger Antwort ins Feedback', () => {
    const state = submitAnswer(createQuiz(['hund'], seededRandom(1)), hund, 'Hunde', settings);
    expect(state.phase).toBe('feedback');
    expect(state.lastResult?.status).toBe('correct');
  });

  it('erlaubt nach „fast“ genau einen zweiten Versuch', () => {
    let state = createQuiz(['hund'], seededRandom(1));
    state = submitAnswer(state, hund, 'Hunte', settings);
    expect(state).toMatchObject({ phase: 'answering', attempt: 2 });
    expect(state.lastResult).toEqual({ status: 'almost', reason: 'typo' });

    state = submitAnswer(state, hund, 'Hunte', settings);
    expect(state.phase).toBe('feedback');
    expect(state.lastResult).toEqual({ status: 'wrong', solution: 'Hunde' });
  });

  it('ignoriert Antworten während des Feedbacks', () => {
    const done = submitAnswer(createQuiz(['hund'], seededRandom(1)), hund, 'Hunde', settings);
    expect(submitAnswer(done, hund, 'Katzen', settings)).toBe(done);
  });

  it('geht zur nächsten Aufgabe und setzt den Versuch zurück', () => {
    let state = createQuiz(ids, seededRandom(5));
    state = { ...state, phase: 'feedback', attempt: 2 };
    const next = nextTask(state, seededRandom(5));
    expect(next).toMatchObject({ position: 1, attempt: 1, phase: 'answering', lastResult: null });
  });

  it('springt nur aus dem Feedback weiter', () => {
    const state = createQuiz(ids, seededRandom(5));
    expect(nextTask(state, seededRandom(5))).toBe(state);
  });

  it('mischt am Ende neu, ohne das letzte Wort direkt zu wiederholen', () => {
    for (let seed = 0; seed < 50; seed++) {
      const random = seededRandom(seed);
      let state = createQuiz(ids, random);
      state = { ...state, position: ids.length - 1, phase: 'feedback' };
      const last = currentWordId(state);
      const next = nextTask(state, random);
      expect(next.position).toBe(0);
      expect([...next.order].sort()).toEqual([...ids].sort());
      expect(currentWordId(next)).not.toBe(last);
    }
  });
});
