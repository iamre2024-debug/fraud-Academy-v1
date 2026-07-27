import { defineConfig, devices } from '@playwright/test';

const localChromium = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: localChromium ? {
      executablePath: localChromium,
      args: [
        '--single-process',
        '--no-zygote',
        '--disable-setuid-sandbox',
        '--disable-webgl',
        '--disable-site-isolation-trials',
      ],
    } : undefined,
  },
  webServer: {
    command: 'npx vite preview --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile-chromium',
      testMatch: /(?:mobile-reference-browser|mobile-mission-deck-v3-browser|mobile-workspace-pages-browser|case-briefing-browser|document-request-browser|document-viewer-browser|decision-luna-browser|final-responsive-browser|payment-verification-browser|login-history-browser|device-intelligence-browser|quick-pad-browser|cloud-persistence-browser)\.spec\.mjs$/,
      use: { ...devices['Pixel 7'] },
    },
  ],
});
