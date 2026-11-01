import type { GridSize } from '../types';

/** Raster für eine Burg mit 15 Aufgaben (Spezifikation Abschnitt 5). */
export const DEFAULT_GRID_SIZE: GridSize = { cols: 12, rows: 8 };

/** Kantenlänge einer Zelle in Weltpixeln. Phaser skaliert die Welt auf den Bildschirm. */
export const CELL_SIZE = 96;

/** Himmel über dem Raster (Ablage für das nächste Teil, Wolken). */
export const SKY_HEIGHT = 144;

/** Wiese unter dem Raster. */
export const GROUND_HEIGHT = 72;

/** Rand links und rechts neben dem Raster. */
export const SIDE_MARGIN = 24;
