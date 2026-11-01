import { DEFAULT_GRID_SIZE } from '../data/grid';
import {
  answerTask,
  continueAfterPlacement,
  createGame,
  finishTask,
  placeAt,
  undoPlacement,
} from '../logic/game';
import { validCells } from '../logic/grid';
import { currentWordId } from '../logic/quiz';
import { createBuildGame } from '../scene/createBuildGame';
import type { GameState, RandomFn, Settings, Word, WordList } from '../types';
import { createBuildControls } from './buildControls';
import { element } from './dom';
import { createTaskPanel } from './taskPanel';

/** Hält den einen Spielzustand und verbindet Aufgaben-UI, Bauszene und Logik. */
export function mountApp(
  root: HTMLElement,
  list: WordList,
  settings: Settings,
  random: RandomFn,
): void {
  const wordsById = new Map(list.words.map((word) => [word.id, word]));
  let state: GameState = createGame([...wordsById.keys()], DEFAULT_GRID_SIZE, random);

  const currentWord = (): Word => {
    const word = wordsById.get(currentWordId(state.quiz));
    if (word === undefined) throw new Error('Wort nicht in der Liste');
    return word;
  };

  const sceneContainer = element('div', 'scene');
  const taskOverlay = element('div', 'task-overlay');

  const update = (next: GameState): void => {
    const previousStep = state.step;
    state = next;
    render();
    if (state.step === 'task') {
      if (previousStep !== 'task') taskPanel.startNewTask();
      else taskPanel.focusForPhase(state.quiz);
    }
  };

  const taskPanel = createTaskPanel({
    onSubmit: (input) => {
      update(answerTask(state, currentWord(), input, settings));
    },
    onContinue: () => {
      update(finishTask(state, random));
    },
  });

  const controls = createBuildControls({
    onUndo: () => {
      update(undoPlacement(state));
    },
    onNextTask: () => {
      update(continueAfterPlacement(state, random));
    },
  });

  taskOverlay.append(taskPanel.element);
  root.replaceChildren(sceneContainer, controls.element, taskOverlay);

  const scene = createBuildGame(sceneContainer, state.grid, {
    onCellChosen: (cell) => {
      update(placeAt(state, cell));
    },
  });

  function render(): void {
    taskOverlay.hidden = state.step !== 'task';
    taskPanel.render(state.quiz, currentWord());
    controls.render(state.step);
    scene.setView({
      grid: state.grid,
      validCells: state.step === 'placing' ? validCells(state.grid) : [],
      pieceWaiting: state.step === 'placing',
      lastPlacement: state.lastPlacement,
    });
  }

  render();
  taskPanel.startNewTask();
}
