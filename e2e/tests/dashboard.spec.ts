import { Browser, BrowserContext, Page, test, expect, chromium } from '@playwright/test';
import { DashboardPage } from '../pages/dashboard.ts';
import { Session } from '../pages/session.ts';
import { Credentials } from '../utils/testData.ts';

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
    throw new Error(
      'Dashboard tests require the test account to belong to at least one organization. ' +
        'No organization slug captured at sign-in — bootstrap an org for the account first.',
    );
  }
});

test.afterAll(async () => {
  await context?.close();
  await browser?.close();
});

test.describe('Dashboard — Layout & Navigation', () => {

  /**
   * @Test_Scenarios : [DASHBOARD — LAYOUT & NAVIGATION]
   * @Test_DB0001 : User lands on /<slug>/tickets with all core chrome visible
   * @Test_DB0002 : Header has Tickets and Settings tabs, Tickets is active by default
   * @Test_DB0003 : Sidebar nav exposes Tickets, Organization settings, Manage account, Sign out
   * @Test_DB0004 : Seeded sample tickets are rendered on first page
   * @Test_DB0005 : Clicking "Settings" header tab routes to /<slug>/settings
   * @Test_DB0006 : Clicking "New" routes to /<slug>/tickets/new
   */

  let dashboard: DashboardPage;

  test.beforeEach(async () => {
    dashboard = new DashboardPage(page, slug);
    await dashboard.goto();
  });

  test('DB0001 : User lands on /<slug>/tickets with all core chrome visible', async () => {
    await dashboard.assertCoreElementsVisible();
    await dashboard.assertUrlMatches(new RegExp(`/${slug}/tickets$`));
  });

  test('DB0002 : Header has Tickets and Settings tabs, Tickets is active by default', async () => {
    await dashboard.assertHeaderTabsVisible();
    await dashboard.assertActiveHeaderTab('Tickets');
  });

  test('DB0003 : Sidebar nav exposes Tickets, Organization settings, Manage account, Sign out', async () => {
    await dashboard.assertSideNavVisible();
  });

  test('DB0004 : Seeded sample tickets are findable in the org\'s ticket list', async () => {
    // Search-anchored so the seed row is guaranteed in view regardless of
    // how many newer tickets the suite has created in earlier runs.
    await dashboard.assertSeedTicketVisible();
  });

  test('DB0005 : Clicking "Settings" header tab routes to /<slug>/settings', async () => {
    await dashboard.clickHeaderSettingsTab();
    await dashboard.waitForUrl(new RegExp(`/${slug}/settings$`));
    await dashboard.assertUrlMatches(new RegExp(`/${slug}/settings$`));
  });

  test('DB0006 : Clicking "New" routes to /<slug>/tickets/new', async () => {
    await dashboard.clickNewTicket();
    await dashboard.waitForUrl(new RegExp(`/${slug}/tickets/new$`));
    await dashboard.assertUrlMatches(new RegExp(`/${slug}/tickets/new$`));
  });
});

test.describe('Dashboard — Search & Filter', () => {

  /**
   * @Test_Scenarios : [DASHBOARD — SEARCH & FILTER]
   * @Test_DB0007 : Search by title puts the term in ?search and narrows the table
   * @Test_DB0008 : Search with a guaranteed-unique gibberish term yields zero rows
   * @Test_DB0009 : Status filter "In Progress" sets ?status=InProgress and shows only matching rows
   * @Test_DB0010 : Reverting the status filter to "Any" clears ?status from the URL
   */

  let dashboard: DashboardPage;

  test.beforeEach(async () => {
    dashboard = new DashboardPage(page, slug);
    await dashboard.goto();
  });

  test('DB0007 : Search by title puts the term in ?search and narrows the table', async () => {
    await dashboard.search('Session timeout');
    await dashboard.assertUrlMatches(/\?search=Session\+timeout/);
    // Exactly one seed row matches "Session timeout" — test-created tickets
    // use distinct prefixes (NT0004, AT0001) and won't collide.
    expect(await dashboard.ticketRowCount()).toBe(1);
  });

  test('DB0008 : Search with a guaranteed-unique gibberish term yields zero rows', async () => {
    await dashboard.search('zzzz_no_such_ticket_9921');
    await dashboard.assertUrlMatches(/\?search=zzzz_no_such_ticket_9921/);
    expect(await dashboard.ticketRowCount()).toBe(0);
  });

  test('DB0009 : Status filter "In Progress" sets ?status=InProgress and shows only matching rows', async () => {
    await dashboard.pickStatusFilter('In Progress');
    await dashboard.assertUrlMatches(/\?status=InProgress/);
    expect(await dashboard.ticketRowCount()).toBeGreaterThanOrEqual(1);
    // Every visible status badge must read "In Progress".
    const badges = await dashboard.getAllRowStatusTexts();
    for (const text of badges) {
      expect(text).toContain('In Progress');
    }
  });

  test('DB0010 : Reverting the status filter to "Any" clears ?status from the URL', async () => {
    await dashboard.pickStatusFilter('In Progress');
    await dashboard.pickStatusFilter('Any');
    // The "Any" option clears the param entirely (no ?status= in the URL).
    expect(dashboard.getUrlSearchParam('status')).toBeNull();
  });
});
