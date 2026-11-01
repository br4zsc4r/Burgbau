import type { PieceCategory, PieceDef, PieceId, Rarity } from '../types';

// Mauern und Türme sind aus demselben Stein, verschmelzen und tragen Fahnen auf ihren Zinnen.
const block = { kind: 'block', width: 1, height: 1, material: 'stone', front: 'plain', topMount: true } as const;
const tower = block;
const cap = { kind: 'cap', width: 1, height: 1, topMount: true } as const;
const roof = { ...cap, roof: true } as const;
const deco = { kind: 'attachment', width: 1, height: 1 } as const;
const ground = { kind: 'ground', width: 1, height: 1 } as const;

/**
 * Bauteil-Katalog (Spezifikation Abschnitt 4 und Abschnitt 13, Vorgaben für Phase 4).
 * Große Teile haben width/height > 1 und eine Mindest-Serie; seltene Teile eine Seltenheit.
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
  { id: 'towerBig', category: 'basic', ...tower, width: 2, height: 2, minStreak: 5 },
  { id: 'windowWallBig', category: 'basic', ...block, width: 2, height: 2, front: 'window', minStreak: 5 },
  { id: 'stainedGlass', category: 'basic', ...block, front: 'window', rarity: 'rare' },
  { id: 'portcullis', category: 'basic', ...block, front: 'none', rarity: 'rare' },
  // Bogen: unten offen, man sieht hindurch – eine Brücke zwischen zwei Mauerteilen.
  { id: 'arch', category: 'basic', ...block, width: 2, front: 'none', minStreak: 1, rarity: 'rare' },
  // Brückenbögen liegen auf zwei Türmen: erste und letzte Zelle gemauert, dazwischen die Öffnung.
  { id: 'bridgeArch', category: 'basic', ...block, width: 3, front: 'none', minStreak: 1, rarity: 'rare' },
  { id: 'bridgeArchWide', category: 'basic', ...block, width: 4, front: 'none', minStreak: 1, rarity: 'rare' },

  // Zinnen entstehen inzwischen automatisch; das Teil bleibt nur für alte Burgen erhalten.
  { id: 'battlements', category: 'finish', ...cap, retired: true },
  { id: 'pointedRoof', category: 'finish', ...roof },
  { id: 'coneRoof', category: 'finish', ...roof },
  { id: 'pointedRoofTall', category: 'finish', ...roof, height: 2, minStreak: 5 },
  // Großes Dach: eine Spitze zwischen den beiden Zellen; die Fahne dockt an der linken an.
  { id: 'roofBig', category: 'finish', ...roof, width: 2, height: 2, mountDx: 0, minStreak: 5 },
  { id: 'goldenRoof', category: 'finish', ...roof, rarity: 'rare' },
  { id: 'bellRoof', category: 'finish', ...roof, rarity: 'rare' },
  // Hoher Turmhelm: eine Spalte breit, ragt aber links und rechts je eine halbe Zelle über.
  { id: 'spireRoof', category: 'finish', ...roof, height: 3, minStreak: 5 },

  { id: 'flag', category: 'decoration', ...deco, slot: 'top', mirror: true },
  { id: 'pennant', category: 'decoration', ...deco, slot: 'top', mirror: true },
  { id: 'balcony', category: 'decoration', ...deco, slot: 'front', fits: 'plain' },
  { id: 'coatOfArms', category: 'decoration', ...deco, slot: 'front', fits: 'plain' },
  { id: 'torch', category: 'decoration', ...deco, slot: 'front', fits: 'plain' },
  { id: 'ivy', category: 'decoration', ...deco, slot: 'growth', mirror: true },
  { id: 'flowerBox', category: 'decoration', ...deco, slot: 'front', fits: 'window' },
  { id: 'banner', category: 'decoration', ...deco, slot: 'front', fits: 'plain', rarity: 'rare' },
  // Treppe: steht wie ein Dach auf dem Boden oder einem Block, darauf kann man nicht bauen.
  { id: 'stairs', category: 'decoration', ...cap, topMount: false, mirror: true },

  { id: 'dragon', category: 'premium', ...deco, slot: 'top', mirror: true, rarity: 'epic' },
  { id: 'giantFlag', category: 'premium', ...deco, slot: 'top', mirror: true, rarity: 'epic' },
  { id: 'crystal', category: 'premium', ...deco, slot: 'top', rarity: 'epic' },
  { id: 'ghost', category: 'premium', ...deco, slot: 'front', fits: 'plain', rarity: 'epic' },
  { id: 'treasureChest', category: 'premium', ...ground, rarity: 'epic' },
  { id: 'fireDragon', category: 'premium', ...deco, slot: 'top', mirror: true, rarity: 'legendary' },
  { id: 'windmill', category: 'premium', ...cap, width: 2, height: 2, topMount: false, minStreak: 1, rarity: 'legendary' },
  { id: 'balloon', category: 'premium', ...cap, height: 2, topMount: false, minStreak: 1, rarity: 'legendary' },
  { id: 'observatory', category: 'premium', ...roof, topMount: false, mirror: true, rarity: 'legendary' },
  { id: 'unicorn', category: 'premium', ...ground, mirror: true, rarity: 'legendary' },

  { id: 'tree', category: 'environment', ...ground },
  { id: 'well', category: 'environment', ...ground },
  { id: 'moat', category: 'environment', ...ground },
  { id: 'drawbridge', category: 'environment', ...ground, mirror: true },
  { id: 'barrels', category: 'environment', ...ground, mirror: true },
  { id: 'fountain', category: 'environment', ...ground, rarity: 'rare' },

  // Beschädigt: verhalten sich wie ihr Basisteil, sehen nur weniger schön aus.
  { id: 'crumblingWall', category: 'damaged', ...block, base: 'wall' },
  { id: 'holeWall', category: 'damaged', ...block, base: 'wall' },
  { id: 'crackedWall', category: 'damaged', ...block, base: 'wall' },
  { id: 'plankPatch', category: 'damaged', ...block, base: 'wall' },
  { id: 'rubble', category: 'damaged', ...block, base: 'wall' },
  { id: 'chippedTower', category: 'damaged', ...tower, base: 'tower' },
  { id: 'crookedRoof', category: 'damaged', ...roof, base: 'pointedRoof' },
  { id: 'tornFlag', category: 'damaged', ...deco, slot: 'top', mirror: true, base: 'flag' },
  { id: 'crumblingWallWide', category: 'damaged', ...block, width: 2, minStreak: 1, base: 'wallWide' },
  { id: 'chippedTowerTall', category: 'damaged', ...tower, height: 2, minStreak: 1, base: 'towerTall' },
  { id: 'ruinWall', category: 'damaged', ...block, width: 2, height: 2, minStreak: 5, base: 'wallBig' },
  { id: 'ruinTower', category: 'damaged', ...tower, width: 2, height: 2, minStreak: 5, base: 'towerBig' },
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

export function rarityOf(piece: PieceDef): Rarity {
  return piece.rarity ?? 'common';
}

export function isMirrorable(id: PieceId): boolean {
  return getPiece(id).mirror === true;
}

export function isLarge(piece: PieceDef): boolean {
  return piece.width > 1 || piece.height > 1;
}

/** Wird gerade angeboten (stillgelegte Teile nicht). */
export function isOffered(piece: PieceDef): boolean {
  return piece.retired !== true;
}
