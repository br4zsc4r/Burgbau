import { parseCsvWordList } from '../logic/csvImport';
import {
  addClass,
  removeProfile,
  renameProfile,
  setProfileCode,
  setProfileWordList,
} from '../logic/profiles';
import type { Repository } from '../state/repository';
import { defaultSettings } from '../state/settings';
import type { InputModeSetting, Profile, Settings, TasksPerCastle, WordList } from '../types';
import { element } from './dom';
import { createPieceIcon } from './pieceIcon';
import { createSymbolBadge } from './profileSymbol';
import { texts } from './texts';

export interface TeacherDeps {
  repository: Repository;
  builtinLists: readonly WordList[];
  newId: () => string;
  now: () => Date;
  /** Einstellungen verlassen; die App lädt danach neu, damit alles wirkt. */
  onDone: () => void;
}

const report = (error: unknown): void => {
  console.error(error);
};

function button(label: string, className: string, onClick: () => void): HTMLButtonElement {
  const b = element('button', className, label);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

/** Knopf, der vor dem Ausführen einmal nachfragt. */
function confirmButton(label: string, question: string, yes: string, onConfirm: () => void): HTMLElement {
  const box = element('span', 'confirm-inline');
  const start = button(label, 'secondary-button', () => {
    start.hidden = true;
    ask.hidden = false;
  });
  const ask = element('span', 'confirm-ask');
  ask.hidden = true;
  ask.append(
    element('span', 'confirm-question', question),
    button(yes, 'danger-button', onConfirm),
    button(texts.cancel, 'secondary-button', () => {
      ask.hidden = true;
      start.hidden = false;
    }),
  );
  box.append(start, ask);
  return box;
}

function labelled(text: string, control: HTMLElement): HTMLElement {
  const label = element('label', 'setting-row');
  label.append(element('span', 'setting-label', text), control);
  return label;
}

function select<T extends string>(
  options: readonly { value: T; label: string }[],
  value: T,
  onChange: (value: T) => void,
): HTMLSelectElement {
  const el = element('select', 'setting-select');
  for (const option of options) {
    const opt = element('option', '', option.label);
    opt.value = option.value;
    opt.selected = option.value === value;
    el.append(opt);
  }
  el.addEventListener('change', () => {
    onChange(el.value as T);
  });
  return el;
}

function checkbox(text: string, checked: boolean, onChange: (checked: boolean) => void): HTMLElement {
  const label = element('label', 'setting-check');
  const input = element('input', '');
  input.type = 'checkbox';
  input.checked = checked;
  input.addEventListener('change', () => {
    onChange(input.checked);
  });
  label.append(input, element('span', '', text));
  return label;
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
  const listsSection = element('section', 'teacher-section');
  const resetSection = element('section', 'teacher-section');
  screen.append(header, general, profilesSection, listsSection, resetSection);

  let settings: Settings = defaultSettings;
  let profiles: Profile[] = [];
  let customLists: WordList[] = [];

  const allLists = (): WordList[] => [...deps.builtinLists, ...customLists];

  async function saveSettings(change: Partial<Settings>): Promise<void> {
    settings = { ...settings, ...change };
    await repository.saveSettings(settings);
  }

  async function saveProfiles(next: Profile[]): Promise<void> {
    profiles = next;
    await repository.saveProfiles(profiles);
  }

  // ---------- Allgemein ----------

  function renderGeneral(): void {
    const listOptions = allLists().map((l) => ({ value: l.id, label: l.name }));
    const modeOptions: { value: InputModeSetting; label: string }[] = [
      { value: 'list', label: texts.inputModeList },
      { value: 'tiles', label: texts.inputModeTiles },
      { value: 'keyboard', label: texts.inputModeKeyboard },
    ];
    const taskOptions = (['10', '15', '20'] as const).map((n) => ({ value: n, label: n }));
    const save = (change: Partial<Settings>): void => {
      void saveSettings(change).catch(report);
    };
    general.replaceChildren(
      element('h2', 'section-title', texts.sectionGeneral),
      labelled(texts.settingWordList, select(listOptions, settings.wordListId, (wordListId) => {
        save({ wordListId });
      })),
      labelled(texts.settingInputMode, select(modeOptions, settings.inputMode, (inputMode) => {
        save({ inputMode });
      })),
      labelled(
        texts.settingTasks,
        select(taskOptions, String(settings.tasksPerCastle) as '10' | '15' | '20', (value) => {
          save({ tasksPerCastle: Number(value) as TasksPerCastle });
        }),
      ),
      element('p', 'setting-note', texts.settingsNote),
      checkbox(texts.settingCapitalization, settings.requireCapitalization, (requireCapitalization) => {
        save({ requireCapitalization });
      }),
      checkbox(texts.settingReadAloud, settings.readAloud, (readAloud) => {
        save({ readAloud });
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

    const listOptions = [
      { value: '', label: texts.listOfDevice },
      ...allLists().map((l) => ({ value: l.id, label: l.name })),
    ];
    const list = select(listOptions, profile.wordListId ?? '', (value) => {
      void saveProfiles(setProfileWordList(profiles, profile.id, value === '' ? undefined : value)).catch(report);
    });

    const details = element('div', 'teacher-profile-details');
    details.append(labelled(texts.profileListLabel, list));

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

  // ---------- Eigene Wortlisten ----------

  function renderLists(): void {
    const nameInput = element('input', 'setting-input');
    nameInput.setAttribute('aria-label', texts.listName);
    const file = element('input', 'setting-file');
    file.type = 'file';
    file.accept = '.csv,text/csv,text/plain';
    file.setAttribute('aria-label', texts.listFile);
    const preview = element('div', 'csv-preview');
    const importButton = button(texts.listImport, 'primary-button', () => undefined);
    importButton.disabled = true;

    let pending: WordList | null = null;
    file.addEventListener('change', () => {
      const chosen = file.files?.[0];
      if (chosen === undefined) return;
      void chosen
        .text()
        .then((text) => {
          const name = nameInput.value.trim() || chosen.name.replace(/\.[^.]+$/, '');
          const result = parseCsvWordList(text, `eigene-${deps.newId()}`, name);
          pending = result.list;
          preview.replaceChildren(
            element('p', 'setting-note', texts.listPreview(result.list?.words.length ?? 0)),
            ...result.errors
              .slice(0, 12)
              .map((e) => element('p', 'csv-error', texts.csvErrorLine(e.line, texts.csvErrors[e.reason]))),
          );
          importButton.disabled = pending === null;
        })
        .catch(report);
    });
    importButton.addEventListener('click', () => {
      if (pending === null) return;
      const name = nameInput.value.trim();
      const list = name === '' ? pending : { ...pending, name };
      customLists = [...customLists, list];
      void repository
        .saveCustomLists(customLists)
        .then(() => {
          renderLists();
          renderGeneral();
          return renderProfiles();
        })
        .catch(report);
    });

    const existing = customLists.map((list) => {
      const row = element('div', 'castle-row');
      row.append(
        element('span', 'castle-row-name', `${list.name} · ${texts.listWords(list.words.length)}`),
        confirmButton(texts.listDelete, texts.confirmDelete, texts.confirmDeleteYes, () => {
          customLists = customLists.filter((l) => l.id !== list.id);
          // Wer die Liste nutzt, bekommt wieder die des Geräts bzw. den Standard.
          const users = profiles.filter((p) => p.wordListId === list.id);
          let next = profiles;
          for (const user of users) next = setProfileWordList(next, user.id, undefined);
          void repository
            .saveCustomLists(customLists)
            .then(() => saveProfiles(next))
            .then(() =>
              settings.wordListId === list.id ? saveSettings({ wordListId: defaultSettings.wordListId }) : undefined,
            )
            .then(() => {
              renderLists();
              renderGeneral();
              return renderProfiles();
            })
            .catch(report);
        }),
      );
      return row;
    });

    listsSection.replaceChildren(
      element('h2', 'section-title', texts.sectionLists),
      ...(existing.length === 0 ? [element('p', 'setting-note', texts.listNone)] : existing),
      labelled(texts.listName, nameInput),
      labelled(texts.listFile, file),
      preview,
      importButton,
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
      [settings, profiles, customLists] = await Promise.all([
        repository.loadSettings(),
        repository.loadProfiles(),
        repository.loadCustomLists(),
      ]);
      renderGeneral();
      renderLists();
      renderReset();
      await renderProfiles();
    },
  };
}
