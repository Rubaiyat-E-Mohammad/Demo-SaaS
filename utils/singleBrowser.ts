import { test, chromium } from '@playwright/test';
import type { Browser, BrowserContext, Page } from '@playwright/test';

/**
 * Single-browser-per-spec-file lifecycle.
 *
 * Playwright's default opens a fresh context for every test, so a headed run
 * flickers a new window per test. This helper instead:
 *  - launches ONE browser when the spec file starts (beforeAll),
 *  - runs every test in the file against that same page,
 *  - closes the browser once when the file ends (afterAll).
 *
 * Each spec file that calls this gets its OWN browser instance, so files stay
 * isolated from one another — "different browser for different spec file".
 *
 * Tests run in 'serial' mode: the page is shared, so its state must be
 * deterministic and a failure stops the rest of the file.
 *
 * Headed by default so the run is watchable. Set HEADLESS=1 for a headless
 * (CI) run.
 *
 * Usage — at the top level of a spec file:
 *   const getPage = useSingleBrowser();
 *   test('...', async () => { const page = getPage(); ... });
 */
export function useSingleBrowser(): () => Page {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  // Shared page => tests cannot run in parallel within the file.
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    browser = await chromium.launch({ headless: process.env.HEADLESS === '1' });
    context = await browser.newContext();
    page = await context.newPage();
  });

  // The manual browser lives outside the runner's fixtures, so the config's
  // screenshot:'only-on-failure' does not reach it — re-create that here.
  test.afterEach(async ({}, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      await testInfo.attach('failure-screenshot', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    }
  });

  test.afterAll(async () => {
    await context?.close();
    await browser?.close();
  });

  return () => page;
}
