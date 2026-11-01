import { parseCsvWordList, wordFromInput } from '../../logic/csvImport';
import { toggleKeepingOne } from '../../logic/exercises/freePlay';
import { toggleList, validActiveIds, type ListEntry } from '../../logic/wordlists';
import { DEFAULT_LIST_ID } from '../../state/settings';
import type { Article, InputMode, InputModeSetting, Word, WordList } from '../../types';
import { element } from '../dom';
import { button, checkbox, confirmButton, labelled, report, select } from '../settingsControls';
import { texts } from '../texts';
import type { ExerciseSettings, SettingsContext } from './settings';

const ARTICLES: readonly Article[] = ['der', 'die', 'das'];
const LIST_MODES: readonly { value: InputMode; label: string }[] = [
  { value: 'tiles', label: texts.inputModeTiles },
  { value: 'keyboard', label: texts.inputModeKeyboard },
];
const MODE_SETTINGS: readonly { value: InputModeSetting; label: string }[] = [
  { value: 'list', label: texts.inputModeList },
  { value: 'tiles', label: texts.inputModeTiles },
  { value: 'keyboard', label: texts.inputModeKeyboard },
];

/**
 * Wortlisten verwalten (im Popup der Mehrzahl): ein- und ausschalten, bearbeiten, anlegen,
 * per CSV importieren. Der Editor einer Liste ersetzt den Inhalt des Popups; danach zurück.
 */
function renderFreeSettings(body: HTMLElement, ctx: SettingsContext): void {
  const draw = (): void => {
    const settings = ctx.settings();
    const save = (change: Parameters<SettingsContext['saveSettings']>[0]): void => {
      void ctx.saveSettings(change).catch(report);
    };
    body.replaceChildren(
      element('h3', 'subsection-title', texts.pluralInputTitle),
      labelled(
        texts.settingInputMode,
        select(MODE_SETTINGS, settings.inputMode, (inputMode) => {
          save({ inputMode });
        }),
      ),
      checkbox(texts.settingCapitalization, settings.requireCapitalization, (requireCapitalization) => {
        save({ requireCapitalization });
      }),
      element('h3', 'subsection-title', texts.sectionLists),
      element('p', 'setting-note', texts.listsHint),
      ...ctx.lists().map(listRow),
      button(texts.listNew, 'primary-button', () => {
        openEditor({ id: `eigene-${ctx.newId()}`, name: texts.listNewName, inputMode: 'keyboard', words: [] });
      }),
      csvImport(),
    );
  };

  const saveLists = (next: WordList[]): void => {
    void ctx.saveStoredLists(next).then(draw).catch(report);
  };

  function listRow(entry: ListEntry): HTMLElement {
    const { list } = entry;
    const row = element('div', 'list-row');
    const unverified = list.words.filter((w) => !w.verified).length;
    const toggle = element('input', '');
    toggle.type = 'checkbox';
    toggle.checked = ctx.settings().activeListIds.includes(list.id);
    toggle.setAttribute('aria-label', texts.listActive(list.name));
    toggle.addEventListener('change', () => {
      const activeListIds = toggleList(ctx.settings().activeListIds, list.id, toggle.checked);
      toggle.checked = activeListIds.includes(list.id);
      void ctx.saveSettings({ activeListIds }).catch(report);
    });

    const info = element('span', 'list-info');
    info.append(element('strong', '', list.name), ' ', texts.listInfo(list.words.length, unverified));
    if (entry.builtin) info.append(' · ', entry.edited ? texts.listEditedBadge : texts.listBuiltin);

    const others = (): WordList[] => ctx.storedLists().filter((l) => l.id !== list.id);
    const actions = element('span', 'list-actions');
    actions.append(
      button(texts.listEdit, 'secondary-button', () => {
        openEditor(list);
      }),
    );
    if (entry.edited) {
      actions.append(
        confirmButton(texts.listRestore, texts.confirmDelete, texts.confirmDeleteYes, () => {
          saveLists(others());
        }),
      );
    }
    if (!entry.builtin) {
      actions.append(
        confirmButton(texts.listDelete, texts.confirmDelete, texts.confirmDeleteYes, () => {
          saveLists(others());
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
      saveLists([...ctx.storedLists(), pending]);
    });
    take.disabled = true;
    file.addEventListener('change', () => {
      const chosen = file.files?.[0];
      if (chosen === undefined) return;
      void chosen
        .text()
        .then((text) => {
          const name = chosen.name.replace(/\.[^.]+$/, '');
          const result = parseCsvWordList(text, `eigene-${ctx.newId()}`, name);
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
        // Ein korrigiertes Wort behält sein Bild.
        const image = original?.id === result.word.id ? original.image : undefined;
        words.push({ ...result.word, ...(image === undefined ? {} : { image }), verified: row.verified.checked });
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
      saveLists([...ctx.storedLists().filter((l) => l.id !== saved.id), saved]);
    };

    const actions = (message: HTMLElement): HTMLElement => {
      const bar = element('div', 'editor-actions');
      bar.append(
        button(texts.editorSave, 'primary-button', save),
        button(texts.cancel, 'secondary-button', draw),
        message,
      );
      return bar;
    };

    body.replaceChildren(
      element('h3', 'subsection-title', texts.editorTitle(list.name)),
      labelled(texts.listName, name),
      labelled(texts.listMode, mode),
      actions(topMessage),
      rows,
      button(texts.editorAdd, 'secondary-button', () => {
        addRow(null);
      }),
      actions(bottomMessage),
    );
    name.focus();
  }

  draw();
}

/** Mehrzahl: Inhalt sind Wortlisten; Eingabemodus und Großschreibung gelten auch in den Paketen. */
export const pluralSettings: ExerciseSettings<'plural'> = {
  freeContent: (ctx) => ({
    listIds: validActiveIds(
      ctx.settings().activeListIds,
      ctx.lists().map((entry) => entry.list),
      DEFAULT_LIST_ID,
    ),
  }),
  summary: (content) => texts.listCount(content.listIds.length),
  renderFree: renderFreeSettings,
  renderPack: (body, content, ctx, change) => {
    let listIds = content.listIds;
    const draw = (): void => {
      body.replaceChildren(
        element('h3', 'subsection-title', texts.sectionLists),
        element('p', 'setting-note', texts.packListsHint),
        ...ctx.lists().map(({ list }) =>
          checkbox(list.name, listIds.includes(list.id), (on) => {
            listIds = toggleKeepingOne(listIds, list.id, on);
            change({ listIds });
            draw();
          }),
        ),
      );
    };
    draw();
  },
};
