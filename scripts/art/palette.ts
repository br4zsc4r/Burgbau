// Feste Farbpalette aller Grafiken (Spezifikation Abschnitt 9: flache Vektorgrafik,
// feste Palette, dicke Kontur). Licht kommt immer von links oben.

export const OUTLINE = '#3b2f2a';
export const OUTLINE_WIDTH = 4;

/** Ein Farbton in drei Stufen: Licht, Fläche, Schatten. */
export interface Tone {
  light: string;
  base: string;
  shade: string;
}

export const STONE: readonly Tone[] = [
  { light: '#ebe1cd', base: '#d6c8ad', shade: '#bba98a' },
  { light: '#e4d8c2', base: '#cdbea2', shade: '#b3a184' },
  { light: '#efe6d4', base: '#ddd0b7', shade: '#c2b192' },
];
export const MORTAR = '#92806a';
/** Dunkle Öffnungen (Schießscharten, Tordurchgang). */
export const DARK = '#3a3340';
export const DARK_LIGHT = '#544a5c';

export const WOOD: Tone = { light: '#c98d55', base: '#a86f3e', shade: '#83532c' };
export const IRON: Tone = { light: '#8d929b', base: '#686d76', shade: '#4c5058' };
export const GOLD: Tone = { light: '#ffe27a', base: '#f2bf2c', shade: '#c9930f' };
export const GLASS: Tone = { light: '#9fd0f5', base: '#4f86c6', shade: '#365f99' };

export const ROOF_RED: Tone = { light: '#f07c5a', base: '#d9573b', shade: '#ae412c' };
export const ROOF_BLUE: Tone = { light: '#7aa3e0', base: '#4f78b8', shade: '#3b5d96' };

export const LEAF: Tone = { light: '#8fd06c', base: '#5fae4c', shade: '#3f8a35' };
export const WATER: Tone = { light: '#bfe6ff', base: '#4aa3df', shade: '#2f7fbf' };

export const CLOTH_BLUE: Tone = { light: '#6aa5ef', base: '#3a7bd5', shade: '#2b5fae' };
export const CLOTH_RED: Tone = { light: '#f27a6e', base: '#e0483e', shade: '#b5352d' };
export const CLOTH_PURPLE: Tone = { light: '#b07ee0', base: '#8a4fbf', shade: '#6a3796' };
export const CLOTH_YELLOW: Tone = GOLD;

export const MOSS = '#7fae4a';
export const WHITE = '#fffdf7';
