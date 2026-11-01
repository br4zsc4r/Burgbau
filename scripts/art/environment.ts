// Umgebung (steht auf dem Boden) und große Premium-Teile: Windmühle, Ballon, Truhe, Einhorn.

import {
  CLOTH_BLUE,
  CLOTH_PURPLE,
  CLOTH_RED,
  DARK,
  GOLD,
  IRON,
  LEAF,
  OUTLINE,
  ROOF_RED,
  STONE,
  WATER,
  WHITE,
  WOOD,
  type Tone,
} from './palette.ts';
import { sparkleStar } from './decorations.ts';
import { circle, clipped, ellipse, group, line, outlined, path, rect, svg } from './svg.ts';

const PINK: Tone = { light: '#ffc2d8', base: '#f28bb0', shade: '#d0668f' };
const stoneTone = (i: number): Tone => {
  const tone = STONE[i] ?? STONE[0];
  if (tone === undefined) throw new Error('Keine Steinfarbe');
  return tone;
};

export function tree(): string {
  return svg(96, 96, [
    path('M42 96V62H54V96', outlined(WOOD.base)),
    path('M45 66V94', line(WOOD.light, 3)),
    path('M48 72L36 60M50 68L60 58', line(OUTLINE, 7)),
    path('M48 72L36 60M50 68L60 58', line(WOOD.base, 3)),
    group({}, [
      circle(30, 50, 18, outlined(LEAF.shade)),
      circle(66, 50, 18, outlined(LEAF.shade)),
      circle(48, 30, 24, outlined(LEAF.base)),
      circle(30, 50, 14, { fill: LEAF.shade }),
      circle(66, 50, 14, { fill: LEAF.shade }),
      circle(48, 30, 20, { fill: LEAF.base }),
      ellipse(40, 22, 9, 6, { fill: LEAF.light }),
    ]),
    circle(36, 46, 4.5, outlined(CLOTH_RED.base, 2.5)),
    circle(60, 36, 4.5, outlined(CLOTH_RED.base, 2.5)),
    circle(64, 56, 4.5, outlined(CLOTH_RED.base, 2.5)),
    // Grasbüschel am Fuß
    path('M34 96c0-6 2-9 4-10M62 96c0-6-2-9-4-10', line(LEAF.shade, 3)),
  ]);
}

export function well(): string {
  const stone = stoneTone(1);
  return svg(96, 96, [
    path('M24 66V32M72 66V32', line(OUTLINE, 9)),
    path('M24 66V32M72 66V32', line(WOOD.base, 4)),
    path('M10 34L48 10L86 34Z', outlined(ROOF_RED.base)),
    path('M48 10L86 34H48Z', { fill: ROOF_RED.shade, opacity: 0.5 }),
    path('M20 30L48 13', line(ROOF_RED.light, 4)),
    path('M48 34V50', line(OUTLINE, 3)),
    path('M40 50H56L54 62H42Z', outlined(WOOD.base, 3)),
    path('M40 54H56', line(IRON.base, 2.5)),
    rect(14, 62, 68, 34, { rx: 6, ...outlined(stone.base) }),
    clipped('w', rect(14, 62, 68, 34, { rx: 6 }), [
      path('M14 74H82M14 86H82M32 62V74M52 62V74M70 62V74M24 74V86M44 74V86M62 74V86M36 86V96M56 86V96', line(stone.shade, 3)),
      rect(14, 62, 68, 4, { fill: stone.light }),
    ]),
    rect(14, 62, 68, 34, { rx: 6, ...outlined('none') }),
  ]);
}

/** Wassergraben: niedriges Steinbecken mit Wasser und Schilf. */
export function moat(): string {
  const stone = stoneTone(1);
  const water = 'M10 66H86V92H10Z';
  return svg(96, 96, [
    path('M2 96V60H14V88H82V60H94V96', outlined(stone.base)),
    path(water, { fill: WATER.base }),
    clipped('m', path(water, {}), [
      rect(10, 66, 76, 5, { fill: WATER.shade }),
      path('M18 78c6-4 10 4 16 0s10 4 16 0 10 4 16 0', line(WATER.light, 3)),
    ]),
    path('M14 64H82', line(OUTLINE, 4)),
    path('M88 60C86 46 88 38 90 32M84 60C80 50 78 44 76 40', line(LEAF.shade, 3)),
    ellipse(90, 32, 3, 7, outlined(WOOD.base, 2)),
  ]);
}

