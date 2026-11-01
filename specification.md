# Burgbau – Spezifikation

> Lernspiel für Grundschulkinder: Pluralbildung deutscher Nomen.
> Jede Antwort bringt ein Bauteil für eine Burg. Richtige Antworten bringen schöne Teile, falsche bröckelige.

**Spielsprache:** Deutsch
**Einsatz:** im Unterricht, vor allem als **Pausenbeschäftigung** auf Schulgeräten
**Zielplattform:** Browser (Chromebook, iPad, Windows-PC, interaktive Tafel) – ohne Installation, offline-fähig
**Zielgruppe:** Grundschule; die Klassenstufe wird über die gewählte Wortliste bestimmt

---

## 1. Spielablauf

### Eine Partie = eine Burg
```
Profil wählen  →  [ Aufgabe  →  Antwort  →  1 aus 3 Bauteilen wählen  →  Bauteil platzieren ]  × X  →  Burg fertig  →  Sammlung
```

- Jede Partie beginnt mit einer **leeren Landschaft**.
- Nach **jeder Aufgabe** bekommt das Kind ein Bauteil, egal ob die Antwort richtig oder falsch war. Es wählt **eines aus drei angebotenen** und setzt es sofort in die Szene.
- Nach **X Aufgaben** (Standard: 15, einstellbar 10 / 15 / 20) ist die Burg fertig und wandert in die **Sammlung**.
- Wer wieder spielt, beginnt eine **neue Burg**.

### Pausentauglich
- **Schneller Einstieg:** eigenes Profil-Symbol antippen, dann sofort „Neue Burg bauen“ oder „Weiterbauen“. Kein Passwort, keine weiteren Menüs.
- **Kurze Partie:** 15 Aufgaben dauern ca. 5–10 Minuten.
- **Jederzeit unterbrechbar:** Die laufende Burg wird nach jedem Schritt automatisch gespeichert. Beim nächsten Öffnen erscheint „Weiterbauen oder neue Burg?“.
- **Leise:** Sound standardmäßig leise bzw. stumm schaltbar, damit es im Klassenzimmer nicht stört.

## 2. Die Aufgabe

### Darstellung
```
   [Bild: Hund]
   der Hund   →   die ________
                  [🔊 vorlesen]
```
- Singular **mit Artikel**, Plural immer mit „die“ vorgegeben.
- **Bild/Icon** zum Wort, damit auch schwächere Leser:innen das Wort erkennen.
- **Vorlesen** über die Web Speech API (`de-DE`), optional abschaltbar.

### Eingabemodi (zwei Schwierigkeitsstufen)

| Modus | Stufe | Ablauf |
|---|---|---|
| **Bausteine (Drag & Drop)** | leicht | Der Wortstamm ist vorgegeben. Das Kind zieht eine **Endung** (`-e`, `-er`, `-n`, `-en`, `-s`, `–` keine Endung) an das Wort und setzt bei Bedarf **Umlautpünktchen** (¨) auf den Vokal. Beispiel: `Hand` + ¨ + `-e` → `Hände` |
| **Tastatur** | schwer | Das Kind tippt den ganzen Plural. Eine Bildschirmleiste bietet **Ä Ö Ü ß** an (wichtig für Tablets und Schul-PCs). |

Der Modus ist in der Wortliste festgelegt (siehe Abschnitt 3) und kann von der Lehrkraft überschrieben werden. Der Drag-&-Drop-Modus macht die **fünf Pluralmuster** des Deutschen sichtbar. Das ist das eigentliche Lernziel.

### Bewertung der Antwort
- Vergleich mit einer Liste erlaubter Formen (z. B. `Pizza` → `Pizzas`, `Pizzen`).
- **Groß-/Kleinschreibung:** Kleingeschriebene Antworten zählen als richtig, das Spiel zeigt aber einen freundlichen Hinweis („Nomen schreibt man groß!“). Über eine Einstellung kann die Großschreibung verpflichtend werden.
- **Fast richtig** (Levenshtein-Abstand 1): Hinweis „Fast! Schau noch mal genau.“ und **ein** zweiter Versuch. Erst danach zählt die Antwort als falsch.

