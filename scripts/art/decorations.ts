// Dekorationen: Fahnen, Balkon, Wappen, Fackel, Efeu, Blumenkasten, Banner, Treppe
// und die Premium-Teile, die an ein Teil andocken (Drachen, Kristall, Gespenst).

import {
  CLOTH_BLUE,
  CLOTH_PURPLE,
  CLOTH_RED,
  DARK,
  GLASS,
  GOLD,
  IRON,
  LEAF,
  OUTLINE,
  STONE,
  WHITE,
  WOOD,
  type Tone,
} from './palette.ts';
import { archD, archRing } from './stone.ts';
import { circle, clipped, ellipse, group, line, outlined, path, rect, svg } from './svg.ts';

const ORANGE: Tone = { light: '#ffb45e', base: '#f28c28', shade: '#c96a12' };
const DRAGON_GREEN: Tone = { light: '#8fd39a', base: '#4caf7d', shade: '#36885e' };
const DRAGON_RED: Tone = { light: '#f58a76', base: '#d9483b', shade: '#a8332a' };
const PINK = '#f28bb0';

/** Fahnenstange vom Fuß (unten) bis top, mit Goldknauf. */
export function pole(x: number, top: number, bottom: number): string[] {
  return [
    path(`M${String(x)} ${String(bottom)}V${String(top)}`, line(OUTLINE, 8)),
    path(`M${String(x)} ${String(bottom)}V${String(top)}`, line(WOOD.light, 3)),
    circle(x, top - 2, 5, outlined(GOLD.base, 3)),
  ];
}

/** Wehendes Tuch ab der Stange (x), oben bei y. */
export function cloth(x: number, y: number, length: number, height: number, tone: Tone, stripe: Tone, id = 'cloth'): string[] {
  const end = x + length;
  const mid = y + height / 2;
  const n = (v: number) => String(v);
  const d = `M${n(x)} ${n(y)}C${n(x + length * 0.35)} ${n(y - 6)} ${n(x + length * 0.6)} ${n(y + 6)} ${n(end)} ${n(y)}L${n(end - 8)} ${n(mid)}L${n(end)} ${n(y + height)}C${n(x + length * 0.6)} ${n(y + height + 6)} ${n(x + length * 0.35)} ${n(y + height - 6)} ${n(x)} ${n(y + height)}Z`;
  return [
    path(d, { fill: tone.base }),
    clipped(id, path(d, {}), [
      path(`M${n(x)} ${n(mid)}C${n(x + length * 0.35)} ${n(mid - 6)} ${n(x + length * 0.6)} ${n(mid + 6)} ${n(end)} ${n(mid)}`, line(stripe.base, height / 4)),
      path(
        `M${n(x + length * 0.42)} ${n(y - 4)}C${n(x + length * 0.5)} ${n(y + height / 3)} ${n(x + length * 0.5)} ${n(y + height)} ${n(x + length * 0.45)} ${n(y + height + 8)}`,
        line(tone.shade, height / 5),
      ),
      path(`M${n(x)} ${n(y + 3)}H${n(end)}`, line(tone.light, 4)),
    ]),
    path(d, outlined('none')),
  ];
}

export function flag(): string {
  return svg(96, 96, [...pole(48, 10, 96), ...cloth(50, 14, 38, 30, CLOTH_BLUE, GOLD)]);
}

export function pennant(): string {
  const d = 'M50 14C64 16 76 22 90 28C76 32 64 38 50 44Z';
  return svg(96, 96, [
    ...pole(48, 10, 96),
    path(d, { fill: ORANGE.base }),
    clipped('p', path(d, {}), [path('M50 29H92', line(CLOTH_RED.base, 8)), path('M50 17C62 19 72 23 84 28', line(ORANGE.light, 4))]),
    path(d, outlined('none')),
  ]);
}

