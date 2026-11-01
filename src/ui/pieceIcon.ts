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
    const texture = svgElement('rect', { width: String(w), height: String(h), fill: `url(#${patternId})` });
    if (art.cutout !== null) {
      // Bogenöffnung aussparen: Maske weiß, Öffnung schwarz.
      const { cx, top, half, bottom } = art.cutout;
      const maskId = `${patternId}-cutout`;
      const mask = svgElement('mask', { id: maskId });
      mask.append(
        svgElement('rect', { width: String(w), height: String(h), fill: 'white' }),
        svgElement('path', {
          d: `M${String(cx - half)} ${String(bottom + 1)}V${String(top + half)}A${String(half)} ${String(half)} 0 0 1 ${String(cx + half)} ${String(top + half)}V${String(bottom + 1)}Z`,
          fill: 'black',
        }),
      );
      defs.append(mask);
      texture.setAttribute('mask', `url(#${maskId})`);
    }
    svg.append(defs, texture);
  }

  if (art.image !== null) {
    svg.append(svgElement('image', { href: art.image, width: String(w), height: String(h) }));
  }

  if (art.animation !== null) {
    // Bewegter Teil auch auf der Karte, damit die Belohnung gleich erkennbar ist.
    const moving = svgElement('image', {
      href: art.animation.image,
      width: String(w),
      height: String(h),
      class: `piece-anim anim-${art.animation.kind}`,
    });
    moving.style.transformOrigin = `${String(art.animation.originX * w)}px ${String(art.animation.originY * h)}px`;
    svg.append(moving);
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

  if (art.material !== null && art.cutout === null) {
    svg.append(
      svgElement('rect', {
        x: '2',
        y: '2',
        width: String(w - 4),
        height: String(h - 4),
        fill: 'none',
        stroke: '#3b2f2a',
        'stroke-width': '4',
        'stroke-dasharray': art.rough ? '18 3 9 4' : 'none',
      }),
    );
  }
  return svg;
}
