import { describe, expect, it } from 'vitest';
import {
  canAttach,
  canPlacePiece,
  createGrid,
  pickUpAt,
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
    expect(canAttach(build(['windowWallBig', 0, 0]), 'flowerBox', { col: 1, row: 1 })).toBe(true);
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
    it('passt auf Türme, Dächer und Mauern (auf deren Zinnen), nicht auf Umgebung', () => {
      for (const host of ['tower', 'chippedTower', 'pointedRoof', 'coneRoof', 'wall', 'crackedWall'] as const) {
        expect(canAttach(build([host, 0, 0]), 'flag', { col: 0, row: 0 })).toBe(true);
      }
      expect(canAttach(build(['tree', 0, 0]), 'flag', { col: 0, row: 0 })).toBe(false);
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

describe('pickUpAt (Bearbeitungsmodus)', () => {
  it('nimmt zuerst die oberste Dekoration: Fahne vor Front-Deko vor Efeu', () => {
    let grid = build(['wall', 0, 0], ['ivy', 0, 0], ['torch', 0, 0], ['flag', 0, 0]);
    let result = pickUpAt(grid, { col: 0, row: 0 });
    expect(result.picked).toBe('flag');
    grid = result.grid;
    result = pickUpAt(grid, { col: 0, row: 0 });
    expect(result.picked).toBe('torch');
    result = pickUpAt(result.grid, { col: 0, row: 0 });
    expect(result.picked).toBe('ivy');
    result = pickUpAt(result.grid, { col: 0, row: 0 });
    expect(result).toMatchObject({ picked: 'wall', fallen: [] });
    expect(result.grid.pieces).toEqual([]);
  });

  it('was keinen Halt mehr hat, fällt mit heraus – samt Dekoration', () => {
    const grid = build(['wall', 1, 0], ['wall', 1, 1], ['tower', 1, 2], ['pennant', 1, 2], ['ivy', 1, 1]);
    const result = pickUpAt(grid, { col: 1, row: 0 });
    expect(result.picked).toBe('wall');
    expect([...result.fallen].sort()).toEqual(['ivy', 'pennant', 'tower', 'wall']);
    expect(result.grid.pieces).toEqual([]);
    expect(result.grid.attachments).toEqual([]);
  });

  it('Überhänge bleiben stehen, solange eine Spalte noch trägt', () => {
    const grid = build(['wall', 1, 0], ['wall', 2, 0], ['wallWide', 1, 1]);
    const result = pickUpAt(grid, { col: 1, row: 0 });
    expect(result.fallen).toEqual([]);
    expect(pieceAt(result.grid, { col: 1, row: 1 })?.piece).toBe('wallWide');
  });

  it('leere Zelle: nichts passiert', () => {
    const grid = build(['wall', 1, 0]);
    expect(pickUpAt(grid, { col: 3, row: 0 })).toEqual({ grid, picked: null, flipped: false, fallen: [] });
  });
});

describe('Nachtrag Phase 8: Spiegeln und Montagepunkt', () => {
  it('großes Dach: Fahne nur an der Spitze (linke Zelle)', () => {
    const grid = build(['wallBig', 0, 0], ['roofBig', 0, 2]);
    expect(canAttach(grid, 'flag', { col: 0, row: 3 })).toBe(true);
    expect(canAttach(grid, 'flag', { col: 1, row: 3 })).toBe(false);
    expect(canAttach(grid, 'crystal', { col: 0, row: 3 })).toBe(true);
  });

  it('merkt sich gespiegelt nur bei unsymmetrischen Teilen', () => {
    const grid = placeOnGrid(placeOnGrid(createGrid(size), 'stairs', { col: 0, row: 0 }, true), 'wall', { col: 1, row: 0 }, true);
    expect(grid.pieces).toEqual([
      { piece: 'stairs', col: 0, row: 0, flipped: true },
      { piece: 'wall', col: 1, row: 0 },
    ]);
  });

  it('beim Aufnehmen bleibt das Teil gespiegelt', () => {
    const grid = placeOnGrid(build(['wall', 0, 0]), 'flag', { col: 0, row: 0 }, true);
    expect(pickUpAt(grid, { col: 0, row: 0 })).toMatchObject({ picked: 'flag', flipped: true });
  });
});

describe('Seitliche Überhänge (zwei Teile weit)', () => {
  const wide = { cols: 8, rows: 6 };
  const tower = (): GridState =>
    [0, 1, 2].reduce((grid, row) => placeOnGrid(grid, 'wall', { col: 3, row }), createGrid(wide));

  it('ein Mauerteil darf seitlich am Turm hängen, auch zwei weit', () => {
    let grid = tower();
    expect(canPlacePiece(grid, 'wall', { col: 4, row: 2 })).toBe(true);
    expect(canPlacePiece(grid, 'wall', { col: 2, row: 1 })).toBe(true);
    grid = placeOnGrid(grid, 'wall', { col: 4, row: 2 });
    expect(canPlacePiece(grid, 'wall', { col: 5, row: 2 })).toBe(true);
    grid = placeOnGrid(grid, 'wall', { col: 5, row: 2 });
    // Drei Teile weit wäre frei in der Luft.
    expect(canPlacePiece(grid, 'wall', { col: 6, row: 2 })).toBe(false);
  });

  it('ganz frei in der Luft geht nicht', () => {
    expect(canPlacePiece(tower(), 'wall', { col: 5, row: 2 })).toBe(false);
    expect(canPlacePiece(tower(), 'wall', { col: 4, row: 4 })).toBe(false);
  });

  it('auf einem Überhang zählt dessen Abstand weiter', () => {
    let grid = placeOnGrid(placeOnGrid(tower(), 'wall', { col: 4, row: 2 }), 'wall', { col: 5, row: 2 });
    // Oben drauf ist erlaubt (getragen), aber von dort nicht noch weiter hinaus.
    expect(canPlacePiece(grid, 'wall', { col: 5, row: 3 })).toBe(true);
    grid = placeOnGrid(grid, 'wall', { col: 5, row: 3 });
    expect(canPlacePiece(grid, 'wall', { col: 6, row: 3 })).toBe(false);
  });

  it('nur Mauerteile hängen seitlich; Dächer und Umgebung brauchen weiter Halt von unten', () => {
    expect(canPlacePiece(tower(), 'pointedRoof', { col: 4, row: 2 })).toBe(false);
    expect(canPlacePiece(tower(), 'stairs', { col: 4, row: 2 })).toBe(false);
    expect(canPlacePiece(tower(), 'tree', { col: 4, row: 2 })).toBe(false);
    expect(canPlacePiece(tower(), 'wallWide', { col: 4, row: 2 })).toBe(true);
  });

  it('nimmt man den Turm weg, fällt der Überhang mit', () => {
    const grid = placeOnGrid(placeOnGrid(tower(), 'wall', { col: 4, row: 2 }), 'wall', { col: 5, row: 2 });
    const { fallen } = pickUpAt(grid, { col: 3, row: 2 });
    expect(fallen.sort()).toEqual(['wall', 'wall']);
  });
});