/** Zugbrücke: Holzsteg mit Ketten, links ein Pfosten. */
export function drawbridge(): string {
  const stone = stoneTone(2);
  return svg(96, 96, [
    rect(4, 22, 16, 74, { rx: 3, ...outlined(stone.base) }),
    rect(7, 26, 4, 66, { rx: 2, fill: stone.light }),
    path('M4 48H20M4 72H20', line(stone.shade, 3)),
    path('M16 30L88 76', { fill: 'none', stroke: IRON.base, 'stroke-width': 4, 'stroke-dasharray': '6 4' }),
    rect(16, 76, 78, 14, { rx: 3, ...outlined(WOOD.base) }),
    rect(19, 78, 72, 3, { rx: 1.5, fill: WOOD.light }),
    path('M36 76v14M56 76v14M76 76v14', line(WOOD.shade, 3)),
    circle(14, 30, 4, outlined(IRON.base, 2.5)),
  ]);
}

/** Holzkiste, Fass und ein kleines Fass obendrauf. */
export function barrels(): string {
  return svg(96, 96, [
    rect(4, 54, 42, 42, { rx: 3, ...outlined(WOOD.light) }),
    path('M8 58L42 92M42 58L8 92', line(WOOD.shade, 5)),
    path('M4 54H46', line(WOOD.shade, 3)),
    rect(4, 54, 42, 42, { rx: 3, ...outlined('none') }),
    // Fass
    path('M50 96C46 80 46 60 50 44H84C88 60 88 80 84 96Z', outlined(WOOD.base)),
    path('M54 46C51 62 51 80 54 94', line(WOOD.light, 4)),
    path('M60 44V96M74 44V96', line(WOOD.shade, 2.5)),
    path('M48 56H86M47 84H87', line(IRON.base, 5)),
    path('M50 96C46 80 46 60 50 44H84C88 60 88 80 84 96Z', outlined('none')),
    // kleines Fass auf der Kiste
    path('M12 54C10 46 10 38 12 30H36C38 38 38 46 36 54Z', outlined(WOOD.base, 3)),
    path('M11 38H37M11 47H37', line(IRON.base, 3.5)),
    ellipse(24, 30, 12, 3, outlined(WOOD.shade, 3)),
  ]);
}

/** Springbrunnen: Becken und Säule mit Schale; das Wasser sprudelt (eigene Datei). */
export function fountain(): string {
  const stone = stoneTone(2);
  return svg(96, 96, [
    path('M42 80V50H54V80', outlined(stone.base, 3)),
    path('M28 46H68C66 54 58 56 48 56S30 54 28 46Z', outlined(stone.base, 3)),
    ellipse(48, 46, 20, 4, outlined(WATER.base, 3)),
    path('M6 72H90L84 94H12Z', outlined(stone.base)),
    rect(6, 70, 84, 8, { rx: 3, ...outlined(stone.light, 3) }),
    ellipse(48, 72, 36, 3, { fill: WATER.base }),
    path('M20 86H76', line(stone.shade, 3)),
  ]);
}

export function fountainMoving(): string {
  return svg(96, 96, [
    path('M48 46C46 30 40 22 30 22C24 22 22 30 24 40M48 46C50 30 56 22 66 22C72 22 74 30 72 40', line(WATER.shade, 7)),
    path('M48 46C46 30 40 22 30 22C24 22 22 30 24 40M48 46C50 30 56 22 66 22C72 22 74 30 72 40', line(WATER.light, 3.5)),
    path('M48 46V12', line(WATER.shade, 7)),
    path('M48 46V12', line(WATER.light, 3.5)),
    circle(48, 8, 3.5, outlined(WATER.light, 2)),
    circle(22, 48, 2.5, { fill: WATER.base }),
    circle(74, 48, 2.5, { fill: WATER.base }),
  ]);
}