/** Balkon mit Tür dahinter, damit man ihn auch erreichen kann. */
export function balcony(): string {
  const stoneTone = STONE[2] ?? STONE[0];
  const floor = STONE[0];
  if (stoneTone === undefined || floor === undefined) throw new Error('Keine Steinfarbe');
  const door = path(archD(48, 8, 18, 76), {});
  const balusters = [17, 32, 48, 64, 79].map((x) => rect(x - 3.5, 56, 7, 20, { rx: 3.5, ...outlined(WOOD.base, 3) }));
  return svg(96, 96, [
    ...archRing(48, 8, 18, 6, 76),
    path(archD(48, 8, 18, 76), { fill: WOOD.base }),
    clipped('door', door, [
      rect(30, 8, 6, 68, { fill: WOOD.light }),
      path('M42 8v68M54 8v68', line(WOOD.shade, 3)),
      rect(30, 30, 36, 6, { fill: IRON.base }),
    ]),
    circle(58, 46, 3.5, { fill: GOLD.base }),
    path(archD(48, 8, 18, 76, false), line(OUTLINE, 4)),
    // Konsolen unter dem Boden
    path('M12 84h16l-5 10h-6z', outlined(stoneTone.base, 3)),
    path('M68 84h16l-5 10h-6z', outlined(stoneTone.base, 3)),
    rect(4, 74, 88, 12, { rx: 3, ...outlined(floor.base) }),
    rect(8, 77, 80, 3, { rx: 1.5, fill: floor.light }),
    ...balusters,
    rect(6, 50, 84, 8, { rx: 4, ...outlined(WOOD.light) }),
  ]);
}

export function coatOfArms(): string {
  const shield = 'M26 18H70V46C70 62 60 72 48 80C36 72 26 62 26 46Z';
  return svg(96, 96, [
    path(shield, { fill: CLOTH_BLUE.base }),
    clipped('s', path(shield, {}), [
      rect(48, 10, 26, 36, { fill: CLOTH_RED.base }),
      rect(22, 46, 26, 40, { fill: CLOTH_RED.base }),
      path('M30 22V50', line(CLOTH_BLUE.light, 4)),
    ]),
    // Goldene Krone in der Mitte
    path('M36 52L38 36L44 44L48 32L52 44L58 36L60 52Z', outlined(GOLD.base, 3)),
    circle(48, 32, 2.5, { fill: GOLD.light }),
    path(shield, outlined('none')),
  ]);
}

/** Flamme mit hellem Kern; (x, y) = Fuß der Flamme. */
function flame(x: number, y: number, size: number): string[] {
  const s = (v: number) => String(v * size);
  return [
    path(`M${String(x)} ${String(y)}c-${s(10)} 0-${s(14)}-${s(8)}-${s(12)}-${s(16)}c${s(2)}-${s(8)} ${s(8)}-${s(12)} ${s(12)}-${s(24)}c${s(4)} ${s(12)} ${s(10)} ${s(16)} ${s(12)} ${s(24)}c${s(2)} ${s(8)}-${s(2)} ${s(16)}-${s(12)} ${s(16)}z`, outlined(ORANGE.base)),
    path(`M${String(x)} ${String(y - 3 * size)}c-${s(5)} 0-${s(7)}-${s(4)}-${s(6)}-${s(9)}c${s(1)}-${s(4)} ${s(4)}-${s(6)} ${s(6)}-${s(12)}c${s(2)} ${s(6)} ${s(5)} ${s(8)} ${s(6)} ${s(12)}c${s(1)} ${s(5)}-${s(1)} ${s(9)}-${s(6)} ${s(9)}z`, { fill: GOLD.light }),
  ];
}

/** Wandfackel in einer eisernen Halterung. */
export function torch(): string {
  return svg(96, 96, [
    circle(48, 34, 24, { fill: GOLD.light, opacity: 0.35 }),
    rect(40, 66, 16, 8, { rx: 2, ...outlined(IRON.base, 3) }),
    path('M48 74V84', line(OUTLINE, 6)),
    path('M42 46H54L51 76H45Z', outlined(WOOD.base, 3)),
    rect(40, 42, 16, 8, { rx: 3, ...outlined(IRON.base, 3) }),
    ...flame(48, 44, 1.1),
  ]);
}

