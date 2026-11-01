import { describe, expect, it } from 'vitest';
import { startTask, submitAnswer } from '../src/logic/quiz';
import { makeWord, pluralTask, testSettings } from './helpers';

const hund = pluralTask(makeWord({ id: 'hund', singular: 'Hund', plural: ['Hunde'] }));

describe('quiz', () => {
  it('startet im ersten Versuch', () => {
    expect(startTask('plural:hund')).toEqual({
      taskId: 'plural:hund',
      attempt: 1,
      phase: 'answering',
      lastResult: null,
    });
  });

  it('wechselt nach richtiger Antwort ins Feedback', () => {
    const state = submitAnswer(startTask('plural:hund'), hund, 'Hunde', testSettings);
    expect(state.phase).toBe('feedback');
    expect(state.lastResult?.status).toBe('correct');
  });

  it('erlaubt nach „fast“ genau einen zweiten Versuch', () => {
    let state = submitAnswer(startTask('plural:hund'), hund, 'Hunte', testSettings);
    expect(state).toMatchObject({ phase: 'answering', attempt: 2 });
    expect(state.lastResult).toEqual({ status: 'almost', reason: 'typo' });

    state = submitAnswer(state, hund, 'Hunte', testSettings);
    expect(state.phase).toBe('feedback');
    expect(state.lastResult).toEqual({ status: 'wrong', solution: 'Hunde' });
  });

  it('ignoriert Antworten während des Feedbacks', () => {
    const done = submitAnswer(startTask('plural:hund'), hund, 'Hunde', testSettings);
    expect(submitAnswer(done, hund, 'Katzen', testSettings)).toBe(done);
  });
});
