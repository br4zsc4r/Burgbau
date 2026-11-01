/** PIN für den Lehrkraft-Bereich: 4 bis 8 Ziffern. */
export const PIN_PATTERN = /^\d{4,8}$/;

export function isValidPin(pin: string): boolean {
  return PIN_PATTERN.test(pin);
}

/** Gespeichert wird nur ein Hash, nie die PIN selbst. */
export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`burgbau-pin:${pin}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function pinMatches(pin: string, hash: string): Promise<boolean> {
  return (await hashPin(pin)) === hash;
}
