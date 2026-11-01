import { describe, expect, it } from 'vitest';
import { analyzePlural, solutionSegments } from '../src/logic/pluralPattern';
import { makeWord } from './helpers';

describe('analyzePlural', () => {
  it.each([
    ['Hund', 'Hunde', 'e', null],
    ['Kind', 'Kinder', 'er', null],
    ['Katze', 'Katzen', 'n', null],
    ['Frau', 'Frauen', 'en', null],
    ['Auto', 'Autos', 's', null],
    ['Fenster', 'Fenster', 'none', null],
    ['Hand', 'Hände', 'e', 1],
    ['Haus', 'Häuser', 'er', 1],
    ['Apfel', 'Äpfel', 'none', 0],
    ['Tür', 'Türen', 'en', null],
  ])('%s → %s: Muster %s, Umlaut an %s', (singular, plural, pattern, umlautIndex) => {
    expect(analyzePlural(singular, plural)).toEqual({
      pattern,
      umlautIndex,
      endingStart: Array.from(singular).length,
    });
  });

  it.each([
    ['Museum', 'Museen'],
    ['Pizza', 'Pizzen'],
    ['Hund', 'Hundis'],
    ['Haus', 'Hüuser'],
  ])('%s → %s folgt keinem regelmäßigen Muster', (singular, plural) => {
    expect(analyzePlural(singular, plural)).toBeNull();
  });
});

describe('solutionSegments', () => {
  it('hebt die Endung hervor', () => {
    expect(solutionSegments(makeWord({ singular: 'Hund', plural: ['Hunde'] }))).toEqual([
      { text: 'Hund', highlight: false },
      { text: 'e', highlight: true },
    ]);
  });

  it('hebt Umlaut und Endung hervor', () => {
    expect(solutionSegments(makeWord({ singular: 'Haus', plural: ['Häuser'] }))).toEqual([
      { text: 'H', highlight: false },
      { text: 'ä', highlight: true },
      { text: 'us', highlight: false },
      { text: 'er', highlight: true },
    ]);
  });

  it('hebt einen Umlaut am Wortanfang hervor', () => {
    expect(solutionSegments(makeWord({ singular: 'Apfel', plural: ['Äpfel'] }))).toEqual([
      { text: 'Ä', highlight: true },
      { text: 'pfel', highlight: false },
    ]);
  });

  it('zeigt Formen ohne Endung und Umlaut unverändert', () => {
    expect(solutionSegments(makeWord({ singular: 'Fenster', plural: ['Fenster'] }))).toEqual([
      { text: 'Fenster', highlight: false },
    ]);
  });

  it('zeigt unregelmäßige Formen ohne Hervorhebung', () => {
    expect(solutionSegments(makeWord({ singular: 'Museum', plural: ['Museen'] }))).toEqual([
      { text: 'Museen', highlight: false },
    ]);
  });
});
