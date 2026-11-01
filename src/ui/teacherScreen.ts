import { parseCsvWordList, wordFromInput } from '../logic/csvImport';
import { hashPin, isValidPin } from '../logic/pin';
import { addClass, removeProfile, renameProfile, setProfileCode } from '../logic/profiles';
import { mergeLists, toggleList, validActiveIds, type ListEntry } from '../logic/wordlists';
import type { Repository } from '../state/repository';
import { DEFAULT_LIST_ID, defaultSettings } from '../state/settings';
import type {
  Article,
  InputMode,
  InputModeSetting,
  Profile,
  Settings,
  TasksPerCastle,
  Word,
  WordList,
} from '../types';
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

const ARTICLES: readonly Article[] = ['der', 'die', 'das'];
const LIST_MODES: readonly { value: InputMode; label: string }[] = [
  { value: 'tiles', label: texts.inputModeTiles },
  { value: 'keyboard', label: texts.inputModeKeyboard },
];

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
  const listsSection = element('section', 'teacher-section');
  const profilesSection = element('section', 'teacher-section');
  const pinSection = element('section', 'teacher-section');
  const resetSection = element('section', 'teacher-section');
  screen.append(header, general, listsSection, profilesSection, pinSection, resetSection);

  let settings: Settings = defaultSettings;
  let profiles: Profile[] = [];
  /** Bearbeitete mitgelieferte Listen und eigene Listen der Lehrkraft. */
  let storedLists: WordList[] = [];

  const entries = (): ListEntry[] => mergeLists(deps.builtinLists, storedLists);

  async function saveSettings(change: Partial<Settings>): Promise<void> {
    settings = { ...settings, ...change };
    await repository.saveSettings(settings);
  }

  async function saveProfiles(next: Profile[]): Promise<void> {
    profiles = next;
    await repository.saveProfiles(profiles);
  }

  async function saveStoredLists(next: WordList[]): Promise<void> {
    storedLists = next;
    await repository.saveCustomLists(storedLists);
    // Gelöschte Listen dürfen nicht aktiv bleiben.
    const lists = entries().map((e) => e.list);
    const activeListIds = validActiveIds(settings.activeListIds, lists, DEFAULT_LIST_ID);
    if (activeListIds.join() !== settings.activeListIds.join()) await saveSettings({ activeListIds });
  }

  // ---------- Allgemein ----------

  function renderGeneral(): void {
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

  // ---------- Wortlisten ----------

  function listRow(entry: ListEntry): HTMLElement {
    const { list } = entry;
    const row = element('div', 'list-row');
    const unverified = list.words.filter((w) => !w.verified).length;
    const toggle = element('input', '');
    toggle.type = 'checkbox';
    toggle.checked = settings.activeListIds.includes(list.id);
    toggle.setAttribute('aria-label', texts.listActive(list.name));
    toggle.addEventListener('change', () => {
      const activeListIds = toggleList(settings.activeListIds, list.id, toggle.checked);
      toggle.checked = activeListIds.includes(list.id);
      void saveSettings({ activeListIds }).catch(report);
    });

    const info = element('span', 'list-info');
    info.append(element('strong', '', list.name), ' ', texts.listInfo(list.words.length, unverified));
    if (entry.builtin) info.append(' · ', entry.edited ? texts.listEditedBadge : texts.listBuiltin);

    const actions = element('span', 'list-actions');
    actions.append(
      button(texts.listEdit, 'secondary-button', () => {
        openEditor(list);
      }),
    );
    if (entry.edited) {
      actions.append(
        confirmButton(texts.listRestore, texts.confirmDelete, texts.confirmDeleteYes, () => {
          void saveStoredLists(storedLists.filter((l) => l.id !== list.id)).then(renderLists).catch(report);
        }),
      );
    }
    if (!entry.builtin) {
      actions.append(
        confirmButton(texts.listDelete, texts.confirmDelete, texts.confirmDeleteYes, () => {
          void saveStoredLists(storedLists.filter((l) => l.id !== list.id)).then(renderLists).catch(report);
        }),
      );
    }
    row.append(toggle, info, actions);
    return row;
  }

  function csvImport(): HTMLElement {
    const box = element('div', 'csv-import');
    const file = element('input', 'setting-file');
    file.type = 'file';
    file.accept = '.csv,text/csv,text/plain';
    file.setAttribute('aria-label', texts.listFile);
    const preview = element('div', 'csv-preview');
    let pending: WordList | null = null;
    const take = button(texts.listImport, 'primary-button', () => {
      if (pending === null) return;
      void saveStoredLists([...storedLists, pending]).then(renderLists).catch(report);
    });
    take.disabled = true;
    file.addEventListener('change', () => {
      const chosen = file.files?.[0];
      if (chosen === undefined) return;
      void chosen
        .text()
        .then((text) => {
          const name = chosen.name.replace(/\.[^.]+$/, '');
          const result = parseCsvWordList(text, `eigene-${deps.newId()}`, name);
          pending = result.list;
          preview.replaceChildren(
            element('p', 'setting-note', texts.listPreview(result.list?.words.length ?? 0)),
            ...result.errors
              .slice(0, 12)
              .map((e) => element('p', 'csv-error', texts.csvErrorLine(e.line, texts.csvErrors[e.reason]))),
          );
          take.disabled = pending === null;
        })
        .catch(report);
    });
    box.append(labelled(texts.listFile, file), preview, take);
    return box;
  }

  function renderLists(): void {
    listsSection.replaceChildren(
      element('h2', 'section-title', texts.sectionLists),
      element('p', 'setting-note', texts.listsHint),
      ...entries().map(listRow),
      button(texts.listNew, 'primary-button', () => {
        openEditor({ id: `eigene-${deps.newId()}`, name: texts.listNewName, inputMode: 'keyboard', words: [] });
      }),
      csvImport(),
    );
  }

  /** Editor für eine Liste: Name, Eingabemodus, Wörter (hinzufügen, ändern, entfernen, prüfen). */
  function openEditor(list: WordList): void {
    const name = element('input', 'setting-input');
    name.value = list.name;
    const mode = select(LIST_MODES, list.inputMode, () => undefined);
    const rows = element('div', 'editor-rows');
    // Meldung und Knöpfe oben und unten – lange Listen müssen nicht bis ans Ende gescrollt werden.
    const topMessage = element('p', 'csv-error');
    const bottomMessage = element('p', 'csv-error');
    const messages = [topMessage, bottomMessage];
    const say = (text: string): void => {
      for (const m of messages) m.textContent = text;
    };

    interface Row {
      element: HTMLElement;
      article: HTMLSelectElement;
      singular: HTMLInputElement;
      plural: HTMLInputElement;
      verified: HTMLInputElement;
      original: Word | null;
    }
    let editorRows: Row[] = [];

    const addRow = (word: Word | null): void => {
      const rowEl = element('div', 'editor-row');
      const article = select(
        ARTICLES.map((a) => ({ value: a, label: a })),
        word?.article ?? 'der',
        () => undefined,
      );
      article.setAttribute('aria-label', texts.editorArticle);
      const singular = element('input', 'setting-input');
      singular.value = word?.singular ?? '';
      singular.setAttribute('aria-label', texts.editorSingular);
      const plural = element('input', 'setting-input');
      plural.value = word?.plural.join(' | ') ?? '';
      plural.setAttribute('aria-label', texts.editorPlural);
      const verifiedBox = element('label', 'setting-check');
      const verified = element('input', '');
      verified.type = 'checkbox';
      verified.checked = word?.verified ?? true;
      verifiedBox.append(verified, element('span', '', texts.editorVerified));
      // Wer ein Wort selbst einträgt oder ändert, hat es geprüft.
      for (const input of [article, singular, plural]) {
        input.addEventListener('change', () => {
          verified.checked = true;
        });
      }
      const row: Row = { element: rowEl, article, singular, plural, verified, original: word };
      rowEl.append(
        article,
        singular,
        plural,
        verifiedBox,
        button(texts.editorRemove, 'secondary-button', () => {
          editorRows = editorRows.filter((r) => r !== row);
          rowEl.remove();
        }),
      );
      editorRows.push(row);
      rows.append(rowEl);
    };
    list.words.forEach(addRow);

    const save = (): void => {
      say('');
      const listName = name.value.trim();
      if (listName === '') {
        say(texts.editorNameMissing);
        return;
      }
      const words: Word[] = [];
      let errors = 0;
      for (const row of editorRows) {
        row.element.classList.remove('has-error');
        const { original } = row;
        const unchanged =
          original !== null &&
          original.article === row.article.value &&
          original.singular === row.singular.value.trim() &&
          original.plural.join(' | ') === row.plural.value.trim();
        const result = unchanged
          ? { word: original }
          : wordFromInput(row.article.value, row.singular.value, row.plural.value);
        if ('error' in result || words.some((w) => w.id === result.word.id)) {
          row.element.classList.add('has-error');
          errors++;
          continue;
        }
        words.push({ ...result.word, verified: row.verified.checked });
      }
      if (errors > 0) {
        say(texts.editorHasErrors);
        return;
      }
      if (words.length === 0) {
        say(texts.editorEmpty);
        return;
      }
      const saved: WordList = { ...list, name: listName, inputMode: mode.value as InputMode, words };
      const others = storedLists.filter((l) => l.id !== saved.id);
      void saveStoredLists([...others, saved]).then(renderLists).catch(report);
    };

    const actions = (message: HTMLElement): HTMLElement => {
      const bar = element('div', 'editor-actions');
      bar.append(
        button(texts.editorSave, 'primary-button', save),
        button(texts.cancel, 'secondary-button', renderLists),
        message,
      );
      return bar;
    };

    listsSection.replaceChildren(
      element('h2', 'section-title', texts.editorTitle(list.name)),
      labelled(texts.listName, name),
      labelled(texts.listMode, mode),
      actions(topMessage),
      rows,
      button(texts.editorAdd, 'secondary-button', () => {
        addRow(null);
      }),
      actions(bottomMessage),
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
      [settings, profiles, storedLists] = await Promise.all([
        repository.loadSettings(),
        repository.loadProfiles(),
        repository.loadCustomLists(),
      ]);
      renderGeneral();
      renderLists();
      renderPin();
      renderReset();
      await renderProfiles();
    },
  };
}
