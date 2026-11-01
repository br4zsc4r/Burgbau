import { toggleKeepingOne } from '../../logic/exercises/freePlay';
import { MULTIPLICATION_ROWS } from '../../logic/exercises/multiplication';
import { element } from '../dom';
import { report, toggleButtons } from '../settingsControls';
import { texts } from '../texts';
import type { ExerciseSettings } from './settings';

const sorted = (rows: readonly number[]): number[] => [...rows].sort((a, b) => a - b);

/** Reihen-Knöpfe 1–10; die letzte eingeschaltete Reihe bleibt an. */
function rowToggles(rows: readonly number[], onChange: (rows: number[]) => void): HTMLElement {
  return toggleButtons(
    MULTIPLICATION_ROWS,
    (row) => rows.includes(row),
    texts.rowLabel,
    (row) => {
      onChange(sorted(toggleKeepingOne(rows, row, !rows.includes(row))));
    },
  );
}

/** Kleines 1×1: freigegeben bzw. im Paket sind einzelne Reihen. */
export const multiplicationSettings: ExerciseSettings<'multiplication'> = {
  freeContent: (ctx) => ({ rows: [...ctx.settings().multiplicationRows] }),
  summary: (content) => texts.rowsSummary(content.rows),
  renderFree: (body, ctx) => {
    const draw = (): void => {
      body.replaceChildren(
        element('h3', 'subsection-title', texts.rowsTitle),
        element('p', 'setting-note', texts.rowsHint),
        rowToggles(ctx.settings().multiplicationRows, (multiplicationRows) => {
          void ctx.saveSettings({ multiplicationRows }).then(draw).catch(report);
        }),
      );
    };
    draw();
  },
  renderPack: (body, content, _ctx, change) => {
    let rows = content.rows;
    const draw = (): void => {
      body.replaceChildren(
        element('h3', 'subsection-title', texts.rowsTitle),
        element('p', 'setting-note', texts.packRowsHint),
        rowToggles(rows, (next) => {
          rows = next;
          change({ rows });
          draw();
        }),
      );
    };
    draw();
  },
};
