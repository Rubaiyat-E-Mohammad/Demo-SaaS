import { type Page } from '@playwright/test';
import { HelperFunctions } from '../utils/helperFunctions.ts';
import { Selectors } from '../utils/selectors.ts';

/**
 * Manage-account page at `/manage-account` — non-org-scoped user profile
 * surface with two tabs:
 *   - User details: First name / Last name + Save
 *   - Security:     Sessions list (with revoke) + Change-password form
 *
 * Destructive flows (real password change, real session revoke) are NOT
 * exercised — the test account is shared, so we only verify the form
 * surfaces, the tab switching, and form-validation behaviour.
 */
export class ManageAccountPage extends HelperFunctions {
  constructor(page: Page) {
    super(page);
  }

  /*************** @Navigation ***************/

  async goto() {
    await this.navigateToURL(this.manageAccountPage);
    await this.assertionValidate(Selectors.manageAccount.pageHeading);
    await this.assertionValidate(Selectors.manageAccount.userDetailsTab);
  }

  /*************** @Tabs ***************/

  async clickSecurityTab() {
    await this.validateAndClick(Selectors.manageAccount.securityTab);
    await this.assertionValidate(Selectors.manageAccount.passwordHeading);
  }

  async clickUserDetailsTab() {
    await this.validateAndClick(Selectors.manageAccount.userDetailsTab);
    await this.assertionValidate(Selectors.manageAccount.firstNameInput);
  }

  /*************** @User-details tab ***************/

  async assertUserDetailsFormVisible() {
    await this.assertionValidate(Selectors.manageAccount.firstNameInput);
    await this.assertionValidate(Selectors.manageAccount.lastNameInput);
    await this.assertionValidate(Selectors.manageAccount.saveButton);
  }

  async getFirstName(): Promise<string> {
    return this.getInputValue(Selectors.manageAccount.firstNameInput);
  }

  async getLastName(): Promise<string> {
    return this.getInputValue(Selectors.manageAccount.lastNameInput);
  }

  async assertTabsVisible() {
    await this.assertionValidate(Selectors.manageAccount.userDetailsTab);
    await this.assertionValidate(Selectors.manageAccount.securityTab);
  }

  /*************** @Security tab ***************/

  async assertSecurityPanelVisible() {
    await this.assertionValidate(Selectors.manageAccount.sessionsHeading);
    // currentSessionMarker is intentionally NOT asserted here — sessions
    // list can be empty when the account has no other authenticated devices.
    await this.assertionValidate(Selectors.manageAccount.passwordHeading);
    await this.assertionValidate(Selectors.manageAccount.currentPasswordInput);
    await this.assertionValidate(Selectors.manageAccount.newPasswordInput);
    await this.assertionValidate(Selectors.manageAccount.signOutOtherSessionsCheckbox);
    await this.assertionValidate(Selectors.manageAccount.changePasswordButton);
  }

  /**
   * Click "Change password" with empty fields — expect the form to refuse
   * submission and remain on the page. Used as a non-destructive surface
   * check (we never submit valid credentials, which would rotate the
   * shared test password).
   */
  async clickChangePasswordEmpty() {
    await this.validateAndClick(Selectors.manageAccount.changePasswordButton);
  }
}
