import { describe, expect, it } from 'vitest';
import { specialChars } from '../src/logic/specialChars';

describe('specialChars', () => {
  it('bietet am Wortanfang Großbuchstaben an', () => {
    expect(specialChars(0)).toEqual(['Ä', 'Ö', 'Ü', 'ß']);
  });

  it('bietet im Wort Kleinbuchstaben an', () => {
    expect(specialChars(1)).toEqual(['ä', 'ö', 'ü', 'ß']);
    expect(specialChars(5)).toEqual(['ä', 'ö', 'ü', 'ß']);
  });
});
