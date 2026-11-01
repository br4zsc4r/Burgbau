import { GRID_SIZE_BY_TASKS } from '../data/grid';
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
  withKnownWords,
} from '../logic/game';
import { coveredCells, createGrid, resolvePlacement, validPlacements } from '../logic/grid';
import { addProfile, availableSymbols, canCreateProfile, possessive } from '../logic/profiles';
import { createBuildGame } from '../scene/createBuildGame';
import type { Repository } from '../state/repository';
import type { Castle, GameState, GridState, Profile, RandomFn, Settings, Word, WordList } from '../types';
import { createBuildControls } from './buildControls';
import { createCastleViewBar } from './castleViewBar';
import { createCollectionScreen, type CollectionScope } from './collectionScreen';
import { element } from './dom';
import { createNamingPanel } from './namingPanel';
import { createNewProfile } from './newProfile';
import { createOffersPanel } from './offersPanel';
import { createProfileHome } from './profileHome';
import { createProfileSelect } from './profileSelect';
import { createProgressDots } from './progressDots';
import { createStreakTorches } from './streakTorches';
import { createTaskPanel } from './taskPanel';
import { texts } from './texts';

type Screen =
  | { kind: 'profiles' }
  | { kind: 'newProfile' }
  | { kind: 'home' }
  | { kind: 'game' }
  | { kind: 'collection'; scope: CollectionScope }
  | { kind: 'castle'; castle: Castle; scope: CollectionScope };

export interface AppDeps {
  list: WordList;
  settings: Settings;
  random: RandomFn;
  repository: Repository;
  newId: () => string;
  now: () => Date;
  /** false, wenn nur im Speicher gespeichert werden kann (z. B. privates Fenster). */
  persistent: boolean;
}

const PAUSE_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';

/**
 * Hält Navigation und den einen Spielzustand, verbindet Bildschirme, Bauszene und Logik.
 * Die laufende Burg wird nach jedem Schritt gespeichert.
 */
