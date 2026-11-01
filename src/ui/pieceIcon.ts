import { DAMAGE_OVERLAY_URL, pieceArt, pieceArtUrl } from '../data/pieceArt';
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

/** Vorschau eines Bauteils als SVG (gleiche Grafiken wie in der Bauszene). */
export function createPieceIcon(id: PieceId): SVGSVGElement {
  const art = pieceArt(id);
  const svg = svgElement('svg', { viewBox: '0 0 96 96', class: 'piece-icon', 'aria-hidden': 'true' });
  const image = svgElement('image', { href: pieceArtUrl(art.base), width: '96', height: '96' });

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
    svg.append(svgElement('image', { href: DAMAGE_OVERLAY_URL, width: '96', height: '96' }));
  }
  return svg;
}
