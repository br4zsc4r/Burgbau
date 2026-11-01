import { describe, expect, it } from 'vitest';
import {
  canAttach,
  canPlacePiece,
  createGrid,
  footprint,
  isPlaceable,
  pieceAt,
  placeOnGrid,
  removeFromGrid,
  resolvePlacement,
  validPlacements,
} from '../src/logic/grid';
import { getPiece } from '../src/data/pieces';
import type { GridState, PieceId } from '../src/types';

const size = { cols: 4, rows: 4 };

/** Baut ein Raster aus [Teil, Spalte, Reihe]-Einträgen (Teile vor Dekorationen). */
function build(...entries: [PieceId, number, number][]): GridState {
  return entries.reduce(
    (grid, [piece, col, row]) => placeOnGrid(grid, piece, { col, row }),
    createGrid(size),
  );
}

describe('footprint', () => {
  it('geht von der Ankerzelle unten links nach rechts und oben', () => {
    expect(footprint(getPiece('wallBig'), { col: 1, row: 2 })).toEqual([
      { col: 1, row: 2 },
      { col: 2, row: 2 },
      { col: 1, row: 3 },
      { col: 2, row: 3 },
    ]);
  });
});

describe('Schwerkraft-Regel', () => {
  it('erlaubt die unterste Reihe und verbietet schwebende Teile', () => {
    const grid = createGrid(size);
    expect(canPlacePiece(grid, 'wall', { col: 1, row: 0 })).toBe(true);
    expect(canPlacePiece(grid, 'wall', { col: 1, row: 1 })).toBe(false);
  });

  it('erlaubt Teile auf Blöcken, auch auf beschädigten', () => {
    for (const below of ['wall', 'crackedWall', 'rubble', 'chippedTower'] as const) {
      expect(canPlacePiece(build([below, 1, 0]), 'wall', { col: 1, row: 1 })).toBe(true);
    }
  });

  it('verbietet Teile auf Dächern und Umgebungsteilen', () => {
    for (const below of ['pointedRoof', 'battlements', 'crookedRoof', 'tree', 'well'] as const) {
      expect(canPlacePiece(build([below, 1, 0]), 'wall', { col: 1, row: 1 })).toBe(false);
    }
  });

  it('verbietet belegte Zellen und Zellen außerhalb', () => {
    const grid = build(['wall', 0, 0]);
    expect(canPlacePiece(grid, 'wall', { col: 0, row: 0 })).toBe(false);
    expect(canPlacePiece(grid, 'wall', { col: -1, row: 0 })).toBe(false);
    expect(canPlacePiece(grid, 'wall', { col: 4, row: 0 })).toBe(false);
  });

  it('Umgebungsteile stehen nur auf dem Boden', () => {
    const grid = build(['wall', 1, 0]);
    expect(canPlacePiece(grid, 'tree', { col: 0, row: 0 })).toBe(true);
    expect(canPlacePiece(grid, 'tree', { col: 1, row: 1 })).toBe(false);
  });

  it('Dekorationen belegen keine Zelle', () => {
    expect(canPlacePiece(createGrid(size), 'ivy', { col: 0, row: 0 })).toBe(false);
  });
});

describe('große Teile', () => {
  it('brauchen alle Zellen frei', () => {
    const grid = build(['wall', 1, 0]);
    expect(canPlacePiece(grid, 'wallWide', { col: 0, row: 0 })).toBe(false);
    expect(canPlacePiece(grid, 'wallWide', { col: 2, row: 0 })).toBe(true);
    expect(canPlacePiece(grid, 'wallWide', { col: 3, row: 0 })).toBe(false);
  });

  it('dürfen überhängen, wenn eine Spalte Halt hat', () => {
    const grid = build(['wall', 1, 0]);
    expect(canPlacePiece(grid, 'wallWide', { col: 1, row: 1 })).toBe(true);
    expect(canPlacePiece(grid, 'wallWide', { col: 0, row: 1 })).toBe(true);
    expect(canPlacePiece(grid, 'wallBig', { col: 1, row: 1 })).toBe(true);
  });

  it('brauchen trotzdem irgendwo Halt', () => {
    const grid = build(['pointedRoof', 1, 0]);
    expect(canPlacePiece(grid, 'wallWide', { col: 1, row: 1 })).toBe(false);
  });

  it('man kann auf großen Blöcken weiterbauen, auch auf dem Überhang', () => {
    const grid = build(['wall', 1, 0], ['wallWide', 1, 1]);
    expect(canPlacePiece(grid, 'wall', { col: 2, row: 2 })).toBe(true);
    expect(pieceAt(grid, { col: 2, row: 1 })?.piece).toBe('wallWide');
    expect(pieceAt(grid, { col: 2, row: 0 })).toBeNull();
  });

  it('hohe Teile passen nicht über den oberen Rand', () => {
    expect(canPlacePiece(createGrid(size), 'towerTall', { col: 0, row: 3 })).toBe(false);
  });
});

