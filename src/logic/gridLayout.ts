import { CELL_SIZE, GROUND_HEIGHT, SIDE_MARGIN, SKY_HEIGHT } from '../data/grid';
import type { Cell, GridSize } from '../types';
import { isInside } from './grid';

export interface WorldLayout {
  width: number;
  height: number;
  cellSize: number;
  gridLeft: number;
  gridTop: number;
  /** Oberkante der Wiese = Unterkante des Rasters. */
  groundTop: number;
  /** Mittelpunkt der Ablage für das nächste Teil. */
  tray: { x: number; y: number };
}

export function worldLayout(size: GridSize): WorldLayout {
  const gridTop = SKY_HEIGHT;
  const groundTop = gridTop + size.rows * CELL_SIZE;
  return {
    width: size.cols * CELL_SIZE + 2 * SIDE_MARGIN,
    height: groundTop + GROUND_HEIGHT,
    cellSize: CELL_SIZE,
    gridLeft: SIDE_MARGIN,
    gridTop,
    groundTop,
    // Links oben bleibt Platz für den Pause-Knopf.
    tray: { x: SIDE_MARGIN + 2 * CELL_SIZE, y: SKY_HEIGHT / 2 },
  };
}

/** Linke obere Ecke einer Zelle in Weltkoordinaten. */
export function cellOrigin(layout: WorldLayout, cell: Cell): { x: number; y: number } {
  return {
    x: layout.gridLeft + cell.col * layout.cellSize,
    y: layout.groundTop - (cell.row + 1) * layout.cellSize,
  };
}

export function cellCenter(layout: WorldLayout, cell: Cell): { x: number; y: number } {
  const origin = cellOrigin(layout, cell);
  return { x: origin.x + layout.cellSize / 2, y: origin.y + layout.cellSize / 2 };
}

/** Zelle unter einem Weltpunkt, oder null außerhalb des Rasters. */
export function cellAt(layout: WorldLayout, size: GridSize, x: number, y: number): Cell | null {
  const cell = {
    col: Math.floor((x - layout.gridLeft) / layout.cellSize),
    row: Math.floor((layout.groundTop - y) / layout.cellSize),
  };
  return isInside(size, cell) ? cell : null;
}
