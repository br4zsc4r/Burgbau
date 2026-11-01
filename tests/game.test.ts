import { describe, expect, it } from 'vitest';
import {
  answerTask,
  choosePiece,
  completedTasks,
  canFinishEditing,
  continueAfterPlacement,
  createGame,
  finishEditing,
  finishTask,
  flipPending,
  pickUp,
  stashPending,
  takeFromStash,
  isLastTask,
  placeAt,
  undoPlacement,
} from '../src/logic/game';
import { getPiece } from '../src/data/pieces';
import { pieceAt, validPlacements } from '../src/logic/grid';
import type { GameState, PieceId, PluralTask, Settings, Word } from '../src/types';
import { makeWord, pluralTask, seededRandom, testSettings } from './helpers';

const words: Word[] = ['Hund', 'Tisch', 'Fisch', 'Schaf', 'Pferd', 'Zelt'].map((singular) =>
  makeWord({ id: singular.toLowerCase(), singular, plural: [`${singular}e`] }),
);
const tasks = words.map((word) => pluralTask(word));
const ids = tasks.map((task) => task.id);
const random = seededRandom(7);

function taskOf(state: GameState): PluralTask {
  const task = tasks.find((t) => t.id === state.quiz.taskId);
  if (task === undefined) throw new Error('unbekannte Aufgabe');
  return task;
}

function answer(state: GameState, correct: boolean, settings: Settings = testSettings): GameState {
  const task = taskOf(state);
  const input = correct ? (task.word.plural[0] ?? '') : 'Xyzxyz';
  return answerTask(state, task, input, settings, random);
}

/** Erstes Angebot an die erste gültige Stelle setzen. */
function playPlacement(state: GameState): GameState {
  const piece = state.offers[0] ?? 'wall';
  const next = choosePiece(state, piece);
  const placement = validPlacements(next.grid, piece)[0];
  if (placement === undefined) throw new Error('kein Platz');
  return placeAt(next, placement.anchor);
}

/** Antwort → Angebot → erstes Angebot → erste gültige Zelle. */
function playTask(state: GameState, correct: boolean): GameState {
  let next = finishTask(answer(state, correct), ids, random);
  const piece = next.offers[0] ?? 'wall';
  next = choosePiece(next, piece);
  const placement = validPlacements(next.grid, piece)[0];
  if (placement === undefined) throw new Error('kein Platz');
  return placeAt(next, placement.anchor);
}

