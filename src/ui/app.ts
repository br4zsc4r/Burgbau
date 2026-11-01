import {
  answerTask,
  choosePiece,
  continueAfterPlacement,
  createGame,
  finishTask,
  isLastTask,
  placeAt,
  undoPlacement,
} from '../logic/game';
import { validCells } from '../logic/grid';
import { createBuildGame } from '../scene/createBuildGame';
import type { GameState, RandomFn, Settings, Word, WordList } from '../types';
import { createBuildControls } from './buildControls';
import { element } from './dom';
import { createFinishedPanel } from './finishedPanel';
import { createOffersPanel } from './offersPanel';
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

  overlay.append(taskPanel.element, offersPanel.element, finishedPanel);
  root.replaceChildren(sceneContainer, torches.element, controls.element, overlay);

  const scene = createBuildGame(sceneContainer, state.grid, {
    onCellChosen: (cell) => {
      update(placeAt(state, cell));
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
    controls.render(step, isLastTask(state));
    torches.render(state.streak);
    scene.setView({
      grid: state.grid,
      validCells: step === 'placing' ? validCells(state.grid) : [],
      pendingPiece: step === 'placing' ? state.pendingPiece : null,
      lastPlacement: state.lastPlacement?.cell ?? null,
    });
  }

  render();
  taskPanel.startNewTask();
}
