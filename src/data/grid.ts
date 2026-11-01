import type { GridSize, TasksPerCastle } from '../types';

/** Rastergröße je Aufgabenzahl (Spezifikation Abschnitt 5). */
export const GRID_SIZE_BY_TASKS: Readonly<Record<TasksPerCastle, GridSize>> = {
  10: { cols: 12, rows: 8 },
  15: { cols: 12, rows: 8 },
  20: { cols: 14, rows: 9 },
  // Mehr Aufgaben, mehr Teile: breiter und höher (die Zellen werden auf Tablets etwas kleiner).
  25: { cols: 15, rows: 10 },
  30: { cols: 16, rows: 10 },
};

/** Kantenlänge einer Zelle in Weltpixeln. Phaser skaliert die Welt auf den Bildschirm. */
export const CELL_SIZE = 96;

/** Himmel über dem Raster (Ablage für das nächste Teil, Wolken). */
export const SKY_HEIGHT = 144;

/** Wiese unter dem Raster. */
export const GROUND_HEIGHT = 72;

/** Rand links und rechts neben dem Raster. */
export const SIDE_MARGIN = 24;
