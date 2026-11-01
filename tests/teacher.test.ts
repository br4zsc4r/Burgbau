import { describe, expect, it } from 'vitest';
import {
  addClass,
  addProfile,
  codeMatches,
  removeProfile,
  renameProfile,
  setProfileCode,
  setProfileWordList,
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

  it('benennt um, löscht und setzt eine eigene Wortliste', () => {
    let profiles: Profile[] = addClass([], ['Lena', 'Max'], newId, now);
    const [lena, max] = profiles;
    if (lena === undefined || max === undefined) throw new Error('fehlt');
    profiles = renameProfile(profiles, lena.id, ' Lena Marie ');
    expect(profiles[0]?.nickname).toBe('Lena Marie');
    expect(() => renameProfile(profiles, lena.id, '  ')).toThrow();

    profiles = setProfileWordList(profiles, max.id, 'klasse-4');
    expect(profiles[1]?.wordListId).toBe('klasse-4');
    profiles = setProfileWordList(profiles, max.id, undefined);
    expect(profiles[1]).not.toHaveProperty('wordListId');

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
    wordListId: 'klasse-3',
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

    const list = { id: 'eigene-1', name: 'Test', inputMode: 'keyboard' as const, words: [
      { id: 'hund', singular: 'Hund', article: 'der' as const, plural: ['Hunde'], pattern: 'e' as const, umlaut: false, verified: true },
    ] };
    await repo.saveCustomLists([list]);
    expect(await repo.loadCustomLists()).toEqual([list]);
  });

  it('behält Wortliste und Bild-Code eines Profils', async () => {
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
    await repo.saveBoxes('p1', 'klasse-3', { baum: 2 });
    await repo.deleteProfileData('p1');
    expect(await repo.loadCastles('p1')).toEqual([]);
    expect(await repo.loadGame('p1')).toBeNull();
    expect(await repo.loadBoxes('p1', 'klasse-3')).toEqual({});
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
