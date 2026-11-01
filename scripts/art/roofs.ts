// Dächer: Schindelreihen, rechte Hälfte im Schatten. Die Traufe liegt genau auf den
// Außenkanten des Teils darunter (Kontur mittig auf der Zellgrenze wie bei den Blöcken).

import { DARK, DARK_LIGHT, GOLD, IRON, OUTLINE, ROOF_BLUE, ROOF_RED, STONE, WOOD, type Tone } from './palette.ts';
import { circle, clipped, group, line, outlined, path, rect, svg } from './svg.ts';

interface RoofShape {
  /** Umriss, beginnt links unten, über die Spitze nach rechts unten. */
  d: string;
  /** Nur die linke Flanke (für die Lichtkante). */
  leftEdge: string;
  tipX: number;
  tipY: number;
  left: number;
  right: number;
  bottom: number;
  tone: Tone;
  id: string;
}

function triangle(width: number, bottom: number, tipY: number, tone: Tone, id = 'roof'): RoofShape {
  const tipX = width / 2;
  return {
    d: `M0 ${String(bottom)}L${String(tipX)} ${String(tipY)}L${String(width)} ${String(bottom)}Z`,
    leftEdge: `M0 ${String(bottom)}L${String(tipX)} ${String(tipY)}`,
    tipX,
    tipY,
    left: 0,
    right: width,
    bottom,
    tone,
    id,
  };
}

function roof(shape: RoofShape): string[] {
  const { d, tipX, tipY, left, right, bottom, tone } = shape;
  const rows: string[] = [];
  const size = 7;
  let stagger = 0;
  for (let y = tipY + 16; y < bottom - 4; y += 14) {
    let row = '';
    for (let x = left - stagger; x < right; x += size * 2) {
      row += `M${String(x)} ${String(y)}a${String(size)} ${String(size)} 0 0 0 ${String(size * 2)} 0`;
    }
    rows.push(row);
    stagger = stagger === 0 ? size : 0;
  }
  return [
    path(d, { fill: tone.base }),
    clipped(shape.id, path(d, {}), [
      path(rows.join(''), line(tone.shade, 3)),
      path(`M${String(tipX)} ${String(tipY - 4)}L${String(right + 4)} ${String(bottom + 4)}H${String(tipX)}Z`, {
        fill: tone.shade,
        opacity: 0.45,
      }),
      path(shape.leftEdge, line(tone.light, 12)),
      rect(left, bottom - 9, right - left, 9, { fill: tone.shade }),
    ]),
    path(d, outlined('none')),
  ];
}

function finial(x: number, y: number, tone: Tone): string[] {
  return [circle(x, y, 5, outlined(tone.base, 3)), circle(x - 1.5, y - 1.5, 1.5, { fill: tone.light })];
}

export function pointedRoof(): string {
  return svg(96, 96, roof(triangle(96, 96, 8, ROOF_RED)));
}

export function pointedRoofTall(): string {
  return svg(96, 192, roof(triangle(96, 192, 8, ROOF_RED)));
}

/** Schlanke Turmspitze mit leicht nach innen geschwungenen Flanken. */
export function coneRoof(): string {
  const shape: RoofShape = {
    d: 'M0 96Q34 76 48 6Q62 76 96 96Z',
    leftEdge: 'M0 96Q34 76 48 6',
    tipX: 48,
    tipY: 6,
    left: 0,
    right: 96,
    bottom: 96,
    tone: ROOF_BLUE,
    id: 'roof',
  };
  return svg(96, 96, [...roof(shape), ...finial(48, 6, GOLD)]);
}

export function roofBig(): string {
  return svg(192, 192, [...roof(triangle(192, 192, 10, ROOF_RED)), ...finial(96, 10, GOLD)]);
}

export function goldenRoof(): string {
  return svg(96, 96, [
    ...roof(triangle(96, 96, 8, GOLD)),
    path('M28 66l4-7 4 7-4 7zM58 44l3-5 3 5-3 5z', { fill: '#ffffff' }),
  ]);
}