describe('game', () => {
  it('startet mit Aufgabe 1, Serie 0 und leerem Raster in der passenden Größe', () => {
    const state = createGame(ids, testSettings, random);
    expect(state).toMatchObject({ step: 'task', taskNumber: 1, tasksTotal: 15, streak: 0 });
    expect(state.grid).toMatchObject({ cols: 12, rows: 8 });
    expect(state.grid.pieces).toEqual([]);
  });

  it('nutzt für 20 Aufgaben ein größeres Raster', () => {
    const state = createGame(ids, { ...testSettings, tasksPerCastle: 20 }, random);
    expect(state.grid).toMatchObject({ cols: 14, rows: 9 });
  });

  it('erhöht die Serie bei richtiger Antwort', () => {
    const state = answer(createGame(ids, testSettings, random), true);
    expect(state.streak).toBe(1);
  });

  it('halbiert die Serie bei falscher Antwort und plant das Wort neu ein', () => {
    let state = createGame(ids, testSettings, random);
    state = { ...state, streak: 6 };
    const taskId = state.quiz.taskId;
    state = answer(state, false);
    expect(state.streak).toBe(3);
    expect(state.picker.retries.map((retry) => retry.taskId)).toEqual([taskId]);
  });

  it('ändert die Serie bei „fast“ noch nicht', () => {
    let state = createGame(ids, testSettings, random);
    state = answerTask(state, taskOf(state), `${taskOf(state).word.plural[0] ?? ''}x`, testSettings, random);
    expect(state.quiz.phase).toBe('answering');
    expect(state.streak).toBe(0);
  });

  it('bietet nach falscher Antwort drei beschädigte Teile an', () => {
    const state = finishTask(answer(createGame(ids, testSettings, random), false), ids, random);
    expect(state.step).toBe('choosing');
    expect(state.offers.map((id) => getPiece(id).category)).toEqual(['damaged', 'damaged', 'damaged']);
  });

  it('bietet nach richtiger Antwort Grundbauteile (oder ein Umgebungsteil) an', () => {
    const state = finishTask(answer(createGame(ids, testSettings, random), true), ids, random);
    for (const id of state.offers) {
      expect(['basic', 'environment']).toContain(getPiece(id).category);
    }
  });

  it('bietet nur Teile an, die gerade irgendwo hinpassen', () => {
    for (let seed = 0; seed < 30; seed++) {
      let state = createGame(ids, testSettings, seededRandom(seed));
      state = { ...state, streak: 4 };
      state = finishTask(answer(state, true), ids, seededRandom(seed));
      // Leeres Raster: Dekorationen haben noch nichts zum Andocken.
      for (const id of state.offers) {
        expect(validPlacements(state.grid, id).length).toBeGreaterThan(0);
      }
    }
  });

  it('nimmt nur angebotene Teile an', () => {
    const state = finishTask(answer(createGame(ids, testSettings, random), true), ids, random);
    expect(choosePiece(state, 'dragon')).toBe(state);
    const offer = state.offers[1] ?? 'wall';
    expect(choosePiece(state, offer)).toMatchObject({ step: 'placing', pendingPiece: offer });
  });

  it('setzt das gewählte Teil nur auf gültige Zellen', () => {
    let state = finishTask(answer(createGame(ids, testSettings, random), true), ids, random);
    const piece = state.offers[0] ?? 'wall';
    state = choosePiece(state, piece);
    expect(placeAt(state, { col: 0, row: 3 })).toBe(state);

    const placed = placeAt(state, { col: 0, row: 0 });
    expect(placed).toMatchObject({ step: 'placed', pendingPiece: null });
    expect(placed.lastPlacement).toEqual({ anchor: { col: 0, row: 0 }, piece });
    expect(pieceAt(placed.grid, { col: 0, row: 0 })?.piece).toBe(piece);
  });

  it('Rückgängig legt das gewählte Teil zurück in die Ablage', () => {
    const placed = playTask(createGame(ids, testSettings, random), true);
    const piece = placed.lastPlacement?.piece;
    const undone = undoPlacement(placed);
    expect(undone).toMatchObject({ step: 'placing', pendingPiece: piece, lastPlacement: null });
    expect(undone.grid.pieces).toEqual([]);
  });

  it('erlaubt kein Rückgängig mehr nach Beginn der nächsten Aufgabe', () => {
    const placed = playTask(createGame(ids, testSettings, random), true);
    const next = continueAfterPlacement(placed, ids, random);
    expect(next).toMatchObject({ step: 'task', taskNumber: 2, lastPlacement: null, offers: [] });
    expect(next.quiz).toMatchObject({ phase: 'answering', attempt: 1 });
    expect(next.quiz.taskId).not.toBe(placed.quiz.taskId);
    expect(undoPlacement(next)).toBe(next);
  });

  it('ist nach X Aufgaben fertig', () => {
    let state = createGame(ids, { ...testSettings, tasksPerCastle: 10 }, random);
    for (let task = 1; task <= 10; task++) {
      expect(state).toMatchObject({ step: 'task', taskNumber: task });
      expect(isLastTask(state)).toBe(task === 10);
      state = playTask(state, task % 3 !== 0);
      if (task < 10) state = continueAfterPlacement(state, ids, random);
    }
    // Nach dem letzten gesetzten Teil direkt im Bearbeitungsmodus.
    expect(state.step).toBe('editing');
    expect(state.grid.pieces.length + state.grid.attachments.length).toBe(10);
    expect(finishEditing(state).step).toBe('finished');
  });

  it('stellt ein falsch beantwortetes Wort 3–5 Aufgaben später erneut', () => {
    let state = createGame(ids, testSettings, random);
    const missed = state.quiz.taskId;
    state = continueAfterPlacement(playTask(state, false), ids, random);
    const askedAt: number[] = [];
    while (state.step === 'task' && state.taskNumber <= 7) {
      if (state.quiz.taskId === missed) askedAt.push(state.taskNumber);
      state = continueAfterPlacement(playTask(state, true), ids, random);
    }
    expect(askedAt).toHaveLength(1);
    expect(askedAt[0]).toBeGreaterThanOrEqual(4);
    expect(askedAt[0]).toBeLessThanOrEqual(6);
  });

  it('überspringt die Angebote, wenn nichts mehr hinpasst', () => {
    let state = createGame(ids, testSettings, random);
    // Jede Spalte: Dach mit Fahne – darauf passt weder ein Teil noch eine Deko.
    const cols = Array.from({ length: state.grid.cols }, (_, col) => col);
    const pieces = cols.map((col) => ({ piece: 'pointedRoof' as const, col, row: 0 }));
    const attachments = cols.map((col) => ({ piece: 'flag' as const, col, row: 0 }));
    state = { ...state, grid: { ...state.grid, pieces, attachments } };
    const next = finishTask(answer(state, true), ids, random);
    expect(next).toMatchObject({ step: 'task', taskNumber: 2 });
  });

  it('bleibt als JSON serialisierbar', () => {
    const placed = playTask(createGame(ids, testSettings, random), true);
    expect(JSON.parse(JSON.stringify(placed))).toEqual(placed);
  });

  it('zählt beendete Aufgaben für die Fortschrittsanzeige', () => {
    let state = createGame(ids, { ...testSettings, tasksPerCastle: 10 }, random);
    expect(completedTasks(state)).toBe(0);
    state = answer(state, false);
    expect(completedTasks(state)).toBe(1);
    state = finishTask(state, ids, random);
    expect(completedTasks(state)).toBe(1);
    state = continueAfterPlacement(placeAt(choosePiece(state, state.offers[0] ?? 'wall'), validPlacements(state.grid, state.offers[0] ?? 'wall')[0]?.anchor ?? { col: 0, row: 0 }), ids, random);
    expect(completedTasks(state)).toBe(1);
    expect(completedTasks({ ...state, step: 'finished' })).toBe(10);
  });

  describe('Zwischenspeicher', () => {
    function placing(): GameState {
      const state = finishTask(answer(createGame(ids, testSettings, random), true), ids, random);
      return choosePiece(state, state.offers[0] ?? 'wall');
    }

    it('ablegen statt setzen zählt wie gesetzt und lässt sich rückgängig machen', () => {
      const state = placing();
      const piece = state.pendingPiece;
      const stashed = stashPending(state);
      expect(stashed).toMatchObject({ step: 'placed', pendingPiece: null, stash: [piece] });
      expect(stashed.grid.pieces).toEqual([]);

      const undone = undoPlacement(stashed);
      expect(undone).toMatchObject({ step: 'placing', pendingPiece: piece, stash: [] });
    });

    it('tauscht das wartende Teil mit einem Teil aus dem Speicher', () => {
      const state = { ...placing(), stash: ['tower', 'ivy'] as const };
      const pending = state.pendingPiece;
      const swapped = takeFromStash({ ...state, stash: [...state.stash] }, 1);
      expect(swapped.pendingPiece).toBe('ivy');
      expect(swapped.stash).toEqual(['tower', pending]);
    });

    it('der Speicher bleibt über Aufgaben hinweg erhalten', () => {
      const stashed = stashPending(placing());
      const next = continueAfterPlacement(stashed, ids, random);
      expect(next.stash).toEqual(stashed.stash);
    });
  });

  describe('Bearbeitungsmodus', () => {
    function editing(): GameState {
      let state = createGame(ids, { ...testSettings, tasksPerCastle: 10 }, random);
      state = { ...state, taskNumber: 10 };
      return playTask(state, true);
    }

    it('kommt direkt nach dem letzten gesetzten Teil', () => {
      expect(editing()).toMatchObject({ step: 'editing', lastPlacement: null });
    });

    it('kommt auch, wenn das letzte Teil in den Speicher gelegt wird', () => {
      let state = createGame(ids, { ...testSettings, tasksPerCastle: 10 }, random);
      state = { ...state, taskNumber: 10 };
      state = finishTask(answer(state, true), ids, random);
      state = stashPending(choosePiece(state, state.offers[0] ?? 'wall'));
      expect(state.step).toBe('editing');
      expect(state.stash).toHaveLength(1);
    });

    it('Teile aufnehmen, ablegen und aus dem Speicher setzen', () => {
      let state = editing();
      const placed = state.grid.pieces[0];
      if (placed === undefined) throw new Error('kein Teil');
      state = pickUp(state, placed);
      expect(state.pendingPiece).toBe(placed.piece);
      expect(state.grid.pieces).toEqual([]);

      state = stashPending(state);
      expect(state).toMatchObject({ step: 'editing', pendingPiece: null, stash: [placed.piece] });

      state = takeFromStash(state, 0);
      expect(state).toMatchObject({ pendingPiece: placed.piece, stash: [] });
      state = placeAt(state, { col: 5, row: 0 });
      expect(state).toMatchObject({ step: 'editing', pendingPiece: null });
      expect(pieceAt(state.grid, { col: 5, row: 0 })?.piece).toBe(placed.piece);
    });

    it('Fertig erst, wenn alle Teile gesetzt sind', () => {
      const withStash = { ...editing(), stash: ['tower' as const] };
      expect(canFinishEditing(withStash)).toBe(false);
      expect(finishEditing(withStash)).toBe(withStash);

      const holding = { ...editing(), pendingPiece: 'wall' as const };
      expect(canFinishEditing(holding)).toBe(false);

      expect(canFinishEditing(editing())).toBe(true);
      expect(finishEditing(editing()).step).toBe('finished');
    });

    it('Reste, die nirgends mehr hinpassen, blockieren das Fertigmachen nicht', () => {
      // Eine Fahne braucht einen Turm, eine Mauer oder ein Dach – auf leerem Raster passt sie nicht.
      const state = { ...editing(), grid: { ...editing().grid, pieces: [], attachments: [] }, stash: ['flag' as const] };
      expect(canFinishEditing(state)).toBe(true);
      expect(finishEditing(state)).toMatchObject({ step: 'finished', stash: [] });
    });

    it('zählt im Fortschritt als beendet', () => {
      expect(completedTasks(editing())).toBe(10);
    });
  });

  describe('Dach-Garantie', () => {
    it('in den letzten zwei Aufgaben ist immer ein Dach im Angebot', () => {
      for (let seed = 0; seed < 40; seed++) {
        for (const correct of [true, false]) {
          let state = createGame(ids, testSettings, seededRandom(seed));
          state = { ...state, taskNumber: 14 + (seed % 2), grid: { ...state.grid, pieces: [{ piece: 'wall', col: 0, row: 0 }] } };
          state = finishTask(answer(state, correct), ids, seededRandom(seed));
          expect(state.offers.some((id) => getPiece(id).roof === true)).toBe(true);
        }
      }
    });

    it('vorher nicht erzwungen', () => {
      const roofs = Array.from({ length: 40 }, (_, seed) => {
        let state = createGame(ids, testSettings, seededRandom(seed));
        state = finishTask(answer(state, true), ids, seededRandom(seed));
        return state.offers.some((id) => getPiece(id).roof === true);
      });
      expect(roofs.some(Boolean)).toBe(false);
    });
  });

  it('schreibt das Lernfach bei jeder Antwort fort', () => {
    let state = createGame(ids, testSettings, random, { [ids[0] ?? '']: 3 });
    const taskId = state.quiz.taskId;
    const before = state.boxes[taskId] ?? 0;
    state = answer(state, true);
    expect(state.boxes[taskId]).toBe(Math.min(before + 1, 4));
    state = continueAfterPlacement(playPlacement(finishTask(state, ids, random)), ids, random);
    const second = state.quiz.taskId;
    expect(answer(state, false).boxes[second]).toBe(0);
  });
});

