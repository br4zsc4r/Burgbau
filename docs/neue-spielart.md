# Eine neue Spielart hinzufügen

Burgbau ist ein Rahmen für mehrere Lernspiele: Bauen, Angebote, Serie, Seltenheit, Speicher und Sammlung bleiben gleich, nur die **Aufgabe** wechselt. Eine solche Aufgabenart heißt im Projekt **Spielart** (`ExerciseId`). Zurzeit gibt es zwei:

| Spielart | ID | Inhalt (woraus die Aufgaben kommen) | Logik | Panel |
|---|---|---|---|---|
| Mehrzahl | `plural` | eingeschaltete Wortlisten | `src/logic/exercises/plural.ts` | `src/ui/exercises/pluralPanel.ts` |
| Kleines 1×1 | `multiplication` | eingeschaltete Reihen 1–10 | `src/logic/exercises/multiplication.ts` | `src/ui/exercises/multiplicationPanel.ts` |

**Das kleine 1×1 ist die beste Vorlage**: Es ist klein und berührt jede Stelle genau einmal. Mit `grep -rn multiplication src tests` findest du alle Stellen, die eine neue Spielart ebenfalls braucht.

Als Beispiel nennt diese Anleitung eine erdachte Spielart „Plus und Minus bis 20“ mit der ID `addition`.

---

## 1. Erst klären, dann programmieren

Laut `CLAUDE.md` ist `specification.md` verbindlich. Beschreibe die neue Spielart deshalb **zuerst** in Abschnitt 14, als eigenen Unterabschnitt wie „Kleines 1×1“. Klären und festhalten:

