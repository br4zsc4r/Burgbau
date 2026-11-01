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

Die Klassenstufe wird **nicht** separat eingestellt, sondern über die **eingeschalteten Wortlisten**. Die Lehrkraft schaltet eine oder mehrere Listen ein. Ihre Wörter kommen gemeinsam für alle Kinder des Geräts dran.

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
- `stem`: optional, Pluralstamm, wenn er sich vom Singular unterscheidet (`Museum` → `Muse` + `en`, `Bus` → `Buss` + `e`). `pattern` und `umlaut` beziehen sich dann auf diesen Stamm. Solche Wörter gibt es nur im Tastatur-Modus.
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
| Richtig, Serie 5–7 | 1 Grundbauteil + 1 Dekoration + 1 Abschluss (Dach/Zinnen) |
| Richtig, Serie 8+ | 1 **Premium-Teil** + 1 Grundbauteil + 1 Dekoration oder Abschluss |

- **Serie (Streak):** Anzahl richtiger Antworten in Folge. Eine falsche Antwort **halbiert** die Serie (abgerundet), statt sie auf 0 zu setzen.
- Die Serie wird sichtbar angezeigt (z. B. als Fackeln, die nacheinander aufleuchten), damit Kinder den Zusammenhang „mehr richtig in Folge → schönere Teile“ verstehen.
- Die drei Angebote sollen sich unterscheiden (keine drei gleichen Teile).
- **Umgebungsteile** (Baum, Brunnen, Wassergraben, Zugbrücke): Bei richtigen Antworten kann ab und zu ein Grundbauteil durch ein Umgebungsteil ersetzt werden (siehe Abschnitt 13, Vorgaben für Phase 4).

### Seltenheit (seit Phase 8)
Je cooler ein Teil, desto seltener ist es. Eine Stufe kommt erst ab ihrer Serie in den Topf und wird dann seltener gezogen als die gewöhnlichen Teile.

| Stufe | ab Serie | Gewicht | Karte |
|---|---|---|---|
| gewöhnlich | 0 | 12 | normal |
| selten | 5 | 4 | blauer Schimmer |
| episch | 8 | 2 | lila Schimmer |
| legendär | 10 | 1 | goldener Schimmer mit Lichtstreifen |

- Gezogen wird pro Angebotsplatz in zwei Schritten: erst eine Stufe nach Gewicht (nur Stufen, die gerade Teile haben), dann gleich verteilt ein Teil daraus. So bleibt Legendäres selten, egal wie viele Teile es gibt. Am Premium-Platz (nur episch und legendär) ist ein legendäres Teil damit etwa jedes dritte Mal dabei.
- Große Teile behalten zusätzlich ihre Mindest-Serie; es gilt die höhere der beiden Schwellen.
- Die Karte zeigt die Stufe nur über Farbe und Schimmer, ohne Text, Zahlen oder Sterne. Bei „Bewegung reduzieren“ entfällt der Lichtstreifen.
- Beschädigte Teile sind immer gewöhnlich.

### Bauteil-Katalog
| Kategorie | Beispiele |
|---|---|
| Grundbauteile | Mauerblock, Turmblock, Tor, Mauer mit Fenster, große Varianten; *selten:* Buntglasfenster, Tor mit Fallgitter, Burgbogen |
| Abschlüsse | ~~Zinnen~~ (automatisch), Spitzdach, Kegeldach, hohes und großes Dach; *selten:* goldenes Dach, Glockenturm |
| Dekorationen | Fahne, Wimpel, Balkon (mit Tür), Wappen, Fackel, Efeu, Blumenkasten, Holztreppe; *selten:* Bannerfahne |
| Premium | *episch:* Drache, Riesenfahne, Funkelkristall, Burggespenst, Schatztruhe; *legendär:* Feuerdrache, Windmühle, Heißluftballon, Sternwarte, Einhorn |
| Umgebung | Baum, Brunnen, Wassergraben, Zugbrücke, Fässer und Kisten; *selten:* Springbrunnen |
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
- **Große Teile** (z. B. 2 × 1, 1 × 2, 2 × 2 Zellen) brauchen nur unter **einer** ihrer Spalten Halt. So lassen sich Überhänge bauen (siehe Abschnitt 13, Vorgaben für Phase 4).
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
   - Gestapelte Turmblöcke ergeben einen Turm. Dächer dürfen überall stehen, wo die Schwerkraft-Regel es erlaubt (auf Türmen, Mauern oder dem Boden).
   - Dekorationen haben **Andockpunkte** (Fahne → Turmspitze/Zinnen, Balkon → Mauerseite mit freier Luft davor, Fackel → Mauerfront, Efeu → Mauer- oder Turmblock, Blumenkasten → Fenster) und rasten dort ein. Sie werden an **bestehende Bauteile** gesetzt und belegen keine eigene Zelle.

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
- **Pro Profil gespeichert:** laufende Burg, eigene Burg-Sammlung, Lernfortschritt der Wörter. Gezielte Förderung entsteht über den Lernfortschritt: Jedes Kind übt vor allem seine Problemwörter. Eigene Wortlisten pro Kind gibt es nicht (Entscheidung 2026-11-01).
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

Erreichbar über einen **gesicherten Zugang**, damit Kinder sie nicht versehentlich öffnen: Zahnrad antippen, dann eine **PIN** der Lehrkraft eingeben.

- **Profile verwalten:** anlegen (einzeln oder als Liste), umbenennen, löschen; „Kinder dürfen selbst Profile anlegen“ ja/nein; Bild-Code an/aus
- Wortlisten ein- und ausschalten (= Klassenstufe), Listen anlegen und bearbeiten
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

