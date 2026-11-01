import { describe, expect, it } from 'vitest';
import { ALL_SYMBOLS } from '../src/data/profileSymbols';
import {
  MAX_PROFILES,
  addProfile,
  availableSymbols,
  canCreateProfile,
  normalizeNickname,
  possessive,
} from '../src/logic/profiles';
import type { Profile } from '../src/types';

const now = new Date('2026-11-01T10:00:00Z');
const fox = { animal: 'fox', color: 'blue' } as const;

describe('Profil-Symbole', () => {
  it('gibt es 30 verschiedene, genug für eine Klasse', () => {
    const keys = ALL_SYMBOLS.map((s) => `${s.animal}-${s.color}`);
    expect(new Set(keys).size).toBe(MAX_PROFILES);
  });

  it('vergebene Symbole sind nicht mehr wählbar', () => {
    const profiles = addProfile([], 'Lena', fox, 'p1', now);
    expect(availableSymbols(profiles)).toHaveLength(29);
    expect(availableSymbols(profiles)).not.toContainEqual(fox);
  });
});

describe('normalizeNickname', () => {
  it('trimmt, fasst Leerzeichen zusammen und kürzt auf 20 Zeichen', () => {
    expect(normalizeNickname('  Lena   Marie ')).toBe('Lena Marie');
    expect(normalizeNickname('A'.repeat(30))).toHaveLength(20);
    expect(normalizeNickname('Jörg')).toBe('Jörg');
  });
});

describe('addProfile', () => {
  it('legt ein Profil mit bereinigtem Namen an', () => {
    expect(addProfile([], ' Lena ', fox, 'p1', now)).toEqual([
      { id: 'p1', nickname: 'Lena', symbol: fox, createdAt: '2026-11-01T10:00:00.000Z' },
    ]);
  });

  it('lehnt leere Namen und doppelte Symbole ab', () => {
    expect(() => addProfile([], '   ', fox, 'p1', now)).toThrow();
    const profiles = addProfile([], 'Lena', fox, 'p1', now);
    expect(() => addProfile(profiles, 'Max', fox, 'p2', now)).toThrow();
  });

  it('erlaubt höchstens 30 Profile', () => {
    let profiles: Profile[] = [];
    ALL_SYMBOLS.forEach((symbol, i) => {
      profiles = addProfile(profiles, `Kind ${String(i)}`, symbol, `p${String(i)}`, now);
    });
    expect(profiles).toHaveLength(30);
    expect(canCreateProfile(profiles)).toBe(false);
    expect(availableSymbols(profiles)).toEqual([]);
  });
});

describe('possessive', () => {
  it.each([
    ['Lena', 'Lenas'],
    ['Max', 'Max’'],
    ['Jonas', 'Jonas’'],
    ['Fritz', 'Fritz’'],
    ['Ali', 'Alis'],
  ])('%s → %s', (name, expected) => {
    expect(possessive(name)).toBe(expected);
  });
});
