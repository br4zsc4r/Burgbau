import { describe, expect, it } from 'vitest';
import { checkAnswer } from '../src/logic/plural';
import { solutionSegments } from '../src/logic/pluralPattern';
import { ENDING_TILES, buildPlural, canUseTiles, umlautTargets } from '../src/logic/tiles';
import { makeWord, testSettings } from './helpers';

describe('Bausteine', () => {
  it('bieten die fünf Muster plus „keine Endung“ an', () => {
    expect(ENDING_TILES).toEqual(['e', 'er', 'n', 'en', 's', 'none']);
  });

  it('Umlautpünktchen passen auf a, o, u – auch groß und in „au“', () => {
    expect(umlautTargets('Hand')).toEqual([1]);
    expect(umlautTargets('Haus')).toEqual([1, 2]);
    expect(umlautTargets('Apfel')).toEqual([0]);
    expect(umlautTargets('Tisch')).toEqual([]);
  });

  it.each([
    ['Hand', 1, 'e', 'Hände'],
    ['Haus', 1, 'er', 'Häuser'],
    ['Apfel', 0, 'none', 'Äpfel'],
    ['Katze', null, 'n', 'Katzen'],
    ['Fenster', null, 'none', 'Fenster'],
    ['Auto', null, 's', 'Autos'],
  ] as const)('%s + Pünktchen an %s + %s → %s', (singular, umlaut, ending, expected) => {
    expect(buildPlural(singular, umlaut, ending)).toBe(expected);
  });

  it('nutzt dieselbe Antwortprüfung: fehlende Pünktchen sind „fast“', () => {
    const hand = makeWord({ singular: 'Hand', plural: ['Hände'], umlaut: true });
    expect(checkAnswer(buildPlural('Hand', null, 'e'), hand, testSettings, 1).status).toBe('almost');
    expect(checkAnswer(buildPlural('Hand', 1, 'e'), hand, testSettings, 1).status).toBe('correct');
  });

  it('gehen nur bei regelmäßig gebildeten Pluralen', () => {
    expect(canUseTiles(makeWord({ singular: 'Hand', plural: ['Hände'] }))).toBe(true);
    expect(canUseTiles(makeWord({ singular: 'Museum', plural: ['Museen'], stem: 'Muse', pattern: 'en' }))).toBe(false);
  });
});

describe('Lösung bei Sonderfällen', () => {
  it('hebt bei eigenem Pluralstamm den neuen Teil und die Endung hervor', () => {
    const freundin = makeWord({ singular: 'Freundin', plural: ['Freundinnen'], stem: 'Freundinn', pattern: 'en' });
    expect(solutionSegments(freundin)).toEqual([
      { text: 'Freundin', highlight: false },
      { text: 'nen', highlight: true },
    ]);
    const museum = makeWord({ singular: 'Museum', plural: ['Museen'], stem: 'Muse', pattern: 'en' });
    expect(solutionSegments(museum)).toEqual([
      { text: 'Muse', highlight: false },
      { text: 'en', highlight: true },
    ]);
  });
});