### Feedback
- **Richtig:** kurze Animation, Sound, danach Auswahl schöner Bauteile.
- **Falsch:** keine Strafe und kein roter Bildschirm. Die richtige Lösung wird gezeigt, die Endung farbig hervorgehoben. Danach folgt die Auswahl bröckeliger Bauteile (siehe Abschnitt 4). Das Wort kommt in derselben Partie später noch einmal.

## 3. Wortlisten (bestimmen die Klassenstufe)

Die Klassenstufe wird **nicht** separat eingestellt, sondern über die **aktive Wortliste**. Die Lehrkraft wählt pro Gerät eine Liste aus.

### Mitgelieferte Listen
| Datei | Inhalt | Standardmodus |
|---|---|---|
| `klasse-1-2.json` | ca. 60 häufige, meist regelmäßige Nomen (Hund, Katze, Auto, Ball) | Bausteine |
| `klasse-3.json` | ca. 80 Nomen, mehr Umlaute (Baum → Bäume, Haus → Häuser) | Bausteine oder Tastatur |
| `klasse-4.json` | ca. 80 Nomen, inkl. Sonderfälle (Museum → Museen, Lehrer → Lehrer) | Tastatur |

### Dateiformat
```json
{
  "id": "klasse-1-2",
  "name": "Klasse 1/2 – Grundwortschatz",
  "inputMode": "tiles",
  "words": [
    {
      "id": "hund",
      "singular": "Hund",
      "article": "der",
      "plural": ["Hunde"],
      "pattern": "e",
      "umlaut": false,
      "image": "hund.svg",
      "verified": true
    }
  ]
}
```
- `inputMode`: `tiles` (Bausteine) | `keyboard` (Tastatur)
- `pattern`: `e | er | n | en | s | none`
- `umlaut`: ob im Plural ein Umlaut entsteht
- `image`: optional; ohne Bild wird ein Platzhalter angezeigt
- `verified`: `false`, solange das Wort nicht gegen Duden/Wiktionary geprüft ist
- Wörter **ohne Plural** (Milch, Glück) kommen in keine Liste.
- Von KI erzeugte Listen müssen gegen den Duden oder Wiktionary **geprüft** werden.

### Eigene Listen (Ausbaustufe)
Die Lehrkraft kann eine eigene Liste als **CSV** importieren (`Artikel;Singular;Plural`, mehrere Plurale mit `|` getrennt). Ohne Bild wird statt des Icons nur der Text angezeigt.

### Wortauswahl innerhalb einer Partie
- Zufällige Auswahl aus der aktiven Liste, ohne Wiederholung innerhalb der Partie.
- Falsch beantwortete Wörter werden **3–5 Aufgaben später** noch einmal gestellt (zählt als eigene Aufgabe).
- **Lernfortschritt pro Profil:** Jedes Wort hat pro Profil einen Fach-Wert 0–4 (leichtes Leitner-System). Falsch → Fach 0, richtig → Fach + 1. Eine Partie mischt ca. 60 % Wörter aus niedrigen Fächern mit 40 % neuen bzw. sicheren Wörtern. So übt jedes Kind gezielt seine eigenen Problemwörter.

## 4. Bauteile und Belohnungen

### Auswahl „1 aus 3“
Nach jeder Aufgabe werden **drei Bauteile** angeboten. Das Kind wählt eines und platziert es. Wie gut die Angebote sind, hängt von der Antwort und der aktuellen Serie ab:

| Situation | Angebot (3 Teile) |
|---|---|
| **Falsche Antwort** | 3 **beschädigte** Teile zur Auswahl (das Kind entscheidet also auch hier selbst) |
| Richtig, Serie 1–2 | 3 Grundbauteile |
| Richtig, Serie 3–4 | 2 Grundbauteile + 1 Dekoration |
| Richtig, Serie 5–9 | 1 Grundbauteil + 1 Dekoration + 1 Abschluss (Dach/Zinnen) |
| Richtig, Serie 10+ | mindestens 1 **Premium-Teil** |

- **Serie (Streak):** Anzahl richtiger Antworten in Folge. Eine falsche Antwort **halbiert** die Serie (abgerundet), statt sie auf 0 zu setzen.
- Die Serie wird sichtbar angezeigt (z. B. als Fackeln, die nacheinander aufleuchten), damit Kinder den Zusammenhang „mehr richtig in Folge → schönere Teile“ verstehen.
- Die drei Angebote sollen sich unterscheiden (keine drei gleichen Teile).

