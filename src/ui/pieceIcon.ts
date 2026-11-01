import { ART_CELL, TEXTURE_SIZE, damageUrl, pieceArt, textureUrl } from '../data/pieceArt';
import { getPiece } from '../data/pieces';
import type { PieceId } from '../types';

const SVG_NS = 'http://www.w3.org/2000/svg';
let patternCount = 0;

function svgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attributes: Record<string, string>,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value);
  return el;
}

/**
 * Vorschau eines Bauteils als SVG – aus denselben Grafiken wie in der Bauszene:
 * Blöcke aus Materialtextur, Merkmal, Schaden und Kontur; andere Teile als Bild.
 */
export function createPieceIcon(id: PieceId): SVGSVGElement {
  const art = pieceArt(id);
  const { width, height } = getPiece(id);
  const w = width * ART_CELL;
  const h = height * ART_CELL;
  const svg = svgElement('svg', {
    viewBox: `0 0 ${String(w)} ${String(h)}`,
    class: 'piece-icon',
    'aria-hidden': 'true',
  });

  if (art.material !== null) {
    const patternId = `piece-texture-${String(++patternCount)}`;
    const size = String(TEXTURE_SIZE);
    const pattern = svgElement('pattern', {
      id: patternId,
      patternUnits: 'userSpaceOnUse',
      width: size,
      height: size,
    });
    pattern.append(svgElement('image', { href: textureUrl(art.material), width: size, height: size }));
    const defs = svgElement('defs', {});
    defs.append(pattern);
    svg.append(defs, svgElement('rect', { width: String(w), height: String(h), fill: `url(#${patternId})` }));
  }

  if (art.image !== null) {
    svg.append(svgElement('image', { href: art.image, width: String(w), height: String(h) }));
  }

  for (const overlay of art.damage) {
    svg.append(
      svgElement('image', {
        href: damageUrl(overlay.kind),
        x: String(overlay.dx * ART_CELL),
        y: String((height - 1 - overlay.dy) * ART_CELL),
        width: String(ART_CELL),
        height: String(ART_CELL),
      }),
    );
  }

  if (art.material !== null) {
    svg.append(
      svgElement('rect', {
        x: '2',
        y: '2',
        width: String(w - 4),
        height: String(h - 4),
        fill: 'none',
        stroke: '#4a3f33',
        'stroke-width': '4',
        'stroke-dasharray': art.rough ? '18 3 9 4' : 'none',
      }),
    );
  }
  return svg;
}
