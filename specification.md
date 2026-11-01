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
| Richtig, Serie 5–9 | 1 Grundbauteil + 1 Dekoration + 1 Abschluss (Dach/Zinnen) |
| Richtig, Serie 10+ | mindestens 1 **Premium-Teil** |

- **Serie (Streak):** Anzahl richtiger Antworten in Folge. Eine falsche Antwort **halbiert** die Serie (abgerundet), statt sie auf 0 zu setzen.
- Die Serie wird sichtbar angezeigt (z. B. als Fackeln, die nacheinander aufleuchten), damit Kinder den Zusammenhang „mehr richtig in Folge → schönere Teile“ verstehen.
- Die drei Angebote sollen sich unterscheiden (keine drei gleichen Teile).
- **Umgebungsteile** (Baum, Brunnen, Wassergraben, Zugbrücke): Bei richtigen Antworten kann ab und zu ein Grundbauteil durch ein Umgebungsteil ersetzt werden (siehe Abschnitt 13, Vorgaben für Phase 4).

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
| 4a | Große Teile (2 × 1, 1 × 2, 2 × 2) mit Überhängen, Dekorationen mit Andockpunkten an bestehenden Teilen, Umgebungsteile, Fortschrittsanzeige | abwechslungsreich bauen |
| 4b | Autotiling (Bitmaske, Kanten, Zinnen), Weltkoordinaten-Textur, Schadens-Overlays | Teile verschmelzen |
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
- **Aktive Liste:** Kommt aus den Einstellungen (Standard Klasse 1/2). Bis zu den Lehrkraft-Einstellungen in Phase 7 lässt sie sich zum Ausprobieren über die Adresse wählen: `?liste=klasse-3`.

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
- Fächer 0–4 je Wort, Profil und Wortliste, gespeichert als `progress:<Profil-ID>`.
- Gezählt wird das Endergebnis jeder Aufgabe, auch bei Wiederholungen: richtig → ein Fach höher, falsch → Fach 0.
- Fach 0–2 gilt als „zu üben“. Neue Aufgaben kommen zu etwa 60 % aus diesen Wörtern, sonst aus neuen oder sicheren (Fach 3–4).

**Rückmeldung nach Phase 5 (Extras)**
- **Zinnen-Teil stillgelegt:** Es wird nicht mehr angeboten, weil Zinnen automatisch entstehen. In gespeicherten Burgen bleibt es darstellbar.
- **Oben drauf auch auf Mauern:** Fahne, Wimpel, Drache usw. stecken jetzt auch auf Mauern, und zwar auf deren automatischen Zinnen.
- **Dach-Garantie:** In den letzten 2 Aufgaben ist immer ein Dach im Angebot, nach richtiger Antwort Spitz-, Kegel- oder hohes Spitzdach, nach falscher das schiefe Dach. Es ersetzt nie ein Premium-Teil und nie das einzige Teil zum Weiterbauen.
- **Animierte Teile:** Feuerdrache (pustet Flammen), Riesenfahne (weht), Funkelkristall (glitzert), alle drei oben drauf, sowie die Windmühle (Flügel drehen sich; steht wie ein Dach, nichts darauf). Ab **Serie 12** ist das Premium-Teil immer eines davon. Sie bewegen sich in der Bauszene und auf den Angebotskarten. Vorschaubilder der Galerie sind Standbilder.
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
- **Gesicherter Zugang:** Das Zahnrad oben rechts auf „Wer spielt?“ muss 3 Sekunden gedrückt gehalten werden, ein Ring füllt sich dabei. Danach kommt eine Malaufgabe (6–9 × 6–9). Eine falsche Antwort bringt eine neue Aufgabe.
- **Wirkung:** Einstellungen werden sofort gespeichert und gelten nach „Fertig“; die App lädt dafür neu. Laufende Burgen behalten ihre Aufgabenzahl, neue Burgen nutzen die neue.
- Die vorübergehende Listenwahl über die Adresse (`?liste=`) entfällt.

**Einstellungen** (Standard in Klammern)
- Wortliste des Geräts (Klasse 1/2) und Eingabemodus (wie in der Liste / Bausteine / Tastatur).
- Aufgaben pro Burg 10/15/20 (15), Großschreibung Pflicht (aus), Vorlesen (an).
- „Ich bin neu“ erlaubt (an), Bild-Code (aus), „Alle Burgen“ zeigen (an).
- Die Einstellung „Sound an/aus“ kommt mit den Sounds in Phase 8.

**Profile verwalten**
- **Klasse anlegen:** ein Spitzname pro Zeile, die Symbole werden der Reihe nach vergeben (höchstens 30).
- **Pro Profil:** umbenennen, eigene Wortliste (sonst die des Geräts), Bild-Code ansehen und zurücksetzen, Burgen anzeigen und einzeln löschen, Sammlung leeren, Profil löschen. Beim Löschen fallen laufende Burg, Sammlung und Lernstand mit weg.

**Bild-Code**
- 9 Bilder (bekannte Bauteile), zwei davon in fester Reihenfolge. Dasselbe Bild zweimal ist erlaubt (81 Codes).
- Das Kind wählt den Code selbst beim ersten Anmelden, auch direkt nach „Ich bin neu“. Danach tippt es ihn beim Anmelden an. Ein falscher Code gibt einen freundlichen Hinweis und beliebig viele weitere Versuche.

**CSV-Import**
- Format `Artikel;Singular;Plural`, mehrere Plurale mit `|`, Datei in UTF-8. Kopfzeile und BOM werden übersprungen.
- Fehlerhafte Zeilen werden mit Zeilennummer und Grund gemeldet, der Rest wird importiert.
- Muster und Umlaut werden automatisch abgeleitet. Sonderfälle (Museum → Museen) bekommen einen Pluralstamm und laufen nur im Tastatur-Modus.
- Importierte Wörter gelten als geprüft (`verified: true`), weil die Lehrkraft sie verantwortet. Die Liste startet im Tastatur-Modus, die Einstellung „Eingabemodus“ kann das ändern.
- Wird eine Liste gelöscht, fallen Gerät und Profile auf ihre Standardliste zurück.

**20 Aufgaben (14 × 9)**
- Die Bauszene passt Welt und Hintergrund an die Rastergröße der gezeigten Burg an. Vorschaubilder nutzen das Layout der jeweiligen Burg, Burgen verschiedener Größe stehen also nebeneinander in der Galerie.
- Auf kleinen Bildschirmen (z. B. Chromebook 1366 × 680) sind die Zellen dann etwas kleiner als 64 px. Das ist der Preis für das größere Raster.

**PWA**
- `vite-plugin-pwa` im Modus generateSW mit automatischem Update. Alle Dateien der App werden vorab gespeichert (keine Laufzeitanfragen an fremde Server).
- Manifest mit App-Symbolen (192, 512, maskable). Ein E2E-Test prüft den Start ohne Netz.

**Nicht umgesetzt** (in Abschnitt 8 als Ausbaustufe markiert): Übersicht der oft falschen Wörter und Backup als Datei.
