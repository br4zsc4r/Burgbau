import { sha256Hex } from './sha256';

/** PIN für den Lehrkraft-Bereich: 4 bis 8 Ziffern. */
export const PIN_PATTERN = /^\d{4,8}$/;

export function isValidPin(pin: string): boolean {
  return PIN_PATTERN.test(pin);
}

/**
 * Gespeichert wird nur ein Hash, nie die PIN selbst. Eigene SHA-256-Umsetzung statt
 * crypto.subtle, damit es auch über http im Schulnetz geht (gleiches Ergebnis).
 */
export function hashPin(pin: string): Promise<string> {
  return Promise.resolve(sha256Hex(`burgbau-pin:${pin}`));
}

export async function pinMatches(pin: string, hash: string): Promise<boolean> {
  return (await hashPin(pin)) === hash;
}
