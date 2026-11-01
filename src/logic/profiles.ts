import { ALL_SYMBOLS, sameSymbol } from '../data/profileSymbols';
import type { PictureCode, Profile, ProfileSymbol } from '../types';

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

/**
 * Ganze Klasse anlegen: ein Profil je Name, Symbole der Reihe nach aus den freien.
 * Leere Zeilen werden übersprungen. Wirft, wenn nicht genug Plätze frei sind.
 */
export function addClass(
  profiles: readonly Profile[],
  names: readonly string[],
  newId: () => string,
  now: Date,
): Profile[] {
  const nicknames = names.map(normalizeNickname).filter((name) => name !== '');
  if (profiles.length + nicknames.length > MAX_PROFILES) {
    throw new Error(`Höchstens ${String(MAX_PROFILES)} Profile pro Gerät`);
  }
  return nicknames.reduce<Profile[]>((list, nickname) => {
    const symbol = availableSymbols(list)[0];
    if (symbol === undefined) throw new Error('Keine Symbole mehr frei');
    return addProfile(list, nickname, symbol, newId(), now);
  }, [...profiles]);
}

function updateProfile(
  profiles: readonly Profile[],
  id: string,
  change: (profile: Profile) => Profile,
): Profile[] {
  return profiles.map((profile) => (profile.id === id ? change(profile) : profile));
}

export function renameProfile(profiles: readonly Profile[], id: string, nickname: string): Profile[] {
  const name = normalizeNickname(nickname);
  if (name === '') throw new Error('Spitzname fehlt');
  return updateProfile(profiles, id, (p) => ({ ...p, nickname: name }));
}

export function removeProfile(profiles: readonly Profile[], id: string): Profile[] {
  return profiles.filter((profile) => profile.id !== id);
}

/** Bild-Code setzen oder (undefined) zurücksetzen – dann wählt das Kind beim nächsten Mal neu. */
export function setProfileCode(
  profiles: readonly Profile[],
  id: string,
  code: PictureCode | undefined,
): Profile[] {
  return updateProfile(profiles, id, (profile) => {
    const next = { ...profile };
    delete next.code;
    return code === undefined ? next : { ...next, code };
  });
}

export function codeMatches(profile: Profile, entered: readonly string[]): boolean {
  return profile.code !== undefined && profile.code[0] === entered[0] && profile.code[1] === entered[1];
}
