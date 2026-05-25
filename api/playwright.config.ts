import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

// Reuse the e2e .env so credentials don't have to be duplicated.
dotenv.config({ path: '../e2e/.env' });

export default defineConfig({
  testDir: './tests',
  // Demo SaaS rate-limits per IP; run serially so the burst stays under the
  // throttle threshold.
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['./utils/featureMapReporter.ts'],
  ],
  use: {
    baseURL: process.env.BASE_URL,
    extraHTTPHeaders: { 'Content-Type': 'application/json' },
  },
});
