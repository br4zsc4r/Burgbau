// App-Icon (512 × 512) und Favicon im Stil der Spielgrafiken.

import { CLOTH_BLUE, GOLD, LEAF, MORTAR, OUTLINE, ROOF_BLUE, STONE, WOOD } from './palette.ts';
import { circle, el, line, outlined, path, rect, svg } from './svg.ts';

const SKY = '#8ec9f2';
const SKY_LIGHT = '#d8effc';

/** Burg mit zwei Türmen und Tor; Kontur 12, damit sie auch klein noch trägt. */
function castle(): string[] {
  const stone = STONE[0];
  if (stone === undefined) throw new Error('Keine Steinfarbe');
  const thick = (fill: string): Record<string, string | number> => ({ ...outlined(fill), 'stroke-width': 12 });
  const body =
    'M96 420V230h-4v-34h28v20h22v-20h28v34h-4v34h180v-34h-4v-34h28v20h22v-20h28v34h-4v190z';
  return [
    path(body, thick(stone.base)),
    path('M120 300h64M100 350h300M150 390h220M260 300h40M330 300h56', line(MORTAR, 6)),
    path('M216 420v-70a40 40 0 0 1 80 0v70z', thick(WOOD.base)),
    path('M256 316v104', line(WOOD.shade, 6)),
    // Turmdächer
    path('M84 200L130 92L176 200z', thick(ROOF_BLUE.base)),
    path('M336 200L382 92L428 200z', thick(ROOF_BLUE.base)),
    circle(130, 88, 10, { ...outlined(GOLD.base), 'stroke-width': 6 }),
    circle(382, 88, 10, { ...outlined(GOLD.base), 'stroke-width': 6 }),
    // Fahne auf dem Mittelbau
    path('M256 264V130', line(OUTLINE, 12)),
    path('M262 136c20-8 34 8 58 0l-8 22 8 22c-24 8-38-8-58 0z', { ...outlined(CLOTH_BLUE.base), 'stroke-width': 8 }),
    path('M190 264V232h24v14h28v-14h28v14h28v-14h24v32', thick(stone.base)),
  ];
}

/** maskable = Burg auf 80 % verkleinert, damit sie im sicheren Kreis runder Icons bleibt. */
export function appIcon(maskable = false): string {
  return svg(512, 512, [
    el('defs', {}, [
      el('linearGradient', { id: 'sky', x1: 0, y1: 0, x2: 0, y2: 1 }, [
        el('stop', { offset: 0, 'stop-color': SKY }),
        el('stop', { offset: 1, 'stop-color': SKY_LIGHT }),
      ]),
    ]),
    rect(0, 0, 512, 512, { fill: 'url(#sky)' }),
    path('M0 400C120 340 260 360 512 380V512H0z', { fill: LEAF.light }),
    rect(0, 414, 512, 98, { fill: LEAF.base }),
    ...(maskable ? [el('g', { transform: 'translate(51.2 78) scale(0.8)' }, castle())] : castle()),
    path('M0 414H512', line(LEAF.shade, 8)),
  ]);
}

export function favicon(): string {
  const stone = STONE[0]?.base ?? MORTAR;
  return svg(32, 32, [
    path('M4 30V10h5v4h4v-4h6v4h4v-4h5v20H19v-7a3 3 0 0 0-6 0v7z', { ...outlined(stone), 'stroke-width': 2 }),
  ]).replace(' width="32" height="32"', '');
}
