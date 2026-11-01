import type { ExerciseId, ExercisePack, GameSelection, Settings, Task, WordList } from '../types';
import { freeExercises } from './exercises/freePlay';
import { MULTIPLICATION_ROWS, multiplicationTasks } from './exercises/multiplication';
import { pluralTasks } from './exercises/plural';
import { EXERCISE_IDS } from './exercises/taskId';
import { activePool } from './wordlists';

/** Spielarten, die in einem Paket wirklich etwas beitragen. */
export function packExercises(pack: ExercisePack): ExerciseId[] {
  const { plural, multiplication } = pack.contents;
  const has: Record<ExerciseId, boolean> = {
    plural: (plural?.listIds.length ?? 0) > 0,
    multiplication: (multiplication?.rows.length ?? 0) > 0,
  };
  return EXERCISE_IDS.filter((exercise) => has[exercise]);
}

/**
 * Alle Aufgaben eines Pakets, gemischt aus seinen Spielarten. Gelöschte Wortlisten oder
 * unbekannte Reihen werden übergangen.
 */
export function packTasks(pack: ExercisePack, lists: readonly WordList[], settings: Settings): Task[] {
  const { plural, multiplication } = pack.contents;
  const tasks: Task[] = [];
  if (plural !== undefined) tasks.push(...pluralTasks(activePool(lists, plural.listIds), settings));
  if (multiplication !== undefined) {
    tasks.push(...multiplicationTasks(multiplication.rows.filter((row) => MULTIPLICATION_ROWS.includes(row))));
  }
  return tasks;
}

export type PackProblem = 'name' | 'empty';

/** Was an einem Paket noch fehlt: ein Name und mindestens eine Wortliste oder Reihe. */
export function packProblems(pack: ExercisePack): PackProblem[] {
  const problems: PackProblem[] = [];
  if (pack.name.trim() === '') problems.push('name');
  if (packExercises(pack).length === 0) problems.push('empty');
  return problems;
}

/** Paket anlegen oder ersetzen (gleiche ID). */
export function upsertPack(packs: readonly ExercisePack[], pack: ExercisePack): ExercisePack[] {
  const cleaned = { ...pack, name: pack.name.trim() };
  return packs.some((p) => p.id === pack.id)
    ? packs.map((p) => (p.id === pack.id ? cleaned : p))
    : [...packs, cleaned];
}

export function removePack(packs: readonly ExercisePack[], id: string): ExercisePack[] {
  return packs.filter((pack) => pack.id !== id);
}

/** Gelöschte Wortlisten aus allen Paketen entfernen. */
export function withoutMissingLists(packs: readonly ExercisePack[], listIds: readonly string[]): ExercisePack[] {
  return packs.map((pack) => {
    const plural = pack.contents.plural;
    if (plural === undefined || plural.listIds.every((id) => listIds.includes(id))) return pack;
    return { ...pack, contents: { ...pack.contents, plural: { listIds: plural.listIds.filter((id) => listIds.includes(id)) } } };
  });
}

/**
 * Was ein Kind bei „Neue Burg bauen“ wählen kann: erst die Übungspakete (nur solche mit
 * Aufgaben), dann – wenn erlaubt – die Spielarten des freien Spiels.
 */
export function startOptions(
  settings: Settings,
  packs: readonly ExercisePack[],
  hasTasks: (pack: ExercisePack) => boolean,
): GameSelection[] {
  const fromPacks = packs.filter(hasTasks).map((pack): GameSelection => ({ kind: 'pack', packId: pack.id }));
  const free = settings.freePlay
    ? freeExercises(settings).map((exercise): GameSelection => ({ kind: 'free', exercise }))
    : [];
  return [...fromPacks, ...free];
}
