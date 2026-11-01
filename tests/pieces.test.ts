import { describe, expect, it } from 'vitest';
import {
  BATTLEMENTS_BROKEN_URL,
  BATTLEMENTS_URL,
  DAMAGE_KINDS,
  damageUrl,
  featureUrl,
  footX,
  imageUrl,
  pieceArt,
  textureUrl,
  topMountX,
} from '../src/data/pieceArt';
import { PIECES, getPiece, isStackable, piecesOf, rarityOf } from '../src/data/pieces';
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

  it('genau die Blöcke haben ein Material', () => {
    for (const piece of PIECES) {
      expect(piece.material !== undefined, piece.id).toBe(piece.kind === 'block');
    }
  });

  it('beschädigte Teile verhalten sich genau wie ihr Basisteil', () => {
    for (const piece of piecesOf('damaged')) {
      const base = getPiece(piece.base ?? 'wall');
      expect(base.category).not.toBe('damaged');
      const behaviour = (p: PieceDef) => [p.kind, p.width, p.height, p.material, p.front, p.topMount, p.slot, p.fits, p.minStreak];
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

  it('es gibt mehrere 2 × 2-Teile, auch bei den beschädigten', () => {
    const big = (category: Parameters<typeof piecesOf>[0]) =>
      piecesOf(category).filter((p) => p.width === 2 && p.height === 2 && p.retired !== true);
    expect(big('basic').length).toBeGreaterThanOrEqual(4);
    expect(big('finish').length).toBeGreaterThanOrEqual(1);
    expect(big('damaged').length).toBeGreaterThanOrEqual(2);
    expect(getPiece('windmill')).toMatchObject({ width: 2, height: 2, rarity: 'legendary' });
  });

  it('Umgebungsteile stehen auf dem Boden', () => {
    expect(piecesOf('environment').every((p) => p.kind === 'ground')).toBe(true);
    expect(getPiece('unicorn').kind).toBe('ground');
    expect(getPiece('treasureChest').kind).toBe('ground');
  });
});

describe('pieceArt', () => {
  const files = Object.keys(import.meta.glob('../public/assets/art/**/*.svg'));
  const exists = (url: string) => files.includes(`../public/${url}`);

  it('Blöcke entstehen aus Materialtextur, nur Merkmale haben eine Grafik', () => {
    expect(pieceArt('wall')).toMatchObject({ material: 'stone', image: null, damage: [] });
    expect(pieceArt('tower')).toMatchObject({ material: 'stone', image: featureUrl('tower') });
    expect(pieceArt('pointedRoof')).toMatchObject({ material: null, image: imageUrl('pointedRoof') });
  });

  it('jede Grafik und Textur existiert als Datei', () => {
    for (const piece of PIECES) {
      const art = pieceArt(piece.id);
      if (art.image !== null) expect(exists(art.image), art.image).toBe(true);
      if (art.material !== null) expect(exists(textureUrl(art.material)), art.material).toBe(true);
    }
    for (const kind of DAMAGE_KINDS) expect(exists(damageUrl(kind)), kind).toBe(true);
    for (const piece of PIECES) {
      const animation = pieceArt(piece.id).animation;
      if (animation !== null) expect(exists(animation.image), animation.image).toBe(true);
    }
    expect(exists(BATTLEMENTS_URL)).toBe(true);
    expect(exists(BATTLEMENTS_BROKEN_URL)).toBe(true);
  });

  it('beschädigte Teile nutzen das Basisteil plus Overlays innerhalb ihrer Fläche', () => {
    for (const piece of piecesOf('damaged')) {
      const art = pieceArt(piece.id);
      expect(art.base).toBe(piece.base);
      expect(art.damaged).toBe(true);
      expect(art.damage.length).toBeGreaterThan(0);
      for (const overlay of art.damage) {
        expect(overlay.dx).toBeLessThan(piece.width);
        expect(overlay.dy).toBeLessThan(piece.height);
      }
      expect(pieceArt(piece.id).material).toBe(getPiece(piece.base ?? 'wall').material ?? null);
    }
  });

  it('bewegte Teile sind mindestens selten, legendäre bewegen sich alle', () => {
    for (const piece of PIECES) {
      const animated = pieceArt(piece.id).animation !== null;
      if (animated) expect(rarityOf(piece), piece.id).not.toBe('common');
      if (rarityOf(piece) === 'legendary') expect(animated, piece.id).toBe(true);
    }
  });

  it('normale Teile haben keine Schäden und glatte Kanten', () => {
    for (const piece of PIECES.filter((p) => p.category !== 'damaged')) {
      expect(pieceArt(piece.id)).toMatchObject({ damage: [], rough: false, damaged: false });
    }
  });
});

describe('Nachtrag Phase 8: Fuß- und Montagepunkte', () => {
  it('die Riesenfahne steckt mit ihrer Stange auf der Spitze, auch gespiegelt', () => {
    expect(footX('flag', false)).toBe(48);
    expect(footX('giantFlag', false)).toBe(16);
    expect(footX('giantFlag', true)).toBe(80);
  });

  it('das große Dach hat seine Spitze auf der Zellgrenze', () => {
    expect(topMountX('roofBig')).toBe(96);
    expect(topMountX('pointedRoof')).toBe(48);
    expect(getPiece('roofBig').mountDx).toBe(0);
  });

  it('nur unsymmetrische Teile lassen sich spiegeln', () => {
    expect(getPiece('stairs').mirror).toBe(true);
    expect(getPiece('wall').mirror).toBeUndefined();
    for (const piece of PIECES.filter((p) => p.mirror === true)) expect(piece.material, piece.id).toBeUndefined();
  });
});
