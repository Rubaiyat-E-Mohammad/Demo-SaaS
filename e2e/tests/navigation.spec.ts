import { Browser, BrowserContext, Page, test, expect, chromium } from '@playwright/test';
import { Session } from '../pages/session.ts';
import { DashboardPage } from '../pages/dashboard.ts';
import { Credentials } from '../utils/testData.ts';
import { Selectors } from '../utils/selectors.ts';

let browser: Browser;
let context: BrowserContext;
let page: Page;
let slug = '';

test.beforeAll(async () => {
  browser = await chromium.launch({ headless: process.env.HEADED !== '1' });
  context = await browser.newContext();
  page = await context.newPage();
  const session = new Session(page);
  slug = await session.signInAndCaptureSlug(Credentials.valid.email, Credentials.valid.password);
  if (!slug) {
    throw new Error('Navigation tests require the test account to belong to an organization.');
  }
});

test.afterAll(async () => {
  await context?.close();
  await browser?.close();
});

test.describe('Navigation — Session persistence & sign-out', () => {

  /**
   * @Test_Scenarios : [POST-LOGIN NAVIGATION & SESSION]
   * @Test_NV0001 : Session persists across a full page reload
   * @Test_NV0002 : Navigating to /onboarding while signed in with an org redirects to /<slug>/tickets
   * @Test_NV0003 : User-menu dropdown lists "Manage account" and "Sign out"
   * @Test_NV0004 : Sign out returns user to home, clears session, and blocks protected URLs
   * @Test_NV0005 : Org switcher dropdown shows current org and a "Create organization" option
   *
   * NV0001/NV0002/NV0003/NV0005 share the spec-level signed-in context.
   * NV0004 explicitly opens its OWN isolated context — signing out via the
   * shared cookie would server-side-invalidate the token the remaining
   * tests in the file depend on. NV0004 owns one extra sign-in to stay
   * hermetic.
   */

  test('NV0001 : Session persists across a full page reload', async () => {
    const dashboard = new DashboardPage(page, slug);
    await dashboard.goto();
    await dashboard.reload();
    await dashboard.assertCoreElementsVisible();
    await dashboard.assertUrlMatches(new RegExp(`/${slug}/tickets`));
  });

  test('NV0002 : Navigating to /onboarding while signed in with an org redirects to /<slug>/tickets', async () => {
    const dashboard = new DashboardPage(page, slug);
    await dashboard.navigateToURL(dashboard.onboardingPage);
    await dashboard.waitForUrl(new RegExp(`/${slug}/tickets`), 15_000);
    await dashboard.assertUrlMatches(new RegExp(`/${slug}/tickets`));
  });

  test('NV0003 : User-menu dropdown lists "Manage account" and "Sign out"', async () => {
    const dashboard = new DashboardPage(page, slug);
    await dashboard.goto();
    await dashboard.validateAndClick(Selectors.postLoginNav.userMenuTrigger);
    await dashboard.assertionValidate(Selectors.postLoginNav.userMenuManageAccount);
    await dashboard.assertionValidate(Selectors.postLoginNav.userMenuSignOut);
    await dashboard.pressKey('Escape');
  });

  test('NV0005 : Org switcher dropdown shows current org and a "Create organization" option', async () => {
    const dashboard = new DashboardPage(page, slug);
    await dashboard.goto();
    await dashboard.validateAndClick(Selectors.postLoginNav.orgSwitcherTrigger);
    await dashboard.assertionValidate(Selectors.postLoginNav.orgSwitcherCreateOption);
    // The current org appears as a disabled menuitem at the top.
    await dashboard.validateAny('role=menuitem[name=/QA Exploration Org/]');
    await dashboard.pressKey('Escape');
  });

  // Last test in the file. Opens its OWN isolated context (with its own
  // sign-in) so signing out does not invalidate the shared cookie that
  // other tests reuse in this file.
  test('NV0004 : Sign out returns user to home, clears session, and blocks protected URLs', async () => {
    const isolatedContext = await browser.newContext();
    const isolatedPage = await isolatedContext.newPage();
    try {
      const session = new Session(isolatedPage);
      const isolatedSlug = await session.signInAndCaptureSlug(
        Credentials.valid.email,
        Credentials.valid.password,
      );
      expect(isolatedSlug).not.toBe('');
      // Now sign out via UI and assert teardown.
      await session.signOut();
      await session.assertUrlMatches(/\/$/);
      await session.assertSignedOut();
      // Try to access a protected page — should redirect away from it.
      const dashboard = new DashboardPage(isolatedPage, isolatedSlug);
      await dashboard.navigateToURL(dashboard.ticketsListPage(isolatedSlug));
      expect(isolatedPage.url()).not.toMatch(new RegExp(`/${isolatedSlug}/tickets`));
    } finally {
      await isolatedContext.close();
    }
  });
});
