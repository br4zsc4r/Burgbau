import { ALL_SYMBOLS, sameSymbol } from '../data/profileSymbols';
import type { Profile, ProfileSymbol } from '../types';

/** Eine Klasse pro Gerät. */
export const MAX_PROFILES = 30;
export const MAX_NICKNAME_LENGTH = 20;

/** Spitzname bereinigen: NFC, Leerzeichen zusammenfassen, kürzen. */
export function normalizeNickname(input: string): string {
  return Array.from(input.normalize('NFC').replace(/\s+/g, ' ').trim())
    .slice(0, MAX_NICKNAME_LENGTH)
    .join('');
}

export function availableSymbols(profiles: readonly Profile[]): ProfileSymbol[] {
  return ALL_SYMBOLS.filter((symbol) => !profiles.some((p) => sameSymbol(p.symbol, symbol)));
}

export function canCreateProfile(profiles: readonly Profile[]): boolean {
  return profiles.length < MAX_PROFILES;
}

/** Neues Profil anhängen. Wirft bei leerem Namen, vergebenem Symbol oder voller Klasse. */
export function addProfile(
  profiles: readonly Profile[],
  nickname: string,
  symbol: ProfileSymbol,
  id: string,
  now: Date,
): Profile[] {
  const name = normalizeNickname(nickname);
  if (name === '') throw new Error('Spitzname fehlt');
  if (!canCreateProfile(profiles)) throw new Error('Es gibt schon die maximale Zahl an Profilen');
  if (!availableSymbols(profiles).some((s) => sameSymbol(s, symbol))) {
    throw new Error('Symbol ist schon vergeben');
  }
  return [...profiles, { id, nickname: name, symbol, createdAt: now.toISOString() }];
}

/** Deutscher Genitiv für Namensvorschläge: „Lenas“, aber „Max’“ und „Fritz’“. */
export function possessive(nickname: string): string {
  return /[sßxz]$/i.test(nickname) ? `${nickname}’` : `${nickname}s`;
}
