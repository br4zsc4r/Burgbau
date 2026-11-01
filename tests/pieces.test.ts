import { describe, expect, it } from 'vitest';
import { pieceArt, pieceArtUrl } from '../src/data/pieceArt';
import { PIECES, getPiece, piecesOf } from '../src/data/pieces';

describe('Bauteil-Katalog', () => {
  it('hat eindeutige IDs', () => {
    const ids = PIECES.map((piece) => piece.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('hat genug Teile je Kategorie für drei verschiedene Angebote', () => {
    expect(piecesOf('basic').length).toBeGreaterThanOrEqual(3);
    expect(piecesOf('damaged').length).toBeGreaterThanOrEqual(3);
    expect(piecesOf('decoration').length).toBeGreaterThanOrEqual(1);
    expect(piecesOf('finish').length).toBeGreaterThanOrEqual(1);
    expect(piecesOf('premium').length).toBeGreaterThanOrEqual(1);
  });

  it('alle Grundbauteile sind stapelbar', () => {
    expect(piecesOf('basic').every((piece) => piece.stackable)).toBe(true);
  });

  it('beschädigte Teile beruhen auf einem normalen Teil und verhalten sich wie dieses', () => {
    for (const piece of piecesOf('damaged')) {
      expect(piece.base).toBeDefined();
      const base = getPiece(piece.base ?? 'wall');
      expect(base.category).not.toBe('damaged');
      expect(piece.stackable).toBe(base.stackable);
    }
  });

  it('nur beschädigte Teile haben ein Basisteil', () => {
    for (const piece of PIECES.filter((p) => p.category !== 'damaged')) {
      expect(piece.base).toBeUndefined();
    }
  });
});

describe('pieceArt', () => {
  it('normale Teile nutzen ihre eigene Grafik ohne Einfärbung', () => {
    expect(pieceArt('tower')).toEqual({ base: 'tower', tint: null, damaged: false });
  });

  it('beschädigte Teile nutzen die Grafik des Basisteils mit eigener Farbe', () => {
    const tints = new Set<number | null>();
    for (const piece of piecesOf('damaged')) {
      const art = pieceArt(piece.id);
      expect(art.base).toBe(piece.base);
      expect(art.damaged).toBe(true);
      expect(art.tint).not.toBeNull();
      tints.add(art.tint);
    }
    expect(tints.size).toBe(piecesOf('damaged').length);
  });

  it('jede Grafik existiert als Datei', () => {
    const files = Object.keys(import.meta.glob('../public/assets/placeholder/**/*.svg'));
    for (const piece of PIECES) {
      const url = pieceArtUrl(pieceArt(piece.id).base);
      expect(files, url).toContain(`../public/${url}`);
    }
  });
});
