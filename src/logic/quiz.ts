import type { QuizState, RandomFn, Settings, Word } from '../types';
import { checkAnswer } from './plural';
import { shuffle } from './random';

function newOrder(wordIds: readonly string[], random: RandomFn, avoidFirst?: string): string[] {
  const order = shuffle(wordIds, random);
  // Kein Wort direkt zweimal hintereinander beim Übergang in eine neue Runde.
  const [first, second] = order;
  if (first !== undefined && first === avoidFirst && second !== undefined) {
    order[0] = second;
    order[1] = first;
  }
  return order;
}

export function createQuiz(wordIds: readonly string[], random: RandomFn): QuizState {
  if (wordIds.length === 0) throw new Error('Quiz braucht mindestens ein Wort');
  return {
    order: newOrder(wordIds, random),
    position: 0,
    attempt: 1,
    phase: 'answering',
    lastResult: null,
  };
}

export function currentWordId(state: QuizState): string {
  const id = state.order[state.position];
  if (id === undefined) throw new Error('Quiz-Position außerhalb der Reihenfolge');
  return id;
}

/** Wertet eine Antwort aus. „Fast“ bleibt in derselben Aufgabe mit zweitem Versuch. */
export function submitAnswer(
  state: QuizState,
  word: Word,
  input: string,
  settings: Settings,
): QuizState {
  if (state.phase !== 'answering') return state;
  const result = checkAnswer(input, word, settings, state.attempt);
  if (result.status === 'almost') {
    return { ...state, attempt: 2, lastResult: result };
  }
  return { ...state, phase: 'feedback', lastResult: result };
}

/** Nächste Aufgabe; nach dem letzten Wort beginnt eine neu gemischte Runde. */
export function nextTask(state: QuizState, random: RandomFn): QuizState {
  if (state.phase !== 'feedback') return state;
  const base = { attempt: 1 as const, phase: 'answering' as const, lastResult: null };
  if (state.position + 1 < state.order.length) {
    return { ...state, ...base, position: state.position + 1 };
  }
  return { ...base, order: newOrder(state.order, random, currentWordId(state)), position: 0 };
}
