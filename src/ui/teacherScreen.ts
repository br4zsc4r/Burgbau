import { EXERCISE_IDS } from '../logic/exercises/taskId';
import { toggleKeepingOne } from '../logic/exercises/freePlay';
import { packExercises, packProblems, removePack, upsertPack, withoutMissingLists } from '../logic/packs';
import { hashPin, isValidPin } from '../logic/pin';
import { addClass, removeProfile, renameProfile, setProfileCode } from '../logic/profiles';
import { mergeLists, validActiveIds, type ListEntry } from '../logic/wordlists';
import type { Repository } from '../state/repository';
import { DEFAULT_LIST_ID, TASK_COUNTS, defaultSettings } from '../state/settings';
import type { ExerciseId, ExercisePack, PackContents, Profile, Settings, TasksPerCastle, WordList } from '../types';
import { element } from './dom';
import { exerciseSettings, type PackContent, type SettingsContext } from './exercises/settings';
import { createPieceIcon } from './pieceIcon';
import { createSymbolBadge } from './profileSymbol';
import { button, checkbox, confirmButton, gearButton, labelled, report, select } from './settingsControls';
import { openSettingsDialog } from './settingsDialog';
import { texts } from './texts';

export interface TeacherDeps {
  repository: Repository;
  builtinLists: readonly WordList[];
  newId: () => string;
  now: () => Date;
  /** Einstellungen verlassen; die App lädt danach neu, damit alles wirkt. */
  onDone: () => void;
}

function withContent(contents: PackContents, exercise: ExerciseId, content: PackContent<ExerciseId>): PackContents {
  return { ...contents, [exercise]: content };
}

function withoutContent(contents: PackContents, exercise: ExerciseId): PackContents {
  return Object.fromEntries(Object.entries(contents).filter(([key]) => key !== exercise));
}

/** Spielarten, die im Paket als Aufgabenbereich stehen – in fester Reihenfolge. */
function packAreas(contents: PackContents): ExerciseId[] {
  return EXERCISE_IDS.filter((exercise) => contents[exercise] !== undefined);
}

/** „Kleines 1×1 (Reihen 3, 7)“ – ein Aufgabenbereich in Kurzform. */
function areaSummary(contents: PackContents, exercise: ExerciseId): string {
  const content = contents[exercise];
  if (content === undefined) return '';
  return texts.packPart(texts.exerciseNames[exercise], exerciseSettings(exercise).summary(content));
}