describe('Andocken', () => {
  it('Efeu wächst auf Blöcken, auch beschädigten, aber nicht auf Dächern', () => {
    expect(canAttach(build(['wall', 0, 0]), 'ivy', { col: 0, row: 0 })).toBe(true);
    expect(canAttach(build(['rubble', 0, 0]), 'ivy', { col: 0, row: 0 })).toBe(true);
    expect(canAttach(build(['gate', 0, 0]), 'ivy', { col: 0, row: 0 })).toBe(true);
    expect(canAttach(build(['pointedRoof', 0, 0]), 'ivy', { col: 0, row: 0 })).toBe(false);
    expect(canAttach(createGrid(size), 'ivy', { col: 0, row: 0 })).toBe(false);
  });

  it('Blumenkasten nur an Fenster', () => {
    expect(canAttach(build(['windowWall', 0, 0]), 'flowerBox', { col: 0, row: 0 })).toBe(true);
    expect(canAttach(build(['stainedGlass', 0, 0]), 'flowerBox', { col: 0, row: 0 })).toBe(true);
    expect(canAttach(build(['wall', 0, 0]), 'flowerBox', { col: 0, row: 0 })).toBe(false);
  });

  it('Wappen, Fackel, Balkon und Banner an Mauern ohne Fenster, nicht ans Tor', () => {
    for (const deco of ['coatOfArms', 'torch', 'balcony', 'banner'] as const) {
      expect(canAttach(build(['wall', 0, 0]), deco, { col: 0, row: 0 })).toBe(true);
      expect(canAttach(build(['windowWall', 0, 0]), deco, { col: 0, row: 0 })).toBe(false);
      expect(canAttach(build(['gate', 0, 0]), deco, { col: 0, row: 0 })).toBe(false);
    }
  });

  it('erlaubt Efeu plus eine Front-Deko je Zelle', () => {
    let grid = build(['windowWall', 0, 0], ['flowerBox', 0, 0]);
    expect(canAttach(grid, 'ivy', { col: 0, row: 0 })).toBe(true);
    grid = placeOnGrid(grid, 'ivy', { col: 0, row: 0 });
    expect(canAttach(grid, 'ivy', { col: 0, row: 0 })).toBe(false);

    const wall = build(['wall', 0, 0], ['torch', 0, 0]);
    expect(canAttach(wall, 'coatOfArms', { col: 0, row: 0 })).toBe(false);
  });

  it('jede Zelle eines großen Teils ist eine eigene Andockstelle', () => {
    let grid = build(['wallBig', 0, 0], ['torch', 0, 0]);
    expect(canAttach(grid, 'torch', { col: 1, row: 1 })).toBe(true);
    grid = placeOnGrid(grid, 'ivy', { col: 1, row: 0 });
    expect(canAttach(grid, 'ivy', { col: 0, row: 1 })).toBe(true);
  });

  describe('Fahne oben drauf', () => {
    it('passt auf Türme und Abschlüsse, nicht auf Mauern', () => {
      for (const host of ['tower', 'chippedTower', 'battlements', 'pointedRoof', 'coneRoof'] as const) {
        expect(canAttach(build([host, 0, 0]), 'flag', { col: 0, row: 0 })).toBe(true);
      }
      expect(canAttach(build(['wall', 0, 0]), 'flag', { col: 0, row: 0 })).toBe(false);
    });

    it('nur ganz oben auf einem Turm', () => {
      const grid = build(['tower', 0, 0], ['tower', 0, 1]);
      expect(canAttach(grid, 'flag', { col: 0, row: 0 })).toBe(false);
      expect(canAttach(grid, 'flag', { col: 0, row: 1 })).toBe(true);

      const tall = build(['towerTall', 0, 0]);
      expect(canAttach(tall, 'dragon', { col: 0, row: 0 })).toBe(false);
      expect(canAttach(tall, 'dragon', { col: 0, row: 1 })).toBe(true);
    });

    it('hält die Zelle darüber frei', () => {
      const grid = build(['tower', 0, 0], ['pennant', 0, 0]);
      expect(canPlacePiece(grid, 'wall', { col: 0, row: 1 })).toBe(false);
      // Auch ein Überhang vom Nachbarn darf nicht in die Fahne ragen.
      const withNeighbour = placeOnGrid(grid, 'wall', { col: 1, row: 0 });
      expect(canPlacePiece(withNeighbour, 'wallWide', { col: 0, row: 1 })).toBe(false);
    });

    it('ragt in der obersten Reihe in den Himmel', () => {
      const grid = build(['tower', 0, 0], ['tower', 0, 1], ['tower', 0, 2], ['tower', 0, 3]);
      expect(canAttach(grid, 'flag', { col: 0, row: 3 })).toBe(true);
    });
  });
});

