import Phaser from 'phaser';
import { worldLayout } from '../logic/gridLayout';
import type { GridSize, GridState } from '../types';
import { BuildScene, type BuildSceneCallbacks, type BuildView } from './BuildScene';

export interface BuildGame {
  setView: (view: BuildView) => void;
  /** Vorschaubild (Data-URL) einer Burg, z. B. für die Galerie. */
  snapshot: (grid: GridState) => Promise<string>;
}

/** Vorschaubilder in einem Viertel der Weltgröße. */
const SNAPSHOT_SCALE = 0.25;

export function createBuildGame(
  parent: HTMLElement,
  size: GridSize,
  callbacks: BuildSceneCallbacks,
): BuildGame {
  const layout = worldLayout(size);
  const scene = new BuildScene(layout, callbacks);

  new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: layout.width,
    height: layout.height,
    backgroundColor: '#cfe8fb',
    banner: false,
    // Tastatur bleibt beim HTML-Eingabefeld; Sound kommt in einer späteren Phase.
    input: { keyboard: false },
    audio: { noAudio: true },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene,
  });

  // Vorschauen nacheinander zeichnen, weil sie sich eine Dynamic Texture teilen.
  let queue: Promise<unknown> = Promise.resolve();

  return {
    setView: (view) => {
      scene.setView(view);
    },
    snapshot: (grid) => {
      const next = queue.then(() => scene.snapshot(grid, SNAPSHOT_SCALE));
      queue = next.catch(() => undefined);
      return next;
    },
  };
}
