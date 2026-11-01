// Mauerwerk: kachelbare Steintextur, Zinnen und die Merkmale der Steinblöcke
// (Schießscharten, Fenster, Tore). Die Kontur der Blöcke zeichnet die Szene selbst.

import {
  DARK,
  DARK_LIGHT,
  GLASS,
  GOLD,
  IRON,
  MORTAR,
  MOSS,
  OUTLINE,
  STONE,
  WOOD,
  type Tone,
} from './palette.ts';
import { circle, clipped, ellipse, line, outlined, path, rect, seeded, svg } from './svg.ts';

const TEXTURE = 192;
const ROW = 32;

/** Ein Stein mit Lichtkante oben und Schattenkante unten. */
function stone(x: number, y: number, w: number, h: number, tone: Tone): string[] {
  return [
    rect(x, y, w, h, { rx: 5, fill: tone.shade }),
    rect(x, y, w, h - 4, { rx: 5, fill: tone.base }),
    rect(x + 4, y + 3, Math.max(4, w - 12), 3, { rx: 1.5, fill: tone.light }),
  ];
}

/** Kachelbare Steintextur, 192 × 192: sechs Reihen unterschiedlich langer Steine. */
export function stoneTexture(): string {
  const random = seeded(11);
  const parts = [rect(0, 0, TEXTURE, TEXTURE, { fill: MORTAR })];
  const details: string[] = [];
  for (let row = 0; row < TEXTURE / ROW; row++) {
    const y = row * ROW;
    const count = random() < 0.5 ? 3 : 4;
    const weights = Array.from({ length: count }, () => 0.75 + random() * 0.5);
    const total = weights.reduce((sum, w) => sum + w, 0);
    let x = Math.floor(random() * TEXTURE);
    for (const weight of weights) {
      const w = Math.round((weight / total) * TEXTURE);
      const tone = STONE[Math.floor(random() * STONE.length)] ?? STONE[0];
      if (tone === undefined) throw new Error('Keine Steinfarbe');
      const detail = random();
      // Steine über den rechten Rand erscheinen links noch einmal (kachelbar).
      for (const offset of x + w > TEXTURE ? [0, -TEXTURE] : [0]) {
        const sx = x + offset + 2;
        parts.push(...stone(sx, y + 2, w - 4, ROW - 4, tone));
        if (detail < 0.18) details.push(circle(sx + w * 0.7, y + 18, 2.5, { fill: tone.shade }));
        else if (detail < 0.3) details.push(ellipse(sx + w * 0.3, y + ROW - 6, 7, 2.5, { fill: MOSS }));
      }
      x = (x + w) % TEXTURE;
    }
  }
  return svg(TEXTURE, TEXTURE, [...parts, ...details]);
}

/** Zinnen über einer Zelle (96 × 32); sie sitzen auf der Mauerkante, unten offen. */
export function battlements(broken: boolean): string {
  const tone = STONE[0];
  if (tone === undefined) throw new Error('Keine Steinfarbe');
  const merlon = (x: number, top: number, jagged: string | null): string[] => {
    const outlineD = jagged ?? `M${String(x)} 34V${String(top)}h24V34`;
    return [
      path(`${outlineD}Z`, { fill: tone.base }),
      rect(x + 3, top + 3, 4, 34 - top - 6, { rx: 2, fill: tone.light }),
      rect(x + 17, top + 3, 4, 34 - top - 6, { rx: 2, fill: tone.shade }),
      path(outlineD, line(OUTLINE, 4)),
    ];
  };
  if (!broken) return svg(96, 32, [...merlon(4, 4, null), ...merlon(36, 4, null), ...merlon(68, 4, null)]);
  return svg(96, 32, [
    ...merlon(4, 4, null),
    ...merlon(36, 16, 'M36 34V18l6-4 5 5 5-6 8 6V34'),
    ...merlon(68, 10, 'M68 34V10l8 4 6-8 10 4V34'),
    circle(56, 29, 3, { fill: MORTAR }),
  ]);
}