**Umsetzung (Phase 8):** Stufe 2 ist umgesetzt. Alle Spielgrafiken erzeugt ein Generator in `scripts/art/` (`npm run art`) als SVG nach `public/assets/art/`. Feste Palette in `scripts/art/palette.ts`, Kontur 4 px, Licht von links oben. Wort-Bilder kommen von OpenMoji (siehe Abschnitt 13, Phase 8).

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
| 4a | Große Teile (2 × 1, 1 × 2, 2 × 2) mit Überhängen, Dekorationen mit Andockpunkten an bestehenden Teilen, Umgebungsteile, Fortschrittsanzeige | abwechslungsreich bauen |
| 4b | Autotiling (Bitmaske, Kanten, Zinnen), Weltkoordinaten-Textur, Schadens-Overlays | Teile verschmelzen |
| 5 | Profile (Auswahl, Anlegen), Burg fertig → Name → Sammlung pro Profil, „Alle Burgen“-Galerie, Speichern und Fortsetzen | mehrere Kinder pro Gerät |
| 6 | Drag-&-Drop-Endungsmodus, Vorlesen, Wortlisten Klasse 1/2, 3, 4, Lernfortschritt pro Profil | didaktisch komplett |
| 7 | Lehrkraft-Einstellungen (inkl. Profilverwaltung), CSV-Import, PWA | einsatzbereit im Unterricht |
| 8 | Echte Grafiken, Sounds, Animationen | schön |
| 9a | Umbau: Schnittstelle „Spielart“, die Mehrzahl wird die erste Spielart; allgemeine Aufgaben-IDs, Migrationen, Mechanismus für exklusive Bauteile (siehe Abschnitt 14) | alles wie vorher, bereit für weitere Spielarten |
| 9b | Kleines 1×1 (Malaufgaben, Ziffernfeld, Vorlesen), Spielart-Wahl bei „Neue Burg bauen“, Lehrkraft: Reihen und Spielarten fürs freie Spiel | zweite Spielart spielbar |
| 9c | Übungspakete der Lehrkraft (auch gemischt), Einstellung „Kinder dürfen frei spielen“ | Lehrkraft steuert, was drankommt |

Jede Phase in Claude Code einzeln anstoßen und vor der nächsten testen.

## 12. Spätere Ideen (nicht im MVP)
- **Reparieren:** Bei einer Serie von z. B. 5 darf ein beschädigtes Teil statt eines neuen Teils repariert werden.
- **Wettereffekte** in der fertigen Burg-Ansicht (Regen, Sonnenuntergang).
- **Klassen-Galerie:** Burgen aller Geräte auf der interaktiven Tafel zeigen (bräuchte Export/Import oder einen Server).
- Weitere Spielarten mit gleichem Bausystem, z. B. Artikel der/die/das, Verben konjugieren, Uhrzeit, Geteilt-Aufgaben (Rahmen siehe Abschnitt 14).
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

### Phase 3 (2026-11-01)
- **Ablauf:** Feedback → „Weiter“ → „Such dir ein Bauteil aus!“ (drei große Karten mit Bild und Namen) → setzen → „Rückgängig“ oder „Nächstes Wort“. Bei der letzten Aufgabe heißt der Button „Burg fertig!“. Danach erscheint „Deine Burg ist fertig!“ mit „Neue Burg bauen“. Name und Sammlung folgen in Phase 5.
- **Serie:** Sie zählt die aktuelle Antwort mit, die erste richtige Antwort ergibt also Serie 1. „Fast“ ändert die Serie nicht, richtig im zweiten Versuch zählt als richtig. Angezeigt wird sie als **10 Fackeln** am unteren Rand. Ab der zehnten Fackel gibt es Premium-Teile.
- **Serie 10+:** 1 Premium-Teil + 1 Grundbauteil + 1 Dekoration oder Abschluss.
- **Weiterbauen immer möglich:** Jedes Angebot enthält mindestens ein Teil, auf das man bauen kann, auch bei drei beschädigten Teilen.
- **Stapelbar:** Grundbauteile, Buntglasfenster und beschädigte Mauer- und Turmteile. Auf Abschlüsse, Dekorationen und die übrigen Premium-Teile kann man nichts setzen. Bis zu den Andockpunkten (Phase 4) belegt jedes Teil eine Zelle und folgt der Schwerkraft-Regel.
- **Umgebungsteile** (Baum, Brunnen, Wassergraben, Zugbrücke) werden in Phase 3 noch nicht angeboten. Ab Phase 4 gilt die Vorgabe unten.
- **Beschädigte Teile:** Grafik des Basisteils, multiplikativ eingefärbt mit einer eigenen Farbe je Teil, dazu ein gemeinsames Riss-und-Moos-Overlay. In der Szene läuft das über Phasers `setTint`, auf den Karten über einen SVG-Farbmatrix-Filter, damit beides gleich aussieht. Bei beschädigten Angeboten steht der Hinweis: „Diesmal sind die Teile etwas bröckelig. Mit richtigen Antworten werden sie wieder schön!“
- **Wortauswahl:** Ein falsch beantwortetes Wort kommt 3–5 Aufgaben später wieder. Sind mehrere fällig, kommt das älteste zuerst. Wiederholungen, die nach dem Partie-Ende fällig wären, entfallen. Ist die Liste kürzer als die Partie, dürfen Wörter wiederkommen, aber nie direkt hintereinander.
- **Raster:** 12 × 8 bei 10 und 15 Aufgaben, 14 × 9 bei 20 Aufgaben.

### Vorgaben für Phase 4 (2026-11-01, Rückmeldung nach Phase 3)
- **Umgebungsteile im Angebot:** Bei einer richtigen Antwort kann ein Grundbauteil zufällig (etwa jedes 4. Mal) durch ein Umgebungsteil ersetzt werden. Mindestens ein Teil zum Weiterbauen bleibt immer im Angebot. Bei falschen Antworten gibt es keine Umgebungsteile.
- **Umgebungsteile stehen nur auf dem Boden** (unterste Reihe). Darauf kann man nichts bauen.
- **Dekorationen docken an bestehende Bauteile an**, statt eine eigene Zelle zu belegen:
  - **Efeu** ist Bewuchs und passt auf jeden Mauer- oder Turmblock, auch auf beschädigte.
  - **Blumenkasten** passt nur an Bauteile mit Fenster (Mauer mit Fenster, Buntglasfenster). Die Grafik sitzt genau unter dem Fenster, sodass beide wie ein Teil wirken.
  - **Wappen, Fackel und Balkon** sind Front-Dekorationen an Mauer- oder Turmblöcken. **Fahne und Wimpel** kommen auf Turmspitze oder Zinnen (Abschnitt 5).
  - **Pro Bauteil** sind höchstens ein Bewuchs (Efeu) und eine Front-Dekoration erlaubt. Beispiel: Mauer mit Fenster + Blumenkasten + Efeu.
  - Die Grafiken werden so gezeichnet, dass Dekorationen an ihren Andockpunkten sauber auf dem Bauteil sitzen.