/** Offene Schatztruhe voller Gold; die Funkeln bewegen sich (eigene Datei). */
export function treasureChest(): string {
  const lid = 'M14 54L18 26C30 18 66 18 78 26L82 54Z';
  return svg(96, 96, [
    path(lid, outlined(WOOD.shade)),
    path('M20 30C32 23 64 23 76 30', line(GOLD.base, 5)),
    // Goldberg
    path('M12 56C16 42 30 36 48 36S80 42 84 56Z', outlined(GOLD.base, 3)),
    circle(30, 46, 5, outlined(GOLD.light, 2)),
    circle(44, 41, 5, outlined(GOLD.light, 2)),
    circle(62, 44, 5, outlined(GOLD.light, 2)),
    path('M52 46l5-6 5 6-5 6z', outlined(CLOTH_RED.base, 2)),
    path('M36 50l4-5 4 5-4 5z', outlined(CLOTH_BLUE.base, 2)),
    // Kiste
    rect(10, 54, 76, 40, { rx: 4, ...outlined(WOOD.base) }),
    rect(14, 58, 68, 4, { rx: 2, fill: WOOD.light }),
    path('M10 72H86', line(WOOD.shade, 3)),
    rect(20, 54, 8, 40, outlined(GOLD.base, 3)),
    rect(68, 54, 8, 40, outlined(GOLD.base, 3)),
    rect(40, 62, 16, 18, { rx: 3, ...outlined(GOLD.base, 3) }),
    circle(48, 70, 2.5, { fill: DARK }),
    // Münzen davor
    ellipse(88, 92, 6, 3, outlined(GOLD.base, 2)),
    ellipse(6, 94, 5, 2.5, outlined(GOLD.base, 2)),
  ]);
}

export function treasureChestMoving(): string {
  return svg(96, 96, [sparkleStar(30, 30, 8, WHITE), sparkleStar(66, 26, 6, GOLD.light), sparkleStar(52, 52, 7, WHITE)]);
}

/** Einhorn (Blick nach rechts); Glitzern am Horn (eigene Datei). */
export function unicorn(): string {
  const body = '#fbf7ff';
  const shade = '#ddd3ee';
  return svg(96, 96, [
    // Schweif in Regenbogenfarben
    path('M22 54C8 54 4 66 8 78C10 70 14 66 20 66', outlined(PINK.base, 3)),
    path('M22 58C12 60 10 70 12 76', line(CLOTH_PURPLE.light, 4)),
    // Beine hinten
    rect(24, 64, 9, 30, { rx: 4, ...outlined(shade, 3) }),
    rect(56, 64, 9, 30, { rx: 4, ...outlined(shade, 3) }),
    // Körper
    ellipse(44, 60, 26, 16, outlined(body)),
    path('M28 68C38 74 54 74 64 68', line(shade, 4)),
    // Beine vorn
    rect(32, 66, 9, 28, { rx: 4, ...outlined(body, 3) }),
    rect(62, 66, 9, 28, { rx: 4, ...outlined(body, 3) }),
    rect(32, 88, 9, 6, { rx: 2, ...outlined(GOLD.base, 2.5) }),
    rect(62, 88, 9, 6, { rx: 2, ...outlined(GOLD.base, 2.5) }),
    // Hals und Kopf
    path('M56 52L64 26L78 24L74 56Z', outlined(body)),
    path('M64 22C72 16 84 20 88 30C90 36 88 40 82 40C76 40 70 38 66 34Z', outlined(body)),
    ellipse(86, 36, 2, 1.5, { fill: shade }),
    circle(74, 28, 3, { fill: DARK }),
    circle(75, 27, 1, { fill: WHITE }),
    ellipse(80, 34, 3, 2, { fill: PINK.light }),
    path('M66 20L64 12L70 18', outlined(body, 3)),
    // Horn
    path('M74 20L84 6L80 22Z', outlined(GOLD.base, 3)),
    path('M76 18L82 14M77 21L81 17', line(GOLD.shade, 2)),
    // Mähne
    path('M64 22C56 26 54 34 56 40C58 34 60 32 62 32C58 38 58 44 60 50C62 42 64 38 66 36Z', outlined(PINK.base, 3)),
    path('M62 26C59 30 58 34 58 38', line(CLOTH_PURPLE.light, 3)),
    path('M64 34C62 38 61 42 61 46', line(CLOTH_BLUE.light, 3)),
  ]);
}

