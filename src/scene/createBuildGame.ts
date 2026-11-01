import Phaser from 'phaser';
import { worldLayout } from '../logic/gridLayout';
import type { GridSize } from '../types';
import { BuildScene, type BuildSceneCallbacks, type BuildView } from './BuildScene';

export interface BuildGame {
  setView: (view: BuildView) => void;
}

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

  return {
    setView: (view) => {
      scene.setView(view);
    },
  };
}
