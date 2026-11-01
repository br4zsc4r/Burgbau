import { getPiece } from '../data/pieces';
import {
  answerTask,
  choosePiece,
  completedTasks,
  continueAfterPlacement,
  createGame,
  finishTask,
  isLastTask,
  placeAt,
  undoPlacement,
} from '../logic/game';
import { coveredCells, resolvePlacement, validPlacements } from '../logic/grid';
import { createBuildGame } from '../scene/createBuildGame';
import type { GameState, RandomFn, Settings, Word, WordList } from '../types';
import { createBuildControls } from './buildControls';
import { element } from './dom';
import { createFinishedPanel } from './finishedPanel';
import { createOffersPanel } from './offersPanel';
import { createProgressDots } from './progressDots';
import { createStreakTorches } from './streakTorches';
import { createTaskPanel } from './taskPanel';

/** Hält den einen Spielzustand und verbindet Aufgaben-UI, Bauszene und Logik. */
export function mountApp(
  root: HTMLElement,
  list: WordList,
  settings: Settings,
  random: RandomFn,
): void {
  const wordsById = new Map(list.words.map((word) => [word.id, word]));
  const wordIds = [...wordsById.keys()];
  let state: GameState = createGame(wordIds, settings, random);

  const currentWord = (): Word => {
    const word = wordsById.get(state.quiz.wordId);
    if (word === undefined) throw new Error('Wort nicht in der Liste');
    return word;
  };

  const sceneContainer = element('div', 'scene');
  const overlay = element('div', 'overlay');

  const update = (next: GameState): void => {
    const previous = state;
    state = next;
    render();
    if (state.step === 'task') {
      if (previous.step !== 'task' || previous.taskNumber !== state.taskNumber) {
        taskPanel.startNewTask();
      } else {
        taskPanel.focusForPhase(state.quiz);
      }
    }
  };

  const taskPanel = createTaskPanel({
    onSubmit: (input) => {
      update(answerTask(state, currentWord(), input, settings, random));
    },
    onContinue: () => {
      update(finishTask(state, wordIds, random));
    },
  });

  const offersPanel = createOffersPanel((piece) => {
    update(choosePiece(state, piece));
  });

  const finishedPanel = createFinishedPanel(() => {
    update(createGame(wordIds, settings, random));
  });

  const controls = createBuildControls({
    onUndo: () => {
      update(undoPlacement(state));
    },
    onNextTask: () => {
      update(continueAfterPlacement(state, wordIds, random));
    },
  });

  const torches = createStreakTorches();
  const progress = createProgressDots();

  overlay.append(taskPanel.element, offersPanel.element, finishedPanel);
  root.replaceChildren(
    sceneContainer,
    progress.element,
    torches.element,
    controls.element,
    overlay,
  );

  const scene = createBuildGame(sceneContainer, state.grid, {
    onPlace: (anchor) => {
      update(placeAt(state, anchor));
    },
  });

  function render(): void {
    const { step } = state;
    overlay.hidden = step !== 'task' && step !== 'choosing' && step !== 'finished';
    overlay.dataset['step'] = step;
    taskPanel.element.hidden = step !== 'task';
    offersPanel.element.hidden = step !== 'choosing';
    finishedPanel.hidden = step !== 'finished';

    taskPanel.render(state.quiz, currentWord());
    offersPanel.render(state.offers);
    const pending = step === 'placing' ? state.pendingPiece : null;
    controls.render(step, isLastTask(state), pending !== null && getPiece(pending).kind === 'attachment');
    torches.render(state.streak);
    progress.render(completedTasks(state), state.tasksTotal);

    const { grid, lastPlacement } = state;
    scene.setView({
      grid,
      pendingPiece: pending,
      highlightCells: pending === null ? [] : validPlacements(grid, pending).flatMap((p) => p.cells),
      resolve: (cell, preferredAnchor) =>
        pending === null ? null : resolvePlacement(grid, pending, cell, preferredAnchor),
      lastPlacementCells:
        lastPlacement === null ? null : coveredCells(lastPlacement.piece, lastPlacement.anchor),
    });
  }

  render();
  taskPanel.startNewTask();
}
