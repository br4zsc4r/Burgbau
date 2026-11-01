import type { DamagedPieceId, Material, NormalPieceId, PieceId } from '../types';
import { getPiece } from './pieces';

/** Spielgrafiken (erzeugt mit npm run art), relativ zur index.html. */
const ART_DIR = 'assets/art/';

export const TORCH_LIT_URL = `${ART_DIR}torch-lit.svg`;
export const TORCH_UNLIT_URL = `${ART_DIR}torch-unlit.svg`;

/** Jede Grafik ist 96 px je Zelle groß (große Teile entsprechend breiter/höher). */
export const ART_CELL = 96;

/** Kachelbare Materialtextur, 2 × 2 Zellen groß. Wird in Weltkoordinaten ausgeschnitten. */
export const TEXTURE_SIZE = 192;

export const BATTLEMENTS_URL = `${ART_DIR}battlements.svg`;
export const BATTLEMENTS_BROKEN_URL = `${ART_DIR}battlements-broken.svg`;
/** Höhe der automatischen Zinnen über der Mauerkante, in Grafik-Pixeln. */
export const BATTLEMENTS_HEIGHT = 32;

export function textureUrl(material: Material): string {
  return `${ART_DIR}textures/${material}.svg`;
}

export type DamageKind =
  | 'crack'
  | 'crumbling'
  | 'hole'
  | 'planks'
  | 'rubble'
  | 'chipped'
  | 'roofTiles'
  | 'tornFlag';

export const DAMAGE_KINDS: readonly DamageKind[] = [
  'crack',
  'crumbling',
  'hole',
  'planks',
  'rubble',
  'chipped',
  'roofTiles',
  'tornFlag',
];

export function damageUrl(kind: DamageKind): string {
  return `${ART_DIR}damage/${kind}.svg`;
}

/** Blöcke mit Merkmal (Tür, Fenster, Schießscharte); die übrigen sind nur Mauerwerk. */
const FEATURES: readonly NormalPieceId[] = [
  'tower',
  'towerTall',
  'towerBig',
  'gate',
  'gateBig',
  'windowWall',
  'windowWallBig',
  'stainedGlass',
  'portcullis',
  'arch',
  'bridgeArch',
  'bridgeArchWide',
];

export function featureUrl(base: NormalPieceId): string {
  return `${ART_DIR}features/${base}.svg`;
}

/** Vollbild für Teile, die nicht aus Textur zusammengesetzt werden (Dächer, Deko, Umgebung). */
export function imageUrl(base: NormalPieceId): string {
  return `${ART_DIR}pieces/${base}.svg`;
}

/** Schadens-Overlay auf einer Zelle; dx/dy relativ zur Ankerzelle, dy = 0 ist die untere Reihe. */
export interface DamageOverlay {
  dx: number;
  dy: number;
  kind: DamageKind;
}

/**
 * Beschädigte Teile = Grafik des Basisteils plus Schadens-Overlays, keine eigene Textur.
 * So fügen sie sich nahtlos in eine intakte Mauer ein (Spezifikation Abschnitt 5).
 */
const DAMAGE: Readonly<Record<DamagedPieceId, readonly DamageOverlay[]>> = {
  crumblingWall: [{ dx: 0, dy: 0, kind: 'crumbling' }],
  holeWall: [{ dx: 0, dy: 0, kind: 'hole' }],
  crackedWall: [{ dx: 0, dy: 0, kind: 'crack' }],
  plankPatch: [{ dx: 0, dy: 0, kind: 'planks' }],
  rubble: [{ dx: 0, dy: 0, kind: 'rubble' }],
  chippedTower: [{ dx: 0, dy: 0, kind: 'chipped' }],
  crookedRoof: [{ dx: 0, dy: 0, kind: 'roofTiles' }],
  tornFlag: [{ dx: 0, dy: 0, kind: 'tornFlag' }],
  crumblingWallWide: [
    { dx: 0, dy: 0, kind: 'crumbling' },
    { dx: 1, dy: 0, kind: 'crack' },
  ],
  chippedTowerTall: [
    { dx: 0, dy: 0, kind: 'crack' },
    { dx: 0, dy: 1, kind: 'chipped' },
  ],
  ruinWall: [
    { dx: 0, dy: 0, kind: 'hole' },
    { dx: 1, dy: 0, kind: 'rubble' },
    { dx: 0, dy: 1, kind: 'crumbling' },
    { dx: 1, dy: 1, kind: 'crack' },
  ],
  ruinTower: [
    { dx: 0, dy: 0, kind: 'crack' },
    { dx: 1, dy: 0, kind: 'planks' },
    { dx: 0, dy: 1, kind: 'crumbling' },
    { dx: 1, dy: 1, kind: 'chipped' },
  ],
};

