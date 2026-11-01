import { describe, expect, it } from 'vitest';
import {
  DOWN,
  LEFT,
  RIGHT,
  UP,
  blockTiles,
  neighborMask,
  needsBattlements,
  standaloneTiles,
} from '../src/logic/autotile';
import { createGrid, placeOnGrid } from '../src/logic/grid';
import type { Cell, GridState, PieceId } from '../src/types';

function build(...entries: [PieceId, number, number][]): GridState {
  return entries.reduce(
    (grid, [piece, col, row]) => placeOnGrid(grid, piece, { col, row }),
    createGrid({ cols: 5, rows: 4 }),
  );
}

function tileAt(grid: GridState, cell: Cell) {
  return blockTiles(grid).find((t) => t.cell.col === cell.col && t.cell.row === cell.row);
}

describe('neighborMask', () => {
  it('ist 0 für einen einzelnen Block', () => {
    expect(neighborMask(build(['wall', 2, 0]), { col: 2, row: 0 }, 'stone')).toBe(0);
  });

  it('setzt Bits für Nachbarn aus gleichem Material', () => {
    const grid = build(['wall', 1, 0], ['wall', 2, 0], ['wall', 3, 0], ['wall', 2, 1]);
    expect(neighborMask(grid, { col: 2, row: 0 }, 'stone')).toBe(UP | RIGHT | LEFT);
    expect(neighborMask(grid, { col: 2, row: 1 }, 'stone')).toBe(DOWN);
  });

  it('kann alle 16 Werte annehmen', () => {
    const grid = build(
      ['wall', 1, 0],
      ['wall', 2, 0],
      ['wall', 3, 0],
      ['wall', 1, 1],
      ['wall', 2, 1],
      ['wall', 3, 1],
      ['wall', 2, 2],
    );
    expect(neighborMask(grid, { col: 2, row: 1 }, 'stone')).toBe(15);
  });

  it('Türme sind aus demselben Stein und verschmelzen mit Mauern', () => {
    const grid = build(['wall', 1, 0], ['tower', 2, 0]);
    expect(neighborMask(grid, { col: 1, row: 0 }, 'stone')).toBe(RIGHT);
    expect(neighborMask(grid, { col: 2, row: 0 }, 'stone')).toBe(LEFT);
  });

  it('beschädigte Teile, Tore und Fenster verschmelzen mit Mauern', () => {
    const grid = build(['crackedWall', 0, 0], ['gate', 1, 0], ['windowWall', 2, 0], ['rubble', 3, 0]);
    expect(tileAt(grid, { col: 1, row: 0 })?.mask).toBe(LEFT | RIGHT);
    expect(tileAt(grid, { col: 2, row: 0 })?.mask).toBe(LEFT | RIGHT);
  });

  it('Dächer und Umgebung zählen nicht als Nachbarn', () => {
    const grid = build(['wall', 1, 0], ['tree', 2, 0], ['pointedRoof', 1, 1]);
    expect(tileAt(grid, { col: 1, row: 0 })?.mask).toBe(0);
  });
});

describe('große Teile', () => {
  it('ihre eigenen Zellen sind Nachbarn (keine inneren Kanten)', () => {
    const grid = build(['wallBig', 1, 0]);
    expect(tileAt(grid, { col: 1, row: 0 })?.mask).toBe(UP | RIGHT);
    expect(tileAt(grid, { col: 2, row: 1 })?.mask).toBe(DOWN | LEFT);
  });

  it('verschmelzen mit normalen Mauern', () => {
    const grid = build(['wall', 0, 0], ['wallWide', 1, 0]);
    expect(tileAt(grid, { col: 0, row: 0 })?.mask).toBe(RIGHT);
    expect(tileAt(grid, { col: 1, row: 0 })?.mask).toBe(LEFT | RIGHT);
  });
});

describe('Zinnen', () => {
  it('Mauer ohne etwas darüber bekommt Zinnen', () => {
    const grid = build(['wall', 1, 0], ['wall', 1, 1]);
    expect(tileAt(grid, { col: 1, row: 0 })?.battlements).toBe(false);
    expect(tileAt(grid, { col: 1, row: 1 })?.battlements).toBe(true);
  });

  it('kein Zinnen unter einem Dach oder Überhang', () => {
    expect(needsBattlements(build(['wall', 1, 0], ['pointedRoof', 1, 1]), { col: 1, row: 0 })).toBe(false);
    const overhang = build(['wall', 1, 0], ['wall', 2, 0], ['wallWide', 2, 1]);
    expect(tileAt(overhang, { col: 2, row: 0 })?.battlements).toBe(false);
  });

  it('nur die obere Reihe eines großen Teils, auch beschädigt', () => {
    const grid = build(['ruinWall', 0, 0]);
    expect(tileAt(grid, { col: 0, row: 0 })?.battlements).toBe(false);
    expect(tileAt(grid, { col: 0, row: 1 })?.battlements).toBe(true);
  });

  it('auch Türme bekommen automatische Zinnen', () => {
    expect(tileAt(build(['tower', 1, 0]), { col: 1, row: 0 })?.battlements).toBe(true);
  });

  it('in der obersten Reihe ragen Zinnen in den Himmel', () => {
    const grid = build(['wall', 0, 0], ['wall', 0, 1], ['wall', 0, 2], ['wall', 0, 3]);
    expect(tileAt(grid, { col: 0, row: 3 })?.battlements).toBe(true);
  });
});

describe('blockTiles', () => {
  it('liefert je Blockzelle eine Kachel, nichts für Dächer, Umgebung und Deko', () => {
    const grid = placeOnGrid(build(['wallBig', 0, 0], ['tower', 2, 0], ['coneRoof', 2, 1], ['tree', 3, 0]), 'ivy', { col: 0, row: 0 });
    expect(blockTiles(grid)).toHaveLength(5);
  });
});

describe('standaloneTiles', () => {
  it('einzelner Block hat überall Kanten', () => {
    expect(standaloneTiles('wall')).toEqual([
      { cell: { col: 0, row: 0 }, piece: 'wall', anchor: { col: 0, row: 0 }, material: 'stone', mask: 0, battlements: false },
    ]);
  });

  it('großes Teil verbindet nur seine eigenen Zellen', () => {
    expect(standaloneTiles('towerTall').map((t) => t.mask)).toEqual([UP, DOWN]);
  });

  it('keine Kacheln für Nicht-Blöcke', () => {
    expect(standaloneTiles('pointedRoof')).toEqual([]);
  });
});
