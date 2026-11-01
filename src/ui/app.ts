import { GRID_SIZE_BY_TASKS } from '../data/grid';
import { getPiece, isMirrorable } from '../data/pieces';
import {
  answerTask,
  canFinishEditing,
  choosePiece,
  completedTasks,
  continueAfterPlacement,
  createGame,
  finishEditing,
  flipPending,
  finishTask,
  pickUp,
  placeAt,
  stashPending,
  takeFromStash,
  undoPlacement,
  withKnownTasks,
} from '../logic/game';
import { gameEvents } from '../logic/gameEvents';
import { coveredCells, createGrid, resolvePlacement, validPlacements } from '../logic/grid';
import {
  addProfile,
  availableSymbols,
  canCreateProfile,
  codeMatches,
  possessive,
  setProfileCode,
} from '../logic/profiles';
import { multiplicationTasks } from '../logic/exercises/multiplication';
import { pluralTasks } from '../logic/exercises/plural';
import { packExercises, packTasks, startOptions } from '../logic/packs';
import { activePool, mergeLists, validActiveIds } from '../logic/wordlists';
import { createBuildGame } from '../scene/createBuildGame';
import { DEFAULT_LIST_ID } from '../state/settings';
import type { Repository } from '../state/repository';
import type {
  Castle,
  ExerciseId,
  ExercisePack,
  GameSelection,
  GameState,
  GridState,
  Profile,
  RandomFn,
  Settings,
  Task,
  TaskBoxes,
  WordList,
} from '../types';
import { createBuildControls } from './buildControls';
import { createCastleViewBar } from './castleViewBar';
import { createCelebration } from './celebration';
import { createCollectionScreen, type CollectionScope } from './collectionScreen';
import { element } from './dom';
import { createExerciseSelect, type StartChoice } from './exerciseSelect';
import { createNamingPanel } from './namingPanel';
import { createNewProfile } from './newProfile';
import { createOffersPanel } from './offersPanel';
import { createPictureCodeScreen } from './pictureCode';
import { createProfileHome } from './profileHome';
import { createProfileSelect } from './profileSelect';
import { createProgressDots } from './progressDots';
import { createSound } from './sound';
import { createSpeaker } from './speech';
import { createStashBar } from './stashBar';
import { createStreakTorches } from './streakTorches';
import { createTaskArea } from './exercises';
import { createTeacherGate } from './teacherGate';
import { createTeacherScreen } from './teacherScreen';
import { texts } from './texts';

type Screen =
  | { kind: 'profiles' }
  | { kind: 'code'; profile: Profile; mode: 'choose' | 'enter'; wrong: boolean }
  | { kind: 'teacher' }
  | { kind: 'newProfile' }
  | { kind: 'home' }
  | { kind: 'chooseExercise' }
  | { kind: 'game' }
  | { kind: 'collection'; scope: CollectionScope }
  | { kind: 'castle'; castle: Castle; scope: CollectionScope };

