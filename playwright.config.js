// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright configuration.
 * - Generates a built-in HTML report (test-results/html-report).
 * - Records video for every test run (required by the assessment).
 * - Base URL points to the OrangeHRM public demo instance.
 */
module.exports = defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false, // scenario is stateful/sequential (one employee lifecycle)
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'test-results/html-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: 'https://opensource-demo.orangehrmlive.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on', // record video of every test run, as required
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    ignoreHTTPSErrors: true,
  },
  outputDir: 'test-results/artifacts',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
