import type { InputMode, Word, WordList } from '../types';

/** Eine Liste mit Herkunft: mitgeliefert (evtl. bearbeitet) oder von der Lehrkraft angelegt. */
export interface ListEntry {
  list: WordList;
  builtin: boolean;
  /** Mitgelieferte Liste, die die Lehrkraft geändert hat. */
  edited: boolean;
}

/**
 * Mitgelieferte und gespeicherte Listen zusammenführen. Eine gespeicherte Liste mit der ID
 * einer mitgelieferten ersetzt diese (bearbeitete Fassung), alle anderen kommen dazu.
 */
export function mergeLists(builtins: readonly WordList[], stored: readonly WordList[]): ListEntry[] {
  const storedById = new Map(stored.map((list) => [list.id, list]));
  const builtinIds = new Set(builtins.map((list) => list.id));
  return [
    ...builtins.map((list) => {
      const edited = storedById.get(list.id);
      return { list: edited ?? list, builtin: true, edited: edited !== undefined };
    }),
    ...stored.filter((list) => !builtinIds.has(list.id)).map((list) => ({ list, builtin: false, edited: false })),
  ];
}

export interface WordPool {
  words: Word[];
  /** Eingabemodus der Liste, aus der ein Wort stammt. */
  inputModes: Record<string, InputMode>;
}

/** Alle Wörter der eingeschalteten Listen; doppelte Wörter (gleiche ID) nur einmal. */
export function activePool(lists: readonly WordList[], activeIds: readonly string[]): WordPool {
  const words: Word[] = [];
  const inputModes: Record<string, InputMode> = {};
  for (const list of lists) {
    if (!activeIds.includes(list.id)) continue;
    for (const word of list.words) {
      if (word.id in inputModes) continue;
      words.push(word);
      inputModes[word.id] = list.inputMode;
    }
  }
  return { words, inputModes };
}

/** Liste ein- oder ausschalten; die letzte aktive Liste bleibt an (sonst gäbe es keine Aufgaben). */
export function toggleList(activeIds: readonly string[], id: string, on: boolean): string[] {
  if (on) return activeIds.includes(id) ? [...activeIds] : [...activeIds, id];
  const next = activeIds.filter((active) => active !== id);
  return next.length === 0 ? [...activeIds] : next;
}

/** Nur IDs behalten, die es noch gibt; ist keine mehr übrig, gilt die Ersatzliste. */
export function validActiveIds(
  activeIds: readonly string[],
  lists: readonly WordList[],
  fallback: string,
): string[] {
  const known = activeIds.filter((id) => lists.some((list) => list.id === id));
  return known.length > 0 ? known : [fallback];
}
