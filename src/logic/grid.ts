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

/** So viele Teile weit darf ein Mauerteil seitlich von einem getragenen Mauerstück in die Luft ragen. */
export const MAX_SIDE_OVERHANG = 2;

/** Mauerstück (zum Draufbauen) an dieser Zelle, sonst null. */
function stackableAt(grid: GridState, cell: Cell): PlacedPiece | null {
  const placed = pieceAt(grid, cell);
  return placed !== null && isStackable(getPiece(placed.piece)) ? placed : null;
}

/**
 * Halt eines Teils mit dieser Ankerzelle, aus dem Halt der Nachbarn:
 * 0 = auf dem Boden; von unten getragen = Halt des tragenden Teils;
 * seitlich an einem Mauerstück (nur Mauerteile) = dessen Halt + 1. Infinity = kein Halt.
 */
function holdOf(grid: GridState, def: PieceDef, anchor: Cell, held: (placed: PlacedPiece) => number): number {
  if (anchor.row === 0) return 0;
  if (def.kind === 'ground') return Infinity;
  let best = Infinity;
  for (let dx = 0; dx < def.width; dx++) {
    const below = stackableAt(grid, { col: anchor.col + dx, row: anchor.row - 1 });
    if (below !== null) best = Math.min(best, held(below));
  }
  if (def.kind === 'block') {
    for (let dy = 0; dy < def.height; dy++) {
      for (const col of [anchor.col - 1, anchor.col + def.width]) {
        const side = stackableAt(grid, { col, row: anchor.row + dy });
        if (side !== null) best = Math.min(best, held(side) + 1);
      }
    }
  }
  return best;
}

const holdCache = new WeakMap<GridState, Map<PlacedPiece, number>>();

/** Halt aller gesetzten Teile (zwischengespeichert je Raster – Raster werden nie verändert). */
function holds(grid: GridState): Map<PlacedPiece, number> {
  const cached = holdCache.get(grid);
  if (cached !== undefined) return cached;
  const hold = new Map<PlacedPiece, number>(grid.pieces.map((placed) => [placed, Infinity]));
  const held = (placed: PlacedPiece): number => hold.get(placed) ?? Infinity;
  // Wie bei kürzesten Wegen: so lange verbessern, bis sich nichts mehr ändert.
  for (let changed = true; changed; ) {
    changed = false;
    for (const placed of grid.pieces) {
      const value = holdOf(grid, getPiece(placed.piece), placed, held);
      if (value < held(placed)) {
        hold.set(placed, value);
        changed = true;
      }
    }
  }
  holdCache.set(grid, hold);
  return hold;
}

/**
 * Schwerkraft-Regel: Alle Zellen frei, und das Teil hat Halt – Boden oder ein Teil zum
 * Draufbauen unter mindestens einer Spalte (große Teile dürfen so überhängen), oder bei
 * Mauerteilen ein Mauerstück daneben, höchstens zwei Teile weit von einem getragenen weg.
 * Umgebungsteile stehen nur auf dem Boden.
 */
export function canPlacePiece(grid: GridState, id: PieceId, anchor: Cell): boolean {
  const piece = getPiece(id);
  if (piece.kind === 'attachment') return false;
  if (!footprint(piece, anchor).every((cell) => isFree(grid, cell))) return false;
  const hold = holds(grid);
  return holdOf(grid, piece, anchor, (placed) => hold.get(placed) ?? Infinity) <= MAX_SIDE_OVERHANG;
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
      // Breites Dach mit nur einer Spitze: nur an dieser Spalte.
      if (hostDef.mountDx !== undefined && target.col !== host.col + hostDef.mountDx) return false;
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
export function placeOnGrid(grid: GridState, id: PieceId, anchor: Cell, flipped = false): GridState {
  if (placementAt(grid, id, anchor) === null) {
    throw new Error(`${id} passt nicht an ${String(anchor.col)}/${String(anchor.row)}`);
  }
  const entry: PlacedPiece = { piece: id, col: anchor.col, row: anchor.row };
  if (flipped && getPiece(id).mirror === true) entry.flipped = true;
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

/** Steht das Teil noch? Gleiche Regel wie beim Setzen (Boden, von unten, seitlich). */
function isSupported(grid: GridState, placed: PlacedPiece): boolean {
  return (holds(grid).get(placed) ?? Infinity) <= MAX_SIDE_OVERHANG;
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
): { grid: GridState; picked: PieceId | null; flipped: boolean; fallen: PieceId[] } {
  const decorations = attachmentsAt(grid, cell).sort(
    (a, b) =>
      SLOT_PRIORITY[getPiece(a.piece).slot ?? 'growth'] - SLOT_PRIORITY[getPiece(b.piece).slot ?? 'growth'],
  );
  const decoration = decorations[0];
  if (decoration !== undefined) {
    return {
      grid: { ...grid, attachments: grid.attachments.filter((a) => a !== decoration) },
      picked: decoration.piece,
      flipped: decoration.flipped === true,
      fallen: [],
    };
  }

  const target = pieceAt(grid, cell);
  if (target === null) return { grid, picked: null, flipped: false, fallen: [] };

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
  return { grid: { ...remaining, attachments }, picked: target.piece, flipped: target.flipped === true, fallen };
}
