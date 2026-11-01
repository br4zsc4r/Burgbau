import { describe, expect, it } from 'vitest';
import {
  canPlace,
  createGrid,
  getCell,
  placePiece,
  removePiece,
  validCells,
} from '../src/logic/grid';

const size = { cols: 3, rows: 3 };

describe('grid', () => {
  it('startet leer', () => {
    const grid = createGrid(size);
    expect(grid.cells).toHaveLength(9);
    expect(grid.cells.every((cell) => cell === null)).toBe(true);
  });

  describe('Schwerkraft-Regel', () => {
    it('erlaubt die unterste Reihe', () => {
      expect(canPlace(createGrid(size), { col: 1, row: 0 })).toBe(true);
    });

    it('verbietet schwebende Teile', () => {
      expect(canPlace(createGrid(size), { col: 1, row: 1 })).toBe(false);
    });

    it('erlaubt Teile auf anderen Teilen', () => {
      const grid = placePiece(createGrid(size), { col: 1, row: 0 }, 'wall');
      expect(canPlace(grid, { col: 1, row: 1 })).toBe(true);
      expect(canPlace(grid, { col: 0, row: 1 })).toBe(false);
    });

    it('verbietet Teile auf Dächern und Dekorationen', () => {
      for (const top of ['pointedRoof', 'battlements', 'flag', 'dragon', 'tornFlag'] as const) {
        const grid = placePiece(createGrid(size), { col: 1, row: 0 }, top);
        expect(canPlace(grid, { col: 1, row: 1 })).toBe(false);
      }
    });

    it('erlaubt Teile auf beschädigten Blöcken', () => {
      for (const damaged of ['crackedWall', 'rubble', 'chippedTower'] as const) {
        const grid = placePiece(createGrid(size), { col: 1, row: 0 }, damaged);
        expect(canPlace(grid, { col: 1, row: 1 })).toBe(true);
      }
    });

    it('verbietet belegte Zellen', () => {
      const grid = placePiece(createGrid(size), { col: 0, row: 0 }, 'wall');
      expect(canPlace(grid, { col: 0, row: 0 })).toBe(false);
    });

    it.each([
      { col: -1, row: 0 },
      { col: 3, row: 0 },
      { col: 0, row: -1 },
      { col: 0, row: 3 },
    ])('verbietet Zellen außerhalb (%o)', (cell) => {
      expect(canPlace(createGrid(size), cell)).toBe(false);
    });
  });

  describe('validCells', () => {
    it('ist im leeren Raster die unterste Reihe', () => {
      expect(validCells(createGrid(size))).toEqual([
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
      ]);
    });

    it('liegt pro Spalte über dem obersten Teil', () => {
      let grid = createGrid(size);
      grid = placePiece(grid, { col: 0, row: 0 }, 'wall');
      grid = placePiece(grid, { col: 0, row: 1 }, 'wall');
      grid = placePiece(grid, { col: 2, row: 0 }, 'wall');
      expect(validCells(grid)).toEqual([
        { col: 0, row: 2 },
        { col: 1, row: 0 },
        { col: 2, row: 1 },
      ]);
    });

    it('lässt Spalten mit Dach aus', () => {
      const grid = placePiece(createGrid(size), { col: 1, row: 0 }, 'coneRoof');
      expect(validCells(grid)).toEqual([
        { col: 0, row: 0 },
        { col: 2, row: 0 },
      ]);
    });

    it('ist leer, wenn das Raster voll ist', () => {
      let grid = createGrid({ cols: 2, rows: 1 });
      grid = placePiece(grid, { col: 0, row: 0 }, 'wall');
      grid = placePiece(grid, { col: 1, row: 0 }, 'wall');
      expect(validCells(grid)).toEqual([]);
    });
  });

  describe('placePiece / removePiece', () => {
    it('verändert das Original nicht', () => {
      const grid = createGrid(size);
      const placed = placePiece(grid, { col: 0, row: 0 }, 'wall');
      expect(getCell(grid, { col: 0, row: 0 })).toBeNull();
      expect(getCell(placed, { col: 0, row: 0 })).toBe('wall');
    });

    it('wirft bei ungültiger Zelle', () => {
      expect(() => placePiece(createGrid(size), { col: 0, row: 2 }, 'wall')).toThrow();
    });

    it('entfernt ein oben liegendes Teil', () => {
      const grid = placePiece(createGrid(size), { col: 0, row: 0 }, 'wall');
      expect(getCell(removePiece(grid, { col: 0, row: 0 }), { col: 0, row: 0 })).toBeNull();
    });

    it('entfernt kein Teil, auf dem noch etwas steht', () => {
      let grid = placePiece(createGrid(size), { col: 0, row: 0 }, 'wall');
      grid = placePiece(grid, { col: 0, row: 1 }, 'wall');
      expect(() => removePiece(grid, { col: 0, row: 0 })).toThrow();
    });

    it('bleibt als JSON serialisierbar', () => {
      const grid = placePiece(createGrid(size), { col: 1, row: 0 }, 'wall');
      expect(JSON.parse(JSON.stringify(grid))).toEqual(grid);
    });
  });
});
