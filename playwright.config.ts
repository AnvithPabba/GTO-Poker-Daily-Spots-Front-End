import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4175",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4175",
    url: "http://127.0.0.1:4175",
    reuseExistingServer: false,
    timeout: 30_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Keep the mobile viewport in the default test dependency footprint. The
    // iPhone device preset selects WebKit, which is not installed by a plain
    // `playwright install chromium` and makes a clean checkout fail before
    // executing any assertions. Chromium's mobile emulation still verifies
    // responsive layout, touch-sized controls, and keyboard semantics; a
    // separately provisioned WebKit job can be added in deployment CI.
    { name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium" } },
  ],
});