/** Bröckelige Teile haben unregelmäßige statt glatter Kanten. */
const ROUGH: readonly DamagedPieceId[] = [
  'crumblingWall',
  'rubble',
  'crumblingWallWide',
  'ruinWall',
  'ruinTower',
];

/**
 * Wo auf der obersten Zelle eines Teils eine Fahne steckt: Abstand von der Zellenoberkante
 * in Grafik-Pixeln (Turm: ganz oben, Zinnen: Oberkante der Zinnen, Dach: Spitze).
 */
const TOP_MOUNT_OFFSET: Partial<Record<NormalPieceId, number>> = {
  battlements: 30,
  pointedRoof: 8,
  pointedRoofTall: 8,
  coneRoof: 4,
  goldenRoof: 8,
  bellRoof: 4,
  spireRoof: 8,
};

/**
 * Öffnung, durch die man hindurchsieht (Burgbogen): Rundbogen in Grafik-Pixeln des Teils.
 * Die Textur wird dort ausgespart, das Merkmal zeichnet Steinkranz und Kontur.
 */
export interface Cutout {
  cx: number;
  /** Scheitel des Bogens */
  top: number;
  half: number;
  /** Höhe der Rundung (fehlt = Halbkreis, sonst flacher Ellipsenbogen). */
  rise?: number;
  bottom: number;
}

const CUTOUTS: Partial<Record<NormalPieceId, Cutout>> = {
  arch: { cx: 96, top: 30, half: 60, bottom: 96 },
  // Öffnung genau über den mittleren Zellen: schließt bündig an die Türme darunter an.
  bridgeArch: { cx: 144, top: 30, half: 48, bottom: 96 },
  bridgeArchWide: { cx: 192, top: 30, half: 96, rise: 62, bottom: 96 },
};

/** Liegt die Öffnung in dieser Zelle (dx ab Ankerzelle)? Dort hat der Bogen unten keine Kante. */
export function cutoutCoversCell(cutout: Cutout, dx: number): boolean {
  const left = dx * ART_CELL;
  return left + ART_CELL > cutout.cx - cutout.half && left < cutout.cx + cutout.half;
}

/**
 * Wie weit die Grafik links und rechts über das Teil hinausragt (in Zellen). Der hohe
 * Turmhelm sitzt auf einem schmalen Turm und ragt je eine halbe Zelle über.
 */
const OVERHANG: Partial<Record<NormalPieceId, number>> = {
  spireRoof: 0.5,
};

export function artOverhang(id: PieceId): number {
  return OVERHANG[pieceArt(id).base] ?? 0;
}

/** Bewegter Teil eines animierten Teils: eigene Grafik, Art der Bewegung und Drehpunkt (0–1). */
export type AnimationKind = 'flicker' | 'wave' | 'sparkle' | 'spin' | 'swing' | 'bob' | 'splash';

export interface PieceAnimation {
  image: string;
  kind: AnimationKind;
  originX: number;
  originY: number;
}

