import { type Page } from '@playwright/test';
import { HelperFunctions } from '../utils/helperFunctions.ts';
import { Selectors } from '../utils/selectors.ts';

/**
 * Organization-settings page at `/<slug>/settings` — shows the org members
 * roster and exposes the "Add member" dialog. Read-only assertions only: we
 * do not actually invite real members, since the test account is shared.
 */
export class OrganizationSettingsPage extends HelperFunctions {
  readonly slug: string;

  constructor(page: Page, slug: string) {
    super(page);
    this.slug = slug;
  }

  /*************** @Navigation ***************/

  async goto() {
    await this.navigateToURL(this.organizationSettingsPage(this.slug));
    await this.assertionValidate(Selectors.organizationSettings.pageHeading);
    await this.assertionValidate(Selectors.organizationSettings.addMemberButton);
  }

  /*************** @Members list ***************/

  async assertMemberVisibleByEmail(email: string) {
    await this.assertionValidate(Selectors.organizationSettings.memberRowByEmail(email));
  }

  /*************** @Add-member dialog ***************/

  async openAddMemberDialog() {
    await this.validateAndClick(Selectors.organizationSettings.addMemberButton);
    await this.assertionValidate(Selectors.organizationSettings.addMemberDialog);
  }

  async submitAddMember() {
    await this.validateAndClick(Selectors.organizationSettings.dialogSubmitButton);
  }

  async fillDialogEmail(email: string) {
    await this.validateAndFillStrings(Selectors.organizationSettings.dialogEmailInput, email);
  }

  async assertInvalidEmailErrorVisible() {
    await this.assertionValidate(Selectors.organizationSettings.dialogInvalidEmailError);
  }

  async closeAddMemberDialog() {
    await this.validateAndClick(Selectors.organizationSettings.dialogCloseButton);
    await this.assertElementCount(Selectors.organizationSettings.addMemberDialog, 0);
  }

  async assertDialogDetached() {
    await this.assertElementCount(Selectors.ticketDetail.dialogCss, 0);
  }

  async openRoleDropdown() {
    await this.validateAndClick(Selectors.organizationSettings.dialogRoleInput);
  }

  /**
   * Assert both Admin and Member roles are listed when the dropdown is open.
   * Caller must call `openRoleDropdown` first.
   */
  async assertRoleOptionsAvailable() {
    await this.assertionValidate(Selectors.organizationSettings.roleOptionAdmin);
    await this.assertionValidate(Selectors.organizationSettings.roleOptionMember);
  }

  async assertAdminRoleBadgeVisible() {
    await this.validateAny(Selectors.ticketsList.adminRoleLabel);
  }
}