export interface AppDeps {
  /** Mitgelieferte Wortlisten. */
  builtinLists: readonly WordList[];
  /** Gespeicherte Listen: bearbeitete mitgelieferte und eigene Listen der Lehrkraft. */
  customLists: readonly WordList[];
  /** Übungspakete der Lehrkraft. */
  packs: readonly ExercisePack[];
  /** Neu laden, damit geänderte Lehrkraft-Einstellungen überall wirken. */
  reload: () => void;
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
  const { settings, random, repository } = deps;
  // Aufgaben: Wörter aller eingeschalteten Listen – gleich für alle Kinder.
  const lists = mergeLists(deps.builtinLists, deps.customLists).map((entry) => entry.list);
  const pool = activePool(lists, validActiveIds(settings.activeListIds, lists, DEFAULT_LIST_ID));
  if (pool.words.length === 0) throw new Error('Keine Wörter in den aktiven Listen');
  // Aufgaben je Spielart (freies Spiel: freigegebener Inhalt der Lehrkraft).
  const tasksByExercise: Record<ExerciseId, readonly Task[]> = {
    plural: pluralTasks(pool, settings),
    multiplication: multiplicationTasks(settings.multiplicationRows),
  };
  // Übungspakete der Lehrkraft: Aufgaben gemischt aus ihren Spielarten.
  const packsById = new Map(deps.packs.map((pack) => [pack.id, pack]));
  const tasksByPack = new Map(deps.packs.map((pack) => [pack.id, packTasks(pack, lists, settings)]));
  /** Aufgaben, aus denen eine Burg mit dieser Auswahl zieht. */
  const tasksFor = (selection: GameSelection): readonly Task[] => {
    const tasks =
      selection.kind === 'free' ? tasksByExercise[selection.exercise] : (tasksByPack.get(selection.packId) ?? []);
    // Paket gelöscht oder leer: mit der Mehrzahl weiter, damit keine angefangene Burg hängen bleibt.
    return tasks.length > 0 ? tasks : tasksByExercise.plural;
  };
  const taskIdsFor = (selection: GameSelection): string[] => tasksFor(selection).map((task) => task.id);
  const gameTaskIds = (): string[] => (game === null ? [] : taskIdsFor(game.selection));
  /** Was das Kind bei „Neue Burg bauen“ wählen kann (leer: Lehrkraft fragen). */
  const options = startOptions(settings, deps.packs, (pack) => (tasksByPack.get(pack.id)?.length ?? 0) > 0);
  const choiceOf = (selection: GameSelection): StartChoice => {
    if (selection.kind === 'free') {
      const { exercise } = selection;
      return { selection, name: texts.exerciseNames[exercise], detail: texts.exerciseSamples[exercise] };
    }
    const pack = packsById.get(selection.packId);
    const detail = pack === undefined ? '' : packExercises(pack).map((e) => texts.exerciseNames[e]).join(' + ');
    return { selection, name: pack?.name ?? '', detail };
  };
  const emptyGrid = createGrid(GRID_SIZE_BY_TASKS[settings.tasksPerCastle]);

  let profiles: Profile[] = await repository.loadProfiles();
  let profile: Profile | null = null;
  let game: GameState | null = null;
  let boxes: TaskBoxes = {};
  let screen: Screen = { kind: 'profiles' };
  const speaker = createSpeaker();
  const sound = createSound(settings.sound);
  const celebration = createCelebration();
  const thumbnails = new Map<string, string>();

  const report = (error: unknown): void => {
    console.error(error);
  };

  const currentTask = (): Task | null => {
    if (game === null) return null;
    const { taskId } = game.quiz;
    return tasksFor(game.selection).find((task) => task.id === taskId) ?? null;
  };

  // ---------- Bausteine ----------

  const sceneContainer = element('div', 'scene');
  const gameOverlay = element('div', 'overlay');
  const screens = element('div', 'screens');

