import type { ListEntry } from '../../logic/wordlists';
import type { ExerciseId, PackContents, Settings, WordList } from '../../types';
import { multiplicationSettings } from './multiplicationSettings';
import { pluralSettings } from './pluralSettings';

/** Inhalt einer Spielart in einem Übungspaket, z. B. die Wortlisten der Mehrzahl. */
export type PackContent<E extends ExerciseId> = NonNullable<PackContents[E]>;

/** Was die Einstellungen einer Spielart vom Lehrkraft-Bereich bekommen. */
export interface SettingsContext {
  settings: () => Settings;
  saveSettings: (change: Partial<Settings>) => Promise<void>;
  /** Alle Wortlisten: mitgelieferte und eigene. */
  lists: () => ListEntry[];
  /** Bearbeitete mitgelieferte und eigene Listen (das, was gespeichert wird). */
  storedLists: () => WordList[];
  saveStoredLists: (next: WordList[]) => Promise<void>;
  newId: () => string;
}

/** Lehrkraft-Einstellungen einer Spielart: Popup im freien Spiel und Aufgabenbereich im Paket. */
export interface ExerciseSettings<E extends ExerciseId> {
  /** Freigegebener Inhalt im freien Spiel; zugleich Startwert, wenn die Spielart in ein Paket kommt. */
  freeContent: (ctx: SettingsContext) => PackContent<E>;
  /** Kurz beschrieben, z. B. „2 Listen“ oder „Reihen 3, 7“. */
  summary: (content: PackContent<E>) => string;
  /** Popup hinter dem Zahnrad bei den Spielarten: alle Einstellungen des freien Spiels, sofort gespeichert. */
  renderFree: (body: HTMLElement, ctx: SettingsContext) => void;
  /** Popup eines Aufgabenbereichs im Paket: nur den Inhalt wählen; change meldet jede Änderung. */
  renderPack: (
    body: HTMLElement,
    content: PackContent<E>,
    ctx: SettingsContext,
    change: (next: PackContent<E>) => void,
  ) => void;
}

/** Einstellungen aller Spielarten. Eine neue Spielart muss hier eingetragen werden (prüft der Compiler). */
export const EXERCISE_SETTINGS: { readonly [E in ExerciseId]: ExerciseSettings<E> } = {
  plural: pluralSettings,
  multiplication: multiplicationSettings,
};

/** Einstellungen der Spielart; der Inhalt, den sie bekommt, gehört immer zu derselben Spielart. */
export function exerciseSettings(exercise: ExerciseId): ExerciseSettings<ExerciseId> {
  return EXERCISE_SETTINGS[exercise] as ExerciseSettings<ExerciseId>;
}
