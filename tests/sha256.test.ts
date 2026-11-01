import { describe, expect, it } from 'vitest';
import { hashPin } from '../src/logic/pin';
import { sha256Hex } from '../src/logic/sha256';

/** Zum Vergleich: die Browser-/Node-Krypto, mit der bisherige PINs gespeichert wurden. */
async function subtleHex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

describe('sha256Hex', () => {
  it('liefert die Prüfwerte aus FIPS 180-4', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
  });

  it('stimmt mit crypto.subtle überein, auch an Blockgrenzen und mit Umlauten', async () => {
    for (const text of ['burgbau-pin:2468', 'ä'.repeat(40), 'x'.repeat(55), 'x'.repeat(56), 'x'.repeat(64), 'x'.repeat(200)]) {
      expect(sha256Hex(text), text.slice(0, 10)).toBe(await subtleHex(text));
    }
  });

  it('bereits gespeicherte PINs passen weiterhin', async () => {
    expect(await hashPin('2468')).toBe(await subtleHex('burgbau-pin:2468'));
    expect(await hashPin('12345678')).toBe(await subtleHex('burgbau-pin:12345678'));
  });
});
