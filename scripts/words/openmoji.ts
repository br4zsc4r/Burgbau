// Lädt einmalig die Wort-Bilder von OpenMoji (CC BY-SA 4.0) und legt sie lokal ab.
// Zur Laufzeit gibt es keine Netzwerkanfragen: Die App nutzt nur public/assets/words/.
// Aufruf: npm run words
//
// Nur Wörter mit einem eindeutigen Bild bekommen eins. Abstraktes (Thema, Problem, Woche …)
// und Missverständliches (Gabel zeigt Messer und Gabel) behält den Buchstaben als Platzhalter.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const VERSION = '15.1.0';
const SOURCE = `https://raw.githubusercontent.com/hfg-gmuend/openmoji/${VERSION}/color/svg/`;
const ROOT = join(import.meta.dirname, '..', '..');
const OUT = join(ROOT, 'public', 'assets', 'words');
const LISTS = ['klasse-1-2', 'klasse-3', 'klasse-4'];

/** Wort-ID → OpenMoji-Datei (Unicode-Codepunkte). */
const IMAGES: Record<string, string> = {
  // Klasse 1/2
  hund: '1F415',
  katze: '1F408',
  auto: '1F697',
  ball: '26BD',
  maus: '1F401',
  haus: '1F3E0',
  baum: '1F333',
  blume: '1F337',
  kind: '1F9D2',
  tuer: '1F6AA',
  buch: '1F4D6',
  stuhl: '1FA91',
  schule: '1F3EB',
  bett: '1F6CF',
  apfel: '1F34E',
  frau: '1F469',
  bild: '1F5BC',
  vogel: '1F426',
  hand: '270B',
  ei: '1F95A',
  zug: '1F686',
  uhr: '23F0',
  fenster: '1FA9F',
  opa: '1F474',
  oma: '1F475',
  sofa: '1F6CB',
  pferd: '1F40E',
  ente: '1F986',
  schaf: '1F411',
  mann: '1F468',
  tasche: '1F45C',
  bein: '1F9B5',
  fuss: '1F9B6',
  nase: '1F443',
  ohr: '1F442',
  mund: '1F444',
  kuh: '1F404',
  schwein: '1F416',
  hase: '1F407',
  sonne: '2600',
  stern: '2B50',
  boot: '26F5',
  ampel: '1F6A6',
  bruder: '1F466',
  schwester: '1F467',
  loeffel: '1F944',
  messer: '1F52A',
  teller: '1F37D',
  tasse: '2615',
  glas: '1F95B',
  hut: '1F3A9',
  muetze: '1F9E2',
  kleid: '1F457',
  schuh: '1F45F',
  jacke: '1F9E5',
  kuchen: '1F382',
  heft: '1F4D3',
  stift: '270F',
  // Klasse 3
  wand: '1F9F1',
  topf: '1F372',
  frosch: '1F438',
  fuchs: '1F98A',
  wolf: '1F43A',
  sturm: '26C8',
  wurm: '1FAB1',
  huhn: '1F414',
  loch: '1F573',
  dorf: '1F3D8',
  wald: '1F332',
  blatt: '1F343',
  rad: '1F6DE',
  schloss: '1F3F0',
  laden: '1F3EA',
  faden: '1F9F5',
  nacht: '1F303',
  stadt: '1F3D9',
  wurst: '1F32D',
  gans: '1FABF',
  faust: '270A',
  braut: '1F470',
  korb: '1F9FA',
  saft: '1F9C3',
  arzt: '1F9D1-200D-2695-FE0F',
  koch: '1F9D1-200D-1F373',
  strasse: '1F6E3',
  bruecke: '1F309',
  insel: '1F3DD',
  zahl: '1F522',
  farbe: '1F3A8',
  hemd: '1F455',
  feder: '1FAB6',
  bauer: '1F9D1-200D-1F33E',
  loewe: '1F981',
  affe: '1F412',
  baer: '1F43B',
  kino: '1F3A6',
  radio: '1F4FB',
  foto: '1F4F7',
  igel: '1F994',
  kaefer: '1F41E',
  // Klasse 4
  museum: '1F3DB',
  datum: '1F4C5',
  stadion: '1F3DF',
  globus: '1F30D',
  kaktus: '1F335',
  lehrerin: '1F469-200D-1F3EB',
  bus: '1F68C',
  pizza: '1F355',
  lehrer: '1F468-200D-1F3EB',
  schueler: '1F9D1-200D-1F393',
  computer: '1F4BB',
  koffer: '1F9F3',
  theater: '1F3AD',
  spiegel: '1FA9E',
  schluessel: '1F511',
  maedchen: '1F467',
  broetchen: '1F35E',
  gebaeude: '1F3E2',
  hotel: '1F3E8',
  park: '1F3DE',
  handy: '1F4F1',
  baby: '1F476',
  clown: '1F921',
  taxi: '1F695',
  mensch: '1F9D1',
  held: '1F9B8',
  prinz: '1F934',
  elefant: '1F418',
  planet: '1FA90',
  polizist: '1F46E',
  astronaut: '1F9D1-200D-1F680',
  zeitung: '1F4F0',
  rechnung: '1F9FE',
  bibliothek: '1F4DA',
  auge: '1F441',
  insekt: '1F41B',
  muskel: '1F4AA',
  kartoffel: '1F954',
  lied: '1F3B5',
  gesicht: '1F642',
  licht: '1F4A1',
  schild: '1FAA7',
  geist: '1F47B',
  gespenst: '1F47B',
  reichtum: '1F4B0',
  brief: '2709',
  geschenk: '1F381',
  kreis: '2B55',
  preis: '1F3C6',
  koenig: '1F451',
  ring: '1F48D',
  zelt: '26FA',
  spiel: '1F3B2',
  tier: '1F43E',
  abend: '1F306',
  paket: '1F4E6',
  nuss: '1F330',
  kuss: '1F48B',
  zahn: '1F9B7',
  bahnhof: '1F689',
  flughafen: '1F6EB',
};

interface ListFile {
  words: { id: string; image?: string }[];
}

mkdirSync(OUT, { recursive: true });
const missing: string[] = [];
for (const [id, code] of Object.entries(IMAGES)) {
  const response = await fetch(`${SOURCE}${code}.svg`);
  if (!response.ok) {
    missing.push(`${id} (${code})`);
    continue;
  }
  writeFileSync(join(OUT, `${id}.svg`), await response.text());
}

// Bildnamen in die Wortlisten eintragen (nur für vorhandene Bilder).
const loaded = new Set(Object.keys(IMAGES).filter((id) => !missing.some((m) => m.startsWith(`${id} `))));
for (const list of LISTS) {
  const file = join(ROOT, 'src', 'data', 'wordlists', `${list}.json`);
  const data = JSON.parse(readFileSync(file, 'utf8')) as ListFile;
  for (const word of data.words) {
    if (loaded.has(word.id)) word.image = `${word.id}.svg`;
    else delete word.image;
  }
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

console.log(`${String(loaded.size)} Bilder geladen.`);
if (missing.length > 0) console.log(`Nicht gefunden: ${missing.join(', ')}`);
