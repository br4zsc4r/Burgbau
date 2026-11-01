// Schadens-Overlays (je 96 × 96): liegen über der Grafik des normalen Teils.
// Nichts wird ausradiert – Lücken sind dunkle, vertiefte Flächen mit Bruchkante.

import { CLOTH_BLUE, DARK, DARK_LIGHT, GOLD, IRON, LEAF, MORTAR, OUTLINE, ROOF_RED, STONE, WOOD, type Tone } from './palette.ts';
import { circle, ellipse, group, line, outlined, path, rect, svg } from './svg.ts';

function stoneTone(i: number): Tone {
  const tone = STONE[i] ?? STONE[0];
  if (tone === undefined) throw new Error('Keine Steinfarbe');
  return tone;
}

/** Ein Grasbüschel am Boden. */
function weed(x: number, y: number): string {
  const n = (v: number) => String(v);
  return path(
    `M${n(x)} ${n(y)}c0-6 2-10 5-12M${n(x)} ${n(y)}c-1-5-4-8-7-9M${n(x)} ${n(y)}c2-4 6-6 9-6`,
    line(LEAF.shade, 3),
  );
}

/** Kleine Brocken am Boden. */
function pebbles(): string[] {
  const tone = stoneTone(1);
  return [
    path('M62 88l6-7 9 2 3 7z', outlined(tone.base, 3)),
    path('M78 92l4-4 5 2v4z', outlined(tone.shade, 3)),
    ellipse(56, 92, 3, 2, { fill: MORTAR }),
  ];
}

/** Ausgebrochene Stelle: dunkle Vertiefung mit heller Bruchkante. */
function gap(d: string): string[] {
  const tone = stoneTone(0);
  return [path(d, { fill: tone.shade }), path(d, { fill: DARK_LIGHT, opacity: 0.55 }), path(d, outlined('none', 3))];
}

/** Riss mit heller Bruchkante und ein paar Steinchen am Boden. */
export function crack(): string {
  const tone = stoneTone(1);
  const main = 'M24 0l8 20-9 13 14 18-7 15 10 30';
  return svg(96, 96, [
    path(main, line(tone.light, 9)),
    path(main, line(OUTLINE, 5)),
    path('M37 51l14 4 6 12M64 26l9 10-6 11', line(OUTLINE, 3.5)),
    ...pebbles(),
    weed(14, 94),
  ]);
}

/** Oben rechts fehlt eine Ecke. */
export function chipped(): string {
  return svg(96, 96, [
    ...gap('M54 0H96V40L86 34L80 42L70 30L62 32L58 18Z'),
    path('M30 58l8 12-4 10', line(OUTLINE, 4)),
    ...pebbles(),
    weed(20, 94),
  ]);
}

/** Oben bröckelt die Mauer, unten liegen Brocken. */
export function crumbling(): string {
  return svg(96, 96, [
    ...gap('M0 0H26L22 10L30 16L20 26L12 22L0 28Z'),
    ...gap('M60 0H96V20L88 16L80 24L72 14L64 16Z'),
    path('M40 30l6 10-4 8', line(OUTLINE, 4)),
    path('M10 94l4-10 10 2 2 8z', outlined(stoneTone(1).base, 3)),
    path('M60 94l6-8 8 4v4z', outlined(stoneTone(2).base, 3)),
    circle(84, 90, 4, outlined(stoneTone(0).shade, 3)),
    weed(40, 94),
  ]);
}

/** Loch in der Mauer – ein Vögelchen hat sich darin eingerichtet. */
export function hole(): string {
  const edge = 'M26 52L30 36L42 30L56 32L68 40L72 54L66 66L50 70L34 66Z';
  return svg(96, 96, [
    path(edge, { fill: DARK }),
    path('M30 60C38 70 58 70 68 58L66 66L50 70L34 66Z', { fill: WOOD.base }),
    path('M34 62l8 3M46 66l8-2M58 64l7-3', line(WOOD.shade, 2)),
    path(edge, outlined('none')),
    path('M24 50L30 36', line(stoneTone(0).light, 3)),
    circle(50, 52, 9, outlined(GOLD.base, 3)),
    path('M58 51l7 2-7 3z', outlined('#f28c28', 2)),
    circle(52, 49, 2, { fill: DARK }),
    path('M44 56c2 2 4 2 6 1', line(GOLD.shade, 2)),
    ...pebbles(),
  ]);
}

/** Holzbretter über einer kaputten Stelle. */
export function planks(): string {
  const board = (y: number, angle: number, w: number): string =>
    group({ transform: `rotate(${String(angle)} 48 ${String(y + 7)})` }, [
      rect(48 - w / 2, y, w, 14, { rx: 2, ...outlined(WOOD.base, 3) }),
      rect(48 - w / 2 + 3, y + 2, w - 6, 3, { rx: 1.5, fill: WOOD.light }),
      circle(48 - w / 2 + 6, y + 8, 2.5, { fill: IRON.base }),
      circle(48 + w / 2 - 6, y + 8, 2.5, { fill: IRON.base }),
    ]);
  return svg(96, 96, [...gap('M24 30L70 26L74 72L22 76Z'), board(24, -6, 62), board(44, 4, 68), board(64, -3, 58)]);
}

/** Steinhaufen: die Mauer ist zusammengefallen. */
export function rubble(): string {
  const tones = [stoneTone(0), stoneTone(1), stoneTone(2)];
  const rock = (d: string, i: number): string => path(d, outlined(tones[i % 3]?.base ?? MORTAR, 3));
  return svg(96, 96, [
    ...gap('M0 0H96V30L80 26L66 34L50 24L34 32L18 24L0 30Z'),
    rock('M4 94l6-20 18-4 6 24z', 0),
    rock('M30 94l4-26 22-6 8 32z', 1),
    rock('M62 94l2-18 16-6 12 10v14z', 2),
    rock('M16 70l8-16 16 2 2 12-18 6z', 2),
    rock('M44 60l10-14 16 6-2 12-16 4z', 0),
    rock('M24 46l14-10 10 8-6 10H28z', 1),
    weed(52, 60),
  ]);
}

/** Dach mit fehlenden Ziegeln. */
export function roofTiles(): string {
  return svg(96, 96, [
    rect(40, 40, 11, 9, { fill: DARK }),
    rect(54, 62, 12, 9, { fill: DARK }),
    rect(26, 74, 11, 9, { fill: DARK }),
    rect(44, 76, 22, 12, { ...outlined(WOOD.base, 3), transform: 'rotate(-8 55 82)' }),
    path('M64 50l8 3-2 6-8-2z', outlined(ROOF_RED.light, 2.5)),
    weed(78, 94),
  ]);
}

/** Zerrissene Fahne: Löcher und ein aufgenähter Flicken (Tuch bei x 50–88, y 14–44). */
export function tornFlag(): string {
  return svg(96, 96, [
    path('M76 12L80 22L74 28L82 36L76 46', line(OUTLINE, 3)),
    circle(62, 24, 4, { fill: DARK }),
    circle(70, 38, 2.5, { fill: DARK }),
    rect(52, 30, 12, 9, outlined(CLOTH_BLUE.shade, 2)),
    path('M54 34h8', { stroke: OUTLINE, 'stroke-width': 1.5, 'stroke-dasharray': '2 2' }),
  ]);
}
