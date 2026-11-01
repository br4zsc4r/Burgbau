import type { QuizState, Settings, Word } from '../types';
import { checkAnswer } from './plural';

export function startTask(wordId: string): QuizState {
  return { wordId, attempt: 1, phase: 'answering', lastResult: null };
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