describe('Nachtrag Phase 8: Spiegeln', () => {
  const holding = (piece: PieceId): GameState => ({
    ...createGame(ids, testSettings, random),
    step: 'placing',
    pendingPiece: piece,
  });

  it('spiegelt nur unsymmetrische Teile', () => {
    expect(flipPending(holding('stairs')).pendingFlipped).toBe(true);
    expect(flipPending(flipPending(holding('stairs'))).pendingFlipped).toBe(false);
    expect(flipPending(holding('wall')).pendingFlipped).toBe(false);
  });

  it('setzt gespiegelt, Rückgängig bringt es gespiegelt zurück', () => {
    const placed = placeAt(flipPending(holding('stairs')), { col: 0, row: 0 });
    expect(placed.grid.pieces).toContainEqual({ piece: 'stairs', col: 0, row: 0, flipped: true });
    expect(placed.pendingFlipped).toBe(false);
    expect(undoPlacement(placed)).toMatchObject({ pendingPiece: 'stairs', pendingFlipped: true });
  });

  it('ein neu gewähltes Teil ist nicht gespiegelt', () => {
    const choosing: GameState = { ...holding('stairs'), pendingFlipped: true, step: 'choosing', offers: ['flag'] };
    expect(choosePiece(choosing, 'flag').pendingFlipped).toBe(false);
  });
});
