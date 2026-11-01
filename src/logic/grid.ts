import { getPiece, isStackable } from '../data/pieces';
import type {
  Cell,
  GridSize,
  GridState,
  PieceDef,
  PieceId,
  PlacedAttachment,
  PlacedPiece,
  Placement,
} from '../types';

export function createGrid(size: GridSize): GridState {
  return { ...size, pieces: [], attachments: [] };
}

export function isInside(grid: GridSize, cell: Cell): boolean {
  return cell.col >= 0 && cell.col < grid.cols && cell.row >= 0 && cell.row < grid.rows;
}

function same(a: Cell, b: Cell): boolean {
  return a.col === b.col && a.row === b.row;
}

/** Alle Zellen, die ein Teil mit dieser Ankerzelle (unten links) bedeckt. */
export function footprint(piece: PieceDef, anchor: Cell): Cell[] {
  const cells: Cell[] = [];
  for (let dy = 0; dy < piece.height; dy++) {
    for (let dx = 0; dx < piece.width; dx++) {
      cells.push({ col: anchor.col + dx, row: anchor.row + dy });
    }
  }
  return cells;
}

/** Zellen, die ein Teil oder eine Dekoration (nur ihre Andockzelle) bedeckt. */
export function coveredCells(id: PieceId, anchor: Cell): Cell[] {
  const piece = getPiece(id);
  return piece.kind === 'attachment' ? [anchor] : footprint(piece, anchor);
}

/** Das gesetzte Teil, das diese Zelle bedeckt. */
export function pieceAt(grid: GridState, cell: Cell): PlacedPiece | null {
  return (
    grid.pieces.find((placed) =>
      footprint(getPiece(placed.piece), placed).some((c) => same(c, cell)),
    ) ?? null
  );
}

function attachmentsAt(grid: GridState, cell: Cell): PlacedAttachment[] {
  return grid.attachments.filter((attachment) => same(attachment, cell));
}

/** Über einer Fahne oder einem Drachen bleibt die Zelle frei (dort weht die Fahne). */
function isReserved(grid: GridState, cell: Cell): boolean {
  return attachmentsAt(grid, { col: cell.col, row: cell.row - 1 }).some(
    (attachment) => getPiece(attachment.piece).slot === 'top',
  );
}

function isFree(grid: GridState, cell: Cell): boolean {
  return isInside(grid, cell) && pieceAt(grid, cell) === null && !isReserved(grid, cell);
}

function supports(grid: GridState, cell: Cell): boolean {
  const below = pieceAt(grid, cell);
  return below !== null && isStackable(getPiece(below.piece));
}

/**
 * Schwerkraft-Regel: Alle Zellen frei, und unter mindestens einer Spalte Boden
 * oder ein Teil, auf dem man bauen kann. Große Teile dürfen so überhängen.
 * Umgebungsteile stehen nur auf dem Boden.
 */
export function canPlacePiece(grid: GridState, id: PieceId, anchor: Cell): boolean {
  const piece = getPiece(id);
  if (piece.kind === 'attachment') return false;
  if (!footprint(piece, anchor).every((cell) => isFree(grid, cell))) return false;
  if (anchor.row === 0) return true;
  if (piece.kind === 'ground') return false;
  for (let dx = 0; dx < piece.width; dx++) {
    if (supports(grid, { col: anchor.col + dx, row: anchor.row - 1 })) return true;
  }
  return false;
}

/** Andock-Regeln: Efeu auf Blöcke, Front-Deko an passende Vorderseite, Fahne oben drauf. */
export function canAttach(grid: GridState, id: PieceId, target: Cell): boolean {
  const deco = getPiece(id);
  if (deco.kind !== 'attachment' || deco.slot === undefined) return false;
  const host = pieceAt(grid, target);
  if (host === null) return false;
  const hostDef = getPiece(host.piece);
  const slotTaken = attachmentsAt(grid, target).some(
    (attachment) => getPiece(attachment.piece).slot === deco.slot,
  );
  if (slotTaken) return false;

  switch (deco.slot) {
    case 'growth':
      return hostDef.kind === 'block';
    case 'front':
      return hostDef.kind === 'block' && hostDef.front === deco.fits;
    case 'top': {
      if (hostDef.topMount !== true) return false;
      const above = { col: target.col, row: target.row + 1 };
      // Oberste Rasterreihe: Die Fahne ragt in den Himmel.
      return !isInside(grid, above) || isFree(grid, above);
    }
  }
}

/** Platz mit genau dieser Ankerzelle, oder null wenn das Teil dort nicht passt. */
export function placementAt(grid: GridState, id: PieceId, anchor: Cell): Placement | null {
  const piece = getPiece(id);
  if (piece.kind === 'attachment') {
    return canAttach(grid, id, anchor) ? { anchor, cells: [anchor] } : null;
  }
  return canPlacePiece(grid, id, anchor) ? { anchor, cells: footprint(piece, anchor) } : null;
}