**Ergänzung: große Teile und Fortschrittsanzeige (2026-11-01)**
- **Große Teile:** Mauer 2 × 1 (für Überhänge), Turm 1 × 2, Spitzdach 1 × 2, Mauer 2 × 2 und Burgtor 2 × 2. Ein großes Teil zählt als **ein** Bauteil, also als eine Aufgabe.
- **Schwerkraft für große Teile:** Alle Zellen des Teils müssen frei sein. Halt braucht es nur unter einer seiner Spalten, also Boden oder ein Teil, auf dem man bauen kann. Überhänge sind damit erlaubt. Auf großen Mauer- und Turmteilen kann man weiterbauen, auf dem großen Spitzdach nicht.
- **Angebot nach Serie:** Bei richtiger Antwort kann ein Teil im Angebot durch seine große Variante ersetzt werden:
  - **Zwei-Zellen-Teile** ab Serie 1 (Mauer 2 × 1, Turm 1 × 2), das Spitzdach 1 × 2 ab Serie 5, weil Abschlüsse erst ab dann angeboten werden.
  - **2 × 2-Teile** (Mauer, Burgtor) ab Serie 5.
  - Startwerte für die Häufigkeit: etwa jedes 3. Angebot enthält ein großes Teil. Nach dem Ausprobieren anpassen.
- **Große beschädigte Teile:** Bei falschen Antworten kann ebenso eines der drei Teile eine große bröckelige Variante sein (Bröckelmauer 2 × 1, Turmblock mit fehlender Ecke 1 × 2, Ruinenmauer 2 × 2). Die Größe richtet sich auch hier nach der Serie, die nach dem Halbieren übrig bleibt.
- **Andocken an große Teile:** Jede Zelle eines großen Mauer- oder Turmteils zählt wie ein eigener Block für Dekorationen. Ein Blumenkasten passt an ein großes Teil nur, wenn es ein Fenster hat.
- **Fortschrittsanzeige:** Eine Punkte-Leiste mit einem Punkt je Aufgabe (bei 15 Aufgaben also 15 Punkte). Ein Punkt füllt sich, sobald eine Aufgabe beendet ist, egal ob richtig oder falsch. Es wird nur der Fortschritt gezählt, nicht das Ergebnis. Die Leiste muss sich deutlich von den Fackeln unterscheiden, in Form und Position.

### Phase 4a (2026-11-01)
- **Rasterdaten:** Gespeichert werden gesetzte Teile mit ihrer Ankerzelle (unten links) und angedockte Dekorationen mit der Zelle, an der sie hängen. Es gibt keine Zelle-für-Zelle-Liste mehr.
- **Vorderseiten:** Mauern und Türme haben eine schlichte Vorderseite (Wappen, Fackel, Balkon, Bannerfahne). Mauer mit Fenster und Buntglasfenster haben eine Fenster-Vorderseite (Blumenkasten). Tore haben wegen der Tür keine Front-Dekoration, Efeu geht aber. Den Balkon „mit freier Luft davor“ behandle ich vereinfacht als Front-Dekoration.
- **Oben drauf:** Fahne, Wimpel, Zerrissene Fahne und Drache stecken auf Türmen (auch hohen und beschädigten) und auf Abschlüssen, nicht auf Mauern. Die Zelle darüber bleibt frei, dort weht die Fahne. Auch ein Überhang darf dort nicht hineinragen. In der obersten Reihe ragt die Fahne in den Himmel.
- **Setzen großer Teile:** Beim Antippen wird die getippte Zelle möglichst die untere linke des Teils, sonst wird passend verschoben. Beim Ziehen zählt die Lage des Teils unter dem Finger. Die Ablage zeigt große Teile verkleinert, beim Ziehen haben sie volle Größe. Unter dem Finger leuchtet die ganze Fläche des Teils auf.
- **Angebote passen immer:** Es werden nur Teile angeboten, die gerade irgendwo hinpassen. Eine Dekoration erscheint also erst, wenn es ein passendes Bauteil gibt. Passt in einer Kategorie nichts, kommt Ersatz: bei richtiger Antwort aus Grundbauteil, Dekoration, Abschluss oder Umgebung, bei falscher aus den beschädigten Teilen. Ein Premium-Teil ist nie Ersatz. Passen weniger als drei Teile, gibt es weniger Karten. Passt gar nichts mehr, wird das Setzen übersprungen.
- **Fortschritts-Leiste:** Runde Punkte oben in der Mitte, die Fackeln stehen unten. Ein Punkt füllt sich, sobald die Antwort feststeht.

### Phase 4b (2026-11-01)
- **Materialien:** Stein (Mauer, Tor, Fenster, Buntglas und ihre beschädigten Varianten) und Turmstein (alle Türme). Nur Blöcke aus **gleichem Material** verschmelzen. Zwischen Mauer und Turm bleibt die Kontur, damit der Turm als eigenes Bauwerk erkennbar ist. Dächer, Umgebung und Dekorationen nehmen am Autotiling nicht teil.
- **Weltkoordinaten-Textur:** Je Material gibt es eine kachelbare Textur von 2 × 2 Zellen. Jeder Block wird daraus passend zu seiner Weltposition ausgeschnitten (Phaser-TileSprite). Tür, Fenster und Schießscharte liegen als eigene Merkmal-Grafik darüber.
- **Kanten nach Bitmaske:** Kontur, Lichtkante (oben, links) und Schattenkante (unten, rechts) gibt es nur an Seiten ohne Nachbarn aus gleichem Material. Bröckelige Teile (Bröckelmauer, Steinhaufen, Ruinenmauer) haben gezackte Kanten. Die Kanten werden gezeichnet, nicht als Kantenstück-Grafiken geladen. Das ist für die Platzhalter einfacher und an den Ecken sauberer.
- **Automatische Zinnen:** Jede Mauerzelle ohne Teil darüber bekommt Zinnen, die in die freie Zelle darüber ragen. Beschädigte Mauern bekommen abgebrochene Zinnen. Türme bekommen keine automatischen Zinnen, sie werden mit Dächern abgeschlossen.
- **Schadens-Overlays statt Farbe:** Die Einfärbung aus Phase 3 entfällt. Jedes beschädigte Teil hat eigene Overlays je Zelle: Riss mit Moos, abgebröckelte Steine, Loch mit Vogelnest, Bretter-Flicken, Steinhaufen, fehlende Turmecke, fehlende Dachziegel, geflickte Fahne. Große beschädigte Teile mischen mehrere davon.
- **Vorschau-Karten** setzen Blöcke genauso zusammen (Textur als SVG-Muster, Merkmal, Schaden, Kontur).
- **Dächer dürfen überall stehen** (Entscheidung 2026-11-01): Die frühere Vorgabe „nur auf dem obersten Turmblock“ entfällt, damit die Kinder frei bauen können. Es gilt allein die Schwerkraft-Regel.

