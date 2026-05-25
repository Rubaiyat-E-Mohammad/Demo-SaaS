import { expect, type Page } from '@playwright/test';
import { Selectors } from '../utils/selectors.ts';
import { HelperFunctions } from '../utils/helperFunctions.ts';

export class SignInPage extends HelperFunctions {
  constructor(page: Page) {
    super(page);
  }

  /*************** @Navigation ***************/

  async goto() {
    await this.navigateToURL(this.signInPage);
    // State-based readiness: the form is interactive only once these resolve.
    await this.assertionValidate(Selectors.signIn.emailInput);
    await this.assertionValidate(Selectors.signIn.submitButton);
  }

  /*************** @Form fill ***************/

  async fillEmail(email: string) {
    await this.validateAndFillStrings(Selectors.signIn.emailInput, email);
  }

  async fillPassword(password: string) {
    await this.validateAndFillStrings(Selectors.signIn.passwordInput, password);
  }

  async submit() {
    await this.validateAndClick(Selectors.signIn.submitButton);
  }

  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  /**
   * Fill credentials, submit, and await the auth POST so the test knows the
   * backend has responded before asserting on the resulting UI state.
   */
  async loginAndAwaitAuth(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    const authResponse = this.page
      .waitForResponse(
        (res) =>
          res.url().includes('/api/auth/sign-in/email') &&
          res.request().method() === 'POST',
        { timeout: 30_000 },
      )
      .catch(() => null);
    await this.submit();
    await authResponse;
  }

  async togglePasswordVisibility() {
    await this.validateAndClick(Selectors.signIn.passwordToggle);
  }

  /*************** @Assertions used by spec ***************/

  async assertCoreElementsVisible() {
    await this.assertionValidate(Selectors.signIn.emailInput);
    await this.assertionValidate(Selectors.signIn.passwordInput);
    await this.assertionValidate(Selectors.signIn.submitButton);
    await this.assertionValidate(Selectors.signIn.forgotPasswordLink);
    await this.assertionValidate(Selectors.signIn.signUpLink);
    await this.assertionValidate(Selectors.signIn.continueWithEmailLink);
    await this.assertionValidate(Selectors.signIn.continueWithGoogleButton);
  }

  async assertInvalidEmailErrorVisible() {
    await this.assertionValidate(Selectors.signIn.invalidEmailError);
  }

  async assertLoginRejected() {
    await this.assertionValidate(Selectors.signIn.loginRejectedError);
  }

  async assertPasswordFieldType(expected: 'password' | 'text') {
    const actual = await this.page
      .locator(Selectors.signIn.passwordInput)
      .getAttribute('type');
    expect(actual).toBe(expected);
    console.log('\x1b[34m%s\x1b[0m', `✅ Password field type = "${expected}"`);
  }

  async assertWelcomeMessageVisible() {
    await this.assertionValidate(Selectors.signIn.welcomeMessage);
  }

  /*************** @Footer / SSO clicks ***************/

  async clickForgotPassword() {
    await this.validateAndClick(Selectors.signIn.forgotPasswordLink);
  }

  async clickSignUp() {
    await this.validateAndClick(Selectors.signIn.signUpLink);
  }

  async clickContinueWithEmail() {
    await this.validateAndClick(Selectors.signIn.continueWithEmailLink);
  }
}