/** Alle Plätze, an die das Teil gerade passt. */
export function validPlacements(grid: GridState, id: PieceId): Placement[] {
  const result: Placement[] = [];
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const placement = placementAt(grid, id, { col, row });
      if (placement !== null) result.push(placement);
    }
  }
  return result;
}

export function isPlaceable(grid: GridState, id: PieceId): boolean {
  return validPlacements(grid, id).length > 0;
}

/**
 * Platz für ein Teil, wenn das Kind auf eine Zelle tippt oder es dorthin zieht.
 * Erst die bevorzugte Ankerzelle (z. B. aus der Lage beim Ziehen), dann eine Lage,
 * bei der die Zelle möglichst weit unten links im Teil liegt.
 */
export function resolvePlacement(
  grid: GridState,
  id: PieceId,
  cell: Cell,
  preferredAnchor: Cell | null = null,
): Placement | null {
  if (preferredAnchor !== null) {
    const preferred = placementAt(grid, id, preferredAnchor);
    if (preferred !== null) return preferred;
  }
  const piece = getPiece(id);
  for (let dy = 0; dy < piece.height; dy++) {
    for (let dx = 0; dx < piece.width; dx++) {
      const placement = placementAt(grid, id, { col: cell.col - dx, row: cell.row - dy });
      if (placement !== null) return placement;
    }
  }
  return null;
}

/** Setzt ein Teil oder dockt eine Dekoration an; wirft bei ungültigem Platz. */
export function placeOnGrid(grid: GridState, id: PieceId, anchor: Cell): GridState {
  if (placementAt(grid, id, anchor) === null) {
    throw new Error(`${id} passt nicht an ${String(anchor.col)}/${String(anchor.row)}`);
  }
  const entry = { piece: id, col: anchor.col, row: anchor.row };
  return getPiece(id).kind === 'attachment'
    ? { ...grid, attachments: [...grid.attachments, entry] }
    : { ...grid, pieces: [...grid.pieces, entry] };
}

/** Entfernt ein Teil wieder (für Rückgängig: Es darf nichts darauf aufbauen). */
export function removeFromGrid(grid: GridState, id: PieceId, anchor: Cell): GridState {
  const matches = (entry: PlacedPiece): boolean => entry.piece === id && same(entry, anchor);
  if (getPiece(id).kind === 'attachment') {
    if (!grid.attachments.some(matches)) throw new Error(`${id} ist nicht angedockt`);
    return { ...grid, attachments: grid.attachments.filter((entry) => !matches(entry)) };
  }
  if (!grid.pieces.some(matches)) throw new Error(`${id} ist nicht gesetzt`);
  return { ...grid, pieces: grid.pieces.filter((entry) => !matches(entry)) };
}

/** Steht das Teil noch? Boden oder unter mindestens einer Spalte ein Teil zum Draufbauen. */
function isSupported(grid: GridState, placed: PlacedPiece): boolean {
  if (placed.row === 0) return true;
  const def = getPiece(placed.piece);
  if (def.kind === 'ground') return false;
  for (let dx = 0; dx < def.width; dx++) {
    if (supports(grid, { col: placed.col + dx, row: placed.row - 1 })) return true;
  }
  return false;
}

const SLOT_PRIORITY = { top: 0, front: 1, growth: 2 } as const;

/**
 * Bearbeitungsmodus: das oberste Ding an einer Zelle aufnehmen – erst Dekorationen
 * (Fahne vor Front-Deko vor Efeu), sonst das Teil. Was danach keinen Halt mehr hat,
 * fällt mit heraus (auch Dekorationen ohne Träger).
 */
export function pickUpAt(
  grid: GridState,
  cell: Cell,
): { grid: GridState; picked: PieceId | null; fallen: PieceId[] } {
  const decorations = attachmentsAt(grid, cell).sort(
    (a, b) =>
      SLOT_PRIORITY[getPiece(a.piece).slot ?? 'growth'] - SLOT_PRIORITY[getPiece(b.piece).slot ?? 'growth'],
  );
  const decoration = decorations[0];
  if (decoration !== undefined) {
    return {
      grid: { ...grid, attachments: grid.attachments.filter((a) => a !== decoration) },
      picked: decoration.piece,
      fallen: [],
    };
  }

  const target = pieceAt(grid, cell);
  if (target === null) return { grid, picked: null, fallen: [] };

  let pieces = grid.pieces.filter((p) => p !== target);
  const fallen: PieceId[] = [];
  // Was keinen Halt mehr hat, fällt – so lange, bis alles wieder steht.
  for (;;) {
    const current: GridState = { ...grid, pieces };
    const loose = pieces.filter((p) => !isSupported(current, p));
    if (loose.length === 0) break;
    fallen.push(...loose.map((p) => p.piece));
    pieces = pieces.filter((p) => !loose.includes(p));
  }

  const remaining: GridState = { ...grid, pieces, attachments: [] };
  const attachments = grid.attachments.filter((a) => pieceAt(remaining, a) !== null);
  fallen.push(...grid.attachments.filter((a) => !attachments.includes(a)).map((a) => a.piece));
  return { grid: { ...remaining, attachments }, picked: target.piece, fallen };
}