### Phase 5 (2026-11-01)
- **Profil-Symbole:** 30 Stück, nämlich 10 Tiere (Fuchs, Eule, Drache, Löwe, Bär, Katze, Hase, Frosch, Igel, Fisch) auf je drei Hintergrundfarben (Blau, Gelb, Rosa). Vergebene Symbole erscheinen beim Anlegen nicht mehr. Spitznamen sind auf 20 Zeichen begrenzt.
- **„Ich bin neu“** ist immer möglich, bis die Lehrkraft-Einstellung „Kinder dürfen selbst Profile anlegen“ in Phase 7 kommt.
- **Profilseite** nach dem Antippen: „Weiterbauen“ (falls eine Burg läuft), „Neue Burg bauen“, „Meine Burgen“, „Anderes Kind“. Läuft schon eine Burg, fragt „Neue Burg bauen“ nach, weil die angefangene Burg dann verworfen wird.
- **Pause-Knopf** oben links im Spiel führt zur Profilseite. Die Ablage für das nächste Teil ist dafür eine Zelle nach rechts gerückt.
- **Burg fertig:** Das Namensfeld zeigt einen Vorschlag „<Spitzname>s <Tier>burg“ (z. B. „Lenas Fuchsburg“, bei s/ß/x/z mit Apostroph: „Max’ Drachenburg“). Bleibt das Feld leer, gilt der Vorschlag. Danach öffnet sich „Meine Burgen“.
- **Volle Sammlung (30 Burgen):** Die älteste Burg wird automatisch ersetzt. Die Spezifikation erlaubt beides, die automatische Variante kommt ohne zusätzliche Frage aus.
- **Speicherung:** IndexedDB über `idb-keyval` (Datenbank „burgbau“). Die Datensätze `profiles`, `game:<Profil-ID>` und `castles:<Profil-ID>` haben jeweils `version`, Migrationen stehen in `src/state/migrations.ts`. Beim Laden fallen nur einzelne kaputte Teile oder Burgen weg, nie eine ganze Sammlung. Wörter, die es in der Liste nicht mehr gibt, werden in einer laufenden Burg ersetzt.
- **Ohne IndexedDB** (z. B. privates Fenster) läuft das Spiel im Speicher weiter, ein Hinweis sagt, dass nichts gespeichert wird.
- **Vorschaubilder:** Phaser zeichnet sie mit derselben Render-Funktion wie die Bauszene in eine Dynamic Texture (Viertel-Größe). Sie werden nur im Speicher zwischengespeichert, nicht dauerhaft. Die Vollansicht nutzt die Bauszene selbst, ohne Rasterlinien und ohne Eingabe.

### Phase 6 (2026-11-01)
**Wortlisten**
- **Umfang:** `klasse-1-2.json` hat 61 Wörter (Bausteine), `klasse-3.json` 82 Wörter mit vielen Umlauten (Bausteine; die Spezifikation erlaubt beide Modi), `klasse-4.json` 83 Wörter mit Sonderfällen (Tastatur). Alle Wörter stehen auf `verified: false` und müssen vor dem Einsatz gegen Duden/Wiktionary geprüft werden.
- **Bewusst weggelassen** wurden Wörter mit mehrdeutigem Plural (z. B. Mutter, Bank, Wort, Stock, Band, Hahn, Tuch, Virus). Bei anerkannten Doppelformen gelten beide: Pizzas/Pizzen, Globen/Globusse, Kakteen/Kaktusse, Taxis/Taxen.
- **Aktive Liste:** Kommt aus den Einstellungen (Standard Klasse 1/2). Bis zu den Lehrkraft-Einstellungen in Phase 7 ließ sie sich zum Ausprobieren über die Adresse wählen (`?liste=klasse-3`); seit Phase 7 nicht mehr.

**Bausteine-Modus**
- Das Wort steht als Bausteine da: „die“, die Buchstaben des Singulars, dahinter ein Endungsfeld. Die Endungen (-e, -er, -n, -en, -s, – für „keine Endung“) werden **angetippt oder ans Wort gezogen**. Pünktchen setzt man durch **Antippen eines Vokals** oder durch Ziehen des ¨-Bausteins auf den Vokal. Vokale sind eigene 64-px-Felder.
- „Keine Endung“ muss ausdrücklich gewählt werden, erst dann wird „Fertig“ aktiv.
- Die Prüfung ist dieselbe wie beim Tippen. Fehlende Pünktchen sind also „Fast!“ mit zweitem Versuch.
- Wörter mit eigenem Pluralstamm erscheinen auch in Bausteine-Listen im Tastatur-Modus.

**Vorlesen**
- Ein Lautsprecher-Knopf an der Wortkarte liest vor der Antwort „Wie heißt die Mehrzahl? der Hund.“ vor, danach Singular und Plural. Die Sprache ist `de-DE`, mit etwas langsamerem Tempo.
- Der Knopf erscheint nur, wenn der Browser tatsächlich **Stimmen** hat, nicht schon, wenn er die API nur anbietet. Lädt der Browser seine Stimmen erst später (z. B. Chrome), taucht der Knopf nachträglich auf. Bei ausgeschaltetem Vorlesen (Einstellung `readAloud`, Lehrkraft ab Phase 7) fehlt er ebenfalls.
- **Hinweis für Linux-Geräte:** Firefox-basierte Browser brauchen einen laufenden `speech-dispatcher` mit Sprachmodul (z. B. `speech-dispatcher-espeak-ng`). Bei Flatpak-Browsern muss der Dienst über die Socket-Unit erreichbar sein (`systemctl --user enable --now speech-dispatcher.socket`), weil die Sandbox ihn nicht selbst starten kann. Danach den Browser vollständig neu starten.

**Lernfortschritt**
- Fächer 0–4 je Wort und Profil, gespeichert als `progress:<Profil-ID>` (seit dem Nachtrag zu Phase 7 unabhängig von der Liste).
- Gezählt wird das Endergebnis jeder Aufgabe, auch bei Wiederholungen: richtig → ein Fach höher, falsch → Fach 0.
- Fach 0–2 gilt als „zu üben“. Neue Aufgaben kommen zu etwa 60 % aus diesen Wörtern, sonst aus neuen oder sicheren (Fach 3–4).

