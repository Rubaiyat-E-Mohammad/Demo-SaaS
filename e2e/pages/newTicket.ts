import { expect, type Page } from '@playwright/test';
import { HelperFunctions } from '../utils/helperFunctions.ts';
import { Selectors } from '../utils/selectors.ts';



/**
 * Customer-facing "Submit new ticket" form at `/<slug>/tickets/new`. The page
 * is anonymous-accessible — it's the public submission URL printed on the
 * "Create organization" success screen. Authenticated dashboard users land
 * here when they click the "New" button on the tickets list.
 */
export class NewTicketPage extends HelperFunctions {
  readonly slug: string;

  constructor(page: Page, slug: string) {
    super(page);
    this.slug = slug;
  }

  /*************** @Navigation ***************/

  async goto() {
    await this.navigateToURL(this.newTicketPage(this.slug));
    await this.assertionValidate(Selectors.newTicket.pageHeading);
    await this.assertionValidate(Selectors.newTicket.submitButton);
  }

  /*************** @Form fill ***************/

  async fillReportedBy(email: string) {
    await this.validateAndFillStrings(Selectors.newTicket.reportedByInput, email);
  }

  async fillYourName(name: string) {
    await this.validateAndFillStrings(Selectors.newTicket.yourNameInput, name);
  }

  async fillTitle(title: string) {
    await this.validateAndFillStrings(Selectors.newTicket.titleInput, title);
  }

  async fillDescription(body: string) {
    await this.validateAndFillStrings(Selectors.newTicket.descriptionInput, body);
  }

  async submit() {
    await this.validateAndClick(Selectors.newTicket.submitButton);
  }

  /** Fill all four required fields, then submit. */
  async submitTicket(form: { email: string; name: string; title: string; description: string }) {
    await this.fillReportedBy(form.email);
    await this.fillYourName(form.name);
    await this.fillTitle(form.title);
    await this.fillDescription(form.description);
    await this.submit();
  }

  /*************** @Assertions ***************/

  async assertAllValidationErrorsVisible() {
    await this.assertionValidate(Selectors.newTicket.invalidEmailError);
    // Three "String must contain at least 1 character(s)" errors — one per
    // missing required text field.
    expect(await this.getElementCount(Selectors.newTicket.requiredLengthError)).toBeGreaterThanOrEqual(3);
  }

  async assertInvalidEmailErrorVisible() {
    await this.assertionValidate(Selectors.newTicket.invalidEmailError);
  }

  async assertSuccessToastVisible() {
    await this.assertionValidate(Selectors.newTicket.successToast);
  }

  async assertOnDetailPage() {
    await this.assertUrlMatches(/\/tickets\/[a-z0-9]+$/);
    await this.assertionValidate(Selectors.newTicket.detailIdLabel);
  }
}
