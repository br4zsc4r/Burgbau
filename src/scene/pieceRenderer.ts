import Phaser from 'phaser';
import {
  ART_CELL,
  BATTLEMENTS_BROKEN_URL,
  BATTLEMENTS_HEIGHT,
  BATTLEMENTS_URL,
  DAMAGE_KINDS,
  TEXTURE_SIZE,
  damageUrl,
  pieceArt,
  textureUrl,
  type Cutout,
  type DamageKind,
  type PieceAnimation,
} from '../data/pieceArt';
import { PIECES, getPiece } from '../data/pieces';
import { DOWN, LEFT, RIGHT, UP } from '../logic/autotile';
import type { Material, PieceId } from '../types';

/** SVGs werden doppelt so groß gerastert, damit sie auch vergrößert scharf bleiben. */
const RASTER_SCALE = 2;
const OUTLINE = 4;
const OUTLINE_COLOR = 0x3b2f2a;

const textureKey = (material: Material): string => `texture-${material}`;
const damageKey = (kind: DamageKind): string => `damage-${kind}`;
const BATTLEMENTS_KEY = 'battlements';
const BATTLEMENTS_BROKEN_KEY = 'battlements-broken';

/** Lädt alle Platzhalter-Grafiken der Bauteile. */
export function preloadPieceArt(load: Phaser.Loader.LoaderPlugin): void {
  const loaded = new Set<string>();
  for (const piece of PIECES) {
    const art = pieceArt(piece.id);
    if (art.image !== null && !loaded.has(art.image)) {
      loaded.add(art.image);
      const base = getPiece(art.base);
      load.svg(art.image, art.image, {
        width: base.width * ART_CELL * RASTER_SCALE,
        height: base.height * ART_CELL * RASTER_SCALE,
      });
    }
    if (art.animation !== null && !loaded.has(art.animation.image)) {
      loaded.add(art.animation.image);
      const base = getPiece(art.base);
      load.svg(art.animation.image, art.animation.image, {
        width: base.width * ART_CELL * RASTER_SCALE,
        height: base.height * ART_CELL * RASTER_SCALE,
      });
    }
    if (art.material !== null && !loaded.has(art.material)) {
      loaded.add(art.material);
      // Textur in Weltgröße, damit die Kachel-Position direkt Weltkoordinaten entspricht.
      load.svg(textureKey(art.material), textureUrl(art.material), {
        width: TEXTURE_SIZE,
        height: TEXTURE_SIZE,
      });
    }
  }
  const cell = ART_CELL * RASTER_SCALE;
  for (const kind of DAMAGE_KINDS) load.svg(damageKey(kind), damageUrl(kind), { width: cell, height: cell });
  const battlements = { width: cell, height: BATTLEMENTS_HEIGHT * RASTER_SCALE };
  load.svg(BATTLEMENTS_KEY, BATTLEMENTS_URL, battlements);
  load.svg(BATTLEMENTS_BROKEN_KEY, BATTLEMENTS_BROKEN_URL, battlements);
}

/** Eine Zelle eines Blocks relativ zum Teil (dy = 0 ist die untere Reihe). */
export interface TileView {
  dx: number;
  dy: number;
  /** Nachbar-Bitmaske (UP/RIGHT/DOWN/LEFT): dort keine Kante. */
  mask: number;
  battlements: boolean;
}

/** Ebenen, in die gezeichnet wird – getrennt, damit Kanten über allen Texturen liegen. */
export interface PieceLayers {
  base: Phaser.GameObjects.Container;
  edges: Phaser.GameObjects.Graphics;
  top: Phaser.GameObjects.Container;
}

