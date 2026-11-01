import { describe, expect, it } from 'vitest';
import { answerTask, choosePiece, createGame, finishEditing, finishTask, placeAt } from '../src/logic/game';
import { gameEvents } from '../src/logic/gameEvents';
import { validPlacements } from '../src/logic/grid';
import type { GameState, Word } from '../src/types';
import { makeWord, seededRandom, testSettings } from './helpers';

const words: Word[] = ['Hund', 'Tisch', 'Fisch'].map((singular) =>
  makeWord({ id: singular.toLowerCase(), singular, plural: [`${singular}e`] }),
);
const ids = words.map((word) => word.id);
const random = seededRandom(3);

function wordOf(state: GameState): Word {
  const word = words.find((w) => w.id === state.quiz.wordId);
  if (word === undefined) throw new Error('unbekanntes Wort');
  return word;
}

const answer = (state: GameState, input: string): GameState =>
  answerTask(state, wordOf(state), input, testSettings, random);

describe('gameEvents', () => {
  const start = createGame(ids, testSettings, random, {});

  it('ohne vorherigen Zustand passiert nichts', () => {
    expect(gameEvents(null, start)).toEqual([]);
  });

  it('richtig: correct; falsch: kein Ereignis (keine Strafsounds)', () => {
    const word = wordOf(start);
    expect(gameEvents(start, answer(start, word.plural[0] ?? ''))).toEqual(['correct']);
    expect(gameEvents(start, answer(start, 'Xyzxyz'))).toEqual([]);
  });

  it('Tippfehler: almost, danach richtig: correct', () => {
    const plural = wordOf(start).plural[0] ?? '';
    const almost = answer(start, `${plural}x`);
    expect(gameEvents(start, almost)).toEqual(['almost']);
    expect(gameEvents(almost, answer(almost, plural))).toEqual(['correct']);
  });

  it('Teil nehmen und setzen', () => {
    const choosing = finishTask(answer(start, wordOf(start).plural[0] ?? ''), ids, random);
    const piece = choosing.offers[0] ?? 'wall';
    const holding = choosePiece(choosing, piece);
    expect(gameEvents(choosing, holding)).toEqual(['pickedUp']);
    const placement = validPlacements(holding.grid, piece)[0];
    if (placement === undefined) throw new Error('kein Platz');
    expect(gameEvents(holding, placeAt(holding, placement.anchor))).toContain('placed');
  });

  it('seltenes Teil im Angebot', () => {
    const answered = answer(start, wordOf(start).plural[0] ?? '');
    const special: GameState = { ...answered, step: 'choosing', offers: ['wall', 'unicorn', 'tower'] };
    const plain: GameState = { ...answered, step: 'choosing', offers: ['wall', 'gate', 'tower'] };
    expect(gameEvents(answered, special)).toContain('specialOffer');
    expect(gameEvents(answered, plain)).not.toContain('specialOffer');
  });

  it('Burg fertig', () => {
    const editing: GameState = { ...start, step: 'editing' };
    expect(gameEvents(editing, finishEditing(editing))).toEqual(['finished']);
  });
});