**Rückmeldung nach Phase 5 (Extras)**
- **Zinnen-Teil stillgelegt:** Es wird nicht mehr angeboten, weil Zinnen automatisch entstehen. In gespeicherten Burgen bleibt es darstellbar.
- **Oben drauf auch auf Mauern:** Fahne, Wimpel, Drache usw. stecken jetzt auch auf Mauern, und zwar auf deren automatischen Zinnen.
- **Dach-Garantie:** In den letzten 2 Aufgaben ist immer ein Dach im Angebot, nach richtiger Antwort Spitz-, Kegel- oder hohes Spitzdach, nach falscher das schiefe Dach. Es ersetzt nie ein Premium-Teil und nie das einzige Teil zum Weiterbauen.
- **Animierte Teile:** Feuerdrache (pustet Flammen), Riesenfahne (weht), Funkelkristall (glitzert), alle drei oben drauf, sowie die Windmühle (Flügel drehen sich; steht wie ein Dach, nichts darauf). ~~Ab **Serie 12** ist das Premium-Teil immer eines davon.~~ Seit Phase 8 regelt das die Seltenheit (Abschnitt 4). Sie bewegen sich in der Bauszene und auf den Angebotskarten. Vorschaubilder der Galerie sind Standbilder.
- **Zwischenspeicher:** Er ist unbegrenzt. Die Leiste steht links, im Hochformat unten. Beim Setzen kann man das Teil „In den Speicher“ legen; das zählt wie gesetzt und lässt sich rückgängig machen. Oder man tippt ein Speicher-Teil an und tauscht es gegen das gewählte.
- **Bearbeitungsmodus:** Nach dem Setzen (oder Ablegen) des letzten Teils geht es **automatisch** in den Bearbeitungsmodus. Antippen nimmt das oberste Ding einer Zelle auf, erst Fahne, dann Front-Deko, dann Efeu, dann das Teil. Was dadurch keinen Halt mehr hat, fällt samt Deko in den Speicher. Speicher-Teile lassen sich setzen, ein gehaltenes Teil kann zurück in den Speicher.
- **„Burg ist fertig“ erst, wenn alles gesetzt ist:** Es darf nichts in der Hand und nichts im Speicher liegen. Damit kein Kind festsitzt, gibt es eine Ausnahme: Passt keines der restlichen Speicher-Teile noch irgendwo hin, darf es trotzdem abschließen (Hinweis im Text), und die Reste entfallen.
- **Speicherformat:** Laufende Burgen haben jetzt Version 2 (Speicher und Lernfächer). Die Migration von Version 1 steht in `src/state/migrations.ts`.

**Rückmeldung nach Phase 6 (vor dem Commit)**
- **Türme aus demselben Stein wie die Mauern:** Turmteile unterscheiden sich nur durch ihre Schießscharten. Sie verschmelzen deshalb mit Mauern und bekommen wie diese automatisch Zinnen. Das ersetzt die Material-Trennung aus Phase 4b, Turm und Mauer passten farblich nicht zusammen.
- **Mehr 2 × 2-Teile:** Neu sind Großer Turm, Große Fenstermauer (vier Fenster; Blumenkästen passen), Großes Dach (ohne Fahne, die Spitze liegt zwischen zwei Zellen) und die Turmruine (beschädigt). Die Chance auf ein großes Teil im Angebot steigt von ⅓ auf 40 %.
- **Windmühle 2 × 2.**
- **Riesenfahne:** Sie weht nur über die Breite (scaleX). Mit zusätzlicher Drehung zeichnete Phaser 4 das Tuch fehlerhaft.

### Phase 7 (2026-11-01)
**Zugang und Wirkung**
- **Gesicherter Zugang:** ~~Zahnrad 3 Sekunden halten, dann Malaufgabe~~ – ersetzt durch eine PIN (siehe Nachtrag unten).
- **Wirkung:** Einstellungen werden sofort gespeichert und gelten nach „Fertig“; die App lädt dafür neu. Laufende Burgen behalten ihre Aufgabenzahl, neue Burgen nutzen die neue.
- Die vorübergehende Listenwahl über die Adresse (`?liste=`) entfällt.

**Einstellungen** (Standard in Klammern)
- Eingabemodus (wie in der Liste / Bausteine / Tastatur). Die Wortlisten werden seit dem Nachtrag eingeschaltet statt einzeln gewählt.
- Aufgaben pro Burg 10/15/20 (15), Großschreibung Pflicht (aus), Vorlesen (an).
- „Ich bin neu“ erlaubt (an), Bild-Code (aus), „Alle Burgen“ zeigen (an).
- Die Einstellung „Sound an/aus“ kam mit den Sounds in Phase 8 („Leise Töne bei Erfolgen“, an).

**Profile verwalten**
- **Klasse anlegen:** ein Spitzname pro Zeile, die Symbole werden der Reihe nach vergeben (höchstens 30).
- **Pro Profil:** umbenennen, Bild-Code ansehen und zurücksetzen, Burgen anzeigen und einzeln löschen, Sammlung leeren, Profil löschen. Beim Löschen fallen laufende Burg, Sammlung und Lernstand mit weg.

**Bild-Code**
- 9 Bilder (bekannte Bauteile), zwei davon in fester Reihenfolge. Dasselbe Bild zweimal ist erlaubt (81 Codes).
- Das Kind wählt den Code selbst beim ersten Anmelden, auch direkt nach „Ich bin neu“. Danach tippt es ihn beim Anmelden an. Ein falscher Code gibt einen freundlichen Hinweis und beliebig viele weitere Versuche.

**CSV-Import**
- Format `Artikel;Singular;Plural`, mehrere Plurale mit `|`, Datei in UTF-8. Kopfzeile und BOM werden übersprungen.
- Fehlerhafte Zeilen werden mit Zeilennummer und Grund gemeldet, der Rest wird importiert.
- Muster und Umlaut werden automatisch abgeleitet. Sonderfälle (Museum → Museen) bekommen einen Pluralstamm und laufen nur im Tastatur-Modus.
- Importierte Wörter gelten als geprüft (`verified: true`), weil die Lehrkraft sie verantwortet. Die Liste startet im Tastatur-Modus, die Einstellung „Eingabemodus“ kann das ändern.
- Wird eine eingeschaltete Liste gelöscht und ist danach keine mehr an, gilt wieder Klasse 1/2.

**20 Aufgaben (14 × 9)**
- Die Bauszene passt Welt und Hintergrund an die Rastergröße der gezeigten Burg an. Vorschaubilder nutzen das Layout der jeweiligen Burg, Burgen verschiedener Größe stehen also nebeneinander in der Galerie.
- Auf kleinen Bildschirmen (z. B. Chromebook 1366 × 680) sind die Zellen dann etwas kleiner als 64 px. Das ist der Preis für das größere Raster.

**PWA**
- `vite-plugin-pwa` im Modus generateSW mit automatischem Update. Alle Dateien der App werden vorab gespeichert (keine Laufzeitanfragen an fremde Server).
- Manifest mit App-Symbolen (192, 512, maskable). Ein E2E-Test prüft den Start ohne Netz.