describe('validPlacements / isPlaceable', () => {
  it('liefert im leeren Raster die unterste Reihe', () => {
    expect(validPlacements(createGrid(size), 'wall').map((p) => p.anchor)).toEqual([
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
      { col: 3, row: 0 },
    ]);
  });

  it('liefert für große Teile alle bedeckten Zellen', () => {
    const [first] = validPlacements(createGrid(size), 'wallBig');
    expect(first?.cells).toHaveLength(4);
  });

  it('Dekorationen passen erst, wenn es ein passendes Teil gibt', () => {
    expect(isPlaceable(createGrid(size), 'ivy')).toBe(false);
    expect(isPlaceable(build(['wall', 2, 0]), 'ivy')).toBe(true);
    expect(isPlaceable(build(['wall', 2, 0]), 'flowerBox')).toBe(false);
  });
});

describe('resolvePlacement', () => {
  it('nimmt die bevorzugte Ankerzelle, wenn sie passt', () => {
    const placement = resolvePlacement(createGrid(size), 'wallWide', { col: 2, row: 0 }, { col: 1, row: 0 });
    expect(placement?.anchor).toEqual({ col: 1, row: 0 });
  });

  it('legt die angetippte Zelle möglichst nach unten links ins Teil', () => {
    const grid = createGrid(size);
    expect(resolvePlacement(grid, 'wallWide', { col: 1, row: 0 })?.anchor).toEqual({ col: 1, row: 0 });
    expect(resolvePlacement(grid, 'wallWide', { col: 3, row: 0 })?.anchor).toEqual({ col: 2, row: 0 });
    expect(resolvePlacement(grid, 'towerTall', { col: 1, row: 1 })?.anchor).toEqual({ col: 1, row: 0 });
  });

  it('liefert null, wenn das Teil dort nicht hinpasst', () => {
    expect(resolvePlacement(createGrid(size), 'wall', { col: 1, row: 2 })).toBeNull();
    expect(resolvePlacement(createGrid(size), 'ivy', { col: 1, row: 0 })).toBeNull();
  });

  it('Dekorationen docken an der angetippten Zelle an', () => {
    const grid = build(['wallBig', 0, 0]);
    expect(resolvePlacement(grid, 'ivy', { col: 1, row: 1 })).toEqual({
      anchor: { col: 1, row: 1 },
      cells: [{ col: 1, row: 1 }],
    });
  });
});

describe('placeOnGrid / removeFromGrid', () => {
  it('verändert das Original nicht und bleibt serialisierbar', () => {
    const grid = createGrid(size);
    const placed = placeOnGrid(grid, 'wallWide', { col: 0, row: 0 });
    expect(grid.pieces).toEqual([]);
    expect(JSON.parse(JSON.stringify(placed))).toEqual(placed);
  });

  it('wirft bei ungültigem Platz', () => {
    expect(() => placeOnGrid(createGrid(size), 'wall', { col: 0, row: 2 })).toThrow();
    expect(() => placeOnGrid(createGrid(size), 'ivy', { col: 0, row: 0 })).toThrow();
  });

  it('entfernt Teile und Dekorationen', () => {
    const grid = build(['wall', 0, 0], ['ivy', 0, 0]);
    expect(removeFromGrid(grid, 'ivy', { col: 0, row: 0 }).attachments).toEqual([]);
    const withoutWall = removeFromGrid(build(['wall', 0, 0]), 'wall', { col: 0, row: 0 });
    expect(withoutWall.pieces).toEqual([]);
    expect(() => removeFromGrid(grid, 'tower', { col: 0, row: 0 })).toThrow();
  });
});