/** Herzförmiges Blatt an (x, y), gedreht um angle Grad. */
function leaf(x: number, y: number, angle: number, size = 1): string {
  return group({ transform: `translate(${String(x)} ${String(y)}) rotate(${String(angle)}) scale(${String(size)})` }, [
    path('M0 0C-8-2-12-10-6-14C-3-16 0-13 0-11C0-13 3-16 6-14C12-10 8-2 0 0Z', outlined(LEAF.base, 2.5)),
    path('M0-2V-10', line(LEAF.shade, 2)),
  ]);
}

/** Efeu wächst links hoch und oben entlang. */
export function ivy(): string {
  const vine = 'M8 96C4 76 14 62 8 44C4 30 10 14 24 10C40 6 56 14 72 8C80 5 86 6 92 4';
  return svg(96, 96, [
    path(vine, line(OUTLINE, 8)),
    path(vine, line(LEAF.shade, 4)),
    path('M10 60C18 62 24 68 26 76M30 9C34 18 32 24 28 30M62 10C64 18 70 22 76 22', line(LEAF.shade, 3)),
    leaf(10, 88, -20),
    leaf(4, 70, 30),
    leaf(26, 78, 160, 0.9),
    leaf(10, 50, -30),
    leaf(6, 30, 20, 0.9),
    leaf(28, 32, 150, 0.8),
    leaf(18, 12, -60),
    leaf(42, 8, 10, 0.9),
    leaf(58, 12, -10),
    leaf(76, 24, 170, 0.8),
    leaf(80, 6, 30, 0.85),
  ]);
}

/** Blumenkasten unter dem Fenster (Fenster x 34–62, Unterkante 70). */
export function flowerBox(): string {
  const blossom = (x: number, y: number, color: string): string[] => [
    ...[0, 72, 144, 216, 288].map((a) =>
      circle(x + Math.cos((a * Math.PI) / 180) * 5, y + Math.sin((a * Math.PI) / 180) * 5, 4.5, outlined(color, 2.5)),
    ),
    circle(x, y, 3.5, { fill: GOLD.base }),
  ];
  return svg(96, 96, [
    path('M34 70V58M48 70V52M62 70V58', line(LEAF.shade, 3)),
    leaf(40, 66, -50, 0.7),
    leaf(56, 64, 50, 0.7),
    ...blossom(34, 56, PINK),
    ...blossom(48, 50, WHITE),
    ...blossom(62, 56, CLOTH_PURPLE.light),
    rect(26, 68, 44, 18, { rx: 3, ...outlined(WOOD.base) }),
    rect(29, 71, 38, 3, { rx: 1.5, fill: WOOD.light }),
    path('M40 70V84M56 70V84', line(WOOD.shade, 2.5)),
  ]);
}

/** Hängendes Banner an einer Stange. */
export function banner(): string {
  const d = 'M30 12H66V82L48 70L30 82Z';
  return svg(96, 96, [
    path(d, { fill: CLOTH_PURPLE.base }),
    clipped('b', path(d, {}), [
      path('M36 12V74M60 12V74', line(GOLD.base, 3)),
      rect(30, 12, 8, 80, { fill: CLOTH_PURPLE.light }),
      rect(58, 12, 8, 80, { fill: CLOTH_PURPLE.shade }),
    ]),
    path(d, outlined('none')),
    path('M48 30l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z', outlined(GOLD.base, 2.5)),
    path('M22 12H74', line(OUTLINE, 8)),
    path('M22 12H74', line(WOOD.light, 3)),
    circle(22, 12, 4, outlined(GOLD.base, 2.5)),
    circle(74, 12, 4, outlined(GOLD.base, 2.5)),
  ]);
}

