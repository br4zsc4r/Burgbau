import { isRecord } from './validate';

/**
 * Versionen der gespeicherten Datensätze. Bei jeder Formatänderung: Version erhöhen und
 * hier eine Migration von der alten Version eintragen. Kinder dürfen nie Burgen verlieren.
 */
export const CURRENT_VERSION = {
  profiles: 1,
  game: 4,
  castles: 1,
  progress: 2,
  settings: 2,
  wordlists: 1,
  pin: 1,
  packs: 1,
} as const;

export type RecordKind = keyof typeof CURRENT_VERSION;

type Migration = (record: Record<string, unknown>) => Record<string, unknown>;

// Feste Schreibweise der Migration 9a (nicht die aktuelle taskId-Funktion: Migrationen ändern sich nie).
const pluralTask = (wordId: unknown): unknown => (typeof wordId === 'string' ? `plural:${wordId}` : wordId);

function pluralBoxes(boxes: unknown): Record<string, unknown> {
  if (!isRecord(boxes)) return {};
  return Object.fromEntries(Object.entries(boxes).map(([wordId, box]) => [`plural:${wordId}`, box]));
}

/** Migrationen je Datensatzart, Schlüssel = Version, von der aus migriert wird. */
const MIGRATIONS: Record<RecordKind, Partial<Record<number, Migration>>> = {
  profiles: {},
  game: {
    // Phase 6: Zwischenspeicher und Lernfächer kamen dazu.
    1: (record) => {
      const game = isRecord(record['game']) ? record['game'] : {};
      return { ...record, game: { stash: [], boxes: {}, ...game } };
    },
    // Nachtrag Phase 8: Teile lassen sich spiegeln.
    2: (record) => {
      const game = isRecord(record['game']) ? record['game'] : {};
      return { ...record, game: { pendingFlipped: false, ...game } };
    },
    // Phase 9a: Aufgaben statt Wörter. Bisher gab es nur die Mehrzahl (freies Spiel).
    3: (record) => {
      const game = isRecord(record['game']) ? record['game'] : {};
      const quiz = isRecord(game['quiz']) ? game['quiz'] : {};
      const { wordId, ...quizRest } = quiz;
      const picker = isRecord(game['picker']) ? game['picker'] : {};
      const used = Array.isArray(picker['used']) ? picker['used'].map(pluralTask) : [];
      const retries = Array.isArray(picker['retries'])
        ? picker['retries'].map((retry: unknown) =>
            isRecord(retry) ? { taskId: pluralTask(retry['wordId']), dueTask: retry['dueTask'] } : retry,
          )
        : [];
      return {
        ...record,
        game: {
          ...game,
          selection: { kind: 'free', exercise: 'plural' },
          quiz: { ...quizRest, taskId: pluralTask(wordId) },
          picker: { used, retries },
          boxes: pluralBoxes(game['boxes']),
        },
      };
    },
  },
  castles: {},
  progress: {
    // Phase 9a: ein Stand pro Aufgabe (Präfix der Spielart) statt Stände je Wortliste.
    1: (record) => {
      const lists = isRecord(record['lists']) ? record['lists'] : {};
      // „alle“ war schon der zusammengeführte Stand; sonst alle Listen zusammenführen.
      const merged = isRecord(lists['alle'])
        ? lists['alle']
        : Object.values(lists).reduce<Record<string, unknown>>(
            (all, boxes) => (isRecord(boxes) ? { ...all, ...boxes } : all),
            {},
          );
      const rest: Record<string, unknown> = { ...record };
      delete rest['lists'];
      return { ...rest, boxes: pluralBoxes(merged) };
    },
  },
  settings: {
    // Phase 7: statt einer Liste pro Gerät mehrere eingeschaltete Listen.
    1: (record) => {
      const settings = isRecord(record['settings']) ? record['settings'] : {};
      const { wordListId, ...rest } = settings;
      // Schon vorhandene Liste aktiver Listen hat Vorrang vor dem alten Einzelfeld.
      const activeListIds =
        rest['activeListIds'] ?? (typeof wordListId === 'string' ? [wordListId] : undefined);
      return { ...record, settings: { ...rest, activeListIds } };
    },
  },
  wordlists: {},
  pin: {},
  packs: {},
};

/**
 * Bringt einen gespeicherten Datensatz auf die aktuelle Version.
 * null bei unbekanntem Format oder einer neueren Version als diese App kennt.
 */
export function migrate(kind: RecordKind, raw: unknown): Record<string, unknown> | null {
  if (!isRecord(raw) || !Number.isInteger(raw['version'])) return null;
  let record = raw;
  let version = record['version'] as number;
  const target = CURRENT_VERSION[kind];
  while (version < target) {
    const step = MIGRATIONS[kind][version];
    if (step === undefined) return null;
    record = { ...step(record), version: version + 1 };
    version += 1;
  }
  return version === target ? record : null;
}

/** Datensatz zum Speichern mit aktueller Version versehen. */
export function withVersion<T extends object>(kind: RecordKind, data: T): T & { version: number } {
  return { ...data, version: CURRENT_VERSION[kind] };
}
