import { type Page } from '@playwright/test';
import { HelperFunctions } from '../utils/helperFunctions.ts';
import { Selectors } from '../utils/selectors.ts';

/**
 * Ticket-detail dialog opened by clicking a row on the dashboard, or the
 * full-page detail at `/<slug>/tickets/<id>`. Both surfaces use the same
 * dialog markup; selectors are scoped to `[role="dialog"]`.
 */
export class TicketDetailPage extends HelperFunctions {
  constructor(page: Page) {
    super(page);
  }

  /*************** @Assertions ***************/

  async assertOpen() {
    await this.assertionValidate(Selectors.ticketDetail.dialog);
  }

  async assertTitleVisible(title: string) {
    await this.assertionValidate(Selectors.ticketDetail.titleByText(title));
  }

  async assertCoreFieldsVisible() {
    await this.assertionValidate(Selectors.ticketDetail.statusButton);
    await this.assertionValidate(Selectors.ticketDetail.descriptionTextbox);
    await this.assertionValidate(Selectors.ticketDetail.idLabel);
    await this.assertionValidate(Selectors.ticketDetail.reportedByText);
    await this.assertionValidate(Selectors.ticketDetail.createdText);
    await this.assertionValidate(Selectors.ticketDetail.commentsHeading);
  }

  async assertCurrentStatus(expected: string) {
    await this.checkElementText(Selectors.ticketDetail.statusButton, expected);
  }

  async assertNoCommentsState() {
    await this.assertionValidate(Selectors.ticketDetail.noCommentsState);
  }

  async assertCommentInputVisible() {
    await this.assertionValidate(Selectors.ticketDetail.addCommentTextbox);
    await this.assertionValidate(Selectors.ticketDetail.sendCommentButton);
  }

  async assertStatusOptions(values: string[]) {
    for (const v of values) {
      await this.assertionValidate(Selectors.ticketDetail.comboboxOptionByText(v));
    }
    await this.assertElementCount(Selectors.ticketDetail.comboboxOption, values.length);
  }

  async assertDialogClosed() {
    await this.assertElementCount(Selectors.ticketDetail.dialog, 0);
  }

  async isDialogOpen(): Promise<boolean> {
    return (await this.getElementCount(Selectors.ticketDetail.dialog)) > 0;
  }

  /*************** @Status change ***************/

  async openStatusMenu() {
    await this.validateAndClick(Selectors.ticketDetail.statusButton);
    await this.assertionValidate(Selectors.ticketDetail.statusListbox);
  }

  async closeStatusMenu() {
    // Mantine combobox closes on outside click / Escape.
    await this.pressKey('Escape');
  }

  /*************** @Close ***************/

  async close() {
    await this.validateAndClick(Selectors.ticketDetail.closeDialogButton);
    await this.assertDialogClosed();
  }

  async closeViaEscape() {
    await this.pressKey('Escape');
  }
}
