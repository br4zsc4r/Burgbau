import { describe, expect, it } from 'vitest';
import { wordImageUrl } from '../src/data/wordImages';
import { checkWordConsistency, parseWordList, validateWordList } from '../src/logic/wordlist';
import { makeWord } from './helpers';

const images = Object.keys(import.meta.glob('../public/assets/words/*.svg'));

const files = import.meta.glob<unknown>('../src/data/wordlists/*.json', {
  eager: true,
  import: 'default',
});

describe('mitgelieferte Wortlisten', () => {
  it('es gibt mindestens eine Liste', () => {
    expect(Object.keys(files).length).toBeGreaterThan(0);
  });

  describe.each(Object.entries(files))('%s', (path, data) => {
    it('ist gültig (Schema, eindeutige IDs, Muster und Umlaut passen)', () => {
      expect(validateWordList(data)).toEqual([]);
    });

    it('id entspricht dem Dateinamen', () => {
      const fileId = path.split('/').pop()?.replace(/\.json$/, '');
      expect(parseWordList(data).id).toBe(fileId);
    });

    it('enthält nur NFC-normalisierte Texte', () => {
      const raw = JSON.stringify(data);
      expect(raw).toBe(raw.normalize('NFC'));
    });

    it('jedes Wort-Bild liegt lokal vor', () => {
      for (const word of parseWordList(data).words) {
        if (word.image !== undefined) expect(images.includes(`../public/${wordImageUrl(word.image)}`), word.id).toBe(true);
      }
    });
  });

  it('die meisten Wörter haben ein Bild', () => {
    const words = Object.values(files).flatMap((data) => parseWordList(data).words);
    expect(words.filter((word) => word.image !== undefined).length).toBeGreaterThan(words.length * 0.6);
  });
});

describe('validateWordList', () => {
  const valid = {
    id: 'test',
    name: 'Test',
    inputMode: 'keyboard',
    words: [makeWord({ id: 'hund', singular: 'Hund', plural: ['Hunde'] })],
  };

  it('akzeptiert eine gültige Liste', () => {
    expect(validateWordList(valid)).toEqual([]);
  });

  it('meldet doppelte IDs', () => {
    const list = { ...valid, words: [...valid.words, ...valid.words] };
    expect(validateWordList(list)).toContain('doppelte id „hund“');
  });

  it('meldet fehlende Felder', () => {
    const list = { ...valid, words: [{ id: 'x', singular: 'X' }] };
    expect(validateWordList(list).length).toBeGreaterThan(0);
  });

  it('meldet ungültigen inputMode', () => {
    expect(validateWordList({ ...valid, inputMode: 'voice' })).toContain('inputMode ungültig');
  });

  it('wirft bei parseWordList mit ungültigen Daten', () => {
    expect(() => parseWordList({})).toThrow();
  });
});

describe('checkWordConsistency', () => {
  it('meldet falsches Muster', () => {
    const word = makeWord({ singular: 'Kind', plural: ['Kinder'], pattern: 'e' });
    expect(checkWordConsistency(word)).toHaveLength(1);
  });

  it('meldet falsches Umlaut-Flag', () => {
    const word = makeWord({ singular: 'Hand', plural: ['Hände'], umlaut: false });
    expect(checkWordConsistency(word)).toHaveLength(1);
  });

  it('meldet unregelmäßige Formen', () => {
    const word = makeWord({ singular: 'Museum', plural: ['Museen'] });
    expect(checkWordConsistency(word)).toHaveLength(1);
  });
});
