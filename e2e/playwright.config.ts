import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load credentials from the project-root .env BEFORE the test runner reads
// any spec/util file, so process.env (SIGNIN_EMAIL / SIGNIN_PASSWORD) is
// populated when utils/testData.ts is imported.
dotenv.config();

export default defineConfig({
  testDir: './tests',
  // Run spec FILES serially so the per-IP auth rate limit (~4 requests in
  // any 30s window on /api/auth/sign-in/email) is not tripped when each spec
  // signs in for itself in its own `beforeAll`. Sharding in CI distributes
  // spec files across separate runner IPs, so each shard naturally fires
  // fewer logins per IP — the in-runner serialisation keeps single-shard
  // local runs under the per-IP cap.
  fullyParallel: false,
  workers: 1,
  // 'list' prints a per-test-case line to the console during the run;
  // 'html' keeps the browsable report; the feature-map reporter renders the
  // GitHub Actions test-summary from feature-map/feature-map.yml.
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['./utils/featureMapReporter.ts'],
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
  },
  // Chromium only — auth is backend-driven and identical across browsers.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
