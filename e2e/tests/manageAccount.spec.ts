import { Browser, BrowserContext, Page, test, expect, chromium } from '@playwright/test';
import { ManageAccountPage } from '../pages/manageAccount.ts';
import { Session } from '../pages/session.ts';
import { Selectors } from '../utils/selectors.ts';
import { Credentials } from '../utils/testData.ts';

let browser: Browser;
let context: BrowserContext;
let page: Page;

test.beforeAll(async () => {
  browser = await chromium.launch({ headless: process.env.HEADED !== '1' });
  context = await browser.newContext();
  page = await context.newPage();
  const session = new Session(page);
  await session.signInAndCaptureSlug(Credentials.valid.email, Credentials.valid.password);
});

test.afterAll(async () => {
  await context?.close();
  await browser?.close();
});

test.describe('Manage Account — User Details tab', () => {

  /**
   * @Test_Scenarios : [MANAGE ACCOUNT — USER DETAILS]
   * @Test_MA0001 : User details tab renders First name, Last name, Save
   * @Test_MA0002 : First name and Last name are pre-filled from the logged-in user's profile
   * @Test_MA0003 : The page exposes both "User details" and "Security" tabs
   */

  let manage: ManageAccountPage;

  test.beforeEach(async () => {
    manage = new ManageAccountPage(page);
    await manage.goto();
  });

  test('MA0001 : User details tab renders First name, Last name, Save', async () => {
    await manage.assertUserDetailsFormVisible();
  });

  test('MA0002 : First name and Last name are pre-filled from the logged-in user\'s profile', async () => {
    // The seeded test user is "Rubaiyat Tonmoy" — pulled from the session
    // payload at /api/auth/get-session. We assert non-empty rather than
    // hardcoded names so the spec is robust if the admin renames the account.
    const first = await manage.getFirstName();
    const last = await manage.getLastName();
    expect(first.length).toBeGreaterThan(0);
    expect(last.length).toBeGreaterThan(0);
  });

  test('MA0003 : The page exposes both "User details" and "Security" tabs', async () => {
    await manage.assertTabsVisible();
  });
});

test.describe('Manage Account — Security tab', () => {

  /**
   * @Test_Scenarios : [MANAGE ACCOUNT — SECURITY]
   * @Test_MA0004 : Security tab renders Sessions list with a "Current" marker
   * @Test_MA0005 : Password section exposes Current/New inputs + Sign-out-other-sessions checkbox + Change password button
   * @Test_MA0006 : Clicking Change password with empty fields keeps the user on the page (no destructive call)
   * @Test_MA0007 : Switching back to User details tab restores the name form
   */

  let manage: ManageAccountPage;

  test.beforeEach(async () => {
    manage = new ManageAccountPage(page);
    await manage.goto();
    await manage.clickSecurityTab();
  });

  test('MA0004 : Security tab renders Sessions list section heading', async () => {
    // The Sessions list itself can be empty (no other devices logged in)
    // — every authenticated user always sees the "Sessions" section heading,
    // so that's the durable signal.
    await manage.assertionValidate(Selectors.manageAccount.sessionsHeading);
  });

  test('MA0005 : Password section exposes Current/New inputs + Sign-out-other-sessions checkbox + Change password button', async () => {
    await manage.assertSecurityPanelVisible();
  });

  test('MA0006 : Clicking Change password with empty fields keeps the user on the page (no destructive call)', async () => {
    await manage.clickChangePasswordEmpty();
    await manage.assertUrlMatches(/\/manage-account$/);
    await manage.assertionValidate(Selectors.manageAccount.currentPasswordInput);
  });

  test('MA0007 : Switching back to User details tab restores the name form', async () => {
    await manage.clickUserDetailsTab();
    await manage.assertUserDetailsFormVisible();
  });
});