/** Bogen-Umriss: Seiten senkrecht, oben ein Halbkreis mit Scheitel bei top. */
function archD(cx: number, top: number, half: number, bottom: number, closed = true, rise = half): string {
  const c = top + rise;
  const d = `M${String(cx - half)} ${String(bottom)}V${String(c)}A${String(half)} ${String(rise)} 0 0 1 ${String(cx + half)} ${String(c)}V${String(bottom)}`;
  return closed ? `${d}Z` : d;
}

/**
 * Steinkranz um eine Bogenöffnung (Keilsteine mit Fugen).
 * hollow = die Öffnung bleibt frei (man sieht hindurch); rise < half = flacher Ellipsenbogen.
 */
function archRing(
  cx: number,
  top: number,
  half: number,
  ring: number,
  bottom: number,
  hollow = false,
  rise = half,
): string[] {
  const tone = STONE[2];
  if (tone === undefined) throw new Error('Keine Steinfarbe');
  const c = top + rise;
  const joints: string[] = [];
  // Breite Bögen bekommen mehr Keilsteine.
  const stones = half > 60 ? 10 : 6;
  for (let i = 1; i < stones; i++) {
    const a = Math.PI - (i * Math.PI) / stones;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    joints.push(
      `M${String(cx + cos * half)} ${String(c - sin * rise)}L${String(cx + cos * (half + ring))} ${String(c - sin * (rise + ring))}`,
    );
  }
  for (let y = c + 18; y < bottom - 6; y += 22) {
    joints.push(`M${String(cx - half - ring)} ${String(y)}h${String(ring)}M${String(cx + half)} ${String(y)}h${String(ring)}`);
  }
  const outer = archD(cx, top - ring, half + ring, bottom, true, rise + ring);
  return [
    hollow
      ? path(outer + archD(cx, top, half, bottom, true, rise), { fill: tone.base, 'fill-rule': 'evenodd' })
      : path(outer, { fill: tone.base }),
    // Offen lassen: geschlossen liefe die Lichtkante unten quer durch die Öffnung.
    path(archD(cx, top - ring + 3, half + ring - 3, bottom, false, rise + ring - 3), {
      fill: 'none',
      stroke: tone.light,
      'stroke-width': 3,
    }),
    path(joints.join(''), line(MORTAR, 3)),
    path(archD(cx, top - ring, half + ring, bottom, false, rise + ring), line(OUTLINE, 4)),
  ];
}

/** Schießscharte mit hellem Steinrahmen (Türme). cy = Mitte. */
function arrowSlit(cx: number, cy: number): string[] {
  const tone = STONE[2];
  if (tone === undefined) throw new Error('Keine Steinfarbe');
  const slit = `M${String(cx - 4)} ${String(cy - 16)}a4 4 0 0 1 8 0V${String(cy - 5)}h6v8h-6V${String(cy + 18)}h-8V${String(cy + 3)}h-6v-8h6Z`;
  return [
    rect(cx - 12, cy - 24, 24, 50, { rx: 7, fill: tone.base }),
    rect(cx - 12, cy - 24, 24, 50, { rx: 7, fill: 'none', stroke: MORTAR, 'stroke-width': 3 }),
    rect(cx - 8, cy - 20, 3, 40, { rx: 1.5, fill: tone.light }),
    path(slit, { ...outlined(DARK, 3) }),
  ];
}

/** Fenster mit Bogen, Glas, Sprossen und Sims (Fensteröffnung x 34–62, Unterkante 70). */
function windowAt(ox: number, oy: number, id: string): string[] {
  const cx = ox + 48;
  const top = oy + 28;
  const bottom = oy + 70;
  const opening = path(archD(cx, top, 14, bottom), {});
  return [
    ...archRing(cx, top, 14, 7, bottom),
    path(archD(cx, top, 14, bottom), outlined(GLASS.base)),
    clipped(id, opening, [
      path(`M${String(cx - 20)} ${String(bottom - 6)}L${String(cx + 6)} ${String(top - 4)}h10L${String(cx - 10)} ${String(bottom + 4)}Z`, {
        fill: GLASS.light,
        opacity: 0.55,
      }),
      rect(cx + 6, top, 10, bottom - top, { fill: GLASS.shade, opacity: 0.5 }),
    ]),
    path(`M${String(cx)} ${String(top)}V${String(bottom)}M${String(cx - 14)} ${String(oy + 50)}h28`, line(WOOD.shade, 4)),
    path(archD(cx, top, 14, bottom), { fill: 'none', ...line(OUTLINE, 4) }),
    rect(cx - 19, bottom - 1, 38, 8, { rx: 3, ...outlined(STONE[0]?.base ?? MORTAR, 3) }),
  ];
}

