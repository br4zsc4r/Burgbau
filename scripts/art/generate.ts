// Erzeugt alle Spielgrafiken als SVG nach public/assets/art/.
// Aufruf: npm run art

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { chipped, crack, crumbling, hole, planks, roofTiles, rubble, tornFlag } from './damage.ts';
import {
  balcony,
  banner,
  coatOfArms,
  crystal,
  crystalMoving,
  dragon,
  fireDragon,
  fireDragonMoving,
  flag,
  flowerBox,
  ghost,
  ghostMoving,
  giantFlag,
  giantFlagMoving,
  ivy,
  pennant,
  stairs,
  torch,
} from './decorations.ts';
import {
  balloon,
  balloonMoving,
  barrels,
  drawbridge,
  fountain,
  fountainMoving,
  moat,
  treasureChest,
  treasureChestMoving,
  tree,
  unicorn,
  unicornMoving,
  well,
  windmill,
  windmillMoving,
} from './environment.ts';
import {
  battlementsPiece,
  bellRoof,
  bellRoofMoving,
  coneRoof,
  goldenRoof,
  observatory,
  observatoryMoving,
  pointedRoof,
  pointedRoofTall,
  roofBig,
} from './roofs.ts';
import {
  archFeature,
  battlements,
  gateBigFeature,
  gateFeature,
  portcullisFeature,
  stainedGlassFeature,
  stoneTexture,
  towerBigFeature,
  towerFeature,
  towerTallFeature,
  windowWallBigFeature,
  windowWallFeature,
} from './stone.ts';
import { appIcon, favicon } from './icon.ts';
import { ANIMALS, animalSymbol, torchIcon } from './ui.ts';

const OUT = join(import.meta.dirname, '..', '..', 'public', 'assets', 'art');

const FILES: Record<string, () => string> = {
  'textures/stone.svg': stoneTexture,
  'battlements.svg': () => battlements(false),
  'battlements-broken.svg': () => battlements(true),
  'torch-lit.svg': () => torchIcon(true),
  'torch-unlit.svg': () => torchIcon(false),

  'features/tower.svg': towerFeature,
  'features/towerTall.svg': towerTallFeature,
  'features/towerBig.svg': towerBigFeature,
  'features/windowWall.svg': windowWallFeature,
  'features/windowWallBig.svg': windowWallBigFeature,
  'features/gate.svg': gateFeature,
  'features/gateBig.svg': gateBigFeature,
  'features/stainedGlass.svg': stainedGlassFeature,
  'features/portcullis.svg': portcullisFeature,
  'features/arch.svg': archFeature,

  'pieces/battlements.svg': battlementsPiece,
  'pieces/pointedRoof.svg': pointedRoof,
  'pieces/pointedRoofTall.svg': pointedRoofTall,
  'pieces/coneRoof.svg': coneRoof,
  'pieces/roofBig.svg': roofBig,
  'pieces/goldenRoof.svg': goldenRoof,
  'pieces/bellRoof.svg': bellRoof,
  'pieces/bellRoof-moving.svg': bellRoofMoving,
  'pieces/observatory.svg': observatory,
  'pieces/observatory-moving.svg': observatoryMoving,

  'pieces/flag.svg': flag,
  'pieces/pennant.svg': pennant,
  'pieces/balcony.svg': balcony,
  'pieces/coatOfArms.svg': coatOfArms,
  'pieces/torch.svg': torch,
  'pieces/ivy.svg': ivy,
  'pieces/flowerBox.svg': flowerBox,
  'pieces/banner.svg': banner,
  'pieces/stairs.svg': stairs,
  'pieces/dragon.svg': dragon,
  'pieces/fireDragon.svg': fireDragon,
  'pieces/fireDragon-moving.svg': fireDragonMoving,
  'pieces/giantFlag.svg': giantFlag,
  'pieces/giantFlag-moving.svg': giantFlagMoving,
  'pieces/crystal.svg': crystal,
  'pieces/crystal-moving.svg': crystalMoving,
  'pieces/ghost.svg': ghost,
  'pieces/ghost-moving.svg': ghostMoving,

  'pieces/tree.svg': tree,
  'pieces/well.svg': well,
  'pieces/moat.svg': moat,
  'pieces/drawbridge.svg': drawbridge,
  'pieces/barrels.svg': barrels,
  'pieces/fountain.svg': fountain,
  'pieces/fountain-moving.svg': fountainMoving,
  'pieces/treasureChest.svg': treasureChest,
  'pieces/treasureChest-moving.svg': treasureChestMoving,
  'pieces/unicorn.svg': unicorn,
  'pieces/unicorn-moving.svg': unicornMoving,
  'pieces/windmill.svg': windmill,
  'pieces/windmill-moving.svg': windmillMoving,
  'pieces/balloon.svg': balloon,
  'pieces/balloon-moving.svg': balloonMoving,

  'damage/crack.svg': crack,
  'damage/chipped.svg': chipped,
  'damage/crumbling.svg': crumbling,
  'damage/hole.svg': hole,
  'damage/planks.svg': planks,
  'damage/rubble.svg': rubble,
  'damage/roofTiles.svg': roofTiles,
  'damage/tornFlag.svg': tornFlag,

  ...Object.fromEntries(ANIMALS.map((animal) => [`symbols/${animal}.svg`, () => animalSymbol(animal)])),
};

rmSync(OUT, { recursive: true, force: true });
for (const [file, draw] of Object.entries(FILES)) {
  const target = join(OUT, file);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, draw());
}
// App-Icon und Favicon liegen außerhalb des Grafik-Ordners (PNG-Fassungen: siehe vite.config.ts).
writeFileSync(join(OUT, '..', '..', 'icons', 'icon.svg'), appIcon());
writeFileSync(join(OUT, '..', '..', 'icons', 'maskable.svg'), appIcon(true));
writeFileSync(join(OUT, '..', '..', 'favicon.svg'), favicon());
console.log(`${String(Object.keys(FILES).length)} Grafiken nach ${OUT} geschrieben, dazu App-Icon und Favicon.`);
