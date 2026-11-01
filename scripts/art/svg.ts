// Kleine Helfer, um SVG-Text zu erzeugen. Nur für den Grafik-Generator (läuft beim Entwickeln).

import { OUTLINE, OUTLINE_WIDTH } from './palette.ts';

export type Attrs = Record<string, string | number>;

function attributes(attrs: Attrs): string {
  return Object.entries(attrs)
    .map(([name, value]) => ` ${name}="${typeof value === 'number' ? round(value) : value}"`)
    .join('');
}

/** Zahlen kurz halten (höchstens zwei Nachkommastellen). */
export function round(value: number): string {
  return String(Math.round(value * 100) / 100);
}

export function el(tag: string, attrs: Attrs, children: readonly string[] = []): string {
  return children.length === 0
    ? `<${tag}${attributes(attrs)}/>`
    : `<${tag}${attributes(attrs)}>${children.join('')}</${tag}>`;
}

export function svg(width: number, height: number, children: readonly string[]): string {
  return `${el(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: `0 0 ${String(width)} ${String(height)}`,
      width,
      height,
    },
    children,
  )}\n`;
}

/** Dicke Kontur – das Erkennungszeichen des Stils. */
export function outlined(fill: string, width = OUTLINE_WIDTH): Attrs {
  return {
    fill,
    stroke: OUTLINE,
    'stroke-width': width,
    'stroke-linejoin': 'round',
    'stroke-linecap': 'round',
  };
}

/** Linie ohne Füllung. */
export function line(color: string, width: number): Attrs {
  return { fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
}

export const path = (d: string, attrs: Attrs): string => el('path', { d, ...attrs });
export const rect = (x: number, y: number, width: number, height: number, attrs: Attrs): string =>
  el('rect', { x, y, width, height, ...attrs });
export const circle = (cx: number, cy: number, r: number, attrs: Attrs): string =>
  el('circle', { cx, cy, r, ...attrs });
export const ellipse = (cx: number, cy: number, rx: number, ry: number, attrs: Attrs): string =>
  el('ellipse', { cx, cy, rx, ry, ...attrs });
export const group = (attrs: Attrs, children: readonly string[]): string => el('g', attrs, children);

/** Polygon aus Punkten [x, y, x, y, …]. */
export function polygon(points: readonly number[], attrs: Attrs): string {
  const pairs: string[] = [];
  for (let i = 0; i + 1 < points.length; i += 2) pairs.push(`${round(points[i] ?? 0)},${round(points[i + 1] ?? 0)}`);
  return el('polygon', { points: pairs.join(' '), ...attrs });
}

/** Inhalt auf eine Form zuschneiden (IDs müssen nur innerhalb einer Datei eindeutig sein). */
export function clipped(id: string, shape: string, children: readonly string[]): string {
  return el('defs', {}, [el('clipPath', { id }, [shape])]) + group({ 'clip-path': `url(#${id})` }, children);
}

/** Deterministischer Zufall, damit der Generator immer dieselben Dateien erzeugt. */
export function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
