import type { PluralTask, Settings } from '../../types';
import { checkAnswer } from '../plural';
import { canUseTiles } from '../tiles';
import type { WordPool } from '../wordlists';
import type { ExerciseLogic } from './exercise';
import { taskId } from './taskId';

/**
 * Aufgaben der Mehrzahl aus dem Wort-Topf der eingeschalteten Listen. Bausteine nur, wenn
 * die Liste (oder die Lehrkraft) sie vorsieht und sich das Wort damit bauen lässt.
 */
export function pluralTasks(pool: WordPool, settings: Settings): PluralTask[] {
  return pool.words.map((word) => {
    const mode = settings.inputMode === 'list' ? pool.inputModes[word.id] : settings.inputMode;
    return {
      exercise: 'plural',
      id: taskId('plural', word.id),
      word,
      inputMode: mode === 'tiles' && canUseTiles(word) ? 'tiles' : 'keyboard',
    };
  });
}

export const pluralExercise: ExerciseLogic<PluralTask> = {
  check: (task, input, settings, attempt) => checkAnswer(input, task.word, settings, attempt),
};
