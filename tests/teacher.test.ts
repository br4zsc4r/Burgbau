import { describe, expect, it } from 'vitest';
import {
  addClass,
  addProfile,
  codeMatches,
  removeProfile,
  renameProfile,
  setProfileCode,
} from '../src/logic/profiles';
import { createRepository } from '../src/state/repository';
import { defaultSettings, parseSettings } from '../src/state/settings';
import { createMemoryStore } from '../src/state/storage';
import { createGame } from '../src/logic/game';
import { createGrid } from '../src/logic/grid';
import type { Profile } from '../src/types';
import { seededRandom, testSettings } from './helpers';

const now = new Date('2026-11-01T10:00:00Z');
let counter = 0;
const newId = () => `p${String(++counter)}`;

describe('Einstellungen', () => {
  it('fällt bei fehlenden oder kaputten Werten auf den Standard zurück', () => {
    expect(parseSettings(undefined)).toEqual(defaultSettings);
    expect(parseSettings({ tasksPerCastle: 12, inputMode: 'sprache', readAloud: 'ja' })).toEqual(defaultSettings);
  });

  it('Töne sind standardmäßig an (leise) und lassen sich abschalten', () => {
    expect(defaultSettings.sound).toBe(true);
    // Ältere Einstellungen ohne das Feld bekommen den Standard.
    const withoutSound: Record<string, unknown> = { ...defaultSettings };
    delete withoutSound['sound'];
    expect(parseSettings(withoutSound).sound).toBe(true);
    expect(parseSettings({ ...defaultSettings, sound: false }).sound).toBe(false);
  });

  it('übernimmt gültige Werte', () => {
    const custom = { ...defaultSettings, tasksPerCastle: 20, inputMode: 'keyboard', pictureCode: true } as const;
    expect(parseSettings(custom)).toEqual(custom);
  });
});

describe('Profilverwaltung', () => {
  it('legt eine ganze Klasse an, Symbole der Reihe nach, Leerzeilen zählen nicht', () => {
    const profiles = addClass([], ['Lena', '', '  Max ', 'Ali'], newId, now);
    expect(profiles.map((p) => p.nickname)).toEqual(['Lena', 'Max', 'Ali']);
    expect(new Set(profiles.map((p) => `${p.symbol.animal}-${p.symbol.color}`)).size).toBe(3);
  });

  it('lehnt mehr als 30 Profile ab', () => {
    const names = Array.from({ length: 31 }, (_, i) => `Kind ${String(i)}`);
    expect(() => addClass([], names, newId, now)).toThrow();
  });

  it('benennt um und löscht', () => {
    let profiles: Profile[] = addClass([], ['Lena', 'Max'], newId, now);
    const [lena, max] = profiles;
    if (lena === undefined || max === undefined) throw new Error('fehlt');
    profiles = renameProfile(profiles, lena.id, ' Lena Marie ');
    expect(profiles[0]?.nickname).toBe('Lena Marie');
    expect(() => renameProfile(profiles, lena.id, '  ')).toThrow();


    expect(removeProfile(profiles, lena.id).map((p) => p.id)).toEqual([max.id]);
  });

  it('prüft den Bild-Code in der richtigen Reihenfolge', () => {
    let profiles = addProfile([], 'Lena', { animal: 'fox', color: 'blue' }, 'p1', now);
    profiles = setProfileCode(profiles, 'p1', ['tree', 'torch']);
    const lena = profiles[0];
    if (lena === undefined) throw new Error('fehlt');
    expect(codeMatches(lena, ['tree', 'torch'])).toBe(true);
    expect(codeMatches(lena, ['torch', 'tree'])).toBe(false);
    expect(setProfileCode(profiles, 'p1', undefined)[0]).not.toHaveProperty('code');
  });
});

describe('Repository für die Lehrkraft', () => {
  const profile: Profile = {
    id: 'p1',
    nickname: 'Lena',
    symbol: { animal: 'fox', color: 'blue' },
    createdAt: now.toISOString(),
    code: ['tree', 'well'],
  };
  const castle = (id: string) => ({
    id,
    profileId: 'p1',
    name: id,
    createdAt: now.toISOString(),
    grid: createGrid({ cols: 12, rows: 8 }),
  });

  it('speichert Einstellungen und eigene Wortlisten', async () => {
    const repo = createRepository(createMemoryStore());
    expect(await repo.loadSettings()).toEqual(defaultSettings);
    await repo.saveSettings({ ...defaultSettings, tasksPerCastle: 10 });
    expect((await repo.loadSettings()).tasksPerCastle).toBe(10);
    await repo.saveSettings({ ...defaultSettings, tasksPerCastle: 30 });
    expect((await repo.loadSettings()).tasksPerCastle).toBe(30);

    const list = { id: 'eigene-1', name: 'Test', inputMode: 'keyboard' as const, words: [
      { id: 'hund', singular: 'Hund', article: 'der' as const, plural: ['Hunde'], pattern: 'e' as const, umlaut: false, verified: true },
    ] };
    await repo.saveCustomLists([list]);
    expect(await repo.loadCustomLists()).toEqual([list]);
  });

  it('behält den Bild-Code eines Profils', async () => {
    const repo = createRepository(createMemoryStore());
    await repo.saveProfiles([profile]);
    expect(await repo.loadProfiles()).toEqual([profile]);
  });

  it('löscht einzelne Burgen, ganze Sammlungen und alle Daten eines Profils', async () => {
    const repo = createRepository(createMemoryStore());
    await repo.addCastle(castle('a'));
    await repo.addCastle(castle('b'));
    await repo.deleteCastle('p1', 'a');
    expect((await repo.loadCastles('p1')).map((c) => c.id)).toEqual(['b']);
    await repo.clearCastles('p1');
    expect(await repo.loadCastles('p1')).toEqual([]);

    await repo.addCastle(castle('c'));
    await repo.saveGame('p1', createGame(['hund'], testSettings, seededRandom(1)));
    await repo.saveBoxes('p1', { baum: 2 });
    await repo.deleteProfileData('p1');
    expect(await repo.loadCastles('p1')).toEqual([]);
    expect(await repo.loadGame('p1')).toBeNull();
    expect(await repo.loadBoxes('p1')).toEqual({});
  });

  it('setzt alles zurück', async () => {
    const repo = createRepository(createMemoryStore());
    await repo.saveProfiles([profile]);
    await repo.saveSettings({ ...defaultSettings, pictureCode: true });
    await repo.resetAll();
    expect(await repo.loadProfiles()).toEqual([]);
    expect(await repo.loadSettings()).toEqual(defaultSettings);
  });
});

describe('Einstellungen Version 2', () => {
  it('macht aus der Gerätelisten-ID eine Liste aktiver Listen', async () => {
    const store = createMemoryStore();
    await store.set('settings', { version: 1, settings: { ...defaultSettings, activeListIds: undefined, wordListId: 'klasse-3' } });
    expect((await createRepository(store).loadSettings()).activeListIds).toEqual(['klasse-3']);
  });

  it('behält bereits vorhandene aktive Listen bei der Migration', async () => {
    const store = createMemoryStore();
    await store.set('settings', { version: 1, settings: { ...defaultSettings, activeListIds: ['klasse-4'] } });
    expect((await createRepository(store).loadSettings()).activeListIds).toEqual(['klasse-4']);
  });

  it('PIN-Hash: erst keiner, dann gespeichert', async () => {
    const repo = createRepository(createMemoryStore());
    expect(await repo.loadPinHash()).toBeNull();
    await repo.savePinHash('abc');
    expect(await repo.loadPinHash()).toBe('abc');
  });
});