export async function mountApp(root: HTMLElement, deps: AppDeps): Promise<void> {
  const { list, settings, random, repository } = deps;
  const wordsById = new Map(list.words.map((word) => [word.id, word]));
  const wordIds = [...wordsById.keys()];
  const emptyGrid = createGrid(GRID_SIZE_BY_TASKS[settings.tasksPerCastle]);

  let profiles: Profile[] = await repository.loadProfiles();
  let profile: Profile | null = null;
  let game: GameState | null = null;
  let screen: Screen = { kind: 'profiles' };
  const thumbnails = new Map<string, string>();

  const report = (error: unknown): void => {
    console.error(error);
  };

  const currentWord = (): Word | null =>
    game === null ? null : (wordsById.get(game.quiz.wordId) ?? null);

  // ---------- Bausteine ----------

  const sceneContainer = element('div', 'scene');
  const gameOverlay = element('div', 'overlay');
  const screens = element('div', 'screens');

  const taskPanel = createTaskPanel({
    onSubmit: (input) => {
      const word = currentWord();
      if (game !== null && word !== null) updateGame(answerTask(game, word, input, settings, random));
    },
    onContinue: () => {
      if (game !== null) updateGame(finishTask(game, wordIds, random));
    },
  });

  const offersPanel = createOffersPanel((piece) => {
    if (game !== null) updateGame(choosePiece(game, piece));
  });

  const namingPanel = createNamingPanel((name) => {
    void saveFinishedCastle(name).catch(report);
  });

  const controls = createBuildControls({
    onUndo: () => {
      if (game !== null) updateGame(undoPlacement(game));
    },
    onNextTask: () => {
      if (game !== null) updateGame(continueAfterPlacement(game, wordIds, random));
    },
  });

  const torches = createStreakTorches();
  const progress = createProgressDots();

  const pauseButton = element('button', 'pause-button');
  pauseButton.type = 'button';
  pauseButton.innerHTML = PAUSE_ICON;
  pauseButton.setAttribute('aria-label', texts.pause);
  pauseButton.addEventListener('click', () => {
    show({ kind: 'home' });
  });

  const profileSelect = createProfileSelect({
    onSelect: (selected) => {
      void openProfile(selected).catch(report);
    },
    onNew: () => {
      show({ kind: 'newProfile' });
    },
  });

  const newProfile = createNewProfile({
    onCreate: (symbol, nickname) => {
      void createNewProfileAndOpen(symbol, nickname).catch(report);
    },
    onCancel: () => {
      show({ kind: 'profiles' });
    },
  });

  const profileHome = createProfileHome({
    onContinue: () => {
      if (game === null) return;
      game = withKnownWords(game, wordIds, random);
      show({ kind: 'game' });
    },
    onNewCastle: () => {
      startNewGame();
    },
    onCollection: () => {
      void openCollection('mine').catch(report);
    },
    onSwitchProfile: () => {
      profile = null;
      game = null;
      show({ kind: 'profiles' });
    },
  });

  const collectionScreen = createCollectionScreen({
    onScope: (scope) => {
      void openCollection(scope).catch(report);
    },
    onOpen: (castle) => {
      if (screen.kind === 'collection') show({ kind: 'castle', castle, scope: screen.scope });
    },
    onBack: () => {
      show({ kind: 'home' });
    },
  });

  const castleViewBar = createCastleViewBar(() => {
    if (screen.kind === 'castle') show({ kind: 'collection', scope: screen.scope });
  });

  const storageWarning = element('p', 'storage-warning', texts.storageWarning);
  storageWarning.hidden = deps.persistent;

  gameOverlay.append(taskPanel.element, offersPanel.element, namingPanel.element);
  screens.append(
    profileSelect.element,
    newProfile.element,
    profileHome.element,
    collectionScreen.element,
  );
  root.replaceChildren(
    sceneContainer,
    progress.element,
    torches.element,
    controls.element,
    pauseButton,
    gameOverlay,
    castleViewBar.element,
    screens,
    storageWarning,
  );

  const scene = createBuildGame(sceneContainer, emptyGrid, {
    onPlace: (anchor) => {
      if (game !== null) updateGame(placeAt(game, anchor));
    },
  });

  // ---------- Abläufe ----------

  function show(next: Screen): void {
    const previous = screen;
    screen = next;
    if (next.kind === 'profiles') profileSelect.render(profiles, canCreateProfile(profiles));
    if (next.kind === 'newProfile') newProfile.render(availableSymbols(profiles));
    if (next.kind === 'home' && profile !== null) profileHome.render(profile, game !== null);
    if (next.kind === 'castle') castleViewBar.render(next.castle.name);
    render();
    if (next.kind === 'game' && previous.kind !== 'game') focusGame(true);
  }

  async function openProfile(selected: Profile): Promise<void> {
    profile = selected;
    game = await repository.loadGame(selected.id);
    show({ kind: 'home' });
  }

  async function createNewProfileAndOpen(symbol: Profile['symbol'], nickname: string): Promise<void> {
    profiles = addProfile(profiles, nickname, symbol, deps.newId(), deps.now());
    await repository.saveProfiles(profiles);
    const created = profiles[profiles.length - 1];
    if (created !== undefined) await openProfile(created);
  }

  function startNewGame(): void {
    if (profile === null) return;
    game = createGame(wordIds, settings, random);
    persistGame();
    show({ kind: 'game' });
  }

  function persistGame(): void {
    if (profile !== null && game !== null) void repository.saveGame(profile.id, game).catch(report);
  }

  /** Nach jedem Spielschritt: Zustand übernehmen, speichern, zeichnen, Fokus setzen. */
  function updateGame(next: GameState): void {
    const previous = game;
    game = next;
    persistGame();
    render();
    focusGame(previous === null || previous.step !== 'task' || previous.taskNumber !== next.taskNumber);
  }

  function focusGame(newTask: boolean): void {
    if (game === null) return;
    if (game.step === 'task') {
      if (newTask && game.quiz.phase === 'answering' && game.quiz.lastResult === null) {
        taskPanel.startNewTask();
      } else {
        taskPanel.focusForPhase(game.quiz);
      }
    }
    if (game.step === 'finished') namingPanel.focus();
  }

  async function saveFinishedCastle(name: string): Promise<void> {
    if (profile === null || game === null) return;
    const castle: Castle = {
      id: deps.newId(),
      profileId: profile.id,
      name,
      createdAt: deps.now().toISOString(),
      grid: game.grid,
    };
    await repository.addCastle(castle);
    await repository.deleteGame(profile.id);
    game = null;
    await openCollection('mine');
  }

  async function openCollection(scope: CollectionScope): Promise<void> {
    if (profile === null) return;
    const castles =
      scope === 'mine'
        ? await repository.loadCastles(profile.id)
        : await repository.loadAllCastles(profiles);
    collectionScreen.render(scope, castles, profiles);
    show({ kind: 'collection', scope });
    // Vorschauen mit derselben Render-Funktion wie beim Bauen, nacheinander und zwischengespeichert.
    for (const castle of castles) {
      const cached = thumbnails.get(castle.id);
      if (cached !== undefined) {
        collectionScreen.setThumbnail(castle.id, cached);
        continue;
      }
      void scene
        .snapshot(castle.grid)
        .then((url) => {
          thumbnails.set(castle.id, url);
          collectionScreen.setThumbnail(castle.id, url);
        })
        .catch(report);
    }
  }

  function castleSuggestion(): string {
    if (profile === null) return '';
    return `${possessive(profile.nickname)} ${texts.castleWords[profile.symbol.animal]}`;
  }

  // ---------- Zeichnen ----------

  function render(): void {
    const inGame = screen.kind === 'game' && game !== null;
    const step = inGame && game !== null ? game.step : null;

    profileSelect.element.hidden = screen.kind !== 'profiles';
    newProfile.element.hidden = screen.kind !== 'newProfile';
    profileHome.element.hidden = screen.kind !== 'home';
    collectionScreen.element.hidden = screen.kind !== 'collection';
    screens.hidden = inGame || screen.kind === 'castle';
    castleViewBar.element.hidden = screen.kind !== 'castle';
    pauseButton.hidden = !inGame;
    progress.element.hidden = !inGame;
    torches.element.hidden = !inGame;

    gameOverlay.hidden = step !== 'task' && step !== 'choosing' && step !== 'finished';
    gameOverlay.dataset['step'] = step ?? '';
    taskPanel.element.hidden = step !== 'task';
    offersPanel.element.hidden = step !== 'choosing';
    namingPanel.element.hidden = step !== 'finished';

    if (inGame && game !== null) {
      renderGame(game);
    } else {
      controls.render('task', false, false);
      renderGrid(screen.kind === 'castle' ? screen.castle.grid : emptyGrid);
    }
  }

  function renderGame(state: GameState): void {
    const word = currentWord();
    if (word !== null) taskPanel.render(state.quiz, word);
    offersPanel.render(state.offers);
    if (state.step === 'finished') namingPanel.render(castleSuggestion());
    const pending = state.step === 'placing' ? state.pendingPiece : null;
    controls.render(
      state.step,
      isLastTask(state),
      pending !== null && getPiece(pending).kind === 'attachment',
    );
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
      showGrid: true,
    });
  }

  /** Fertige Burg ansehen (oder leere Wiese hinter den Menüs): ohne Raster, ohne Eingabe. */
  function renderGrid(grid: GridState): void {
    scene.setView({
      grid,
      pendingPiece: null,
      highlightCells: [],
      resolve: () => null,
      lastPlacementCells: null,
      showGrid: false,
    });
  }

  show({ kind: 'profiles' });
}
