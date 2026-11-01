import type { PieceCategory, PieceDef, PieceId } from '../types';

/**
 * Bauteil-Katalog (Spezifikation Abschnitt 4).
 * Bis zu den Andockpunkten (Phase 4) belegt jedes Teil eine Rasterzelle.
 * Umgebungsteile (Baum, Brunnen …) kommen in der Angebotstabelle nicht vor und fehlen daher noch.
 */
export const PIECES: readonly PieceDef[] = [
  { id: 'wall', category: 'basic', stackable: true },
  { id: 'tower', category: 'basic', stackable: true },
  { id: 'gate', category: 'basic', stackable: true },
  { id: 'windowWall', category: 'basic', stackable: true },

  { id: 'battlements', category: 'finish', stackable: false },
  { id: 'pointedRoof', category: 'finish', stackable: false },
  { id: 'coneRoof', category: 'finish', stackable: false },

  { id: 'flag', category: 'decoration', stackable: false },
  { id: 'pennant', category: 'decoration', stackable: false },
  { id: 'balcony', category: 'decoration', stackable: false },
  { id: 'coatOfArms', category: 'decoration', stackable: false },
  { id: 'torch', category: 'decoration', stackable: false },
  { id: 'ivy', category: 'decoration', stackable: false },
  { id: 'flowerBox', category: 'decoration', stackable: false },

  { id: 'goldenRoof', category: 'premium', stackable: false },
  { id: 'banner', category: 'premium', stackable: false },
  { id: 'stainedGlass', category: 'premium', stackable: true },
  { id: 'dragon', category: 'premium', stackable: false },

  // Beschädigt: funktional gleich wie das Basisteil, nur weniger schön.
  { id: 'crumblingWall', category: 'damaged', stackable: true, base: 'wall' },
  { id: 'holeWall', category: 'damaged', stackable: true, base: 'wall' },
  { id: 'crackedWall', category: 'damaged', stackable: true, base: 'wall' },
  { id: 'plankPatch', category: 'damaged', stackable: true, base: 'wall' },
  { id: 'rubble', category: 'damaged', stackable: true, base: 'wall' },
  { id: 'chippedTower', category: 'damaged', stackable: true, base: 'tower' },
  { id: 'crookedRoof', category: 'damaged', stackable: false, base: 'pointedRoof' },
  { id: 'tornFlag', category: 'damaged', stackable: false, base: 'flag' },
];

const BY_ID = new Map(PIECES.map((piece) => [piece.id, piece]));

export function getPiece(id: PieceId): PieceDef {
  const piece = BY_ID.get(id);
  if (piece === undefined) throw new Error(`Unbekanntes Bauteil: ${id}`);
  return piece;
}

export function piecesOf(category: PieceCategory): PieceDef[] {
  return PIECES.filter((piece) => piece.category === category);
}