1. **Aufgaben:** Wie sieht eine Aufgabe aus? Wie viele gibt es?
2. **Inhalt:** Was schaltet die Lehrkraft ein und aus (Listen, Reihen, Zahlenraum …)? Was ist der Standard? Bleibt immer mindestens eins an?
3. **Eingabe:** Tastatur, Ziffernfeld, Bausteine, Auswahlknöpfe? Touch-Ziele ≥ 64 px, auf dem Tablet ohne Scrollen.
4. **Prüfung:** Wann ist die Antwort richtig? Wann gibt es „Fast!“ mit zweitem Versuch, etwa bei Tippfehler oder Zahlendreher? Alles andere ist falsch.
5. **Lösung zeigen:** freundlich und mit farbig hervorgehobenem Teil. Keine roten Fehlerbildschirme.
6. **Vorlesen:** Was wird vor und was nach der Antwort vorgelesen?
7. **Exklusive Bauteile:** Bringt die Spielart eigene Teile mit? Welche Seltenheit haben sie?
8. **Bestehende Geräte:** Soll die neue Spielart nach dem Update sofort im freien Spiel erscheinen? Siehe [Schritt 5](#5-einstellungen-pakete-und-speicher-srcstate).

Weicht etwas von bestehenden Regeln ab, etwa Punkte, Zeitdruck, Netzwerk oder neue Abhängigkeiten: **vorher fragen.**

---

## 2. So läuft eine Aufgabe durch das Spiel

```
Inhalt (Einstellungen / Übungspaket)
  └─ xyzTasks(...)            logic/exercises/xyz.ts      → Task[] mit IDs „xyz:…“
       └─ tasksFor(selection) ui/app.ts                   → Aufgaben-IDs der Burg
            └─ taskPicker     logic/taskPicker.ts         → nächste Aufgabe (Wiederholung, Lernfächer)
                 └─ Panel     ui/exercises/xyzPanel.ts    → zeigt die Aufgabe, liefert die Eingabe als String
                      └─ checkTask  logic/exercises/exercise.ts → AnswerResult (correct / almost / wrong)
                           └─ Angebote, Serie, Bauen … (für alle Spielarten gleich)
```

Diese Teile funktionieren **ohne Änderung** für jede Spielart, weil sie nur mit Aufgaben-IDs arbeiten: Aufgabenauswahl, Lernfächer, Wiederholung falscher Aufgaben, Serie, Angebote, Bauszene, Sammlung, Töne (`logic/gameEvents.ts`) und das Speichern der laufenden Burg.

---

## 3. Typen (`src/types.ts`)

```ts
export type ExerciseId = 'plural' | 'multiplication' | 'addition';

/** Aufgabe „Plus und Minus bis 20“: a + b oder a − b. */
export interface AdditionTask {
  exercise: 'addition';
  /** Aufgaben-ID mit Präfix, z. B. „addition:7+5“. */
  id: string;
  left: number;
  right: number;
  operator: '+' | '-';
}

export type Task = PluralTask | MultiplicationTask | AdditionTask;

export interface PackContents {
  plural?: { listIds: string[] };
  multiplication?: { rows: number[] };
  /** Plus und Minus: diese Zahlenräume. */
  addition?: { ranges: number[] };
}

export interface Settings {
  // …
  /** Freigegebener Inhalt im freien Spiel (mindestens einer). */
  additionRanges: number[];
}
```

Nach dieser Änderung zeigt `npm run typecheck` schon die meisten Stellen, die fehlen (siehe [Abschnitt 11](#11-was-der-compiler-findet-und-was-nicht)).

Braucht die Spielart einen **eigenen „Fast!“-Grund**, kommt er als neuer Wert in `AnswerResult` (`reason: 'typo' | 'capitalization' | 'digits' | …`). Dazu gehören ein Eintrag in `feedbackTitle` (`src/ui/exercises/shared.ts`) und ein Text in `texts.ts`.

---

## 4. Logik (`src/logic/exercises/addition.ts`)

Hier gilt: **reine Funktionen**, kein DOM, kein Phaser, kein IndexedDB. Zufall nur über eine übergebene `RandomFn`. Vorlage ist `multiplication.ts`.

```ts
import type { AdditionTask, AnswerResult } from '../../types';
import type { ExerciseLogic } from './exercise';
import { taskId } from './taskId';

/** Alle Aufgaben der eingeschalteten Zahlenräume, in fester Reihenfolge. */
export function additionTasks(ranges: readonly number[]): AdditionTask[] { /* … */ }

export function checkAddition(task: AdditionTask, input: string, attempt: 1 | 2): AnswerResult {
  const answer = input.normalize('NFC').trim();   // immer NFC + Trimmen
  // correct → { status: 'correct', capitalizationHint: false }
  // „Fast!“ nur bei attempt === 1 → { status: 'almost', reason: … }
  // sonst   → { status: 'wrong', solution }
}

export const additionExercise: ExerciseLogic<AdditionTask> = {
  check: (task, input, _settings, attempt) => checkAddition(task, input, attempt),
};
```

**Aufgaben-IDs** entstehen immer über `taskId('addition', '7+5')` und ergeben dann `addition:7+5`. Diese IDs werden in Lernfächern und in laufenden Burgen **gespeichert**. Das Schema darf sich daher nach der Veröffentlichung nicht mehr ändern, sonst braucht es eine Migration. Gleiche Aufgabe heißt gleiche ID, verschiedene Aufgaben haben verschiedene IDs: `3x7` ist nicht `7x3`.

Danach die Spielart an zwei Stellen eintragen:

- **`src/logic/exercises/taskId.ts`:** `EXERCISE_IDS` um `'addition'` ergänzen. Die Reihenfolge ist auch die Reihenfolge der Karten bei „Was möchtest du üben?“. ⚠️ Der Compiler prüft das nicht. Fehlt der Eintrag, verwirft `isExerciseId` die Spielart, und gespeicherte Burgen mit dieser Auswahl gehen beim Laden verloren.
- **`src/logic/exercises/exercise.ts`:** In der Tabelle `EXERCISES` `addition: additionExercise` eintragen.

**Übungspakete (`src/logic/packs.ts`):**

- In `packExercises`: `addition: (addition?.ranges.length ?? 0) > 0`
- In `packTasks`: `if (addition !== undefined) tasks.push(...additionTasks(…))`. Unbekannte Werte dabei herausfiltern.

---

## 5. Einstellungen, Pakete und Speicher (`src/state/`)

- **`settings.ts`:**
  - Standardwert in `defaultSettings`, z. B. `additionRanges: [10, 20]`.
  - In `parseSettings` lesen, nach dem Muster von `multiplicationRows` mit `nonEmpty(…) ?? defaultSettings.…`. Kaputtes oder Fehlendes fällt so auf den Standard zurück.
- **`validate.ts`:** In `parsePack` den neuen Paketinhalt einlesen. Fehlt das, verschwindet der Inhalt beim nächsten Laden still aus dem Paket.
- **`migrations.ts`:** Ein neues Feld in den Einstellungen braucht **keine** Migration, weil `parseSettings` ergänzt, was fehlt. Mit einer Ausnahme:

> **`freeExercises` ist auf bestehenden Geräten schon gespeichert**, als `['plural', 'multiplication']`. Die neue Spielart wäre dort also **aus**, bis die Lehrkraft sie einschaltet. Soll sie sofort erscheinen, braucht es eine Migration: `CURRENT_VERSION.settings` hochzählen und in `MIGRATIONS.settings` einen Schritt eintragen, der `'addition'` zu `freeExercises` hinzufügt. Beides in `specification.md` festhalten.

Laufende Burgen, Lernfortschritt und Burgen bleiben unverändert. Sie kennen nur IDs und Auswahl.

---

## 6. Aufgaben-Panel (`src/ui/exercises/additionPanel.ts`)

Ein Panel erfüllt `ExercisePanel<AdditionTask>` (`src/ui/exercises/panel.ts`):

| Funktion | Aufgabe |
|---|---|
| `element` | Wurzel-Element: `section.task-panel` mit `data-exercise="addition"` |
| `render(quiz, task)` | Aufgabe, Rückmeldung (`quiz.lastResult`) und Knopf („Fertig“ bzw. „Weiter“) zeichnen. Wird oft aufgerufen, darf also nichts zurücksetzen. |
| `startNewTask()` | Eingabe leeren und fokussieren (neue Aufgabe) |
| `focusForPhase(quiz)` | Fokus passend zur Phase (`answering` / `feedback`) |
| `celebrate()` | `celebrateCard(card)` aus `shared.ts` |

Regeln:

- **Kein eigener Spielzustand.** Das Panel bekommt `quiz` und `task` und meldet nur `callbacks.onSubmit(eingabe)` oder `callbacks.onContinue()`. Prüfen, Weiterzählen und Speichern übernimmt `app.ts` mit der Logik.
- **Vorhandene Bausteine nutzen:**
  - aus `shared.ts`: `createSpeakButton`, `feedbackTitle`, `celebrateCard`
  - aus `../dom`: `element`
  - CSS-Klassen: `word-card`, `answer-form`, `feedback`, `solution`, `solution-part`, `primary-button`
- **Vorlesen:** Den Knopf nur zeigen, wenn `callbacks.speaker?.ready() === true`. Vorher die Frage vorlesen, nach der Antwort die Lösung.
- **Tastatur am PC:** Einen globalen `keydown`-Listener wie im 1×1-Panel nur auswerten, solange das Panel sichtbar ist (`panel.offsetParent !== null`). Sonst tippt man bei gemischten Paketen in die falsche Spielart.
- **Alle Texte** stehen in `texts.ts`, nichts direkt im Markup.

Eintragen in **`src/ui/exercises/index.ts`** (`createTaskArea`):

```ts
const panels = {
  plural: createPluralPanel(callbacks),
  multiplication: createMultiplicationPanel(callbacks),
  addition: createAdditionPanel(callbacks),
} as const;
```

**CSS** in `src/ui/styles.css` gezielt über `.task-panel[data-exercise='addition']` setzen. Ausprobieren:

- im Hochformat
- auf dem Tablet quer (1024 × 690)
- im Kompaktmodus (Höhe ≤ 560 px)

„Fertig“ muss überall ohne Scrollen sichtbar sein.

---

## 7. Texte (`src/ui/texts.ts`)

- `exerciseNames` und `exerciseSamples`: Name und Beispiel für die Auswahlkarte, z. B. `'Plus und Minus'`, `'7 + 5 = 12'`. Beide sind mit `satisfies Record<ExerciseId, string>` abgesichert, der Compiler meldet also, wenn etwas fehlt.
- Aufgabentexte: Aufforderung, `aria-label`, Vorlesetexte für Frage und Lösung.
- Lehrkraft-Texte:
  - Titel und Hinweis für den Inhalt
  - Titel im Paket-Editor
  - Teil der Paket-Zusammenfassung, z. B. `packAdditionPart`
- `packEmpty` anpassen: „Wähle mindestens eine Wortliste, eine Reihe oder …“.

---

## 8. Spiel verdrahten (`src/ui/app.ts`)

Eine Zeile in `tasksByExercise`:

```ts
const tasksByExercise: Record<ExerciseId, readonly Task[]> = {
  plural: pluralTasks(pool, settings),
  multiplication: multiplicationTasks(settings.multiplicationRows),
  addition: additionTasks(settings.additionRanges),
};
```

Mehr ist in `app.ts` nicht nötig. Auswahlkarten, Pakete und der Start der Burg laufen über `EXERCISE_IDS` und `texts.exerciseNames`.

---

## 9. Lehrkraft-Bereich (`src/ui/teacherScreen.ts`)

Drei Stellen, jeweils neben dem 1×1:

1. **`renderExercises()`:** Den Ein-/Ausschalter der Spielart erzeugt die Schleife über `EXERCISE_IDS` von selbst. Neu dazu kommt die Einstellung für den freigegebenen Inhalt, z. B. Knöpfe wie die `row-toggles`. Mit `toggleKeepingOne` bleibt immer mindestens einer an.
2. **`packSummary()`:** den Inhalt in der Paketliste kurz nennen.
3. **`renderPackEditor()`:**
   - eigene Variable für den Inhalt
   - Abschnitt mit Überschrift
   - in `save()` `contents.addition = { … }` setzen, wenn etwas gewählt ist

Der Lehrkraft-Bereich bleibt hinter der PIN. Neue Einstellungen gehören nicht in den Kinderbereich.

---

## 10. Exklusive Bauteile (optional)

Der Mechanismus ist fertig: In `src/data/pieces.ts` bindet das Feld `exercises` ein Teil an Spielarten.

```ts
{ id: 'abacus', category: 'environment', ...ground, rarity: 'rare', exercises: ['addition'] },
```

So ein Teil wird nur nach einer Aufgabe dieser Spielart angeboten (`fitsExercise` in `logic/offers.ts`), bei gemischten Paketen also passend zur gerade gelösten Aufgabe. Einmal gebaut, ist es ein ganz normales Teil.

Für ein neues Teil:

1. **Katalog:**
   - Eintrag in `src/data/pieces.ts`, mit Kategorie, Größe, `rarity`, eventuell `mirror` oder `minStreak`.
   - Die ID in `NormalPieceId` in `src/types.ts` ergänzen.
2. **Grafik im Generator:**
   - Zeichenfunktion in `scripts/art/*.ts` (Dekorationen in `decorations.ts`, Dächer in `roofs.ts` …).
   - In `scripts/art/generate.ts` als `'pieces/<id>.svg'` eintragen, Animationen als `'pieces/<id>-moving.svg'`.
3. **Darstellung:**
   - Wenn nötig, Einträge in `src/data/pieceArt.ts` ergänzen: `FEATURES`, `ANIMATIONS`, `CUTOUTS`, `OVERHANG`, `TOP_MOUNT_X`, `FOOT_X`.
4. **Grafiken erzeugen:**
   - `npm run art` ausführen.
   - Danach den Dev-Server **neu starten**: Der Generator schreibt `public/assets/art/` neu, und der laufende Server liefert sonst `index.html` statt der SVG.
5. **Test:** Der Test „exklusive Teile im Katalog nennen nur bekannte Spielarten“ in `tests/exercises.test.ts` prüft die Bindung.

---

## 11. Was der Compiler findet – und was nicht

Nach dem Erweitern von `ExerciseId` meldet `npm run typecheck` fehlende Einträge in:

- `EXERCISES` (`logic/exercises/exercise.ts`)
- `texts.exerciseNames`, `texts.exerciseSamples`
- `packExercises` (`logic/packs.ts`)
- `tasksByExercise` (`ui/app.ts`)
- `panels` in `createTaskArea` (`ui/exercises/index.ts`)

**Nicht** gemeldet werden diese Stellen, sie musst du selbst prüfen:

- [ ] `EXERCISE_IDS` in `logic/exercises/taskId.ts`
- [ ] `packTasks` in `logic/packs.ts`
- [ ] `defaultSettings` und `parseSettings` in `state/settings.ts`
- [ ] `parsePack` in `state/validate.ts`
- [ ] Migration für `freeExercises` auf bestehenden Geräten (falls gewünscht)
- [ ] Lehrkraft-Bereich: Inhalts-Einstellung, `packSummary`, `renderPackEditor`
- [ ] `texts.packEmpty`
- [ ] CSS für Hochformat, Tablet und Kompaktmodus
- [ ] `specification.md` Abschnitt 14

---

## 12. Tests

**Unit-Tests** (`tests/addition.test.ts`, Vorlage `tests/multiplication.test.ts`):

- Aufgaben aus dem Inhalt: Anzahl, feste Reihenfolge, IDs mit Präfix, `exerciseOf(id) === 'addition'`
- Prüfung:
  - richtig, „Fast!“ nur beim ersten Versuch, falsch mit Lösung
  - Leerzeichen und Unicode-Normalisierung (NFC)
- `checkTask` wählt die richtige Prüfung
- Pakete: `packExercises`, `packTasks`, `packProblems` mit dem neuen Inhalt
- Einstellungen: `parseSettings` mit fehlendem, kaputtem und gültigem Wert
- `parsePack` behält den neuen Inhalt
- gegebenenfalls die Migration (`tests/state.test.ts`)

**E2E-Tests** (`tests/e2e/`, Vorlage `tests/e2e/phase9.spec.ts`):

- Kind wählt die Spielart mit `chooseExercise(page, 'Plus und Minus')`, löst eine Aufgabe richtig und bekommt drei Angebote.
- Eine falsche Antwort zeigt die Lösung.
- Mit `setSettings(page, { freeExercises: ['addition'] })` startet die Burg ohne Auswahl.
- Die Lehrkraft schaltet den Inhalt ein und aus, und es kommt nur noch das Eingeschaltete.
- Ein Paket mit dem neuen Inhalt lässt sich anlegen und spielen.
- Tablet 1024 × 690: `.task-panel:visible .primary-button` ist ohne Scrollen sichtbar.

Hinweise zu den Helfern:

- `currentWord` und `answer` in `tests/e2e/helpers.ts` gelten nur für die Mehrzahl. Für die neue Spielart braucht es eigene Helfer, wie `currentProduct` in `phase9.spec.ts`.
- Bei mehreren Panels sind Locatoren mit `:visible` eindeutig (`.task-panel:visible`, `.feedback:visible`).

---

## 13. Abschluss

1. `npm run typecheck`, `npm run lint`, `npm test` sind grün, ebenso `npm run test:e2e`.
2. `specification.md` ist ergänzt: Abschnitt 14 und gegebenenfalls eine Entscheidung in Abschnitt 13.
3. Im Browser ausprobieren:
   - Lehrkraft-Bereich: Spielart und Inhalt einschalten.
   - Profil wählen, „Neue Burg bauen“, neue Spielart wählen.
   - Antworten: richtig, „Fast!“, falsch. Vorlesen testen.
   - Ein Paket anlegen, das die Spielart mit der Mehrzahl mischt.
   - Auf dem Tablet ohne Scrollen spielen.