**Nicht umgesetzt** (in Abschnitt 8 als Ausbaustufe markiert): Übersicht der oft falschen Wörter und Backup als Datei.

**Nachtrag zu Phase 7 (Rückmeldung, 2026-11-01)**
- **PIN statt Gedrückthalten und Rechenaufgabe:** Ein Tipp aufs Zahnrad öffnet die PIN-Abfrage. Beim ersten Mal legt die Lehrkraft eine PIN aus 4–8 Ziffern fest (zweimal eingeben). Im Lehrkraft-Bereich lässt sie sich ändern. Gespeichert wird nur ein SHA-256-Hash. Eine vergessene PIN lässt sich nur durch Löschen der Website-Daten zurücksetzen, was alle Profile und Burgen löscht; darauf weist der Dialog beim Festlegen hin.
- **Wortlisten ein- und ausschalten statt pro Kind zuweisen:** Jede Liste hat einen Schalter. Die Wörter aller eingeschalteten Listen kommen gemeinsam für alle Kinder dran; doppelte Wörter zählen einmal. Mindestens eine Liste bleibt an. Die Zuordnung einzelner Listen zu Kindern entfällt.
- **Eingabemodus bei mehreren Listen:** Bei „wie in der Wortliste“ gilt pro Wort der Modus der Liste, aus der es stammt.
- **Listen über die Oberfläche bearbeiten:** Neue Listen anlegen; Name, Eingabemodus und Wörter bearbeiten (hinzufügen, ändern, entfernen). Muster und Sonderfälle werden wie beim CSV-Import automatisch erkannt, fehlerhafte Zeilen werden markiert.
- **Mitgelieferte Listen** sind ebenfalls bearbeitbar; die bearbeitete Fassung ersetzt das Original („bearbeitet“), „Original wiederherstellen“ macht das rückgängig. Löschen geht nur bei eigenen Listen.
- **„geprüft“ pro Wort:** Im Editor gibt es dafür ein Häkchen; die Listenübersicht zeigt, wie viele Wörter noch ungeprüft sind. Damit lassen sich die mitgelieferten Wörter direkt in der App gegen Duden/Wiktionary abhaken. Selbst eingetragene oder geänderte Wörter gelten als geprüft.
- **Lernfortschritt** wird pro Wort geführt (nicht mehr pro Liste); ältere Stände werden beim Laden zusammengeführt.
- **Speicherformat:** Einstellungen Version 2 (`activeListIds` statt `wordListId`, mit Migration), PIN als eigener Datensatz `teacherPin`.

### Phase 8 (2026-11-01)
**Grafiken**
- **Generator statt Einzeldateien:** `scripts/art/*.ts` zeichnet alle Grafiken als SVG-Text aus gemeinsamen Bausteinen (Steine, Bögen, Fenster, Schindeln, Tuch, Flammen). `npm run art` schreibt sie nach `public/assets/art/`, dazu App-Icon und Favicon. Die erzeugten Dateien sind eingecheckt; die Platzhalter sind entfernt. Der Generator läuft mit Node direkt als TypeScript, ohne neue Abhängigkeit (die wenigen Node-Typen stehen in `scripts/node.d.ts`).
- **Maße unverändert:** 96 px je Zelle, kachelbare Steintextur 192 × 192, Zinnen 96 × 32. Fenster bleiben bei x 34–62 mit Unterkante 70, damit Blumenkästen passen.
- **Dächer schließen bündig ab:** Die Traufe liegt genau auf den Außenkanten des Teils darunter, die Kontur mittig auf der Zellgrenze wie bei den Blöcken.
- **Balkon mit Tür:** Hinter dem Geländer liegt eine Tür, damit der Balkon erreichbar ist.
- **Hintergrund:** Sonne, Wolken mit Schatten, zwei Hügelreihen mit Bäumchen auf der Kante, Wiese mit Blümchen.
- **Bewegte Teile:** Jedes hat eine Grundgrafik und eine bewegte Grafik `<id>-moving.svg`. Bewegungsarten: drehen (Windmühle), wehen (Riesenfahne), Feuer (Feuerdrache), funkeln (Kristall, Truhe, Einhorn), pendeln (Glocke, Fernrohr), schweben (Gespenst, Ballon), sprudeln (Springbrunnen). Die Sonderregel „ab Serie 12 immer ein animiertes Teil“ entfällt; das regelt jetzt die Seltenheit (Abschnitt 4).

**Neue Teile**
- **Holztreppe** (Dekoration, gewöhnlich): steht wie ein Dach auf dem Boden oder einem Block, steigt nach rechts an; darauf kann man nicht bauen.
- **Fässer und Kisten** (Umgebung, gewöhnlich).
- **Tor mit Fallgitter** (Grundbauteil, selten): Block mit hochgezogenem Eisengitter.
- **Burgbogen** (Grundbauteil 2 × 1, selten): Block mit Rundbogen, durch den man hindurchsieht. Die Szene spart die Textur dort aus (eigene Canvas-Textur je Lage im Fugenmuster) und zeichnet unter dem Bogen keine Kante. Er braucht wie alle großen Teile Halt unter mindestens einer Spalte und taugt so als Brücke.
- **Glockenturm** (Abschluss, selten, Dach): die Glocke pendelt.
- **Springbrunnen** (Umgebung, selten): das Wasser sprudelt.
- **Burggespenst** (Premium, episch, an glatter Vorderseite): schwebt sanft.
- **Schatztruhe** (Premium, episch, Boden): Gold funkelt.
- **Heißluftballon** (Premium, legendär, 1 × 2, steht wie ein Dach): schwebt.
- **Sternwarte** (Premium, legendär, Dach): das Fernrohr schwenkt.
- **Einhorn** (Premium, legendär, Boden): das Horn glitzert.
- Goldenes Dach, Bannerfahne und Buntglasfenster sind jetzt seltene Teile ihrer Kategorie statt Premium.

**Wort-Bilder**
- 161 von 226 Wörtern haben ein Bild von **OpenMoji 15.1.0** (CC BY-SA 4.0). `npm run words` lädt sie einmalig nach `public/assets/words/<Wort-ID>.svg` und trägt `image` in die Wortlisten ein. Zur Laufzeit gibt es keine Netzwerkanfragen.
- Nur eindeutige Bilder: Abstraktes (Thema, Problem, Woche …) und Missverständliches (Gabel: das Emoji zeigt Messer und Gabel) behält den Anfangsbuchstaben.
- Bearbeitete mitgelieferte Listen behalten die Bilder der Originalwörter; ein im Editor korrigiertes Wort behält sein Bild.
- Namensnennung: Abschnitt „Bildnachweis“ im Lehrkraft-Bereich und `public/assets/words/LIZENZ.md`.

