import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative Pfade, damit der Build auch in Unterordnern (z. B. GitHub Pages) läuft.
  base: './',
  build: {
    // Phaser allein ist ~1,4 MB (unkomprimiert); die Warnung ab 500 kB ist hier nicht hilfreich.
    chunkSizeWarningLimit: 1600,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