/** Holztor in einem Bogen; bottom = Unterkante der Grafik. */
function door(cx: number, top: number, half: number, bottom: number, id: string, scale: number): string[] {
  const opening = path(archD(cx, top, half, bottom), {});
  const planks: string[] = [];
  const step = 12 * scale;
  for (let x = cx - half + step; x < cx + half - 2; x += step) planks.push(`M${String(x)} ${String(top)}V${String(bottom)}`);
  const bands = [top + half + 6 * scale, bottom - 14 * scale];
  const studs = bands.flatMap((y) =>
    [-0.6, 0, 0.6].map((f) => circle(cx + f * half, y, 2.5 * scale, { fill: IRON.light })),
  );
  return [
    ...archRing(cx, top, half, 8 * scale, bottom),
    path(archD(cx, top, half, bottom), { fill: WOOD.base }),
    clipped(id, opening, [
      rect(cx - half, top, 6 * scale, bottom - top, { fill: WOOD.light }),
      path(planks.join(''), line(WOOD.shade, 3)),
      ...bands.map((y) => rect(cx - half, y - 4 * scale, half * 2, 8 * scale, { fill: IRON.base })),
      path(archD(cx, top + 4 * scale, half - 4 * scale, bottom), {
        fill: 'none',
        stroke: WOOD.shade,
        'stroke-width': 6 * scale,
        opacity: 0.6,
      }),
    ]),
    ...studs,
    circle(cx + half * 0.45, (bands[0] ?? 0) + 16 * scale, 6 * scale, line(GOLD.shade, 3)),
    path(archD(cx, top, half, bottom, false), line(OUTLINE, 4)),
  ];
}

export function towerFeature(): string {
  return svg(96, 96, arrowSlit(48, 50));
}

export function towerTallFeature(): string {
  return svg(96, 192, [...arrowSlit(48, 50), ...arrowSlit(48, 146)]);
}

export function towerBigFeature(): string {
  return svg(192, 192, [...arrowSlit(48, 50), ...arrowSlit(144, 50), ...arrowSlit(48, 146), ...arrowSlit(144, 146)]);
}

export function windowWallFeature(): string {
  return svg(96, 96, windowAt(0, 0, 'w'));
}

export function windowWallBigFeature(): string {
  return svg(192, 192, [
    ...windowAt(0, 0, 'a'),
    ...windowAt(96, 0, 'b'),
    ...windowAt(0, 96, 'c'),
    ...windowAt(96, 96, 'd'),
  ]);
}

export function gateFeature(): string {
  return svg(96, 96, door(48, 24, 27, 96, 'd', 1));
}

export function gateBigFeature(): string {
  return svg(192, 192, [
    ...door(96, 60, 52, 192, 'd', 2),
    // Schlussstein mit Wappen-Gold
    path('M84 22h24l-4 22h-16z', outlined(STONE[2]?.base ?? MORTAR)),
    circle(96, 32, 5, outlined(GOLD.base, 3)),
  ]);
}