/** Holztreppe, steigt nach rechts an: Stufen, Wange und Geländer. */
export function stairs(): string {
  const steps = 'M2 96V78H20V60H38V42H56V24H74V8H94V96Z';
  const treads = [0, 1, 2, 3, 4].map((i) => rect(4 + i * 18, 80 - i * 18 - (i === 4 ? -2 : 0), i === 4 ? 18 : 14, 4, { rx: 2, fill: WOOD.light }));
  return svg(96, 96, [
    path(steps, { fill: WOOD.base }),
    clipped('st', path(steps, {}), [path('M30 96L94 36V96Z', { fill: WOOD.shade }), path('M2 96L94 12', line(WOOD.shade, 4)), ...treads]),
    path(steps, outlined('none')),
    // Geländer
    path('M10 78V55M46 42V33M82 8V12', line(OUTLINE, 7)),
    path('M10 78V55M46 42V33', line(WOOD.light, 3)),
    path('M6 58L88 6', line(OUTLINE, 9)),
    path('M6 58L88 6', line(WOOD.light, 4)),
  ]);
}

/** Drache, der oben auf einem Turm sitzt (Blick nach rechts, Maul bei 70/40). */
function dragonBody(tone: Tone): string[] {
  return [
    // Schwanz
    path('M30 88C12 90 6 78 10 66C12 60 18 60 20 64', line(OUTLINE, 10)),
    path('M30 88C12 90 6 78 10 66C12 60 18 60 20 64', line(tone.base, 4)),
    path('M14 58l8 2-4 7z', outlined(tone.shade, 2.5)),
    // Flügel
    path('M40 54L16 18L30 24L34 12L44 26L52 20L50 46Z', outlined(CLOTH_PURPLE.light, 3)),
    path('M40 50L26 26M44 46L36 18M48 44L50 26', line(CLOTH_PURPLE.shade, 2.5)),
    // Körper und Bauch
    path('M28 94C24 70 34 50 50 48C64 46 72 60 70 76C69 86 64 94 60 94Z', outlined(tone.base)),
    path('M40 92C38 76 44 62 54 60C62 60 64 72 62 82C61 88 58 92 56 92Z', { fill: GOLD.light }),
    path('M44 70h12M42 78h16M42 86h16', line(GOLD.shade, 2)),
    // Kopf
    path('M50 50C48 36 56 26 66 28C74 29 80 34 82 40C83 46 78 48 70 46C64 50 56 54 50 50Z', outlined(tone.base)),
    path('M58 28L56 16L64 26M68 28L70 16L74 30', outlined(GOLD.base, 2.5)),
    circle(66, 36, 3.5, { fill: DARK }),
    circle(67, 35, 1.2, { fill: WHITE }),
    circle(78, 40, 1.5, { fill: tone.shade }),
    // Füßchen
    ellipse(36, 92, 7, 4, outlined(tone.shade, 3)),
    ellipse(60, 92, 7, 4, outlined(tone.shade, 3)),
  ];
}

export function dragon(): string {
  return svg(96, 96, dragonBody(DRAGON_GREEN));
}

export function fireDragon(): string {
  return svg(96, 96, dragonBody(DRAGON_RED));
}

/** Feuerstoß aus dem Maul, nach rechts (Ursprung 80/42). */
export function fireDragonMoving(): string {
  return svg(96, 96, [
    path('M80 42C84 32 92 30 96 34C92 38 96 42 96 44C96 48 92 52 96 56C90 58 84 54 80 46Z', outlined(ORANGE.base, 3)),
    path('M82 43C86 38 90 38 92 40C90 42 92 45 90 48C87 49 84 47 82 45Z', { fill: GOLD.light }),
  ]);
}

/** Riesenfahne: Stange links, das Tuch weht (eigene Datei). */
export function giantFlag(): string {
  return svg(96, 96, pole(16, 6, 96));
}

