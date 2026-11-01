import { describe, expect, it } from 'vitest';
import { checkAnswer, normalizeAnswer } from '../src/logic/plural';
import type { Settings } from '../src/types';
import { makeWord, testSettings } from './helpers';

const lenient: Settings = testSettings;
const strict: Settings = { ...testSettings, requireCapitalization: true };

const hund = makeWord({ singular: 'Hund', plural: ['Hunde'] });
const hand = makeWord({ singular: 'Hand', plural: ['Hände'], umlaut: true });
const pizza = makeWord({ singular: 'Pizza', plural: ['Pizzas', 'Pizzen'] });

describe('normalizeAnswer', () => {
  it('trimmt und normalisiert nach NFC', () => {
    const decomposed = '  Hände ';
    expect(normalizeAnswer(decomposed)).toBe('Hände');
  });
});

describe('checkAnswer', () => {
  it('erkennt die richtige Form', () => {
    expect(checkAnswer('Hunde', hund, lenient, 1)).toEqual({
      status: 'correct',
      capitalizationHint: false,
    });
  });

  it('akzeptiert jede erlaubte Form', () => {
    expect(checkAnswer('Pizzas', pizza, lenient, 1).status).toBe('correct');
    expect(checkAnswer('Pizzen', pizza, lenient, 1).status).toBe('correct');
  });

  it('ignoriert Leerzeichen am Rand', () => {
    expect(checkAnswer('  Hunde\n', hund, lenient, 1).status).toBe('correct');
  });

  it('akzeptiert zerlegte Umlaute (NFD)', () => {
    expect(checkAnswer('Hände', hand, lenient, 1).status).toBe('correct');
  });

  describe('Großschreibung nicht verpflichtend', () => {
    it('zählt Kleinschreibung als richtig, mit Hinweis', () => {
      expect(checkAnswer('hunde', hund, lenient, 1)).toEqual({
        status: 'correct',
        capitalizationHint: true,
      });
      expect(checkAnswer('hände', hand, lenient, 1)).toEqual({
        status: 'correct',
        capitalizationHint: true,
      });
    });

    it('gilt auch im zweiten Versuch', () => {
      expect(checkAnswer('hunde', hund, lenient, 2).status).toBe('correct');
    });
  });

  describe('Großschreibung verpflichtend', () => {
    it('gibt im ersten Versuch „fast“ mit Groß-Hinweis', () => {
      expect(checkAnswer('hunde', hund, strict, 1)).toEqual({
        status: 'almost',
        reason: 'capitalization',
      });
    });

    it('zählt im zweiten Versuch als falsch', () => {
      expect(checkAnswer('hunde', hund, strict, 2)).toEqual({
        status: 'wrong',
        solution: 'Hunde',
      });
    });

    it('akzeptiert die korrekt geschriebene Form', () => {
      expect(checkAnswer('Hunde', hund, strict, 1).status).toBe('correct');
    });
  });

  describe('fast richtig (Abstand 1)', () => {
    it.each(['Hunte', 'Hund', 'Hundee', 'Hande', 'hande'])('„%s“ → fast', (input) => {
      const word = input.toLowerCase().startsWith('han') ? hand : hund;
      expect(checkAnswer(input, word, lenient, 1)).toEqual({ status: 'almost', reason: 'typo' });
    });

    it('vergleicht gegen alle erlaubten Formen', () => {
      expect(checkAnswer('Pizzem', pizza, lenient, 1).status).toBe('almost');
    });

    it('gibt nur einen zweiten Versuch', () => {
      expect(checkAnswer('Hunte', hund, lenient, 2)).toEqual({
        status: 'wrong',
        solution: 'Hunde',
      });
    });
  });

  it('wertet weit entfernte Antworten als falsch und nennt die Hauptform', () => {
    expect(checkAnswer('Hundis', hund, lenient, 1)).toEqual({ status: 'wrong', solution: 'Hunde' });
    expect(checkAnswer('Pizzaa1', pizza, lenient, 1)).toEqual({
      status: 'wrong',
      solution: 'Pizzas',
    });
  });

  it('wertet leere Eingabe als falsch', () => {
    expect(checkAnswer('   ', hund, lenient, 1).status).toBe('wrong');
  });
});
