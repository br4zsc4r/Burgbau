import type { DamagedPieceId, NormalPieceId, PieceId } from '../types';
import { getPiece } from './pieces';

/** Platzhalter-Grafiken (bis Phase 8), relativ zur index.html. */
const ART_DIR = 'assets/placeholder/';

export const DAMAGE_OVERLAY_URL = `${ART_DIR}damage.svg`;
export const TORCH_LIT_URL = `${ART_DIR}torch-lit.svg`;
export const TORCH_UNLIT_URL = `${ART_DIR}torch-unlit.svg`;

export function pieceArtUrl(id: NormalPieceId): string {
  return `${ART_DIR}pieces/${id}.svg`;
}

/**
 * Beschädigte Teile = Grafik des Basisteils, multiplikativ eingefärbt, plus Schadens-Overlay.
 * Die Farbvariante unterscheidet die Teile, bis Phase 4 eigene Overlays bringt.
 */
const DAMAGE_TINT: Readonly<Record<DamagedPieceId, number>> = {
  crumblingWall: 0xa89a8a,
  holeWall: 0x8a7a68,
  crackedWall: 0xd8a070,
  plankPatch: 0xc08048,
  rubble: 0x9c9c9c,
  chippedTower: 0x98b080,
  crookedRoof: 0x9a7868,
  tornFlag: 0x9890a0,
};

export interface PieceArt {
  /** Grafik des (Basis-)Teils. */
  base: NormalPieceId;
  /** Multiplikative Einfärbung als 0xRRGGBB, null = keine. */
  tint: number | null;
  damaged: boolean;
}

export function pieceArt(id: PieceId): PieceArt {
  const piece = getPiece(id);
  if (piece.category !== 'damaged' || piece.base === undefined) {
    return { base: id as NormalPieceId, tint: null, damaged: false };
  }
  return { base: piece.base, tint: DAMAGE_TINT[id as DamagedPieceId], damaged: true };
}