export function giantFlagMoving(): string {
  return svg(96, 96, [
    ...cloth(18, 10, 74, 48, CLOTH_RED, GOLD),
    path('M50 22l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z', outlined(GOLD.base, 2.5)),
  ]);
}

/** Kristall auf einem kleinen Sockel; die Funkeln bewegen sich (eigene Datei). */
export function crystal(): string {
  const gem: Tone = { light: '#c9f1ff', base: '#7fd3f0', shade: '#4fa6d0' };
  const violet: Tone = { light: '#e3c9ff', base: '#b48cf0', shade: '#8a62c9' };
  return svg(96, 96, [
    path('M30 96L34 82H62L66 96Z', outlined(STONE[2]?.base ?? WOOD.base)),
    path('M36 84L30 58L38 52L44 82Z', outlined(violet.base, 3)),
    path('M60 84L68 62L60 56L52 82Z', outlined(violet.base, 3)),
    path('M38 84L40 34L48 20L56 34L58 84Z', outlined(gem.base)),
    path('M48 20L48 84M40 34L48 44L56 34', line(gem.shade, 2.5)),
    path('M42 38L43 76', line(gem.light, 4)),
    path('M58 84L56 34L48 44V84Z', { fill: gem.shade, opacity: 0.4 }),
  ]);
}

/** Funkelnde Sterne um den Kristall. */
function sparkleStar(x: number, y: number, r: number, color: string): string {
  const s = r * 0.3;
  const n = (v: number) => String(v);
  return path(
    `M${n(x)} ${n(y - r)}L${n(x + s)} ${n(y - s)}L${n(x + r)} ${n(y)}L${n(x + s)} ${n(y + s)}L${n(x)} ${n(y + r)}L${n(x - s)} ${n(y + s)}L${n(x - r)} ${n(y)}L${n(x - s)} ${n(y - s)}Z`,
    { ...outlined(color, 2.5) },
  );
}

export function crystalMoving(): string {
  return svg(96, 96, [
    sparkleStar(24, 30, 9, WHITE),
    sparkleStar(74, 22, 7, GOLD.light),
    sparkleStar(76, 70, 8, WHITE),
    sparkleStar(18, 72, 6, GOLD.light),
  ]);
}

/** Burggespenst: nur ein Schatten an der Wand, das Gespenst selbst schwebt (eigene Datei). */
export function ghost(): string {
  return svg(96, 96, [ellipse(48, 88, 20, 4, { fill: DARK, opacity: 0.25 })]);
}

export function ghostMoving(): string {
  const body = 'M26 76V42C26 26 36 14 48 14S70 26 70 42V76L63 70L56 78L48 70L40 78L33 70Z';
  return svg(96, 96, [
    group({ opacity: 0.94 }, [
      path('M28 50C18 48 14 40 16 34', line(OUTLINE, 9)),
      path('M28 50C18 48 14 40 16 34', line(WHITE, 4)),
      path('M68 50C78 50 82 44 82 38', line(OUTLINE, 9)),
      path('M68 50C78 50 82 44 82 38', line(WHITE, 4)),
      path(body, { fill: WHITE }),
      clipped('gh', path(body, {}), [path('M60 18C68 28 68 60 66 80H72V18Z', { fill: GLASS.light, opacity: 0.35 })]),
      path(body, outlined('none')),
    ]),
    ellipse(41, 40, 4, 5.5, { fill: DARK }),
    ellipse(56, 40, 4, 5.5, { fill: DARK }),
    circle(42, 38, 1.5, { fill: WHITE }),
    circle(57, 38, 1.5, { fill: WHITE }),
    ellipse(36, 50, 4, 2.5, { fill: PINK, opacity: 0.7 }),
    ellipse(62, 50, 4, 2.5, { fill: PINK, opacity: 0.7 }),
    path('M44 52Q48 58 53 52', line(DARK, 3)),
  ]);
}

export { sparkleStar };
