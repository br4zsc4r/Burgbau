import { describe, expect, it } from 'vitest';
import { wordFromInput } from '../src/logic/csvImport';
import { hashPin, isValidPin, pinMatches } from '../src/logic/pin';
import { activePool, mergeLists, toggleList, validActiveIds } from '../src/logic/wordlists';
import type { WordList } from '../src/types';
import { makeWord } from './helpers';

const hund = makeWord({ id: 'hund', singular: 'Hund', plural: ['Hunde'] });
const katze = makeWord({ id: 'katze', singular: 'Katze', plural: ['Katzen'], pattern: 'n' });
const baum = makeWord({ id: 'baum', singular: 'Baum', plural: ['Bäume'], umlaut: true });

const k12: WordList = { id: 'klasse-1-2', name: 'Klasse 1/2', inputMode: 'tiles', words: [hund, katze] };
const k3: WordList = { id: 'klasse-3', name: 'Klasse 3', inputMode: 'keyboard', words: [baum, hund] };

describe('mergeLists', () => {
  it('eine gespeicherte Fassung ersetzt die mitgelieferte, eigene Listen kommen dazu', () => {
    const edited = { ...k12, words: [hund] };
    const own: WordList = { id: 'eigene-1', name: 'Tiere', inputMode: 'keyboard', words: [baum] };
    const merged = mergeLists([k12, k3], [edited, own]);
    expect(merged.map((e) => [e.list.id, e.builtin, e.edited])).toEqual([
      ['klasse-1-2', true, true],
      ['klasse-3', true, false],
      ['eigene-1', false, false],
    ]);
    expect(merged[0]?.list.words).toEqual([hund]);
  });
});

describe('activePool', () => {
  it('nimmt die Wörter aller eingeschalteten Listen, doppelte nur einmal', () => {
    const pool = activePool([k12, k3], ['klasse-1-2', 'klasse-3']);
    expect(pool.words.map((w) => w.id)).toEqual(['hund', 'katze', 'baum']);
  });

  it('merkt sich den Eingabemodus der Liste, aus der ein Wort kommt', () => {
    const pool = activePool([k12, k3], ['klasse-1-2', 'klasse-3']);
    expect(pool.inputModes).toEqual({ hund: 'tiles', katze: 'tiles', baum: 'keyboard' });
  });

  it('ausgeschaltete Listen zählen nicht', () => {
    expect(activePool([k12, k3], ['klasse-3']).words.map((w) => w.id)).toEqual(['baum', 'hund']);
  });
});

describe('toggleList / validActiveIds', () => {
  it('schaltet Listen ein und aus, die letzte bleibt an', () => {
    expect(toggleList(['a'], 'b', true)).toEqual(['a', 'b']);
    expect(toggleList(['a', 'b'], 'a', false)).toEqual(['b']);
    expect(toggleList(['a'], 'a', false)).toEqual(['a']);
  });

  it('entfernt IDs gelöschter Listen und fällt sonst auf die Standardliste zurück', () => {
    expect(validActiveIds(['klasse-3', 'weg'], [k12, k3], 'klasse-1-2')).toEqual(['klasse-3']);
    expect(validActiveIds(['weg'], [k12, k3], 'klasse-1-2')).toEqual(['klasse-1-2']);
  });
});

describe('wordFromInput (Editor)', () => {
  it('baut ein Wort mit abgeleitetem Muster', () => {
    expect(wordFromInput('die', ' Hand ', 'Hände')).toEqual({
      word: { id: 'hand', singular: 'Hand', article: 'die', plural: ['Hände'], pattern: 'e', umlaut: true, verified: true },
    });
  });

  it('meldet Fehler', () => {
    expect(wordFromInput('den', 'Hund', 'Hunde')).toEqual({ error: 'article' });
    expect(wordFromInput('der', '', 'Hunde')).toEqual({ error: 'singular' });
    expect(wordFromInput('der', 'Hund', ' | ')).toEqual({ error: 'plural' });
  });
});

describe('PIN', () => {
  it('erlaubt 4 bis 8 Ziffern', () => {
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('12345678')).toBe(true);
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('12a4')).toBe(false);
  });

  it('speichert nur einen Hash und prüft dagegen', async () => {
    const hash = await hashPin('2468');
    expect(hash).not.toContain('2468');
    expect(hash).toHaveLength(64);
    expect(await pinMatches('2468', hash)).toBe(true);
    expect(await pinMatches('1357', hash)).toBe(false);
  });
});
