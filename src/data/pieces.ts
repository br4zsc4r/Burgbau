import type { PieceCategory, PieceDef, PieceId } from '../types';

const block = { kind: 'block', width: 1, height: 1, material: 'stone', front: 'plain' } as const;
const tower = { ...block, material: 'towerStone', topMount: true } as const;
const cap = { kind: 'cap', width: 1, height: 1, topMount: true } as const;
const deco = { kind: 'attachment', width: 1, height: 1 } as const;
const ground = { kind: 'ground', width: 1, height: 1 } as const;

/**
 * Bauteil-Katalog (Spezifikation Abschnitt 4 und Abschnitt 13, Vorgaben für Phase 4).
 * Große Teile haben width/height > 1 und eine Mindest-Serie.
 */
export const PIECES: readonly PieceDef[] = [
  { id: 'wall', category: 'basic', ...block },
  { id: 'tower', category: 'basic', ...tower },
  { id: 'gate', category: 'basic', ...block, front: 'none' },
  { id: 'windowWall', category: 'basic', ...block, front: 'window' },
  { id: 'wallWide', category: 'basic', ...block, width: 2, minStreak: 1 },
  { id: 'towerTall', category: 'basic', ...tower, height: 2, minStreak: 1 },
  { id: 'wallBig', category: 'basic', ...block, width: 2, height: 2, minStreak: 5 },
  { id: 'gateBig', category: 'basic', ...block, width: 2, height: 2, front: 'none', minStreak: 5 },

  { id: 'battlements', category: 'finish', ...cap },
  { id: 'pointedRoof', category: 'finish', ...cap },
  { id: 'coneRoof', category: 'finish', ...cap },
  { id: 'pointedRoofTall', category: 'finish', ...cap, height: 2, minStreak: 5 },

  { id: 'flag', category: 'decoration', ...deco, slot: 'top' },
  { id: 'pennant', category: 'decoration', ...deco, slot: 'top' },
  { id: 'balcony', category: 'decoration', ...deco, slot: 'front', fits: 'plain' },
  { id: 'coatOfArms', category: 'decoration', ...deco, slot: 'front', fits: 'plain' },
  { id: 'torch', category: 'decoration', ...deco, slot: 'front', fits: 'plain' },
  { id: 'ivy', category: 'decoration', ...deco, slot: 'growth' },
  { id: 'flowerBox', category: 'decoration', ...deco, slot: 'front', fits: 'window' },

  { id: 'goldenRoof', category: 'premium', ...cap },
  { id: 'banner', category: 'premium', ...deco, slot: 'front', fits: 'plain' },
  { id: 'stainedGlass', category: 'premium', ...block, front: 'window' },
  { id: 'dragon', category: 'premium', ...deco, slot: 'top' },

  { id: 'tree', category: 'environment', ...ground },
  { id: 'well', category: 'environment', ...ground },
  { id: 'moat', category: 'environment', ...ground },
  { id: 'drawbridge', category: 'environment', ...ground },

  // Beschädigt: verhalten sich wie ihr Basisteil, sehen nur weniger schön aus.
  { id: 'crumblingWall', category: 'damaged', ...block, base: 'wall' },
  { id: 'holeWall', category: 'damaged', ...block, base: 'wall' },
  { id: 'crackedWall', category: 'damaged', ...block, base: 'wall' },
  { id: 'plankPatch', category: 'damaged', ...block, base: 'wall' },
  { id: 'rubble', category: 'damaged', ...block, base: 'wall' },
  { id: 'chippedTower', category: 'damaged', ...tower, base: 'tower' },
  { id: 'crookedRoof', category: 'damaged', ...cap, base: 'pointedRoof' },
  { id: 'tornFlag', category: 'damaged', ...deco, slot: 'top', base: 'flag' },
  { id: 'crumblingWallWide', category: 'damaged', ...block, width: 2, minStreak: 1, base: 'wallWide' },
  { id: 'chippedTowerTall', category: 'damaged', ...tower, height: 2, minStreak: 1, base: 'towerTall' },
  { id: 'ruinWall', category: 'damaged', ...block, width: 2, height: 2, minStreak: 5, base: 'wallBig' },
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

/** Man kann darauf weiterbauen. */
export function isStackable(piece: PieceDef): boolean {
  return piece.kind === 'block';
}

export function isLarge(piece: PieceDef): boolean {
  return piece.width > 1 || piece.height > 1;
}