### Bauteil-Katalog
| Kategorie | Beispiele |
|---|---|
| Grundbauteile | Mauerblock, Turmblock, Tor, Mauer mit Fenster |
| Abschlüsse | Zinnen, Spitzdach, Kegeldach |
| Dekorationen | Fahne, Wimpel, Balkon, Wappen, Fackel, Efeu, Blumenkasten |
| Premium | goldenes Dach, Bannerfahne, Buntglasfenster, Drache auf dem Turm |
| Umgebung | Baum, Brunnen, Wassergraben, Zugbrücke |
| **Beschädigt** | Bröckelmauer, Mauer mit Loch, Mauer mit Riss, Turmblock mit fehlender Ecke, schiefes Dach mit fehlenden Ziegeln, zerrissene Fahne, Holzbretter-Flickwerk, Steinhaufen |

### Gestaltung der beschädigten Teile
- Beschädigte Teile sind **funktional gleichwertig**: Man kann auf ihnen weiterbauen, sie verschmelzen genauso mit normalen Teilen (siehe Abschnitt 5).
- Sie sehen nur **sichtbar weniger schön** aus. Das ist der Anreiz, richtig zu antworten.
- **Ton:** eher **verwittert und lustig** als traurig, z. B. Moos, ein Vogelnest im Loch, ein Flicken aus Holzbrettern. Eine Burg mit vielen Fehlern wird so zur charmanten Ruine und nicht zum Strafbild.

## 5. Die Bauszene

### Perspektive: Seitenansicht (2D, Raster)
- Seitenansicht statt Isometrie: einfacher zu bedienen, einfacher zu zeichnen, und Burgen wirken von der Seite am stärksten.
- Raster mit **12 × 8 Zellen**, passend zu ca. 15 Bauteilen pro Burg. Bei 20 Aufgaben ist das Raster entsprechend größer (z. B. 14 × 9). Die Zellen sind **groß**, damit sie auf dem Tablet gut mit dem Finger zu treffen sind.
- **Schwerkraft-Regel:** Ein Block braucht einen Block oder den Boden darunter. Das ist intuitiv („wie Bauklötze“) und verhindert schwebende Burgen.
- Das gewählte Bauteil wird per **Drag & Drop oder Antippen** gesetzt. Gültige Zellen leuchten auf, ungültige werden rot.
- **Rückgängig** ist nur für das zuletzt gesetzte Teil möglich, solange die nächste Aufgabe noch nicht begonnen hat.
- Startszene: leere Wiese mit Hügel, Himmel, ein paar Wolken.

### Damit Teile nahtlos zusammenpassen

Drei Techniken kombiniert, statt jede Kombination einzeln zu zeichnen:

1. **Textur in Weltkoordinaten**
   Das Mauerwerk (Steinfugen) wird nicht pro Block gezeichnet, sondern aus einer großen, kachelbaren Steintextur ausgeschnitten, passend zur **Position in der Welt**. Nebeneinanderliegende Blöcke setzen das Fugenmuster also automatisch fort, und die Mauer wirkt wie *ein* Stück.

2. **Autotiling über Nachbar-Bitmaske**
   Jeder Block prüft seine 4 Nachbarn (oben, rechts, unten, links) → 4-Bit-Wert (0–15). Daraus folgt, welche **Ränder** gezeichnet werden: Außenkontur und Schattenkante erscheinen nur dort, wo kein Nachbar ist. Zwischen zwei Blöcken verschwindet die Kante, sie verschmelzen.

3. **Automatische Abschlüsse und Andockpunkte**
   - Ein Mauerblock ohne Block darüber bekommt automatisch **Zinnen**.
   - Gestapelte Turmblöcke ergeben einen Turm. Ein Dach setzt man nur auf den obersten Turmblock.
   - Dekorationen haben **Andockpunkte** (Fahne → Turmspitze/Zinnen, Balkon → Mauerseite mit freier Luft davor, Fackel → Mauerfront) und rasten dort ein.

