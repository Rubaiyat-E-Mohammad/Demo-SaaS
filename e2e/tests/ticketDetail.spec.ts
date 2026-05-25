import { Browser, BrowserContext, Page, test, expect, chromium } from '@playwright/test';
import { DashboardPage } from '../pages/dashboard.ts';
import { TicketDetailPage } from '../pages/ticketDetail.ts';
import { Session } from '../pages/session.ts';
import { Credentials } from '../utils/testData.ts';

let browser: Browser;
let context: BrowserContext;
let page: Page;
let slug = '';

const SEEDED_TICKET_TITLE = 'Session timeout not working correctly';
const SEEDED_TICKET_STATUS = 'In Progress';

test.beforeAll(async () => {
  browser = await chromium.launch({ headless: process.env.HEADED !== '1' });
  context = await browser.newContext();
  page = await context.newPage();
  const session = new Session(page);
  slug = await session.signInAndCaptureSlug(Credentials.valid.email, Credentials.valid.password);
  if (!slug) {
    throw new Error('Ticket-detail tests require an organization to read seeded tickets from.');
  }
});

test.afterAll(async () => {
  await context?.close();
  await browser?.close();
});

test.describe('Ticket Detail — Dialog open / close & layout', () => {

  /**
   * @Test_Scenarios : [TICKET DETAIL]
   * @Test_TK0001 : Clicking a ticket row opens the detail dialog with all core fields
   * @Test_TK0002 : URL gains ?selectedId=<id> while the dialog is open
   * @Test_TK0003 : Dialog status button shows the ticket's current status
   * @Test_TK0004 : Opening the status menu reveals all four status options
   * @Test_TK0005 : Close (X) button closes the dialog and clears ?selectedId
   * @Test_TK0006 : Empty ticket shows "No comments yet" placeholder and comment input
   */

  let dashboard: DashboardPage;
  let detail: TicketDetailPage;

  test.beforeEach(async () => {
    dashboard = new DashboardPage(page, slug);
    detail = new TicketDetailPage(page);
    await dashboard.goto();
    // Earlier runs of NT0004 / AT0001 add new tickets to this shared org,
    // pushing the seed ticket onto page 2+. Search-filter the list so the
    // seed row is reliably on page 1 before we click it.
    await dashboard.search(SEEDED_TICKET_TITLE);
    await dashboard.openTicketByTitle(SEEDED_TICKET_TITLE);
    await detail.assertOpen();
  });

  test.afterEach(async () => {
    // Defensive: close the dialog so it doesn't carry across tests.
    if (await detail.isDialogOpen()) {
      await detail.closeViaEscape();
    }
  });

  test('TK0001 : Clicking a ticket row opens the detail dialog with all core fields', async () => {
    await detail.assertTitleVisible(SEEDED_TICKET_TITLE);
    await detail.assertCoreFieldsVisible();
  });

  test('TK0002 : URL gains ?selectedId=<id> while the dialog is open', async () => {
    expect(detail.getUrlSearchParam('selectedId')).toMatch(/^[a-z0-9]+$/);
  });

  test('TK0003 : Dialog status button shows the ticket\'s current status', async () => {
    await detail.assertCurrentStatus(SEEDED_TICKET_STATUS);
  });

  test('TK0004 : Opening the status menu reveals all four status options', async () => {
    await detail.openStatusMenu();
    await detail.assertStatusOptions(['New', 'In Progress', 'Resolved', 'Closed']);
    await detail.closeStatusMenu();
  });

  test('TK0005 : Close (X) button closes the dialog and clears ?selectedId', async () => {
    await detail.close();
    expect(detail.getUrlSearchParam('selectedId')).toBeNull();
  });

  test('TK0006 : Empty ticket shows "No comments yet" placeholder and comment input', async () => {
    // Seeded SEEDED_TICKET has 0 comments — verify the empty-state UI.
    await detail.assertNoCommentsState();
    await detail.assertCommentInputVisible();
  });
});
