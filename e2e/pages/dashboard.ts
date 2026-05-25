import { type Page } from '@playwright/test';
import { HelperFunctions } from '../utils/helperFunctions.ts';
import { Selectors } from '../utils/selectors.ts';

/**
 * Tickets-list dashboard at `/<slug>/tickets` — the post-login landing page
 * for any user with at least one organization.
 */
export class DashboardPage extends HelperFunctions {
  readonly slug: string;

  constructor(page: Page, slug: string) {
    super(page);
    this.slug = slug;
  }

  /*************** @Navigation ***************/

  async goto() {
    await this.navigateToURL(this.ticketsListPage(this.slug));
    await this.assertCoreElementsVisible();
  }

  /*************** @Assertions ***************/

  async assertCoreElementsVisible() {
    await this.assertionValidate(Selectors.ticketsList.searchInput);
    await this.assertionValidate(Selectors.ticketsList.statusFilter);
    await this.assertionValidate(Selectors.ticketsList.newTicketLink);
    await this.assertionValidate(Selectors.postLoginNav.userMenuTrigger);
    await this.assertionValidate(Selectors.postLoginNav.orgSwitcherTrigger);
  }

  async assertHeaderTabsVisible() {
    await this.assertionValidate(Selectors.ticketsList.headerTicketsTab);
    await this.assertionValidate(Selectors.ticketsList.headerSettingsTab);
  }

  async assertSideNavVisible() {
    await this.assertionValidate(Selectors.ticketsList.sideNavTickets);
    await this.assertionValidate(Selectors.ticketsList.sideNavOrganizationSettings);
    await this.assertionValidate(Selectors.ticketsList.sideNavManageAccount);
    await this.assertionValidate(Selectors.ticketsList.sideNavSignOut);
  }

  /**
   * After "Import example tickets" the org contains 17 seeded rows
   * (`Session timeout not working correctly`, `Dark mode not working …`, …).
   * The list paginates 10 per page and is sorted newest-first; over time
   * E2E test runs append more rows (via the public new-ticket form) which
   * push the seeds onto page 2. Search for a distinctive seeded phrase to
   * guarantee the row is rendered before we anchor on it.
   */
  async assertSeedTicketVisible(seededTitle = 'Session timeout not working correctly') {
    await this.search(seededTitle);
    await this.assertionValidate(Selectors.ticketsList.ticketRowByTitle(seededTitle));
  }

  /*************** @Search & Filter ***************/

  /**
   * Fill the search box, hit Enter, then await the table-refetch network call
   * so the DOM has settled before the caller reads rows. The app calls
   * `tickets.getList` with the new search param embedded in `input=...`.
   */
  async search(text: string) {
    await this.fillSubmitAndWaitForResponse(
      Selectors.ticketsList.searchInput,
      text,
      'tickets.getList',
    );
  }

  async clearSearch() {
    await this.validateAndFillStrings(Selectors.ticketsList.searchInput, '');
    await this.waitForLoading();
  }

  async openStatusFilter() {
    await this.validateAndClick(Selectors.ticketsList.statusFilter);
  }

  async pickStatusFilter(value: 'Any' | 'New' | 'In Progress' | 'Resolved' | 'Closed') {
    await this.openStatusFilter();
    await this.clickAndWaitForResponse(
      Selectors.ticketsList.statusFilterOption(value),
      'tickets.getList',
    );
  }

  /*************** @Row interactions ***************/

  async openTicketByTitle(title: string) {
    await this.validateAndClick(Selectors.ticketsList.ticketRowByTitle(title));
    // Detail dialog opens with role=dialog; let caller assert.
  }

  async clickNewTicket() {
    await this.validateAndClick(Selectors.ticketsList.newTicketLink);
  }

  /*************** @Header / nav clicks ***************/

  async clickHeaderSettingsTab() {
    await this.validateAndClick(Selectors.ticketsList.headerSettingsTab);
  }

  async clickHeaderTicketsTab() {
    await this.validateAndClick(Selectors.ticketsList.headerTicketsTab);
  }

  /**
   * Read the number of ticket rows currently rendered in the table body.
   * Used to assert search / filter narrowed the list down.
   */
  async ticketRowCount(): Promise<number> {
    return this.getElementCount(Selectors.ticketsList.statusBadgeAny);
  }

  async getAllRowStatusTexts(): Promise<string[]> {
    return this.getAllTextContents(Selectors.ticketsList.statusBadgeAny);
  }

  async assertActiveHeaderTab(label: string) {
    await this.checkElementText(Selectors.ticketsList.headerActiveTab, label);
  }
}