**Töne**
- Im Browser erzeugt (Web Audio), keine Dateien. Bewusst leise (Lautstärke 0,12).
- Klänge: richtig (kleiner Dreiklang), „Fast!“ (ein leiser Ton), seltenes Teil im Angebot (Glitzern), Teil nehmen (Klick), Teil setzen („Plopp“), Burg fertig (kurze Fanfare). **Bei falschen Antworten bleibt es still.**
- Einstellung „Leise Töne bei Erfolgen“ (an). Ein fehlendes Feld in älteren Einstellungen bekommt den Standard, daher keine neue Speicherversion.
- Welche Ereignisse es gibt, leitet `logic/gameEvents.ts` rein aus „Zustand vorher → nachher“ ab.

**Animationen**
- Richtige Antwort: Die Wortkarte hüpft, ein kleiner Sternenregen geht von ihr aus.
- Burg fertig: Schild „Burg fertig!“ über der Burg und Konfetti, etwa 3,5 Sekunden. Es blockiert keine Eingabe; das Namensfeld ist sofort bedienbar.
- **Bewegung reduzieren** (`prefers-reduced-motion`): Bewegte Teile stehen auch in der Bauszene still; Sternenregen, Konfetti und Lichtstreifen entfallen.

**Nachtrag zu Phase 8 (Rückmeldung, 2026-11-01)**
- **Fahnen und Co. auf Dächern:** Oben angedockte Teile sitzen mit ihrem Fuß genau auf der Spitze des Teils darunter. Die Riesenfahne hat ihre Stange links (Fußpunkt x 16), sie wird deshalb so verschoben, dass die Stange auf der Spitze steht; das Tuch ragt in die Nachbarzelle.
- **Großes Dach (2 × 2):** Es trägt jetzt Fahne, Wimpel, Drache oder Kristall, aber nur einmal: angedockt wird an der linken oberen Zelle (`mountDx: 0`), gezeichnet auf der Spitze, also auf der Zellgrenze.
- **Spiegeln:** Unsymmetrische Teile (`mirror: true`: Holztreppe, Fahne, Wimpel, zerrissene Fahne, Riesenfahne, Drache, Feuerdrache, Efeu, Einhorn, Zugbrücke, Fässer und Kisten, Sternwarte) lassen sich vor dem Setzen mit einem Knopf ⇆ spiegeln. Ein neu gewähltes Teil ist nie gespiegelt; Rückgängig und Aufnehmen im Bearbeitungsmodus behalten die Richtung, Teile aus dem Speicher kommen ungespiegelt.
- **Speicherformat:** Gesetzte Teile haben optional `flipped: true` (Burgen bleiben Version 1, ältere Burgen sind ungespiegelt). Laufende Burgen haben Version 3 mit `pendingFlipped` (Migration von Version 2).
- **Tablets:**
  - Im Querformat bis 820 px Höhe steht die Aufgabe zweispaltig (Wortkarte links, Antwort rechts). Unter 560 px Höhe (z. B. mit Bildschirmtastatur) wird alles enger. Der Viewport nutzt `interactive-widget=resizes-content`, damit die Tastatur die Seite verkleinert statt sie zu überdecken.
  - Das Aufgaben-Overlay liegt über den Fackeln (vorher verdeckten sie „Fertig“).
  - Im Querformat bekommt die Bauszene links Platz für den Speicher, damit er kein Feld verdeckt. Die Knopfleiste ist kompakter, damit die Ablage oben links frei bleibt; im Bearbeitungsmodus steht der Hinweis in einer zweiten Zeile. Der Hinweis lässt Antippen durch.
  - E2E-Tests prüfen 1024 × 690 (beide Modi) und 1280 × 400 (Tastatur offen): „Fertig“ ist ohne Scrollen sichtbar.


### Phase 9 – Planung (2026-11-01)
Entscheidungen der Rückmeldung: Kinder wählen frei; die Lehrkraft kann zusätzlich Übungspakete anlegen, die vorgeben, was drankommt, und mit „Kinder dürfen frei spielen“ das freie Spiel abschalten. Pakete dürfen Spielarten mischen und gelten für alle Kinder. Im freien Spiel kommt der von der Lehrkraft freigegebene Inhalt dran. Alle Burgen in einer Sammlung. 1×1: nur Malaufgaben, Reihen einzeln ein- und ausschaltbar. Weitere Spielarten folgen später. Von Claude Code ergänzt (bei Bedarf ändern): Reihe = zweiter Faktor, Zahlendreher als „Fast!“, Spielarten im freien Spiel einzeln abschaltbar, Auswahl entfällt bei nur einer Möglichkeit. Nachtrag: Spielarten sollen künftig exklusive Bauteile bringen; angeboten werden sie nach Aufgaben ihrer Spielart.

### Phase 9a (2026-11-01)
Umbau ohne sichtbare Änderung: Die Mehrzahl ist jetzt die erste Spielart.
- **Logik** (`src/logic/exercises/`): `exercise.ts` (Schnittstelle `ExerciseLogic` mit `check`, Tabelle aller Spielarten, `checkTask`), `plural.ts` (`pluralTasks` baut aus dem Wort-Topf Aufgaben samt Eingabemodus, Prüfung wie bisher), `taskId.ts` (Präfix `plural:`, `exerciseOf`).
- **Oberfläche** (`src/ui/exercises/`): `panel.ts` (Schnittstelle `ExercisePanel`), `pluralPanel.ts` (vorher `ui/taskPanel.ts`), `index.ts` (`createTaskArea` zeigt je Aufgabe das Panel ihrer Spielart, für gemischte Pakete ab 9c).
- **Begriffe im Code:** `Task`, `TaskPickerState` und `taskPicker.ts` (vorher Wort-Auswahl), `TaskBoxes`, `withKnownTasks`, `quiz.taskId`.
- **Speicherformat:** Laufende Burg Version 4 mit `selection` (bisher nur `{ kind: 'free', exercise: 'plural' }`), Aufgaben-IDs mit Präfix in Quiz, Auswahl und Lernfächern. Lernfortschritt Version 2 (`{ boxes }` statt Stände je Liste, Schlüssel mit Präfix). Beide mit Migration; ein E2E-Test setzt eine Burg im alten Format fort.
- **Exklusive Bauteile:** Feld `exercises` im Bauteil-Katalog; `finishTask` gibt die Spielart der gelösten Aufgabe an die Angebote, die exklusive Teile danach filtern. Es gibt noch keine exklusiven Teile.

