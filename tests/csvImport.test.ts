import { describe, expect, it } from 'vitest';
import { deriveWord, parseCsvWordList, wordId } from '../src/logic/csvImport';
import { checkWordConsistency, validateWordList } from '../src/logic/wordlist';
import { canUseTiles } from '../src/logic/tiles';

describe('CSV-Import', () => {
  it('liest Artikel;Singular;Plural und leitet Muster und Umlaut ab', () => {
    const { list, errors } = parseCsvWordList('der;Hund;Hunde\ndie;Hand;Hände\n', 'eigene-1', 'Meine Liste');
    expect(errors).toEqual([]);
    expect(list).toMatchObject({ id: 'eigene-1', name: 'Meine Liste', inputMode: 'keyboard' });
    expect(list?.words).toEqual([
      { id: 'hund', singular: 'Hund', article: 'der', plural: ['Hunde'], pattern: 'e', umlaut: false, verified: true },
      { id: 'hand', singular: 'Hand', article: 'die', plural: ['Hände'], pattern: 'e', umlaut: true, verified: true },
    ]);
  });

  it('erlaubt mehrere Plurale mit |, überspringt Kopfzeile, BOM und Leerzeilen', () => {
    const text = '﻿Artikel;Singular;Plural\r\n\r\ndie;Pizza;Pizzas | Pizzen\r\n';
    const { list, errors } = parseCsvWordList(text, 'x', 'x');
    expect(errors).toEqual([]);
    expect(list?.words[0]?.plural).toEqual(['Pizzas', 'Pizzen']);
  });

  it('meldet fehlerhafte Zeilen mit Zeilennummer und übernimmt den Rest', () => {
    const text = ['der;Hund;Hunde', 'den;Baum;Bäume', 'die;Katze', 'das;;Autos', 'die;Uhr;', 'der;Hund;Hunde'].join('\n');
    const { list, errors } = parseCsvWordList(text, 'x', 'x');
    expect(list?.words.map((w) => w.singular)).toEqual(['Hund']);
    expect(errors).toEqual([
      { line: 2, reason: 'article' },
      { line: 3, reason: 'columns' },
      { line: 4, reason: 'singular' },
      { line: 5, reason: 'plural' },
      { line: 6, reason: 'duplicate' },
    ]);
  });

  it('liefert keine Liste, wenn keine Zeile gültig ist', () => {
    expect(parseCsvWordList('Unsinn', 'x', 'x').list).toBeNull();
  });

  it('Sonderfälle bekommen einen Pluralstamm und gehen nur mit Tastatur', () => {
    const museum = deriveWord('das', 'Museum', ['Museen']);
    expect(museum).toMatchObject({ stem: 'Muse', pattern: 'en', umlaut: false });
    expect(checkWordConsistency(museum)).toEqual([]);
    expect(canUseTiles(museum)).toBe(false);
    expect(deriveWord('der', 'Bus', ['Busse'])).toMatchObject({ stem: 'Buss', pattern: 'e' });
  });

  it('importierte Listen bestehen die normale Wortlisten-Prüfung', () => {
    const text = 'das;Museum;Museen\nder;Lehrer;Lehrer\ndie;Freundin;Freundinnen\ndas;Café;Cafés';
    const { list } = parseCsvWordList(text, 'x', 'x');
    expect(validateWordList(list)).toEqual([]);
  });

  it('bildet einfache IDs aus dem Singular', () => {
    expect(wordId('Bär')).toBe('baer');
    expect(wordId('Fuß')).toBe('fuss');
    expect(wordId('Café')).toBe('cafe');
  });
});