const ANIMATIONS: Partial<Record<NormalPieceId, Omit<PieceAnimation, 'image'>>> = {
  fireDragon: { kind: 'flicker', originX: 80 / 96, originY: 42 / 96 },
  giantFlag: { kind: 'wave', originX: 16 / 96, originY: 32 / 96 },
  crystal: { kind: 'sparkle', originX: 0.5, originY: 0.5 },
  windmill: { kind: 'spin', originX: 0.5, originY: 76 / 192 },
  bellRoof: { kind: 'swing', originX: 0.5, originY: 46 / 96 },
  fountain: { kind: 'splash', originX: 0.5, originY: 48 / 96 },
  ghost: { kind: 'bob', originX: 0.5, originY: 0.5 },
  treasureChest: { kind: 'sparkle', originX: 0.5, originY: 54 / 96 },
  balloon: { kind: 'bob', originX: 0.5, originY: 0.5 },
  observatory: { kind: 'swing', originX: 48 / 96, originY: 58 / 96 },
  unicorn: { kind: 'sparkle', originX: 84 / 96, originY: 10 / 96 },
};

export interface PieceArt {
  /** Normales Teil, dessen Grafik verwendet wird. */
  base: NormalPieceId;
  /** Blöcke: Material der Textur; sonst null (dann gibt es ein Vollbild). */
  material: Material | null;
  /** Vollbild (Dächer, Deko, Umgebung) oder Merkmal eines Blocks; null = reines Mauerwerk. */
  image: string | null;
  damage: readonly DamageOverlay[];
  /** Unregelmäßige Kanten und abgebrochene Zinnen. */
  rough: boolean;
  damaged: boolean;
  animation: PieceAnimation | null;
  cutout: Cutout | null;
}

export function pieceArt(id: PieceId): PieceArt {
  const piece = getPiece(id);
  const damaged = piece.category === 'damaged' && piece.base !== undefined;
  const base = damaged && piece.base !== undefined ? piece.base : (id as NormalPieceId);
  const material = piece.material ?? null;
  const image =
    material === null ? imageUrl(base) : FEATURES.includes(base) ? featureUrl(base) : null;
  const animation = ANIMATIONS[base];
  return {
    base,
    material,
    image,
    damage: damaged ? DAMAGE[id as DamagedPieceId] : [],
    rough: ROUGH.includes(id as DamagedPieceId),
    damaged,
    animation: animation === undefined ? null : { ...animation, image: animationUrl(base) },
    cutout: CUTOUTS[base] ?? null,
  };
}

/** Grafik des bewegten Teils (Flammen, Tuch, Glitzern, Flügel, Glocke …). */
export function animationUrl(base: NormalPieceId): string {
  return `${ART_DIR}pieces/${base}-moving.svg`;
}

/**
 * Wo eine Fahne auf dem Teil steckt (Grafik-Pixel ab Zellenoberkante, negativ = darüber):
 * Mauern tragen sie auf ihren automatischen Zinnen.
 */
export function topMountOffset(id: PieceId): number {
  if (getPiece(id).material === 'stone') return -(BATTLEMENTS_HEIGHT - 4);
  return TOP_MOUNT_OFFSET[pieceArt(id).base] ?? 0;
}

/** Waagerecht: Spitze ab linkem Rand der Andockzelle (großes Dach: auf der Zellgrenze). */
const TOP_MOUNT_X: Partial<Record<NormalPieceId, number>> = {
  roofBig: ART_CELL,
};

export function topMountX(id: PieceId): number {
  return TOP_MOUNT_X[pieceArt(id).base] ?? ART_CELL / 2;
}

/** Fußpunkt einer oben angedockten Deko (Fahnenstange). Fehlt = Mitte. */
const FOOT_X: Partial<Record<NormalPieceId, number>> = {
  giantFlag: 16,
};

/** Fußpunkt in Grafik-Pixeln; gespiegelt liegt er auf der anderen Seite. */
export function footX(id: PieceId, flipped: boolean): number {
  const x = FOOT_X[pieceArt(id).base] ?? ART_CELL / 2;
  return flipped ? ART_CELL - x : x;
}