## 14. Spielarten und Übungspakete (ab Phase 9)

Burgbau wird ein Rahmen für mehrere Lernspiele: Das Bauen bleibt gleich, nur die Aufgabe wechselt. Erste weitere Spielart ist das **kleine 1×1**, später kommen weitere dazu.

### Begriffe
- **Spielart:** eine Art von Aufgabe mit eigener Prüfung und eigener Aufgaben-Oberfläche, z. B. „Mehrzahl“ oder „Kleines 1×1“.
- **Inhalt einer Spielart:** woraus die Aufgaben kommen. Bei der Mehrzahl die Wortlisten, beim 1×1 die Reihen 1–10.
- **Übungspaket:** von der Lehrkraft angelegte, benannte Auswahl, z. B. „Wochenplan 12: Klasse 3 + 1×1 Reihen 6–8“. Ein Paket kann **mehrere Spielarten mischen**: Die Aufgaben einer Burg kommen dann bunt gemischt aus allen gewählten Inhalten.
- **Freies Spiel:** Das Kind wählt selbst eine Spielart. Was dabei drankommt, gibt die Lehrkraft vor (freigegebener Inhalt, siehe unten).
- Das Wort „Sammlung“ bleibt für die Burgen reserviert.

### Ablauf für das Kind
- „Neue Burg bauen“ zeigt große Karten zur Auswahl: zuerst die Übungspakete, dann, wenn freies Spiel erlaubt ist, die freigegebenen Spielarten. Gibt es nur eine Möglichkeit, startet die Burg sofort ohne Auswahl.
- Eine Burg gehört zu genau einer Auswahl (Paket oder Spielart). „Weiterbauen“ setzt sie fort. Ändert die Lehrkraft das Paket zwischendurch, kommen nur noch Aufgaben, die es noch gibt (wie bisher bei den Wortlisten).
- Bauen, Angebote, Serie, Seltenheit und Bearbeitungsmodus sind für alle Spielarten gleich.
- **Alle Burgen landen in einer Sammlung**, egal aus welcher Spielart.
- **Exklusive Bauteile (geplant):** Spielarten können eigene Bauteile mitbringen, die es nur dort gibt. Ein solches Teil wird nur nach einer Aufgabe dieser Spielart angeboten, bei gemischten Paketen also passend zur gerade gelösten Aufgabe. Seltenheit und Serie gelten wie für alle Teile. Einmal gebaut, ist es ein ganz normales Teil (Burg, Speicher, Bearbeitungsmodus, Sammlung).
- Ist weder ein Paket angelegt noch freies Spiel erlaubt, zeigt die Startseite freundlich „Frag deine Lehrkraft, was du heute üben sollst.“

### Lehrkraft-Einstellungen (Erweiterung von Abschnitt 8)
- **Kinder dürfen frei spielen** (an): Ohne diese Einstellung gibt es nur die Übungspakete.
- **Spielarten im freien Spiel:** pro Spielart an/aus (alle an). Freigegebener Inhalt:
  - Mehrzahl: die eingeschalteten Wortlisten (wie bisher).
  - Kleines 1×1: die eingeschalteten Reihen (alle 1–10 an, mindestens eine bleibt an).
- **Übungspakete:** anlegen, umbenennen, bearbeiten, löschen. Pro Paket für jede Spielart den Inhalt auswählen (Wortlisten bzw. Reihen); mindestens ein Inhalt muss gewählt sein. Pakete gelten für alle Kinder des Geräts.
- Aufgaben pro Burg, Eingabemodus der Mehrzahl, Großschreibung, Vorlesen und Töne gelten weiter für alle Spielarten bzw. die jeweilige Spielart.

### Kleines 1×1
- **Aufgaben:** nur Malaufgaben `a · r = ?` mit a = 1–10. Die **Reihe** r ist der zweite Faktor: Die 7er-Reihe ist 1 · 7 bis 10 · 7. (3 · 7 gehört zur 7er-, 7 · 3 zur 3er-Reihe.)
- **Eingabe:** großes Ziffernfeld (0–9, Löschen) mit Touch-Zielen ≥ 64 px; am PC geht auch die Tastatur. Keine Bildschirmtastatur nötig.
- **Prüfung:** Zahlvergleich (Leerzeichen und führende Nullen egal). Ein **Zahlendreher** (56 statt 65) gibt „Fast!“ und einen zweiten Versuch, sonst zählt die Antwort sofort.
- **Lösung freundlich zeigen:** „7 · 8 = 56“, das Ergebnis farbig hervorgehoben.
- **Vorlesen:** „Wie viel ist 7 mal 8?“, danach „7 mal 8 ist 56.“
- Wiederholung falscher Aufgaben und Lernfächer funktionieren wie bei den Wörtern.

### Technik
- **Schnittstelle Spielart:** Logik in `src/logic/exercises/` (rein, mit Unit-Tests): Aufgaben-IDs aus einem Inhalt, Antwort prüfen (Ergebnis richtig / fast / falsch wie bisher), Lösung als hervorgehobene Textstücke, Vorlesetext. Oberfläche in `src/ui/exercises/`: ein Aufgaben-Panel je Spielart. Eine Liste der Spielarten verbindet beides. Eine neue Spielart = Logik-Modul + Panel + Inhalts-Einstellung + Texte in `texts.ts`.
- **Exklusive Bauteile:** Im Bauteil-Katalog bindet das Feld `exercises` ein Teil an Spielarten (fehlt = überall). Die Angebote bekommen die Spielart der gerade gelösten Aufgabe mit und filtern danach. Der Mechanismus kommt mit Phase 9a, die ersten exklusiven Teile mit den jeweiligen Spielarten.
- **Aufgaben-IDs** sind über alle Spielarten eindeutig, mit Präfix: `plural:hund`, `1x1:7x8`. Wortauswahl (gemischter Topf, Wiederholungen) und Lernfächer arbeiten unverändert mit diesen IDs.
- **Speicherformat:**
  - Laufende Burg: Auswahl (Paket-ID oder Spielart) und `quiz.taskId` statt `wordId`. Migration: Alt = freies Spiel Mehrzahl, IDs bekommen das Präfix `plural:`.
  - Lernfortschritt: Schlüssel mit Präfix (Migration).
  - Einstellungen: freies Spiel, freigegebene Spielarten, 1×1-Reihen.
  - Neuer Datensatz `packs` (Übungspakete).
  - Burgen bleiben unverändert.
