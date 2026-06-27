import { defineConfig, devices } from "@playwright/test"

// Ejecutar contra el frontend de Bookia (puerto 3001 por defecto).
// Override via E2E_BASE_URL para CI u otros entornos.
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3001"

export default defineConfig({
  testDir: "./e2e",
  // Aislamos los artefactos del eval visual de los tests funcionales.
  outputDir: process.env.E2E_OUTPUT_DIR ?? "test-results",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    timeout: 60_000,
    // En CI: levanta propio. Local: reusa el que ya corre (start-dev.sh).
    reuseExistingServer: !process.env.CI || process.env.E2E_REUSE_SERVER === "1",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})