**Rendering pro Block in Schichten:**
```
1. Grundtextur (Weltkoordinaten-Ausschnitt)
2. Zustands-Overlay (bei beschädigten Teilen: Risse, Loch, Moos, Flicken)
3. Kanten-Overlay (abhängig von Bitmaske; bei Bröckelmauer unregelmäßige Kante)
4. Automatischer Abschluss (Zinnen, falls oben frei; bei Beschädigung: abgebrochene Zinnen)
5. Dekorationen an Andockpunkten
```
→ Beschädigte Teile brauchen **keine eigene Textur**, nur zusätzliche Overlays. Sie fügen sich so automatisch in eine intakte Mauer ein.
→ Pro Material (Stein, Holz, Gold) genügen **1 Textur + 4 Kantenstücke + 1 Zinnenstück**, dazu einige Schadens-Overlays.

## 6. Profile

Auf einem Schulgerät spielen viele Kinder. Jedes Kind hat deshalb ein eigenes, einfaches Profil.

- **Profil = Symbol + Spitzname.** Symbole sind z. B. Tiere oder Wappen (Fuchs, Eule, Drache, Löwe …), jedes Symbol nur einmal pro Gerät. So finden sich auch Kinder, die noch nicht sicher lesen, schnell selbst.
- **Profilauswahl** als Startbildschirm: großes Raster aus Symbolen mit Namen darunter. Antippen genügt.
- **Kein Passwort.** Optional (Lehrkraft-Einstellung, standardmäßig aus): ein **Bild-Code** aus 2 Symbolen, falls Kinder sich gegenseitig in fremden Profilen weiterbauen.
- **Anlegen:** durch die Lehrkraft (ganze Klasse auf einmal, Namen einfügen) oder, falls erlaubt, durch das Kind selbst über „Ich bin neu“.
- Bis zu **30 Profile** pro Gerät (eine Klasse).
- **Pro Profil gespeichert:** laufende Burg, eigene Burg-Sammlung, Lernfortschritt der Wörter, optional eine eigene Wortliste (für Kinder, die mehr Förderung oder mehr Herausforderung brauchen).
- **Datenschutz:** nur Spitzname oder Vorname, alles bleibt lokal auf dem Gerät, kein Server.

## 7. Burg-Sammlung

- Nach der letzten Aufgabe: kurze „Burg fertig!“-Szene, danach gibt das Kind **einen Namen für die Burg** ein (z. B. „Lenas Drachenburg“). Das ist freiwillig, sonst wird ein Name vorgeschlagen.
- Die Burg wird in der **Sammlung des Profils** gespeichert, mit Name und Datum.
- **Keine Sterne, Punkte oder Ranglisten.** Die Burg selbst ist die Bewertung: Wer viel richtig hatte, hat eine prächtigere Burg. Der Antrieb soll sein, **die nächste Burg schöner zu bauen** als die letzte.
- Die Sammlung ist eine **Galerie**: Vorschaubilder, antippen → Burg in voller Größe ansehen (nur anschauen, nicht verändern).
- **Standardansicht:** Beim Öffnen der Sammlung werden die **Burgen des aktuellen Profils** angezeigt.
- **Button „Alle Burgen“:** wechselt zur Sammlung aller Profile auf dem Gerät. Jede Burg zeigt dort das Profil-Symbol und den Spitznamen des Kindes. Ein Button „Meine Burgen“ führt zurück. Kinder vergleichen über das Aussehen, nicht über Zahlen. Die Lehrkraft kann den Button „Alle Burgen“ ausblenden.
- Gespeichert werden die **Rasterdaten** (welches Teil wo), nicht Bilder. Die Vorschau wird beim Anzeigen neu gezeichnet. Das spart Speicher und funktioniert auch nach Grafik-Updates.
- Die Lehrkraft kann die Sammlung leeren und einzelne Burgen löschen (z. B. am Schuljahresende).
- Obergrenze: z. B. 30 Burgen pro Profil, danach wird beim Speichern gefragt, welche alte Burg weichen soll (oder die älteste wird ersetzt).

## 8. Lehrkraft-Einstellungen

Erreichbar über einen **gesicherten Zugang**, damit Kinder sie nicht versehentlich öffnen (z. B. Zahnrad 3 Sekunden gedrückt halten, dann eine einfache Rechenaufgabe wie 7 × 8).

