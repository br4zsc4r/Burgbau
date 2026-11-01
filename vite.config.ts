import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative Pfade, damit der Build auch in Unterordnern (z. B. GitHub Pages) läuft.
  base: './',
  build: {
    // Phaser allein ist ~1,4 MB (unkomprimiert); die Warnung ab 500 kB ist hier nicht hilfreich.
    chunkSizeWarningLimit: 1600,
  },
  plugins: [
    // Offline-fähig und installierbar. Alles wird vorab gespeichert; zur Laufzeit gibt es
    // keine Anfragen an fremde Server (der Service Worker kommt vom eigenen Server).
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Burgbau',
        short_name: 'Burgbau',
        description: 'Lernspiel: Mehrzahl deutscher Nomen – jede Antwort baut an deiner Burg.',
        lang: 'de',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        background_color: '#cfe8fb',
        theme_color: '#7cb7e8',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        // Das Phaser-Bundle (~1,5 MB) liegt nahe an der Standardgrenze von 2 MB.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