/** Kleine, feste Pseudozufallszahl je Position (für gleichbleibend unregelmäßige Kanten). */
function jitter(a: number, b: number, c: number): number {
  const n = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * Kanten einer Zelle: Kontur, Licht oben/links und Schatten unten/rechts – nur an Seiten
 * ohne Nachbarn. Die Kontur liegt mittig auf der Zellgrenze und ist an den Enden verlängert,
 * damit Innen- und Außenecken geschlossen sind.
 */
function drawEdges(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  mask: number,
  rough: boolean,
): void {
  const half = OUTLINE / 2;
  const shade = Math.max(3, Math.round(size * 0.07));

  g.fillStyle(0xffffff, 0.18);
  if ((mask & UP) === 0) g.fillRect(x, y + half, size, shade);
  if ((mask & LEFT) === 0) g.fillRect(x + half, y, shade, size);
  g.fillStyle(0x000000, 0.16);
  if ((mask & DOWN) === 0) g.fillRect(x, y + size - half - shade, size, shade);
  if ((mask & RIGHT) === 0) g.fillRect(x + size - half - shade, y, shade, size);

  if (!rough) {
    g.fillStyle(OUTLINE_COLOR, 1);
    if ((mask & UP) === 0) g.fillRect(x - half, y - half, size + OUTLINE, OUTLINE);
    if ((mask & DOWN) === 0) g.fillRect(x - half, y + size - half, size + OUTLINE, OUTLINE);
    if ((mask & LEFT) === 0) g.fillRect(x - half, y - half, OUTLINE, size + OUTLINE);
    if ((mask & RIGHT) === 0) g.fillRect(x + size - half, y - half, OUTLINE, size + OUTLINE);
    return;
  }

  // Bröckelig: gezackte Kontur, die ein Stück nach innen springt.
  g.lineStyle(OUTLINE, OUTLINE_COLOR, 1);
  const steps = 8;
  const depth = size * 0.07;
  const side = (bit: number, from: [number, number], to: [number, number], inward: [number, number]): void => {
    if ((mask & bit) !== 0) return;
    const points: Phaser.Math.Vector2[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const j = i === 0 || i === steps ? 0 : jitter(x + i, y + bit, size) * depth;
      points.push(
        new Phaser.Math.Vector2(
          from[0] + (to[0] - from[0]) * t + inward[0] * j,
          from[1] + (to[1] - from[1]) * t + inward[1] * j,
        ),
      );
    }
    g.strokePoints(points, false);
  };
  side(UP, [x, y], [x + size, y], [0, 1]);
  side(DOWN, [x, y + size], [x + size, y + size], [0, -1]);
  side(LEFT, [x, y], [x, y + size], [1, 0]);
  side(RIGHT, [x + size, y], [x + size, y + size], [-1, 0]);
}

/** „Bewegung reduzieren“ im System: Teile stehen still. */
export function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Materialtextur mit ausgesparter Bogenöffnung (Burgbogen), als eigene Canvas-Textur.
 * offset = Weltposition der Textur (wie bei der TileSprite), null = mitskaliert ab 0/0.
 */
function cutoutImage(
  scene: Phaser.Scene,
  material: Material,
  cutout: Cutout,
  width: number,
  height: number,
  cellSize: number,
  offset: { x: number; y: number } | null,
): Phaser.GameObjects.Image {
  const scale = cellSize / ART_CELL;
  const tile = offset === null ? TEXTURE_SIZE * scale : TEXTURE_SIZE;
  const mod = (v: number): number => ((v % tile) + tile) % tile;
  const ox = offset === null ? 0 : Math.round(mod(offset.x));
  const oy = offset === null ? 0 : Math.round(mod(offset.y));
  const w = Math.ceil(width);
  const h = Math.ceil(height);
  const key = `cutout-${material}-${String(cutout.cx)}-${String(w)}x${String(h)}-${String(ox)}-${String(oy)}`;
  if (!scene.textures.exists(key)) {
    const canvas = scene.textures.createCanvas(key, w, h);
    if (canvas !== null) {
      const ctx = canvas.context;
      const source = scene.textures.get(textureKey(material)).getSourceImage();
      if (!(source instanceof Phaser.GameObjects.RenderTexture)) {
        for (let x = -ox; x < w; x += tile) {
          for (let y = -oy; y < h; y += tile) ctx.drawImage(source, x, y, tile, tile);
        }
      }
      const k = scale;
      const cx = cutout.cx * k;
      const radius = cutout.half * k;
      const centerY = (cutout.top + cutout.half) * k;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.moveTo(cx - radius, cutout.bottom * k + 1);
      ctx.lineTo(cx - radius, centerY);
      ctx.arc(cx, centerY, radius, Math.PI, 0);
      ctx.lineTo(cx + radius, cutout.bottom * k + 1);
      ctx.closePath();
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      canvas.refresh();
    }
  }
  return scene.add.image(0, 0, key).setOrigin(0, 0).setDisplaySize(width, height);
}

/** Bewegung des animierten Teils (nur in der Bauszene, Vorschaubilder bleiben still). */
function animate(scene: Phaser.Scene, image: Phaser.GameObjects.Image, kind: PieceAnimation['kind']): void {
  const scaleX = image.scaleX;
  const scaleY = image.scaleY;
  switch (kind) {
    case 'spin':
      scene.tweens.add({ targets: image, angle: 360, duration: 4000, repeat: -1 });
      break;
    case 'wave':
      // Nur scaleX, keine Drehung: Drehung plus ungleichmäßige Skalierung zerschnitt das Bild
      // in Phaser 4 entlang der Diagonale (im Browser beobachtet).
      scene.tweens.add({
        targets: image,
        scaleX: scaleX * 0.82,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      break;
    case 'flicker':
      // Kurz Feuer pusten, dann Pause.
      image.setAlpha(0);
      scene.tweens.add({
        targets: image,
        alpha: { from: 0, to: 1 },
        scaleX: { from: scaleX * 0.3, to: scaleX * 1.1 },
        scaleY: { from: scaleY * 0.6, to: scaleY },
        duration: 350,
        hold: 500,
        yoyo: true,
        repeat: -1,
        repeatDelay: 1400,
        ease: 'Quad.easeOut',
      });
      break;
    case 'swing':
      // Glocke und Fernrohr pendeln um ihren Aufhängepunkt.
      image.setAngle(-12);
      scene.tweens.add({ targets: image, angle: 12, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      break;
    case 'bob':
      scene.tweens.add({
        targets: image,
        y: image.y - image.displayHeight * 0.05,
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      break;
    case 'splash':
      scene.tweens.add({
        targets: image,
        scaleY: { from: scaleY * 0.8, to: scaleY * 1.05 },
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      break;
    case 'sparkle':
      scene.tweens.add({
        targets: image,
        alpha: { from: 0.2, to: 1 },
        scaleX: { from: scaleX * 0.85, to: scaleX * 1.1 },
        scaleY: { from: scaleY * 0.85, to: scaleY * 1.1 },
        angle: 12,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      break;
  }
}

/**
 * Zeichnet ein Teil. left/top = linke obere Ecke in Welt- bzw. Container-Koordinaten.
 * Blöcke: Textur (ab textureOrigin in Weltkoordinaten) → Merkmal → Schaden → Kanten → Zinnen.
 * Andere Teile: Vollbild → bewegter Teil → Schaden.
 * Liefert die bewegten Bilder, damit ihre Tweens beim Neuzeichnen beendet werden können.
 */
export function drawPiece(
  scene: Phaser.Scene,
  layers: PieceLayers,
  id: PieceId,
  left: number,
  top: number,
  cellSize: number,
  tiles: readonly TileView[],
  textureOrigin: { x: number; y: number } | null,
  animated = false,
): Phaser.GameObjects.Image[] {
  const moving: Phaser.GameObjects.Image[] = [];
  const piece = getPiece(id);
  const art = pieceArt(id);
  const width = piece.width * cellSize;
  const height = piece.height * cellSize;
  const scale = cellSize / ART_CELL;

  if (art.material !== null && art.cutout !== null) {
    layers.base.add(
      cutoutImage(scene, art.material, art.cutout, width, height, cellSize, textureOrigin).setPosition(left, top),
    );
  } else if (art.material !== null) {
    const texture = scene.add
      .tileSprite(left, top, width, height, textureKey(art.material))
      .setOrigin(0, 0);
    if (textureOrigin === null) {
      // Ablage und Vorschau: Textur einfach mitskalieren.
      texture.setTileScale(scale, scale);
    } else {
      texture.setTilePosition(textureOrigin.x, textureOrigin.y);
    }
    layers.base.add(texture);
  }

  if (art.image !== null) {
    layers.base.add(scene.add.image(left, top, art.image).setOrigin(0, 0).setDisplaySize(width, height));
  }

  if (art.animation !== null) {
    const { image, kind, originX, originY } = art.animation;
    const part = scene.add
      .image(left + originX * width, top + originY * height, image)
      .setOrigin(originX, originY)
      .setDisplaySize(width, height);
    layers.base.add(part);
    if (animated && !prefersReducedMotion()) {
      animate(scene, part, kind);
      moving.push(part);
    }
  }

  for (const overlay of art.damage) {
    const x = left + overlay.dx * cellSize;
    const y = top + (piece.height - 1 - overlay.dy) * cellSize;
    layers.base.add(
      scene.add.image(x, y, damageKey(overlay.kind)).setOrigin(0, 0).setDisplaySize(cellSize, cellSize),
    );
  }

  for (const tile of tiles) {
    const x = left + tile.dx * cellSize;
    const y = top + (piece.height - 1 - tile.dy) * cellSize;
    // Unter einem Bogen ist keine Kante: Dort ist ja die Öffnung.
    const mask = art.cutout === null ? tile.mask : tile.mask | DOWN;
    drawEdges(layers.edges, x, y, cellSize, mask, art.rough);
    if (tile.battlements) {
      const h = BATTLEMENTS_HEIGHT * scale;
      const key = art.damaged ? BATTLEMENTS_BROKEN_KEY : BATTLEMENTS_KEY;
      // Die Zinnen sitzen auf der Kontur und ragen in die freie Zelle darüber.
      layers.top.add(scene.add.image(x, y - h + OUTLINE / 2, key).setOrigin(0, 0).setDisplaySize(cellSize, h));
    }
  }
  return moving;
}