/** Lehrkraft-Einstellungen (Spezifikation Abschnitt 8). Nur über den gesicherten Zugang erreichbar. */
export function createTeacherScreen(deps: TeacherDeps): {
  element: HTMLElement;
  open: () => Promise<void>;
} {
  const { repository } = deps;
  const screen = element('section', 'screen teacher-screen');
  const header = element('div', 'teacher-header');
  header.append(
    element('h1', 'screen-title', texts.teacherTitle),
    button(texts.teacherDone, 'primary-button', deps.onDone),
  );
  const general = element('section', 'teacher-section');
  const profilesSection = element('section', 'teacher-section');
  const pinSection = element('section', 'teacher-section');
  const resetSection = element('section', 'teacher-section');
  // Namensnennung für die Wort-Bilder (CC BY-SA verlangt sie).
  const creditsSection = element('section', 'teacher-section');
  creditsSection.append(
    element('h2', 'section-title', texts.sectionCredits),
    element('p', 'setting-note', texts.creditsOpenMoji),
    element('p', 'setting-note', texts.creditsGame),
  );
  const exercisesSection = element('section', 'teacher-section');
  const packsSection = element('section', 'teacher-section');
  screen.append(
    header,
    general,
    exercisesSection,
    packsSection,
    profilesSection,
    pinSection,
    resetSection,
    creditsSection,
  );

  let settings: Settings = defaultSettings;
  let profiles: Profile[] = [];
  /** Bearbeitete mitgelieferte Listen und eigene Listen der Lehrkraft. */
  let storedLists: WordList[] = [];
  let packs: ExercisePack[] = [];

  const entries = (): ListEntry[] => mergeLists(deps.builtinLists, storedLists);

  async function saveSettings(change: Partial<Settings>): Promise<void> {
    settings = { ...settings, ...change };
    await repository.saveSettings(settings);
  }

  async function savePacks(next: ExercisePack[]): Promise<void> {
    packs = next;
    await repository.savePacks(packs);
  }

  async function saveProfiles(next: Profile[]): Promise<void> {
    profiles = next;
    await repository.saveProfiles(profiles);
  }

  async function saveStoredLists(next: WordList[]): Promise<void> {
    storedLists = next;
    await repository.saveCustomLists(storedLists);
    // Gelöschte Listen dürfen nicht aktiv bleiben und fallen aus den Paketen.
    const lists = entries().map((e) => e.list);
    const activeListIds = validActiveIds(settings.activeListIds, lists, DEFAULT_LIST_ID);
    if (activeListIds.join() !== settings.activeListIds.join()) await saveSettings({ activeListIds });
    const cleaned = withoutMissingLists(
      packs,
      lists.map((list) => list.id),
    );
    if (JSON.stringify(cleaned) !== JSON.stringify(packs)) await savePacks(cleaned);
  }

  /** Was die Einstellungen der Spielarten (src/ui/exercises/*Settings.ts) brauchen. */
  const context: SettingsContext = {
    settings: () => settings,
    saveSettings,
    lists: entries,
    storedLists: () => storedLists,
    saveStoredLists,
    newId: deps.newId,
  };

  // ---------- Allgemein ----------

  function renderGeneral(): void {
    const taskOptions = TASK_COUNTS.map((n) => ({ value: String(n), label: String(n) }));
    const save = (change: Partial<Settings>): void => {
      void saveSettings(change).catch(report);
    };
    general.replaceChildren(
      element('h2', 'section-title', texts.sectionGeneral),
      labelled(
        texts.settingTasks,
        select(taskOptions, String(settings.tasksPerCastle), (value) => {
          save({ tasksPerCastle: Number(value) as TasksPerCastle });
        }),
      ),
      element('p', 'setting-note', texts.settingsNote),
      checkbox(texts.settingReadAloud, settings.readAloud, (readAloud) => {
        save({ readAloud });
      }),
      checkbox(texts.settingSound, settings.sound, (sound) => {
        save({ sound });
      }),
      checkbox(texts.settingSelfRegistration, settings.allowSelfRegistration, (allowSelfRegistration) => {
        save({ allowSelfRegistration });
      }),
      checkbox(texts.settingPictureCode, settings.pictureCode, (pictureCode) => {
        void saveSettings({ pictureCode }).then(renderProfiles).catch(report);
      }),
      checkbox(texts.settingShowAll, settings.showAllCastles, (showAllCastles) => {
        save({ showAllCastles });
      }),
    );
  }

  // ---------- Spielarten ----------

  /** Eine Zeile der Spielarten: im freien Spiel verfügbar (Haken) und Zahnrad zu ihren Einstellungen. */
  function exerciseRow(exercise: ExerciseId): HTMLElement {
    const name = texts.exerciseNames[exercise];
    const ui = exerciseSettings(exercise);
    const row = element('div', 'list-row exercise-row');
    row.dataset['exercise'] = exercise;
    row.append(
      checkbox(name, settings.freeExercises.includes(exercise), (on) => {
        void saveSettings({ freeExercises: toggleKeepingOne(settings.freeExercises, exercise, on) })
          .then(renderExercises)
          .catch(report);
      }),
      element('span', 'list-info setting-note', ui.summary(ui.freeContent(context))),
      gearButton(texts.exerciseSettingsLabel(name), () => {
        openSettingsDialog(
          texts.exerciseSettingsTitle(name),
          (body) => {
            ui.renderFree(body, context);
          },
          () => {
            // Wortlisten können sich geändert haben: Zusammenfassungen und Pakete neu zeichnen.
            renderExercises();
            renderPacks();
          },
        );
      }),
    );
    return row;
  }

  function renderExercises(): void {
    const canStart = settings.freePlay || packs.some((pack) => packExercises(pack).length > 0);
    const warning = element('p', 'setting-warning', texts.noStartWarning);
    warning.hidden = canStart;
    exercisesSection.replaceChildren(
      element('h2', 'section-title', texts.sectionExercises),
      checkbox(texts.settingFreePlay, settings.freePlay, (freePlay) => {
        void saveSettings({ freePlay }).then(renderExercises).catch(report);
      }),
      element('p', 'setting-note', texts.freePlayHint),
      warning,
      element('p', 'setting-note', texts.exercisesHint),
      ...EXERCISE_IDS.map((exercise) => exerciseRow(exercise)),
    );
  }

  // ---------- Übungspakete ----------

  function packSummary(pack: ExercisePack): string {
    return texts.packSummary(packAreas(pack.contents).map((exercise) => areaSummary(pack.contents, exercise)));
  }

  function renderPacks(): void {
    const rows = packs.map((pack) => {
      const row = element('div', 'list-row pack-row');
      const info = element('span', 'list-info');
      info.append(element('strong', '', pack.name), ' ', packSummary(pack));
      const actions = element('span', 'list-actions');
      actions.append(
        button(texts.packEdit, 'secondary-button', () => {
          renderPackEditor(pack);
        }),
        confirmButton(texts.packDelete, texts.confirmDelete, texts.confirmDeleteYes, () => {
          void savePacks(removePack(packs, pack.id))
            .then(() => {
              renderPacks();
              renderExercises();
            })
            .catch(report);
        }),
      );
      row.append(info, actions);
      return row;
    });
    packsSection.replaceChildren(
      element('h2', 'section-title', texts.sectionPacks),
      element('p', 'setting-note', texts.packsHint),
      ...(rows.length > 0 ? rows : [element('p', 'setting-note', texts.noPacks)]),
      button(texts.packNew, 'secondary-button', () => {
        renderPackEditor({ id: deps.newId(), name: '', contents: {} });
      }),
    );
  }

  /**
   * Paket bearbeiten: Name und eine Liste von Aufgabenbereichen (je Spielart einer). Das Zahnrad
   * eines Bereichs öffnet ein Popup, in dem sein Inhalt gewählt wird. Gespeichert wird mit „Speichern“.
   */
  function renderPackEditor(pack: ExercisePack): void {
    let contents: PackContents = { ...pack.contents };
    const name = element('input', 'setting-input');
    name.value = pack.name;
    name.maxLength = 40;
    const areas = element('div', 'pack-areas');
    const adders = element('div', 'pack-adders');

    /** Popup eines Aufgabenbereichs: Änderungen landen im Entwurf des Pakets. */
    const openArea = (exercise: ExerciseId): void => {
      const content = contents[exercise];
      if (content === undefined) return;
      const packName = name.value.trim() === '' ? texts.packEditorTitle : name.value.trim();
      const title = texts.packAreaTitle(packName, texts.exerciseNames[exercise]);
      openSettingsDialog(
        title,
        (body) => {
          exerciseSettings(exercise).renderPack(body, content, context, (next) => {
            contents = withContent(contents, exercise, next);
          });
        },
        drawAreas,
      );
    };

    const addArea = (exercise: ExerciseId): void => {
      contents = withContent(contents, exercise, exerciseSettings(exercise).freeContent(context));
      drawAreas();
      openArea(exercise);
    };

    function drawAreas(): void {
      const present = packAreas(contents);
      areas.replaceChildren(
        ...(present.length === 0 ? [element('p', 'setting-note', texts.noPackAreas)] : []),
        ...present.map((exercise) => {
          const row = element('div', 'list-row pack-area');
          row.dataset['exercise'] = exercise;
          const exerciseName = texts.exerciseNames[exercise];
          row.append(
            element('span', 'list-info', areaSummary(contents, exercise)),
            gearButton(texts.packAreaSettingsLabel(exerciseName), () => {
              openArea(exercise);
            }),
            button(texts.packAreaRemove, 'secondary-button', () => {
              contents = withoutContent(contents, exercise);
              drawAreas();
            }),
          );
          return row;
        }),
      );
      adders.replaceChildren(
        ...EXERCISE_IDS.filter((exercise) => !present.includes(exercise)).map((exercise) =>
          button(texts.packAddArea(texts.exerciseNames[exercise]), 'secondary-button', () => {
            addArea(exercise);
          }),
        ),
      );
    }
    drawAreas();

    const message = element('p', 'csv-error');
    message.setAttribute('aria-live', 'polite');
    const save = (): void => {
      const draft: ExercisePack = { ...pack, name: name.value, contents };
      const problems = packProblems(draft);
      if (problems.length > 0) {
        message.textContent = problems.includes('name') ? texts.packNameMissing : texts.packEmpty;
        return;
      }
      void savePacks(upsertPack(packs, draft))
        .then(() => {
          renderPacks();
          renderExercises();
        })
        .catch(report);
    };

    const bar = element('div', 'editor-actions');
    bar.append(button(texts.packSave, 'primary-button', save), button(texts.cancel, 'secondary-button', renderPacks), message);
    packsSection.replaceChildren(
      element('h2', 'section-title', texts.packEditorTitle),
      labelled(texts.packName, name),
      element('h3', 'subsection-title', texts.packAreasTitle),
      element('p', 'setting-note', texts.packAreasHint),
      areas,
      adders,
      bar,
    );
    name.focus();
  }

  // ---------- Profile ----------

  async function renderCastles(profile: Profile, container: HTMLElement): Promise<void> {
    const castles = await repository.loadCastles(profile.id);
    container.replaceChildren(
      ...castles.map((castle) => {
        const row = element('div', 'castle-row');
        row.append(
          element('span', 'castle-row-name', `${castle.name} · ${texts.formatDate(castle.createdAt)}`),
          button(texts.deleteCastle, 'secondary-button', () => {
            void repository
              .deleteCastle(profile.id, castle.id)
              .then(() => renderCastles(profile, container))
              .then(renderProfiles)
              .catch(report);
          }),
        );
        return row;
      }),
    );
  }

  function profileRow(profile: Profile, castleCount: number): HTMLElement {
    const row = element('div', 'teacher-profile');
    const name = element('input', 'setting-input');
    name.value = profile.nickname;
    name.setAttribute('aria-label', texts.profileNameLabel);
    name.addEventListener('change', () => {
      try {
        void saveProfiles(renameProfile(profiles, profile.id, name.value)).catch(report);
      } catch {
        name.value = profile.nickname;
      }
    });

    const details = element('div', 'teacher-profile-details');

    if (settings.pictureCode) {
      const code = element('span', 'teacher-code');
      if (profile.code === undefined) {
        code.textContent = texts.profileNoCode;
      } else {
        code.append(createPieceIcon(profile.code[0]), createPieceIcon(profile.code[1]));
      }
      const codeRow = element('div', 'setting-row');
      codeRow.append(element('span', 'setting-label', texts.profileCode), code);
      if (profile.code !== undefined) {
        codeRow.append(
          button(texts.profileResetCode, 'secondary-button', () => {
            void saveProfiles(setProfileCode(profiles, profile.id, undefined)).then(renderProfiles).catch(report);
          }),
        );
      }
      details.append(codeRow);
    }

    const castleList = element('div', 'castle-list');
    castleList.hidden = true;
    const castleRow = element('div', 'setting-row');
    castleRow.append(element('span', 'setting-label', texts.profileCastles(castleCount)));
    if (castleCount > 0) {
      castleRow.append(
        button(texts.profileShowCastles, 'secondary-button', () => {
          castleList.hidden = !castleList.hidden;
          if (!castleList.hidden) void renderCastles(profile, castleList).catch(report);
        }),
        confirmButton(texts.profileClearCastles, texts.confirmDelete, texts.confirmDeleteYes, () => {
          void repository.clearCastles(profile.id).then(renderProfiles).catch(report);
        }),
      );
    }
    details.append(castleRow, castleList);

    details.append(
      confirmButton(texts.profileDelete, texts.confirmDelete, texts.confirmDeleteYes, () => {
        void repository
          .deleteProfileData(profile.id)
          .then(() => saveProfiles(removeProfile(profiles, profile.id)))
          .then(renderProfiles)
          .catch(report);
      }),
    );

    const head = element('div', 'teacher-profile-head');
    head.append(createSymbolBadge(profile.symbol, 'small'), name);
    row.append(head, details);
    return row;
  }

  let classMessage = '';

  function classForm(): HTMLElement {
    const form = element('div', 'class-form');
    const area = element('textarea', 'class-names');
    area.rows = 6;
    area.setAttribute('aria-label', texts.classTitle);
    const message = element('p', 'setting-note', classMessage);
    form.append(
      element('h3', 'subsection-title', texts.classTitle),
      element('p', 'setting-note', texts.classHint),
      area,
      button(texts.classCreate, 'primary-button', () => {
        let next: Profile[];
        try {
          next = addClass(profiles, area.value.split(/\r?\n/), deps.newId, deps.now());
        } catch {
          message.textContent = texts.classTooMany;
          return;
        }
        classMessage = texts.classCreated(next.length - profiles.length);
        void saveProfiles(next).then(renderProfiles).catch(report);
      }),
      message,
    );
    return form;
  }

  async function renderProfiles(): Promise<void> {
    const counts = await Promise.all(profiles.map((p) => repository.loadCastles(p.id).then((c) => c.length)));
    profilesSection.replaceChildren(
      element('h2', 'section-title', texts.sectionProfiles),
      ...(profiles.length === 0 ? [element('p', 'setting-note', texts.noProfiles)] : []),
      ...profiles.map((profile, i) => profileRow(profile, counts[i] ?? 0)),
      classForm(),
    );
  }

  // ---------- PIN ----------

  function renderPin(): void {
    const first = element('input', 'setting-input');
    first.type = 'password';
    first.inputMode = 'numeric';
    first.maxLength = 8;
    const repeat = element('input', 'setting-input');
    repeat.type = 'password';
    repeat.inputMode = 'numeric';
    repeat.maxLength = 8;
    const message = element('p', 'setting-note');
    pinSection.replaceChildren(
      element('h2', 'section-title', texts.sectionPin),
      labelled(texts.pinNew, first),
      labelled(texts.pinRepeat, repeat),
      button(texts.pinChange, 'secondary-button', () => {
        const pin = first.value.trim();
        if (!isValidPin(pin)) {
          message.textContent = texts.pinInvalid;
          return;
        }
        if (pin !== repeat.value.trim()) {
          message.textContent = texts.pinMismatch;
          return;
        }
        void hashPin(pin)
          .then((hash) => repository.savePinHash(hash))
          .then(() => {
            first.value = '';
            repeat.value = '';
            message.textContent = texts.pinSaved;
          })
          .catch(report);
      }),
      message,
    );
  }

  // ---------- Zurücksetzen ----------

  function renderReset(): void {
    resetSection.replaceChildren(
      element('h2', 'section-title', texts.sectionReset),
      element('p', 'setting-note', texts.resetHint),
      confirmButton(texts.resetAll, texts.resetConfirm, texts.resetYes, () => {
        void repository.resetAll().then(deps.onDone).catch(report);
      }),
    );
  }

  return {
    element: screen,
    open: async () => {
      [settings, profiles, storedLists, packs] = await Promise.all([
        repository.loadSettings(),
        repository.loadProfiles(),
        repository.loadCustomLists(),
        repository.loadPacks(),
      ]);
      renderGeneral();
      renderExercises();
      renderPacks();
      renderPin();
      renderReset();
      await renderProfiles();
    },
  };
}
