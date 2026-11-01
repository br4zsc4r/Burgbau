// Grafiken für die Oberfläche: Fackeln der Serie und die Tiersymbole der Profile.

import { CLOTH_BLUE, DARK, GOLD, IRON, LEAF, OUTLINE, WHITE, WOOD, type Tone } from './palette.ts';
import { circle, ellipse, group, line, outlined, path, rect, svg } from './svg.ts';

const ORANGE: Tone = { light: '#ffb45e', base: '#f28c28', shade: '#c96a12' };
const PINK = '#f7a8c2';
const CREAM = '#fff4e2';

/** Stehfackel; lit = brennt (Serie), sonst nur ein Rauchfaden. */
export function torchIcon(lit: boolean): string {
  const flame = [
    circle(48, 26, 22, { fill: GOLD.light, opacity: 0.45 }),
    path('M48 44c-12 0-17-9-15-18 2-9 9-13 15-24 6 11 13 15 15 24 2 9-3 18-15 18z', outlined(ORANGE.base)),
    path('M48 40c-6 0-9-5-8-10 1-5 5-7 8-13 3 6 7 8 8 13 1 5-2 10-8 10z', { fill: GOLD.light }),
  ];
  const smoke = [path('M48 40c-6-6 6-10 0-16s6-10 0-16', line('#b9b2aa', 4))];
  return svg(96, 96, [
    ...(lit ? flame : smoke),
    path('M42 52H54L51 94H45Z', outlined(WOOD.base, 3)),
    path('M46 56L47 90', line(WOOD.light, 2)),
    rect(36, 42, 24, 12, { rx: 4, ...outlined(IRON.base, 3) }),
    rect(39, 44, 18, 3, { rx: 1.5, fill: IRON.light }),
  ]);
}

/** Augen mit Glanzpunkt. */
function eyes(lx: number, rx: number, y: number, r = 4.5): string[] {
  return [
    circle(lx, y, r, { fill: DARK }),
    circle(rx, y, r, { fill: DARK }),
    circle(lx + r * 0.35, y - r * 0.35, r * 0.35, { fill: WHITE }),
    circle(rx + r * 0.35, y - r * 0.35, r * 0.35, { fill: WHITE }),
  ];
}

function cheeks(lx: number, rx: number, y: number): string[] {
  return [ellipse(lx, y, 5, 3, { fill: PINK, opacity: 0.8 }), ellipse(rx, y, 5, 3, { fill: PINK, opacity: 0.8 })];
}

