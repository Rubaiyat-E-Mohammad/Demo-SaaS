import { Browser, BrowserContext, Page, test, chromium } from '@playwright/test';
import { NewTicketPage } from '../pages/newTicket.ts';
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
    throw new Error('New-ticket tests need an organization slug; sign-in did not capture one.');
  }
});

test.afterAll(async () => {
  await context?.close();
  await browser?.close();
});

test.describe('New Ticket — Form rendering & validation', () => {

  /**
   * @Test_Scenarios : [NEW TICKET FORM — UI & VALIDATION]
   * @Test_NT0001 : The submit form renders all four required fields
   * @Test_NT0002 : Submitting an empty form shows validation errors on every field
   * @Test_NT0003 : Submitting with a malformed reported-by email shows "Invalid email"
   */

  let newTicket: NewTicketPage;

  test.beforeEach(async () => {
    newTicket = new NewTicketPage(page, slug);
    await newTicket.goto();
  });

  test('NT0001 : The submit form renders all four required fields', async () => {
    await newTicket.assertionValidate('role=textbox[name="Reported by (email)"]');
    await newTicket.assertionValidate('role=textbox[name="Your name"]');
    await newTicket.assertionValidate('role=textbox[name="Title"]');
    await newTicket.assertionValidate('role=textbox[name="Description"]');
    await newTicket.assertionValidate('role=button[name="Submit"]');
  });

  test('NT0002 : Submitting an empty form shows validation errors on every field', async () => {
    await newTicket.submit();
    await newTicket.assertAllValidationErrorsVisible();
    // URL is unchanged — server was never hit.
    await newTicket.assertUrlMatches(new RegExp(`/${slug}/tickets/new$`));
  });

  test('NT0003 : Submitting with a malformed reported-by email shows "Invalid email"', async () => {
    await newTicket.fillReportedBy('notanemail');
    await newTicket.fillYourName('QA Bot');
    await newTicket.fillTitle('Will not submit');
    await newTicket.fillDescription('Email regex should block this.');
    await newTicket.submit();
    await newTicket.assertInvalidEmailErrorVisible();
    await newTicket.assertUrlMatches(new RegExp(`/${slug}/tickets/new$`));
  });
});

test.describe('New Ticket — Successful submission', () => {

  /**
   * @Test_Scenarios : [NEW TICKET FORM — SUCCESS]
   * @Test_NT0004 : Valid submission shows the success toast and lands on the new ticket's detail page
   */

  let newTicket: NewTicketPage;

  test.beforeEach(async () => {
    newTicket = new NewTicketPage(page, slug);
    await newTicket.goto();
  });

  test('NT0004 : Valid submission shows the success toast and lands on the new ticket\'s detail page', async () => {
    const stamp = Date.now();
    await newTicket.submitTicket({
      email: 'qa-bot@example.com',
      name: 'QA Bot',
      title: `NT0004 e2e probe ${stamp}`,
      description: 'Created by Playwright e2e/tests/newTicket.spec.ts',
    });
    await newTicket.assertSuccessToastVisible();
    await newTicket.assertOnDetailPage();
  });
});
