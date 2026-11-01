import { getPiece } from '../data/pieces';
import type { Cell, GridState, Material, PieceId } from '../types';
import { footprint, isInside, pieceAt } from './grid';

/** Bits der Nachbar-Bitmaske: gesetzt = dort grenzt ein Block aus gleichem Material an. */
export const UP = 1;
export const RIGHT = 2;
export const DOWN = 4;
export const LEFT = 8;

export interface BlockTile {
  cell: Cell;
  piece: PieceId;
  /** Ankerzelle des Teils, zu dem die Zelle gehört. */
  anchor: Cell;
  material: Material;
  /** 0–15: an welchen Seiten ein Nachbar aus gleichem Material liegt (dort keine Kante). */
  mask: number;
  /** Block mit freier Zelle darüber: bekommt automatisch Zinnen. */
  battlements: boolean;
}

const SIDES: readonly [number, number, number][] = [
  [UP, 0, 1],
  [RIGHT, 1, 0],
  [DOWN, 0, -1],
  [LEFT, -1, 0],
];

function materialAt(grid: GridState, cell: Cell): Material | null {
  const placed = pieceAt(grid, cell);
  return placed === null ? null : (getPiece(placed.piece).material ?? null);
}

/** Bitmaske für eine Zelle: welche Nachbarn haben dasselbe Material? */
export function neighborMask(grid: GridState, cell: Cell, material: Material): number {
  let mask = 0;
  for (const [bit, dx, dy] of SIDES) {
    if (materialAt(grid, { col: cell.col + dx, row: cell.row + dy }) === material) mask |= bit;
  }
  return mask;
}

/** Ein Block ohne Teil darüber bekommt Zinnen (oberste Reihe: Zinnen ragen in den Himmel). */
export function needsBattlements(grid: GridState, cell: Cell): boolean {
  const above = { col: cell.col, row: cell.row + 1 };
  return !isInside(grid, above) || pieceAt(grid, above) === null;
}

/** Alle Zellen aller Blöcke mit Bitmaske und automatischem Abschluss. */
export function blockTiles(grid: GridState): BlockTile[] {
  return grid.pieces.flatMap((placed) => {
    const def = getPiece(placed.piece);
    const material = def.material;
    if (def.kind !== 'block' || material === undefined) return [];
    const anchor = { col: placed.col, row: placed.row };
    return footprint(def, anchor).map((cell) => ({
      cell,
      piece: placed.piece,
      anchor,
      material,
      mask: neighborMask(grid, cell, material),
      battlements: needsBattlements(grid, cell),
    }));
  });
}

/**
 * Kacheln eines einzelnen Teils für sich (Ablage, Vorschau): Nachbarn sind nur
 * die eigenen Zellen, Zellen relativ zur Ankerzelle 0/0, keine Zinnen.
 */
export function standaloneTiles(id: PieceId): BlockTile[] {
  const def = getPiece(id);
  const material = def.material;
  if (def.kind !== 'block' || material === undefined) return [];
  const cells = footprint(def, { col: 0, row: 0 });
  const inside = (col: number, row: number) => col >= 0 && col < def.width && row >= 0 && row < def.height;
  return cells.map((cell) => {
    let mask = 0;
    for (const [bit, dx, dy] of SIDES) {
      if (inside(cell.col + dx, cell.row + dy)) mask |= bit;
    }
    return { cell, piece: id, anchor: { col: 0, row: 0 }, material, mask, battlements: false };
  });
}