  const taskPanel = createTaskArea({
    onSubmit: (input) => {
      const task = currentTask();
      if (game !== null && task !== null) updateGame(answerTask(game, task, input, settings, random));
    },
    onContinue: () => {
      if (game !== null) updateGame(finishTask(game, gameTaskIds(), random));
    },
    speaker: settings.readAloud ? speaker : null,
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
      if (game !== null) updateGame(continueAfterPlacement(game, gameTaskIds(), random));
    },
    onStash: () => {
      if (game !== null) updateGame(stashPending(game));
    },
    onFinishEditing: () => {
      if (game !== null) updateGame(finishEditing(game));
    },
    onMirror: () => {
      if (game !== null) updateGame(flipPending(game));
    },
  });

  const stashBar = createStashBar((index) => {
    if (game !== null) updateGame(takeFromStash(game, index));
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
      if (settings.pictureCode) {
        show({ kind: 'code', profile: selected, mode: selected.code === undefined ? 'choose' : 'enter', wrong: false });
      } else {
        void openProfile(selected).catch(report);
      }
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
      game = { ...withKnownTasks(game, taskIdsFor(game.selection), random), boxes };
      show({ kind: 'game' });
    },
    onNewCastle: () => {
      // Mehrere Möglichkeiten: erst wählen lassen; eine: gleich los; keine: Startseite zeigt den Hinweis.
      const [only] = options;
      if (options.length > 1) show({ kind: 'chooseExercise' });
      else if (only !== undefined) startNewGame(only);
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

  const pictureCode = createPictureCodeScreen({
    onChosen: (code) => {
      if (screen.kind !== 'code') return;
      const { profile: chosenFor } = screen;
      profiles = setProfileCode(profiles, chosenFor.id, code);
      const updated = profiles.find((p) => p.id === chosenFor.id) ?? chosenFor;
      void repository
        .saveProfiles(profiles)
        .then(() => openProfile(updated))
        .catch(report);
    },
    onEntered: (code) => {
      if (screen.kind !== 'code') return;
      if (codeMatches(screen.profile, code)) void openProfile(screen.profile).catch(report);
      else show({ ...screen, wrong: true });
    },
    onBack: () => {
      show({ kind: 'profiles' });
    },
  });

  const teacherScreen = createTeacherScreen({
    repository,
    builtinLists: deps.builtinLists,
    newId: deps.newId,
    now: deps.now,
    onDone: deps.reload,
  });

  const gate = createTeacherGate(repository, () => {
    void teacherScreen
      .open()
      .then(() => {
        show({ kind: 'teacher' });
      })
      .catch(report);
  });
  profileSelect.element.append(gate.gear, gate.dialog);

  const exerciseSelect = createExerciseSelect({
    onChoose: (selection) => {
      startNewGame(selection);
    },
    onBack: () => {
      show({ kind: 'home' });
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
    pictureCode.element,
    teacherScreen.element,
    newProfile.element,
    profileHome.element,
    exerciseSelect.element,
    collectionScreen.element,
  );
  root.replaceChildren(
    sceneContainer,
    progress.element,
    torches.element,
    controls.element,
    stashBar.element,
    pauseButton,
    gameOverlay,
    castleViewBar.element,
    celebration.element,
    screens,
    storageWarning,
  );

  const scene = createBuildGame(sceneContainer, emptyGrid, {
    onPlace: (anchor) => {
      if (game !== null) updateGame(placeAt(game, anchor));
    },
    onPickUp: (cell) => {
      if (game !== null) updateGame(pickUp(game, cell));
    },
  });

  // ---------- Abläufe ----------

  function show(next: Screen): void {
    const previous = screen;
    screen = next;
    // Für das Layout: Im Spiel bekommt die Szene im Querformat links Platz für den Speicher.
    root.dataset['screen'] = next.kind;
    if (next.kind === 'profiles') {
      profileSelect.render(profiles, settings.allowSelfRegistration && canCreateProfile(profiles));
    }
    if (next.kind === 'code') pictureCode.render(next.profile, next.mode, next.wrong);
    if (next.kind === 'newProfile') newProfile.render(availableSymbols(profiles));
    if (next.kind === 'home' && profile !== null) profileHome.render(profile, game !== null, options.length > 0);
    if (next.kind === 'chooseExercise') exerciseSelect.render(options.map(choiceOf));
    if (next.kind === 'castle') castleViewBar.render(next.castle.name);
    render();
    if (next.kind === 'game' && previous.kind !== 'game') focusGame(true);
  }

  async function openProfile(selected: Profile): Promise<void> {
    profile = selected;
    [game, boxes] = await Promise.all([repository.loadGame(selected.id), repository.loadBoxes(selected.id)]);
    show({ kind: 'home' });
  }

  async function createNewProfileAndOpen(symbol: Profile['symbol'], nickname: string): Promise<void> {
    profiles = addProfile(profiles, nickname, symbol, deps.newId(), deps.now());
    await repository.saveProfiles(profiles);
    const created = profiles[profiles.length - 1];
    if (created === undefined) return;
    // Mit Bild-Code sucht sich das neue Kind gleich seine zwei Bilder aus.
    if (settings.pictureCode) show({ kind: 'code', profile: created, mode: 'choose', wrong: false });
    else await openProfile(created);
  }

  function startNewGame(selection: GameSelection): void {
    if (profile === null) return;
    game = createGame(taskIdsFor(selection), settings, random, boxes, selection);
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
    if (profile !== null && next.boxes !== previous?.boxes) {
      boxes = next.boxes;
      void repository.saveBoxes(profile.id, boxes).catch(report);
    }
    render();
    for (const event of gameEvents(previous, next)) {
      sound.play(event);
      if (event === 'correct') taskPanel.celebrate();
      if (event === 'finished') celebration.play();
    }
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

  async function openCollection(requested: CollectionScope): Promise<void> {
    if (profile === null) return;
    const scope = settings.showAllCastles ? requested : 'mine';
    const castles =
      scope === 'mine'
        ? await repository.loadCastles(profile.id)
        : await repository.loadAllCastles(profiles);
    collectionScreen.render(scope, castles, profiles, settings.showAllCastles);
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
    pictureCode.element.hidden = screen.kind !== 'code';
    teacherScreen.element.hidden = screen.kind !== 'teacher';
    newProfile.element.hidden = screen.kind !== 'newProfile';
    profileHome.element.hidden = screen.kind !== 'home';
    exerciseSelect.element.hidden = screen.kind !== 'chooseExercise';
    collectionScreen.element.hidden = screen.kind !== 'collection';
    screens.hidden = inGame || screen.kind === 'castle';
    castleViewBar.element.hidden = screen.kind !== 'castle';
    pauseButton.hidden = !inGame;
    const stash = inGame && game !== null ? game.stash : [];
    const stashActive = step === 'placing' || step === 'editing';
    stashBar.element.hidden = !inGame || (stash.length === 0 && !stashActive) || step === 'finished';
    stashBar.render(stash, stashActive);
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
      controls.render({
        step: 'task',
        holding: false,
        decoration: false,
        mirror: false,
        stashFilled: false,
        canFinish: false,
      });
      renderGrid(screen.kind === 'castle' ? screen.castle.grid : emptyGrid);
    }
  }

  function renderGame(state: GameState): void {
    const task = currentTask();
    if (task !== null) taskPanel.render(state.quiz, task);
    offersPanel.render(state.offers);
    if (state.step === 'finished') namingPanel.render(castleSuggestion());
    const canPlace = state.step === 'placing' || state.step === 'editing';
    const pending = canPlace ? state.pendingPiece : null;
    controls.render({
      step: state.step,
      holding: pending !== null,
      decoration: pending !== null && getPiece(pending).kind === 'attachment',
      mirror: pending !== null && isMirrorable(pending),
      stashFilled: state.stash.length > 0,
      canFinish: canFinishEditing(state),
    });
    torches.render(state.streak);
    progress.render(completedTasks(state), state.tasksTotal);

    const { grid, lastPlacement } = state;
    scene.setView({
      grid,
      pendingPiece: pending,
      pendingFlipped: state.pendingFlipped,
      highlightCells: pending === null ? [] : validPlacements(grid, pending).flatMap((p) => p.cells),
      resolve: (cell, preferredAnchor) =>
        pending === null ? null : resolvePlacement(grid, pending, cell, preferredAnchor),
      lastPlacementCells:
        lastPlacement?.anchor == null ? null : coveredCells(lastPlacement.piece, lastPlacement.anchor),
      showGrid: true,
      pickUp: state.step === 'editing' && pending === null,
    });
  }

  /** Fertige Burg ansehen (oder leere Wiese hinter den Menüs): ohne Raster, ohne Eingabe. */
  function renderGrid(grid: GridState): void {
    scene.setView({
      grid,
      pendingPiece: null,
      pendingFlipped: false,
      highlightCells: [],
      resolve: () => null,
      lastPlacementCells: null,
      showGrid: false,
      pickUp: false,
    });
  }

  // Stimmen kommen in manchen Browsern erst nach dem Start; dann den Vorlese-Knopf einblenden.
  speaker.onVoicesChanged(render);

  show({ kind: 'profiles' });
}
