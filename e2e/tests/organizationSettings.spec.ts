import { Browser, BrowserContext, Page, test, chromium } from '@playwright/test';
import { OrganizationSettingsPage } from '../pages/organizationSettings.ts';
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
    throw new Error('Organization-settings tests need a logged-in user with an organization.');
  }
});

test.afterAll(async () => {
  await context?.close();
  await browser?.close();
});

test.describe('Organization Settings — Members roster', () => {

  /**
   * @Test_Scenarios : [ORGANIZATION SETTINGS — MEMBERS]
   * @Test_OS0001 : Page renders the "Organization members" heading and an "Add member" button
   * @Test_OS0002 : Logged-in user is listed as an Admin in the members roster
   * @Test_OS0003 : "Add member" opens a dialog with Email + Role inputs and submit button
   * @Test_OS0004 : Submitting the Add Member dialog with empty email shows "Invalid email"
   * @Test_OS0005 : Submitting with a malformed email shows "Invalid email" without sending the invite
   * @Test_OS0006 : Role dropdown exposes both Admin and Member options
   * @Test_OS0007 : Closing the dialog removes it from the DOM
   */

  let settings: OrganizationSettingsPage;

  test.beforeEach(async () => {
    settings = new OrganizationSettingsPage(page, slug);
    await settings.goto();
  });

  test('OS0001 : Page renders the "Organization members" heading and an "Add member" button', async () => {
    // Asserted in `goto()` already; restate to make the test self-documenting.
    await settings.assertionValidate('text=Organization members');
    await settings.assertionValidate('role=button[name="Add member"]');
  });

  test('OS0002 : Logged-in user is listed as an Admin in the members roster', async () => {
    await settings.assertMemberVisibleByEmail(Credentials.valid.email);
    await settings.assertAdminRoleBadgeVisible();
  });

  test('OS0003 : "Add member" opens a dialog with Email + Role inputs and submit button', async () => {
    await settings.openAddMemberDialog();
    await settings.assertionValidate('[role="dialog"] input[name="email"]');
    await settings.assertionValidate('[role="dialog"] input[placeholder="Select role"]');
    await settings.assertionValidate('[role="dialog"] button:has-text("Add member")');
    await settings.closeAddMemberDialog();
  });

  test('OS0004 : Submitting the Add Member dialog with empty email shows "Invalid email"', async () => {
    await settings.openAddMemberDialog();
    await settings.submitAddMember();
    await settings.assertInvalidEmailErrorVisible();
    await settings.closeAddMemberDialog();
  });

  test('OS0005 : Submitting with a malformed email shows "Invalid email" without sending the invite', async () => {
    await settings.openAddMemberDialog();
    await settings.fillDialogEmail('notanemail');
    await settings.submitAddMember();
    await settings.assertInvalidEmailErrorVisible();
    // Dialog stays open — proves the form blocked the invite call.
    await settings.assertionValidate(`[role="dialog"]`);
    await settings.closeAddMemberDialog();
  });

  test('OS0006 : Role dropdown exposes both Admin and Member options', async () => {
    await settings.openAddMemberDialog();
    await settings.openRoleDropdown();
    await settings.assertRoleOptionsAvailable();
    await settings.closeAddMemberDialog();
  });

  test('OS0007 : Closing the dialog removes it from the DOM', async () => {
    await settings.openAddMemberDialog();
    await settings.closeAddMemberDialog();
    await settings.assertDialogDetached();
  });
});
