# CLAUDE.md – Burgbau

Lernspiel für Grundschulkinder: Pluralbildung deutscher Nomen. Jede Antwort bringt ein Bauteil für eine Burg.
**Die vollständige Spezifikation steht in `specification.md`. Sie ist die verbindliche Quelle.** Bei Widersprüchen zwischen dieser Datei, der Spezifikation und einer Anfrage: nachfragen, nicht raten.

## Befehle

```bash
npm run dev         # Dev-Server (Vite)
npm run build       # Produktions-Build
npm run preview     # Build lokal ansehen
npm test            # Unit-Tests (Vitest)
npm run test:e2e    # E2E-Tests (Playwright)
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
```
Diese Skripte werden in Phase 1 angelegt. Wenn ein Skript fehlt, ergänzen statt umgehen.

## Stack

TypeScript (strict) · Vite · Phaser (Bauszene) · HTML/CSS-Overlay für alle Menüs und die Aufgaben-UI · IndexedDB über `idb-keyval` · vite-plugin-pwa · Vitest · Playwright.
Keine weiteren Abhängigkeiten ohne Rückfrage.
Bei Phaser immer die API der **installierten** Version prüfen (`node_modules/phaser/types`), nicht aus dem Gedächtnis schreiben.

## Architektur-Regeln

```
src/
  data/     Wortlisten (JSON), Bauteil-Katalog
  logic/    reine Spiellogik – KEINE Imports aus phaser, keine DOM-Zugriffe, kein IndexedDB
  state/    Speichern/Laden (IndexedDB), Profile, laufende Partie, Sammlung
  ui/       HTML-Overlay (Profilauswahl, Aufgabe, Angebote, Sammlung, Einstellungen)
  scene/    Phaser-Szenen – nur Darstellung und Eingabe, keine Spielregeln
```

1. **Logik und Darstellung strikt trennen.** Spielregeln (Antwortprüfung, Angebote, Serie, Schwerkraft, Autotiling-Bitmaske, Wortauswahl) leben ausschließlich in `logic/` als reine Funktionen. `scene/` und `ui/` rufen sie nur auf.
2. **Ein Zustand, eine Quelle.** Der Spielzustand ist ein serialisierbares Objekt (nur JSON-Daten, keine Klasseninstanzen, keine Phaser-Objekte). Die Szene wird aus diesem Zustand gezeichnet.
3. **Burgen werden als Rasterdaten gespeichert**, nie als Bild. Bauen und Sammlungsansicht nutzen dieselbe Render-Funktion.
4. **Speicherformat versionieren.** Jeder gespeicherte Datensatz hat ein Feld `version`. Bei Formatänderungen eine Migration in `state/migrations.ts` schreiben. Kinder dürfen nach einem Update nie ihre Burgen verlieren.
5. **Nach jedem Spielschritt automatisch speichern** (Pausenspiel: Gerät wird jederzeit weggelegt).

## Code-Konventionen

- Bezeichner im Code **englisch** (`pluralPattern`, `offerPieces`), alle **sichtbaren Texte deutsch**.
- Alle UI-Texte zentral in `src/ui/texts.ts`, keine Texte direkt im Markup oder in Szenen verstreut.
- Kein `any`. Typen für Wortlisten, Bauteile und Spielzustand in `src/types.ts`.
- Zeichenvergleiche bei Antworten immer nach `String.prototype.normalize('NFC')` und mit Trimmen (Umlaute können unterschiedlich kodiert ankommen).
- Zufall über eine injizierbare Zufallsfunktion, damit Logik deterministisch testbar ist.

## Kindgerechte UI – nicht verhandelbar

- Touch-Ziele **mindestens 64 × 64 px**, große gut lesbare Schrift, viel Abstand.
- **Kein** Zeitdruck, **keine** Punkte, Sterne oder Ranglisten, **keine** roten Fehlerbildschirme oder Strafsounds.
- Falsche Antworten sind kein Weltuntergang: Lösung freundlich zeigen, dann beschädigte Bauteile anbieten.
- Wichtige Texte über einen Vorlese-Button zugänglich machen (Web Speech API, `de-DE`).
- Lehrkraft-Einstellungen nur über den gesicherten Zugang erreichbar (siehe Spezifikation).

## Datenschutz und Offline

- **Keine Netzwerkanfragen zur Laufzeit**: keine CDNs, keine externen Schriften, keine Analytics, kein Tracking. Alle Assets und Schriften liegen lokal im Projekt.
- Es werden nur Spitznamen gespeichert, ausschließlich lokal im Browser.

## Wortlisten

- Liegen in `src/data/wordlists/*.json`, Format siehe Spezifikation Abschnitt 3.
- **Keine Pluralformen erfinden.** Neu hinzugefügte Wörter mit `"verified": false` markieren, damit sie vor dem Einsatz gegen Duden/Wiktionary geprüft werden. Unklare Fälle nicht aufnehmen.
- Ein Test (`tests/wordlists.test.ts`) prüft alle Listen: Schema gültig, keine doppelten IDs, `pattern` und `umlaut` passen zur ersten Pluralform.

## Grafiken

- Bis Phase 8 nur **Platzhalter**: einfache, selbst gezeichnete SVGs bzw. farbige Formen in `public/assets/placeholder/`.
- Rastergröße und Zellmaß als Konstanten in einer Datei (`src/data/grid.ts`), nirgends hart kodiert.
- Beschädigte Teile = normale Teile + Schadens-Overlay, keine eigenen Grundtexturen.

## Arbeitsweise

- Es wird **phasenweise** nach Spezifikation Abschnitt 11 gearbeitet. Nur die angefragte Phase umsetzen, nicht vorgreifen.
- Neue Logik in `logic/` kommt immer mit Unit-Tests.
- Vor dem Abschluss einer Aufgabe: `npm run typecheck`, `npm run lint` und `npm test` müssen grün sein.
- Am Ende jeder Phase kurz zusammenfassen: was umgesetzt wurde, was bewusst offen ist, und wie man es im Browser **manuell ausprobiert**.
- Wenn eine Umsetzung von der Spezifikation abweichen müsste: vorher fragen. Getroffene Entscheidungen danach in `specification.md` nachtragen.
