import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: 'tests/e2e',
  // Jede Instanz rendert WebGL in Software: zu viele parallel überlasten die Maschine,
  // und lange Tests (ganze Burgen) laufen dann ins Zeitlimit.
  workers: 6,
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    port: PORT,
    // Immer frisch bauen, damit nie ein veralteter Build getestet wird.
    reuseExistingServer: false,
  },
});