/** Buntglasfenster (Öffnung x 30–66, Unterkante 70). */
export function stainedGlassFeature(): string {
  const opening = path(archD(48, 22, 18, 70), {});
  return svg(96, 96, [
    ...archRing(48, 22, 18, 7, 70),
    clipped('g', opening, [
      rect(30, 22, 18, 26, { fill: '#d94f6b' }),
      rect(48, 22, 18, 26, { fill: GLASS.base }),
      rect(30, 48, 18, 22, { fill: GOLD.base }),
      rect(48, 48, 18, 22, { fill: '#4caf7d' }),
      circle(48, 46, 8, { fill: '#9b6bd6' }),
      path('M34 34l8-8M52 60l8-8', line('#ffffff', 3)),
    ]),
    path('M48 22v48M30 48h36', line(OUTLINE, 3)),
    circle(48, 46, 8, { fill: 'none', ...line(OUTLINE, 3) }),
    path(archD(48, 22, 18, 70), { fill: 'none', ...line(OUTLINE, 4) }),
    rect(25, 69, 46, 8, { rx: 3, ...outlined(STONE[0]?.base ?? MORTAR, 3) }),
  ]);
}

/** Tor mit hochgezogenem Fallgitter: dunkler Durchgang, oben das Eisengitter. */
export function portcullisFeature(): string {
  const cx = 48;
  const top = 24;
  const half = 27;
  const opening = path(archD(cx, top, half, 96), {});
  const bars: string[] = [];
  for (let x = cx - half + 7; x < cx + half; x += 10) bars.push(`M${String(x)} ${String(top - 4)}V58`);
  const spikes = bars.map((_, i) => {
    const x = cx - half + 7 + i * 10;
    return path(`M${String(x - 3.5)} 57L${String(x)} 66L${String(x + 3.5)} 57Z`, outlined(IRON.base, 2.5));
  });
  return svg(96, 96, [
    ...archRing(cx, top, half, 8, 96),
    path(archD(cx, top, half, 96), { fill: DARK }),
    clipped('p', opening, [
      path(archD(cx, top + 12, half - 12, 96), { fill: DARK_LIGHT }),
      rect(cx - half, 86, half * 2, 10, { fill: '#6b5f55' }),
      path(bars.join(''), line(OUTLINE, 7)),
      path(bars.join(''), line(IRON.light, 3)),
      path(`M${String(cx - half)} 36H${String(cx + half)}M${String(cx - half)} 50H${String(cx + half)}`, line(OUTLINE, 6)),
      path(`M${String(cx - half)} 36H${String(cx + half)}M${String(cx - half)} 50H${String(cx + half)}`, line(IRON.base, 3)),
    ]),
    ...spikes,
    path(archD(cx, top, half, 96, false), line(OUTLINE, 4)),
  ]);
}

/**
 * Burgbogen (2 × 1): Steinkranz und Kontur um die Öffnung. Die Textur dort spart die
 * Szene aus (pieceArt: cutout cx 96, Scheitel 30, Halbbreite 60).
 */
export function archFeature(): string {
  const cx = 96;
  const top = 30;
  const half = 60;
  return svg(192, 96, [
    ...archRing(cx, top, half, 10, 96, true),
    path(`M${String(cx - 10)} ${String(top - 14)}h20l-4 18h-12z`, outlined(STONE[0]?.base ?? MORTAR, 3)),
    path(archD(cx, top, half, 96, false), line(OUTLINE, 4)),
    // Unterkante der Pfeiler (die Szene zeichnet unter dem Bogen keine Kante)
    path(`M0 96H${String(cx - half)}M${String(cx + half)} 96H192`, line(OUTLINE, 8)),
  ]);
}

export { archD, archRing, stone };

/**
 * Brückenbogen auf zwei Türmen (3 oder 4 Zellen breit): Die Öffnung liegt genau über den
 * mittleren Zellen, ihre Seiten treffen die Turmwände darunter. Passt zu den Cutouts in pieceArt.
 */
export function bridgeArchFeature(cells: 3 | 4): string {
  const width = cells * 96;
  const cx = width / 2;
  const top = 30;
  const half = (cells - 2) * 48;
  const rise = cells === 3 ? half : 62;
  return svg(width, 96, [
    ...archRing(cx, top, half, 10, 96, true, rise),
    path(`M${String(cx - 10)} ${String(top - 14)}h20l-4 18h-12z`, outlined(STONE[0]?.base ?? MORTAR, 3)),
    path(archD(cx, top, half, 96, false, rise), line(OUTLINE, 4)),
  ]);
}
