import type { Cell, GridSize, GridState, PieceId } from '../types';

export function createGrid(size: GridSize): GridState {
  return { ...size, cells: Array.from({ length: size.cols * size.rows }, () => null) };
}

export function isInside(grid: GridSize, cell: Cell): boolean {
  return cell.col >= 0 && cell.col < grid.cols && cell.row >= 0 && cell.row < grid.rows;
}

export function getCell(grid: GridState, cell: Cell): PieceId | null {
  if (!isInside(grid, cell)) return null;
  return grid.cells[cell.row * grid.cols + cell.col] ?? null;
}

/** Schwerkraft-Regel: Zelle frei und darunter Boden oder ein Teil. */
export function canPlace(grid: GridState, cell: Cell): boolean {
  if (!isInside(grid, cell) || getCell(grid, cell) !== null) return false;
  return cell.row === 0 || getCell(grid, { col: cell.col, row: cell.row - 1 }) !== null;
}

/** Alle Zellen, auf die gerade ein Teil gesetzt werden darf (höchstens eine pro Spalte). */
export function validCells(grid: GridState): Cell[] {
  const result: Cell[] = [];
  for (let col = 0; col < grid.cols; col++) {
    for (let row = 0; row < grid.rows; row++) {
      if (canPlace(grid, { col, row })) {
        result.push({ col, row });
        break;
      }
    }
  }
  return result;
}

function withCell(grid: GridState, cell: Cell, value: PieceId | null): GridState {
  const cells = [...grid.cells];
  cells[cell.row * grid.cols + cell.col] = value;
  return { ...grid, cells };
}

export function placePiece(grid: GridState, cell: Cell, piece: PieceId): GridState {
  if (!canPlace(grid, cell)) throw new Error(`Zelle ${cell.col}/${cell.row} ist nicht frei bebaubar`);
  return withCell(grid, cell, piece);
}

/** Entfernt ein Teil. Nur für Rückgängig gedacht: Darüber darf nichts stehen. */
export function removePiece(grid: GridState, cell: Cell): GridState {
  if (getCell(grid, cell) === null) throw new Error(`Zelle ${cell.col}/${cell.row} ist leer`);
  if (getCell(grid, { col: cell.col, row: cell.row + 1 }) !== null) {
    throw new Error(`Auf Zelle ${cell.col}/${cell.row} steht noch ein Teil`);
  }
  return withCell(grid, cell, null);
}