/** Glockenturm: offene Glockenstube mit kleinem Dach; die Glocke schwingt (eigene Datei). */
export function bellRoof(): string {
  const tone = STONE[0];
  if (tone === undefined) throw new Error('Keine Steinfarbe');
  return svg(96, 96, [
    rect(16, 44, 64, 40, { fill: DARK_LIGHT }),
    rect(16, 44, 64, 6, { fill: DARK, opacity: 0.6 }),
    rect(8, 40, 12, 46, outlined(WOOD.base, 3)),
    rect(76, 40, 12, 46, outlined(WOOD.base, 3)),
    rect(10, 42, 3, 42, { fill: WOOD.light }),
    rect(78, 42, 3, 42, { fill: WOOD.light }),
    // Brüstung aus Stein, liegt bündig auf dem Teil darunter.
    path('M0 96V80H96V96', { fill: tone.base }),
    rect(4, 83, 40, 4, { rx: 2, fill: tone.light }),
    rect(50, 83, 42, 4, { rx: 2, fill: tone.light }),
    path('M47 80v16', line(STONE[1]?.shade ?? OUTLINE, 3)),
    path('M0 96V80H96V96', line(OUTLINE, 4)),
    ...roof(triangle(96, 46, 4, ROOF_RED)),
    rect(14, 44, 68, 7, { rx: 2, ...outlined(WOOD.shade, 3) }),
  ]);
}

export function bellRoofMoving(): string {
  return svg(96, 96, [
    rect(45, 46, 6, 8, outlined(IRON.base, 3)),
    path('M34 76C35 62 38 54 48 54S61 62 62 76L66 80H30Z', outlined(GOLD.base)),
    path('M40 74C40 64 42 59 47 58', line(GOLD.light, 4)),
    circle(48, 83, 4.5, outlined(IRON.base, 3)),
  ]);
}

/** Sternwarte: Kuppel auf einem Steinring; das Fernrohr schwenkt (eigene Datei). */
export function observatory(): string {
  const tone = STONE[0];
  if (tone === undefined) throw new Error('Keine Steinfarbe');
  const dome = 'M6 78A42 42 0 0 1 90 78Z';
  const metal: Tone = { light: '#d9e6f2', base: '#a9bfd6', shade: '#7f97b3' };
  return svg(96, 96, [
    path(dome, { fill: metal.base }),
    clipped('dome', path(dome, {}), [
      path('M48 30V78M27 36Q22 56 24 78M69 36Q74 56 72 78', line(metal.shade, 3)),
      path('M48 30A42 42 0 0 1 96 80H48Z', { fill: metal.shade, opacity: 0.4 }),
      path('M12 70A38 38 0 0 1 40 38', line(metal.light, 6)),
      // Spalt, aus dem das Fernrohr schaut
      path('M48 58L78 26L88 36L56 66Z', { fill: DARK }),
    ]),
    path(dome, outlined('none')),
    path('M0 96V76H96V96', { fill: tone.base }),
    rect(4, 80, 88, 4, { rx: 2, fill: tone.light }),
    path('M0 96V76H96V96', line(OUTLINE, 4)),
    path('M14 20l2 5 5 2-5 2-2 5-2-5-5-2 5-2z', { fill: GOLD.light }),
    path('M30 8l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z', { fill: GOLD.light }),
  ]);
}

export function observatoryMoving(): string {
  return svg(96, 96, [
    group({ transform: 'rotate(-45 48 58)' }, [
      rect(44, 50, 46, 16, { rx: 4, ...outlined(GOLD.base) }),
      rect(48, 53, 38, 4, { rx: 2, fill: GOLD.light }),
      rect(84, 47, 10, 22, { rx: 3, ...outlined(GOLD.shade) }),
      rect(60, 49, 6, 18, { fill: GOLD.shade }),
    ]),
    circle(48, 58, 7, outlined(IRON.base, 3)),
  ]);
}

/** Altes Zinnen-Teil (stillgelegt, nur für gespeicherte Burgen). */
export function battlementsPiece(): string {
  const tone = STONE[0];
  if (tone === undefined) throw new Error('Keine Steinfarbe');
  const merlons = [4, 36, 68].map((x) => path(`M${String(x)} 96V60h24v36`, outlined(tone.base)));
  return svg(96, 96, merlons);
}