export function unicornMoving(): string {
  return svg(96, 96, [sparkleStar(86, 8, 7, GOLD.light), sparkleStar(72, 6, 4, WHITE), sparkleStar(92, 20, 4, PINK.light)]);
}

/** Windmühle (2 × 2): Turm mit Dach, die Flügel drehen sich (eigene Datei, Achse 96/76). */
export function windmill(): string {
  const wall: Tone = { light: '#ffffff', base: '#f3eee4', shade: '#d8cfbf' };
  const tower = 'M52 192L66 82H126L140 192Z';
  return svg(192, 192, [
    path(tower, { fill: wall.base }),
    clipped('t', path(tower, {}), [
      path('M96 82L140 192H96Z', { fill: wall.shade, opacity: 0.6 }),
      path('M60 130H132M56 160H136', line(wall.shade, 3)),
      path('M62 186L72 86', line(wall.light, 5)),
    ]),
    path(tower, outlined('none')),
    path('M84 192V164C84 156 90 152 96 152S108 156 108 164V192', outlined(WOOD.base)),
    path('M96 152V192', line(WOOD.shade, 3)),
    circle(96, 118, 9, outlined(CLOTH_BLUE.base, 3)),
    path('M46 88L96 44L146 88Z', outlined(ROOF_RED.base)),
    path('M96 44L146 88H96Z', { fill: ROOF_RED.shade, opacity: 0.5 }),
    path('M56 84L94 50', line(ROOF_RED.light, 4)),
  ]);
}

export function windmillMoving(): string {
  const blade = (angle: number): string =>
    group({ transform: `rotate(${String(angle)} 96 76)` }, [
      path('M93 72L90 8H118L106 72Z', outlined(WHITE, 3)),
      path('M98 64V14M108 60V14M90 24H118M90 40H116M90 56H110', line('#cdbfa6', 2)),
      path('M96 76V6', line(WOOD.shade, 5)),
    ]);
  return svg(192, 192, [blade(0), blade(90), blade(180), blade(270), circle(96, 76, 10, outlined(WOOD.base))]);
}

/** Heißluftballon (1 × 2): unten nur der Pflock; der Ballon schwebt (eigene Datei). */
export function balloon(): string {
  return svg(96, 192, [
    path('M42 192L46 178H50L54 192', outlined(WOOD.base, 3)),
    ellipse(48, 190, 16, 3, { fill: DARK, opacity: 0.2 }),
  ]);
}

export function balloonMoving(): string {
  const envelope = 'M48 6C22 6 8 26 8 50C8 76 30 96 38 112H58C66 96 88 76 88 50C88 26 74 6 48 6Z';
  return svg(96, 192, [
    path('M48 182V148M38 112L36 134M58 112L60 134', line(OUTLINE, 3)),
    path(envelope, { fill: CLOTH_RED.base }),
    clipped('env', path(envelope, {}), [
      path('M48 6C38 30 36 80 42 112H54C60 80 58 30 48 6Z', { fill: GOLD.base }),
      path('M48 6C20 30 18 80 30 112', line(GOLD.base, 8)),
      path('M48 6C76 30 78 80 66 112', line(GOLD.base, 8)),
      path('M48 6C80 16 92 60 70 112H96V0Z', { fill: CLOTH_RED.shade, opacity: 0.35 }),
      ellipse(30, 34, 8, 14, { fill: WHITE, opacity: 0.35 }),
    ]),
    path(envelope, outlined('none')),
    rect(36, 110, 24, 6, { rx: 2, ...outlined(WOOD.shade, 3) }),
    // Korb
    path('M32 134H64L60 156H36Z', outlined(WOOD.base)),
    path('M34 142H62M35 149H61', line(WOOD.shade, 2.5)),
    path('M44 134V156M52 134V156', line(WOOD.light, 2)),
    rect(30, 130, 36, 6, { rx: 3, ...outlined(WOOD.light, 3) }),
  ]);
}

