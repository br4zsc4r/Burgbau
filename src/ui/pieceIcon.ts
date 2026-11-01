import { ART_CELL, DAMAGE_OVERLAY_URL, pieceArt, pieceArtUrl } from '../data/pieceArt';
import { getPiece } from '../data/pieces';
import type { PieceId } from '../types';

const SVG_NS = 'http://www.w3.org/2000/svg';
let filterCount = 0;

function svgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attributes: Record<string, string>,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value);
  return el;
}

/** Farbmatrix, die wie Phasers setTint multipliziert – damit Karte und Szene gleich aussehen. */
function tintMatrix(tint: number): string {
  const r = ((tint >> 16) & 0xff) / 255;
  const g = ((tint >> 8) & 0xff) / 255;
  const b = (tint & 0xff) / 255;
  return `${r} 0 0 0 0  0 ${g} 0 0 0  0 0 ${b} 0 0  0 0 0 1 0`;
}

/** Vorschau eines Bauteils als SVG (gleiche Grafiken wie in der Bauszene, große Teile unverzerrt). */
export function createPieceIcon(id: PieceId): SVGSVGElement {
  const art = pieceArt(id);
  const { width, height } = getPiece(id);
  const w = String(width * ART_CELL);
  const h = String(height * ART_CELL);
  const svg = svgElement('svg', { viewBox: `0 0 ${w} ${h}`, class: 'piece-icon', 'aria-hidden': 'true' });
  const image = svgElement('image', { href: pieceArtUrl(art.base), width: w, height: h });

  if (art.tint !== null) {
    const filterId = `piece-tint-${String(++filterCount)}`;
    const filter = svgElement('filter', { id: filterId, 'color-interpolation-filters': 'sRGB' });
    filter.append(svgElement('feColorMatrix', { type: 'matrix', values: tintMatrix(art.tint) }));
    const defs = svgElement('defs', {});
    defs.append(filter);
    svg.append(defs);
    image.setAttribute('filter', `url(#${filterId})`);
  }
  svg.append(image);
  if (art.damaged) {
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        svg.append(
          svgElement('image', {
            href: DAMAGE_OVERLAY_URL,
            x: String(dx * ART_CELL),
            y: String(dy * ART_CELL),
            width: String(ART_CELL),
            height: String(ART_CELL),
          }),
        );
      }
    }
  }
  return svg;
}
