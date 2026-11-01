import type { QuizState, Settings, Task } from '../types';
import { checkTask } from './exercises/exercise';

export function startTask(taskId: string): QuizState {
  return { taskId, attempt: 1, phase: 'answering', lastResult: null };
}

/** Wertet eine Antwort aus. „Fast“ bleibt in derselben Aufgabe mit zweitem Versuch. */
export function submitAnswer(state: QuizState, task: Task, input: string, settings: Settings): QuizState {
  if (state.phase !== 'answering') return state;
  const result = checkTask(task, input, settings, state.attempt);
  if (result.status === 'almost') {
    return { ...state, attempt: 2, lastResult: result };
  }
  return { ...state, phase: 'feedback', lastResult: result };
}