- **Profile verwalten:** anlegen (einzeln oder als Liste), umbenennen, löschen; „Kinder dürfen selbst Profile anlegen“ ja/nein; Bild-Code an/aus
- Aktive Wortliste (= Klassenstufe) für das Gerät, optional abweichend pro Profil
- Eingabemodus überschreiben (Bausteine / Tastatur)
- Aufgaben pro Burg (10 / 15 / 20)
- Großschreibung verpflichtend ja/nein
- Vorlesen an/aus, Sound an/aus
- Eigene Wortliste importieren (CSV)
- Sammlungen verwalten; Button „Alle Burgen“ ein-/ausblenden
- Übersicht pro Profil: Wörter, die oft falsch sind (nur für die Lehrkraft sichtbar, Ausbaustufe)
- Alles zurücksetzen (z. B. am Schuljahresende)
- Backup: alle Daten des Geräts als Datei exportieren und wieder einspielen, z. B. vor einem Geräte-Reset (Ausbaustufe)

## 9. Grafiken

Empfohlener Weg in drei Stufen:

1. **Prototyp:** farbige Rechtecke und einfache, von Claude Code gezeichnete **SVG-Formen**. Beschädigte Teile zunächst nur als Variante mit anderer Farbe bzw. Riss-Linie. Damit lassen sich Spielmechanik und Autotiling testen, bevor Grafikarbeit anfällt.
2. **Einheitlicher Stil:** Flache Vektorgrafik (SVG) mit fester Farbpalette und dicker Kontur, kindgerecht und gut von Code erzeugbar. Weil das Autotiling nur wenige Einzelteile braucht, ist der Umfang überschaubar.
3. **Optional ersetzen/ergänzen:**
   - Freie Asset-Pakete (CC0), z. B. von **Kenney.nl** oder **OpenGameArt.org**; Lizenz jedes Pakets prüfen.
   - Bezahlte Pakete auf **itch.io** (mittelalterliche 2D-Tilesets).
   - Eigene Zeichnungen oder KI-Bildgenerierung. KI-Bilder sind schwer stilistisch einheitlich zu halten und müssen auf das Raster nachbearbeitet werden.

Wichtig: Das **Raster- und Overlay-System zuerst festlegen**, dann Grafiken passend dazu erstellen bzw. auswählen, nicht umgekehrt. Fremde Asset-Pakete enthalten selten beschädigte Varianten. Die Schadens-Overlays werden deshalb voraussichtlich selbst gezeichnet.

Wort-Bilder (Hund, Katze …): einheitliches Icon-Set, z. B. OpenMoji (CC BY-SA) oder selbst erzeugte SVGs.

## 10. Technik-Stack

| Bereich | Wahl | Begründung |
|---|---|---|
| Sprache | **TypeScript** | Typsicherheit für Spiellogik, Claude Code arbeitet damit sehr gut |
| Build | **Vite** | schneller Dev-Server, einfacher statischer Build |
| Bauszene | **Phaser** (2D-Framework) | Sprites, Drag & Drop, Tweens, Partikel (Belohnungseffekte), Touch-Support, Asset-Loader; leichtgewichtig im Vergleich zu einer Engine |
| Aufgaben-UI | **HTML/CSS-Overlay** (optional Svelte oder Preact) | Texteingabe, Umlaute, große Buttons, Barrierefreiheit gehen im DOM besser als im Canvas |
| Sprache/Audio | Web Speech API (`speechSynthesis`, `de-DE`), kurze Sound-Effekte | keine Server nötig |
| Speicherung | **IndexedDB** (z. B. über `idb-keyval`) | Profile, Sammlungen, laufende Burgen, Lernfortschritt, Einstellungen; kein Konto, kein Server, nur Spitznamen lokal (DSGVO, Schule) |
| Offline | **PWA** (vite-plugin-pwa) | läuft im Klassenzimmer auch bei schlechtem WLAN, auf Tablets installierbar |
| Tests | **Vitest** (Logik), **Playwright** (E2E) | Pluralprüfung, Angebots-Logik, Autotiling-Bitmaske sind reine Funktionen und gut testbar |
| Hosting | GitHub Pages / Netlify / Cloudflare Pages | statische Dateien, kostenlos |

