import type { InputModeSetting, Settings, TasksPerCastle } from '../types';
import { isRecord } from './validate';

/** Diese Liste ist an, solange nichts anderes eingestellt ist. */
export const DEFAULT_LIST_ID = 'klasse-1-2';

export const defaultSettings: Settings = {
  activeListIds: [DEFAULT_LIST_ID],
  inputMode: 'list',
  requireCapitalization: false,
  readAloud: true,
  tasksPerCastle: 15,
  allowSelfRegistration: true,
  pictureCode: false,
  showAllCastles: true,
};

const TASK_COUNTS: readonly TasksPerCastle[] = [10, 15, 20];
const INPUT_MODES: readonly InputModeSetting[] = ['list', 'tiles', 'keyboard'];

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
    tasksPerCastle: TASK_COUNTS.includes(value['tasksPerCastle'] as TasksPerCastle)
      ? (value['tasksPerCastle'] as TasksPerCastle)
      : defaultSettings.tasksPerCastle,
    allowSelfRegistration: bool('allowSelfRegistration'),
    pictureCode: bool('pictureCode'),
    showAllCastles: bool('showAllCastles'),
  };
}
