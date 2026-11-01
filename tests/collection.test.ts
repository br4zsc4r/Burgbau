import { describe, expect, it } from 'vitest';
import { MAX_CASTLES, addCastle, newestFirst } from '../src/logic/collection';
import { createGrid } from '../src/logic/grid';
import type { Castle } from '../src/types';

function castle(id: string, day: number): Castle {
  return {
    id,
    profileId: 'p1',
    name: `Burg ${id}`,
    createdAt: new Date(Date.UTC(2026, 0, day)).toISOString(),
    grid: createGrid({ cols: 12, rows: 8 }),
  };
}

describe('Sammlung', () => {
  it('sortiert neueste zuerst', () => {
    expect(newestFirst([castle('a', 1), castle('b', 3), castle('c', 2)]).map((c) => c.id)).toEqual([
      'b',
      'c',
      'a',
    ]);
  });

  it('fügt neue Burgen vorne ein', () => {
    expect(addCastle([castle('a', 1)], castle('b', 2)).map((c) => c.id)).toEqual(['b', 'a']);
  });

  it('ersetzt bei voller Sammlung die älteste Burg', () => {
    const full = Array.from({ length: MAX_CASTLES }, (_, i) => castle(`c${String(i)}`, i + 1));
    const next = addCastle(full, castle('neu', 100));
    expect(next).toHaveLength(MAX_CASTLES);
    expect(next[0]?.id).toBe('neu');
    expect(next.map((c) => c.id)).not.toContain('c0');
  });
});