### Warum keine große Game-Engine (Godot/Unity)?
- Das Spiel ist ein **Raster-Baukasten mit Formular-Eingabe**, ohne Physik, 3D oder komplexe Echtzeit-Logik.
- Web-Exporte von Unity/Godot sind groß (zehn bis mehrere zehn MB), laden auf Schul-Chromebooks und iPads langsam und haben auf iOS-Safari häufiger Probleme. Für eine **Pausenbeschäftigung** zählt schnelles Laden besonders.
- Engines sind editor-zentriert (Szenen-Dateien, Inspector). **Claude Code ist am stärksten bei reinem Code**, und Phaser + TypeScript ist komplett textbasiert.
- Texteingabe mit Umlauten ist in Canvas-Engines umständlich, im DOM trivial.

→ **Phaser** ist der Mittelweg: genug Spiel-Werkzeuge für die Szene, ohne den Ballast einer Engine.
(Alternative ganz ohne Framework: PixiJS oder reines Canvas. Das ist machbar, aber dann müssen Drag & Drop, Szenenverwaltung und Tweens selbst gebaut werden.)

### Projektstruktur (Vorschlag)
```
burgbau/
├─ CLAUDE.md                  # Projektregeln für Claude Code
├─ specification.md
├─ public/assets/             # SVG/PNG, Sounds
├─ src/
│  ├─ main.ts
│  ├─ data/wordlists/         # klasse-1-2.json, klasse-3.json, klasse-4.json
│  ├─ data/pieces.ts          # Bauteil-Katalog (Kategorie, Zustand, Andockpunkte)
│  ├─ logic/                  # reine, getestete Logik – KEIN Phaser-Import
│  │  ├─ plural.ts            # Antwortprüfung
│  │  ├─ wordPicker.ts        # Auswahl + Wiederholung falscher Wörter
│  │  ├─ offers.ts            # Serie/Antwort → 3 Bauteil-Angebote
│  │  ├─ grid.ts              # Raster, Schwerkraft-Regel, gültige Zellen
│  │  ├─ autotile.ts          # Nachbar-Bitmaske, Abschlüsse
│  │  └─ csvImport.ts         # eigene Wortlisten
│  ├─ state/                  # Profile, laufende Partie, Sammlung, Fortschritt, Einstellungen (IndexedDB)
│  ├─ ui/                     # HTML-Overlay (Profilauswahl, Aufgabe, Angebote, Sammlung, Einstellungen)
│  └─ scene/                  # Phaser-Szenen (Bauen, Burg-Ansicht)
└─ tests/
```
Grundsatz: **Spiellogik strikt von Darstellung trennen.** Alles in `logic/` ist ohne Browser testbar. Die Burg in der Sammlung wird mit derselben Render-Logik gezeichnet wie beim Bauen.

## 11. Umsetzungsphasen (für Claude Code)

| Phase | Inhalt | Ergebnis |
|---|---|---|
| 1 | Projekt-Setup, eine Wortliste mit 30 Wörtern, Tastatur-Modus, Antwortprüfung + Tests | spielbares Quiz ohne Burg |
| 2 | Phaser-Szene mit Raster, Platzieren von Rechteck-Blöcken, Schwerkraft-Regel | Bauen funktioniert |
| 3 | „1 aus 3“-Angebote, Serie, beschädigte Teile (vorerst als Farbvariante), Partie mit X Aufgaben | vollständige Kernschleife |
| 4 | Autotiling (Bitmaske, Kanten, Zinnen), Weltkoordinaten-Textur, Schadens-Overlays, Dekorationen mit Andockpunkten | Teile verschmelzen |
| 5 | Profile (Auswahl, Anlegen), Burg fertig → Name → Sammlung pro Profil, „Alle Burgen“-Galerie, Speichern und Fortsetzen | mehrere Kinder pro Gerät |
| 6 | Drag-&-Drop-Endungsmodus, Vorlesen, Wortlisten Klasse 1/2, 3, 4, Lernfortschritt pro Profil | didaktisch komplett |
| 7 | Lehrkraft-Einstellungen (inkl. Profilverwaltung), CSV-Import, PWA | einsatzbereit im Unterricht |
| 8 | Echte Grafiken, Sounds, Animationen | schön |

