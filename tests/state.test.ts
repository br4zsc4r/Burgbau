import { describe, expect, it } from 'vitest';
import { createGame, withKnownWords } from '../src/logic/game';
import { createGrid, placeOnGrid } from '../src/logic/grid';
import { CURRENT_VERSION, migrate, withVersion } from '../src/state/migrations';
import { createRepository } from '../src/state/repository';
import { createMemoryStore } from '../src/state/storage';
import { parseCastle, parseGameState, parseProfile, sanitizeGrid } from '../src/state/validate';
import type { Castle, Profile } from '../src/types';
import { seededRandom, testSettings } from './helpers';

const profile: Profile = {
  id: 'p1',
  nickname: 'Lena',
  symbol: { animal: 'fox', color: 'blue' },
  createdAt: '2026-11-01T10:00:00.000Z',
};

const grid = placeOnGrid(
  placeOnGrid(createGrid({ cols: 12, rows: 8 }), 'wall', { col: 0, row: 0 }),
  'ivy',
  { col: 0, row: 0 },
);

function castle(id: string, profileId = 'p1'): Castle {
  return { id, profileId, name: `Burg ${id}`, createdAt: '2026-11-01T10:00:00.000Z', grid };
}

describe('migrate', () => {
  it('lässt aktuelle Datensätze unverändert', () => {
    const record = withVersion('castles', { castles: [] });
    expect(migrate('castles', record)).toEqual({ castles: [], version: CURRENT_VERSION.castles });
  });

  it('lehnt Daten ohne Version oder aus einer neueren App-Version ab', () => {
    expect(migrate('castles', { castles: [] })).toBeNull();
    expect(migrate('castles', { version: 99, castles: [] })).toBeNull();
    expect(migrate('castles', undefined)).toBeNull();
  });
});

describe('Validierung', () => {
  it('rettet gültige Teile aus beschädigten Rasterdaten', () => {
    const raw = {
      cols: 12,
      rows: 8,
      pieces: [{ piece: 'wall', col: 0, row: 0 }, { piece: 'raumschiff', col: 1, row: 0 }, 'kaputt'],
      attachments: [{ piece: 'ivy', col: 0, row: 0, extra: true }],
    };
    expect(sanitizeGrid(raw)).toEqual(grid);
    expect(sanitizeGrid({ pieces: [] })).toBeNull();
  });

  it('erkennt gültige Profile und Burgen', () => {
    expect(parseProfile(profile)).toEqual(profile);
    expect(parseProfile({ ...profile, symbol: { animal: 'einhorn', color: 'blue' } })).toBeNull();
    expect(parseProfile({ ...profile, nickname: '  ' })).toBeNull();
    expect(parseCastle(castle('c1'))).toEqual(castle('c1'));
    expect(parseCastle({ ...castle('c1'), grid: null })).toBeNull();
  });

  it('erkennt eine gültige laufende Partie und lehnt kaputte ab', () => {
    const game = createGame(['hund', 'katze'], testSettings, seededRandom(1));
    expect(parseGameState(JSON.parse(JSON.stringify(game)))).toEqual(game);
    expect(parseGameState({ ...game, step: 'fliegen' })).toBeNull();
    expect(parseGameState({ ...game, quiz: null })).toBeNull();
  });
});

describe('withKnownWords', () => {
  it('ersetzt ein Wort, das es in der Liste nicht mehr gibt, und behält die Burg', () => {
    const game = { ...createGame(['alt'], testSettings, seededRandom(1)), grid };
    const repaired = withKnownWords(
      { ...game, picker: { used: ['alt'], retries: [{ wordId: 'alt', dueTask: 4 }] } },
      ['hund', 'katze'],
      seededRandom(1),
    );
    expect(['hund', 'katze']).toContain(repaired.quiz.wordId);
    expect(repaired.picker.retries).toEqual([]);
    expect(repaired.grid).toEqual(grid);
  });
});

describe('Repository', () => {
  it('speichert und lädt Profile', async () => {
    const repo = createRepository(createMemoryStore());
    expect(await repo.loadProfiles()).toEqual([]);
    await repo.saveProfiles([profile]);
    expect(await repo.loadProfiles()).toEqual([profile]);
  });

  it('speichert, lädt und löscht die laufende Burg je Profil', async () => {
    const repo = createRepository(createMemoryStore());
    const game = createGame(['hund'], testSettings, seededRandom(1));
    await repo.saveGame('p1', game);
    expect(await repo.loadGame('p1')).toEqual(game);
    expect(await repo.loadGame('p2')).toBeNull();
    await repo.deleteGame('p1');
    expect(await repo.loadGame('p1')).toBeNull();
  });

  it('speichert jeden Datensatz mit Version', async () => {
    const store = createMemoryStore();
    const repo = createRepository(store);
    await repo.saveProfiles([profile]);
    await repo.addCastle(castle('c1'));
    expect(await store.get('profiles')).toMatchObject({ version: 1 });
    expect(await store.get('castles:p1')).toMatchObject({ version: 1 });
  });

  it('sammelt Burgen je Profil und alle zusammen', async () => {
    const repo = createRepository(createMemoryStore());
    await repo.addCastle(castle('a'));
    await repo.addCastle({ ...castle('b', 'p2'), createdAt: '2026-11-02T10:00:00.000Z' });
    expect((await repo.loadCastles('p1')).map((c) => c.id)).toEqual(['a']);
    const all = await repo.loadAllCastles([profile, { ...profile, id: 'p2' }]);
    expect(all.map((c) => c.id)).toEqual(['b', 'a']);
  });

  it('verliert keine Burgen, wenn eine einzelne kaputt ist', async () => {
    const store = createMemoryStore();
    await store.set('castles:p1', { version: 1, castles: [castle('a'), { id: 'kaputt' }] });
    const repo = createRepository(store);
    expect((await repo.loadCastles('p1')).map((c) => c.id)).toEqual(['a']);
  });
});

describe('Phase 6: Speicherformat', () => {
  it('migriert eine laufende Burg aus Version 1 (ohne Speicher und Lernfächer)', async () => {
    const store = createMemoryStore();
    const game = createGame(['hund'], testSettings, seededRandom(1));
    const v1 = Object.fromEntries(
      Object.entries({ ...game, grid }).filter(([key]) => key !== 'stash' && key !== 'boxes'),
    );
    await store.set('game:p1', { version: 1, game: v1 });
    const loaded = await createRepository(store).loadGame('p1');
    expect(loaded).toMatchObject({ stash: [], boxes: {} });
    expect(loaded?.grid).toEqual(grid);
  });

  it('akzeptiert in den Speicher gelegte Teile (anchor null)', () => {
    const game = { ...createGame(['hund'], testSettings, seededRandom(1)), step: 'placed' as const };
    const stashed = { ...game, stash: ['tower' as const], lastPlacement: { piece: 'tower' as const, anchor: null } };
    expect(parseGameState(JSON.parse(JSON.stringify(stashed)))).toEqual(stashed);
  });

  it('speichert Lernfächer je Profil und Wortliste', async () => {
    const repo = createRepository(createMemoryStore());
    expect(await repo.loadBoxes('p1', 'klasse-3')).toEqual({});
    await repo.saveBoxes('p1', 'klasse-3', { baum: 2 });
    await repo.saveBoxes('p1', 'klasse-4', { museum: 0 });
    expect(await repo.loadBoxes('p1', 'klasse-3')).toEqual({ baum: 2 });
    expect(await repo.loadBoxes('p1', 'klasse-4')).toEqual({ museum: 0 });
    expect(await repo.loadBoxes('p2', 'klasse-3')).toEqual({});
  });
});
