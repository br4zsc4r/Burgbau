import { describe, expect, it } from 'vitest';
import { pieceArt, pieceArtUrl } from '../src/data/pieceArt';
import { PIECES, getPiece, isStackable, piecesOf } from '../src/data/pieces';
import type { PieceDef } from '../src/types';

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

  it('alle Grundbauteile sind Blöcke', () => {
    expect(piecesOf('basic').every(isStackable)).toBe(true);
  });

  it('beschädigte Teile verhalten sich genau wie ihr Basisteil', () => {
    for (const piece of piecesOf('damaged')) {
      const base = getPiece(piece.base ?? 'wall');
      expect(base.category).not.toBe('damaged');
      const behaviour = (p: PieceDef) => [p.kind, p.width, p.height, p.front, p.topMount, p.slot, p.fits, p.minStreak];
      expect(behaviour(piece)).toEqual(behaviour(base));
    }
  });

  it('nur beschädigte Teile haben ein Basisteil', () => {
    for (const piece of PIECES.filter((p) => p.category !== 'damaged')) {
      expect(piece.base).toBeUndefined();
    }
  });

  it('Dekorationen haben eine Andockstelle, Front-Dekorationen eine passende Vorderseite', () => {
    for (const piece of PIECES.filter((p) => p.kind === 'attachment')) {
      expect(piece.slot).toBeDefined();
      expect(piece.fits !== undefined).toBe(piece.slot === 'front');
      expect([piece.width, piece.height]).toEqual([1, 1]);
    }
  });

  it('große Teile haben eine Mindest-Serie, kleine nicht', () => {
    for (const piece of PIECES) {
      const large = piece.width > 1 || piece.height > 1;
      expect(piece.minStreak !== undefined).toBe(large);
    }
  });

  it('Umgebungsteile stehen auf dem Boden', () => {
    expect(piecesOf('environment').map((p) => p.kind)).toEqual(['ground', 'ground', 'ground', 'ground']);
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