Jede Phase in Claude Code einzeln anstoßen und vor der nächsten testen.

## 12. Spätere Ideen (nicht im MVP)
- **Reparieren:** Bei einer Serie von z. B. 5 darf ein beschädigtes Teil statt eines neuen Teils repariert werden.
- **Wettereffekte** in der fertigen Burg-Ansicht (Regen, Sonnenuntergang).
- **Klassen-Galerie:** Burgen aller Geräte auf der interaktiven Tafel zeigen (bräuchte Export/Import oder einen Server).
- Weitere Grammatik-Module mit gleichem Bausystem (Artikel der/die/das, Verben konjugieren).
- Burgbewohner, die in der fertigen Burg herumlaufen.
- Burg als Bild exportieren/ausdrucken („Urkunde“).

## 13. Entscheidungen
- Falsche Antwort → Auswahl aus **3 beschädigten** Teilen.
- **Profilsystem** mit Symbol + Spitzname, Sammlung und Lernfortschritt pro Profil.
- **Keine Sterne oder Punkte.** Motivation entsteht über das Aussehen der Burg.
- Sammlung zeigt standardmäßig die **eigenen Burgen**, ein Button wechselt zu **allen Burgen**.
- Kinder spielen immer auf **demselben Gerät**. Profile müssen nicht zwischen Geräten übertragen werden. Ein Export/Import ist nur als **Backup** vorgesehen (Ausbaustufe, siehe Lehrkraft-Einstellungen).

### Phase 1 (2026-11-01)
- **Bildschirmleiste:** Steht der Cursor am Wortanfang, zeigt und fügt sie **Ä Ö Ü** ein, sonst **ä ö ü**. **ß** ist immer klein.
- **Großschreibung verpflichtend:** Ist nur die Groß-/Kleinschreibung falsch, gibt es im ersten Versuch „Fast! Nomen schreibt man groß!“, im zweiten Versuch zählt die Antwort als falsch.
- **Fast richtig:** Der Levenshtein-Abstand wird ohne Rücksicht auf Groß-/Kleinschreibung berechnet.
- **Lösungsanzeige:** Hervorgehoben werden Umlaut und Endung der ersten Pluralform. Formen außerhalb der fünf Muster (z. B. Museen) erscheinen ohne Hervorhebung.
- Bis Phase 6 laufen auch Listen mit `inputMode: "tiles"` im Tastatur-Modus.
- In Phase 1 läuft das Quiz endlos: Nach dem letzten Wort wird neu gemischt. Das Wiederholen falscher Wörter kommt mit der Partie (Phase 3).

### Phase 2 (2026-11-01)
- **Ablauf:** Nach dem Feedback („Weiter“) liegt ein Block in der **Ablage** oben links. Das Kind tippt eine leuchtende Zelle an oder zieht den Block dorthin. Danach erscheinen „Rückgängig“ und „Nächstes Wort“. Erst „Nächstes Wort“ macht den Block endgültig. Bis Phase 3 gibt es nur einen Platzhalter-Block, unabhängig von der Antwort.
- **Gültig/ungültig:** Alle gültigen Zellen leuchten gelb. Rot wird nur die Zelle unter dem Finger bzw. der Maus, wenn sie ungültig ist, oder kurz nach dem Antippen bzw. Loslassen auf einer ungültigen Zelle. Das Raster wird nie großflächig rot.
- **Rasterdaten:** Reihe 0 ist die unterste Reihe (auf der Wiese). Der Hügel ist nur Hintergrund, die Schwerkraft gilt allein im Raster.
- **Raster voll:** Gibt es keine gültige Zelle mehr, wird das Setzen übersprungen.
- **Welt:** Zellmaß 96 Weltpixel, darüber 144 px Himmel (Ablage), darunter 72 px Wiese (`src/data/grid.ts`). Phaser skaliert die Welt passend auf den Bildschirm. Rechnerisch sind die Zellen damit auf 1366 × 680 (Chromebook) und auf dem iPad im Hoch- und Querformat mindestens 64 px groß. Für 1280 × 800 prüft das ein E2E-Test.