const animals: Record<string, () => string[]> = {
  fox: () => [
    path('M14 12L38 30H58L82 12L76 50C72 70 60 82 48 86C36 82 24 70 20 50Z', outlined(ORANGE.base)),
    path('M20 18L32 28L22 34Z M76 18L64 28L74 34Z', { fill: DARK, opacity: 0.6 }),
    path('M26 56C34 62 42 64 48 64S62 62 70 56C68 70 58 80 48 84C38 80 28 70 26 56Z', outlined(CREAM)),
    ...eyes(36, 60, 48),
    circle(48, 66, 5, { fill: DARK }),
  ],
  owl: () => [
    path('M18 20L30 30H66L78 20V60C78 78 64 88 48 88S18 78 18 60Z', outlined(WOOD.base)),
    path('M30 70l6 4M60 70l-6 4M40 78l8 3 8-3', line(WOOD.shade, 3)),
    circle(35, 46, 13, outlined(CREAM)),
    circle(61, 46, 13, outlined(CREAM)),
    ...eyes(35, 61, 46, 6),
    path('M43 58L48 68L53 58Z', outlined(GOLD.base, 3)),
  ],
  dragon: () => [
    path('M30 24L24 8L38 20M66 24L72 8L58 20', outlined(GOLD.base, 3)),
    path('M18 50C18 28 32 18 48 18S78 28 78 50C78 70 68 86 48 86S18 70 18 50Z', outlined('#4caf7d')),
    path('M30 64C34 74 40 78 48 78S62 74 66 64C62 68 56 70 48 70S34 68 30 64Z', { fill: '#8fd39a' }),
    ...eyes(36, 60, 44),
    circle(42, 66, 2.5, { fill: DARK }),
    circle(54, 66, 2.5, { fill: DARK }),
    path('M40 18l4-8 4 8 4-8 4 8', outlined('#36885e', 3)),
  ],
  lion: () => [
    ...Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6;
      return circle(48 + Math.cos(a) * 32, 50 + Math.sin(a) * 32, 11, outlined(ORANGE.shade, 3));
    }),
    circle(48, 50, 33, { fill: ORANGE.shade }),
    circle(48, 52, 26, outlined(GOLD.base)),
    circle(30, 30, 7, outlined(GOLD.base, 3)),
    circle(66, 30, 7, outlined(GOLD.base, 3)),
    ...eyes(39, 57, 48),
    path('M42 58H54L48 64Z', outlined(DARK, 2.5)),
    path('M48 64V68M42 70C45 72 47 70 48 68C49 70 51 72 54 70', line(OUTLINE, 3)),
  ],
  bear: () => [
    circle(24, 26, 12, outlined(WOOD.base)),
    circle(72, 26, 12, outlined(WOOD.base)),
    circle(24, 26, 5, { fill: WOOD.shade }),
    circle(72, 26, 5, { fill: WOOD.shade }),
    circle(48, 52, 34, outlined(WOOD.base)),
    ellipse(48, 64, 16, 12, outlined(WOOD.light, 3)),
    ...eyes(36, 60, 46),
    ellipse(48, 59, 5, 4, { fill: DARK }),
    path('M48 63V68M42 70C45 72 47 70 48 68C49 70 51 72 54 70', line(OUTLINE, 3)),
  ],
  cat: () => [
    path('M16 14L36 28H60L80 14L80 50C80 72 66 86 48 86S16 72 16 50Z', outlined('#a9a4b8')),
    path('M22 22L32 30L24 38Z M74 22L64 30L72 38Z', { fill: PINK }),
    ...eyes(36, 60, 50),
    ...cheeks(28, 68, 62),
    path('M44 60H52L48 65Z', { fill: PINK }),
    path('M48 65V69M42 71C45 73 47 71 48 69C49 71 51 73 54 71', line(OUTLINE, 3)),
    path('M20 60H34M22 68L34 64M76 60H62M74 68L62 64', line(OUTLINE, 2)),
  ],
  rabbit: () => [
    ellipse(34, 26, 9, 22, outlined('#ece6f2')),
    ellipse(62, 26, 9, 22, outlined('#ece6f2')),
    ellipse(34, 28, 4, 15, { fill: PINK }),
    ellipse(62, 28, 4, 15, { fill: PINK }),
    circle(48, 60, 28, outlined('#ece6f2')),
    ...eyes(38, 58, 56),
    ...cheeks(30, 66, 66),
    path('M44 64H52L48 68Z', { fill: PINK }),
    rect(44, 70, 8, 8, { rx: 2, ...outlined(WHITE, 2.5) }),
  ],
  frog: () => [
    circle(30, 30, 13, outlined(LEAF.base)),
    circle(66, 30, 13, outlined(LEAF.base)),
    ellipse(48, 58, 36, 26, outlined(LEAF.base)),
    circle(30, 30, 8, { fill: WHITE }),
    circle(66, 30, 8, { fill: WHITE }),
    ...eyes(30, 66, 31),
    ...cheeks(24, 72, 64),
    path('M30 62C38 72 58 72 66 62', line(OUTLINE, 4)),
  ],
  hedgehog: () => [
    path('M10 70L14 52L6 44L18 38L14 24L28 26L30 12L42 20L50 8L56 20L68 12L68 26L82 24L78 38L90 44L82 52L86 70Z', outlined(WOOD.shade)),
    path('M22 66C22 48 34 36 50 36S78 48 78 66C78 78 66 86 50 86S22 78 22 66Z', outlined(CREAM)),
    ...eyes(40, 60, 58),
    ...cheeks(32, 68, 70),
    ellipse(50, 70, 5, 4, { fill: DARK }),
  ],
  fish: () => [
    path('M70 48L90 30V66Z', outlined(ORANGE.shade)),
    ellipse(44, 48, 32, 24, outlined(ORANGE.base)),
    path('M40 26C44 16 56 16 60 26', outlined(ORANGE.shade, 3)),
    path('M54 34C58 42 58 54 54 62', line(ORANGE.shade, 3)),
    path('M20 40C24 34 30 30 36 30', line(ORANGE.light, 4)),
    ...eyes(28, 28, 44, 5),
    path('M18 56C22 58 26 58 28 56', line(OUTLINE, 3)),
    circle(84, 16, 4, outlined(CLOTH_BLUE.light, 2)),
    circle(76, 8, 2.5, outlined(CLOTH_BLUE.light, 2)),
  ],
};

export const ANIMALS = Object.keys(animals);

export function animalSymbol(animal: string): string {
  const draw = animals[animal];
  if (draw === undefined) throw new Error(`Unbekanntes Tier: ${animal}`);
  return svg(96, 96, [group({}, draw())]);
}
