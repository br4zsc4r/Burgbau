import { isRecord } from './validate';

/**
 * Versionen der gespeicherten Datensätze. Bei jeder Formatänderung: Version erhöhen und
 * hier eine Migration von der alten Version eintragen. Kinder dürfen nie Burgen verlieren.
 */
export const CURRENT_VERSION = {
  profiles: 1,
  game: 2,
  castles: 1,
  progress: 1,
  settings: 1,
  wordlists: 1,
} as const;

export type RecordKind = keyof typeof CURRENT_VERSION;

type Migration = (record: Record<string, unknown>) => Record<string, unknown>;

/** Migrationen je Datensatzart, Schlüssel = Version, von der aus migriert wird. */
const MIGRATIONS: Record<RecordKind, Partial<Record<number, Migration>>> = {
  profiles: {},
  game: {
    // Phase 6: Zwischenspeicher und Lernfächer kamen dazu.
    1: (record) => {
      const game = isRecord(record['game']) ? record['game'] : {};
      return { ...record, game: { stash: [], boxes: {}, ...game } };
    },
  },
  castles: {},
  progress: {},
  settings: {},
  wordlists: {},
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
