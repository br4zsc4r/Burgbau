import { describe, expect, it } from 'vitest';
import { CELL_SIZE, GROUND_HEIGHT, SIDE_MARGIN, SKY_HEIGHT } from '../src/data/grid';
import { cellAt, cellCenter, cellOrigin, worldLayout } from '../src/logic/gridLayout';

const size = { cols: 12, rows: 8 };
const layout = worldLayout(size);

describe('worldLayout', () => {
  it('berechnet die Weltgröße aus Raster und Rändern', () => {
    expect(layout.width).toBe(12 * CELL_SIZE + 2 * SIDE_MARGIN);
    expect(layout.height).toBe(SKY_HEIGHT + 8 * CELL_SIZE + GROUND_HEIGHT);
  });

  it('legt Reihe 0 direkt auf die Wiese', () => {
    expect(cellOrigin(layout, { col: 0, row: 0 })).toEqual({
      x: SIDE_MARGIN,
      y: layout.groundTop - CELL_SIZE,
    });
  });

  it('legt die oberste Reihe direkt unter den Himmel', () => {
    expect(cellOrigin(layout, { col: 0, row: 7 }).y).toBe(SKY_HEIGHT);
  });

  it('cellAt ist die Umkehrung von cellCenter', () => {
    for (const cell of [
      { col: 0, row: 0 },
      { col: 11, row: 7 },
      { col: 5, row: 3 },
    ]) {
      const { x, y } = cellCenter(layout, cell);
      expect(cellAt(layout, size, x, y)).toEqual(cell);
    }
  });

  it('liefert null außerhalb des Rasters', () => {
    expect(cellAt(layout, size, layout.tray.x, layout.tray.y)).toBeNull();
    expect(cellAt(layout, size, 1, layout.groundTop + 10)).toBeNull();
    expect(cellAt(layout, size, layout.width - 1, layout.groundTop - 10)).toBeNull();
  });
});
