import { MULTIPLICATION_ROWS } from '../logic/exercises/multiplication';
import { EXERCISE_IDS, isExerciseId } from '../logic/exercises/taskId';
import type { InputModeSetting, Settings, TasksPerCastle } from '../types';
import { isRecord } from './validate';

/** Diese Liste ist an, solange nichts anderes eingestellt ist. */
export const DEFAULT_LIST_ID = 'klasse-1-2';

export const defaultSettings: Settings = {
  activeListIds: [DEFAULT_LIST_ID],
  inputMode: 'list',
  requireCapitalization: false,
  readAloud: true,
  sound: true,
  freePlay: true,
  freeExercises: [...EXERCISE_IDS],
  multiplicationRows: [...MULTIPLICATION_ROWS],
  tasksPerCastle: 15,
  allowSelfRegistration: true,
  pictureCode: false,
  showAllCastles: true,
};

export const TASK_COUNTS: readonly TasksPerCastle[] = [10, 15, 20, 25, 30];
const INPUT_MODES: readonly InputModeSetting[] = ['list', 'tiles', 'keyboard'];

/** Nicht leere Liste, in der jeder Eintrag gültig ist (doppelte entfallen); sonst null. */
function nonEmpty<T>(value: unknown, valid: (item: unknown) => item is T): T[] | null {
  if (!Array.isArray(value) || value.length === 0 || !value.every(valid)) return null;
  return [...new Set(value)];
}

/** Gespeicherte Einstellungen lesen; Unbekanntes oder Kaputtes fällt auf den Standard zurück. */
export function parseSettings(value: unknown): Settings {
  if (!isRecord(value)) return defaultSettings;
  const bool = (key: keyof Settings): boolean =>
    typeof value[key] === 'boolean' ? value[key] : (defaultSettings[key] as boolean);
  return {
    activeListIds:
      Array.isArray(value['activeListIds']) &&
      value['activeListIds'].length > 0 &&
      value['activeListIds'].every((id) => typeof id === 'string' && id !== '')
        ? (value['activeListIds'] as string[])
        : defaultSettings.activeListIds,
    inputMode: INPUT_MODES.includes(value['inputMode'] as InputModeSetting)
      ? (value['inputMode'] as InputModeSetting)
      : defaultSettings.inputMode,
    requireCapitalization: bool('requireCapitalization'),
    readAloud: bool('readAloud'),
    sound: bool('sound'),
    freePlay: bool('freePlay'),
    freeExercises: nonEmpty(value['freeExercises'], isExerciseId) ?? defaultSettings.freeExercises,
    multiplicationRows:
      nonEmpty(value['multiplicationRows'], (row): row is number => MULTIPLICATION_ROWS.includes(row as number)) ??
      defaultSettings.multiplicationRows,
    tasksPerCastle: TASK_COUNTS.includes(value['tasksPerCastle'] as TasksPerCastle)
      ? (value['tasksPerCastle'] as TasksPerCastle)
      : defaultSettings.tasksPerCastle,
    allowSelfRegistration: bool('allowSelfRegistration'),
    pictureCode: bool('pictureCode'),
    showAllCastles: bool('showAllCastles'),
  };
}
