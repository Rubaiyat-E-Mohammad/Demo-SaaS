import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { signInSelectors } from './selectors.ts';
import { urls } from '../utils/testData.ts';

/**
 * Page Object for the Demo SaaS sign-in page.
 * Encapsulates all interactions; spec files must go through these methods
 * and never touch raw locators directly. All locators resolve via the
 * centralized `signInSelectors` store.
 */
export class SignInPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly passwordToggle: Locator;
  readonly forgotPasswordLink: Locator;
  readonly signUpLink: Locator;
  readonly continueWithEmailLink: Locator;
  readonly continueWithGoogleButton: Locator;
  readonly invalidEmailError: Locator;
  readonly loginRejectedError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = signInSelectors.emailInput(page);
    this.passwordInput = signInSelectors.passwordInput(page);
    this.submitButton = signInSelectors.submitButton(page);
    this.passwordToggle = signInSelectors.passwordToggle(page);
    this.forgotPasswordLink = signInSelectors.forgotPasswordLink(page);
    this.signUpLink = signInSelectors.signUpLink(page);
    this.continueWithEmailLink = signInSelectors.continueWithEmailLink(page);
    this.continueWithGoogleButton = signInSelectors.continueWithGoogleButton(page);
    this.invalidEmailError = signInSelectors.invalidEmailError(page);
    this.loginRejectedError = signInSelectors.loginRejectedError(page);
  }

  /** Navigate to the sign-in page and wait for the form to be interactive. */
  async goto(): Promise<void> {
    // The target is a React SPA whose initial document triggers a client-side
    // redirect that aborts the in-flight navigation request (net::ERR_ABORTED;
    // "maybe frame was detached?"). The redirect itself still lands on a valid
    // /sign-in document, so the abort is recoverable. Retry the navigation on
    // that specific error, letting the page settle between attempts; if every
    // attempt still aborts, fall through — the element waits below are the
    // real readiness gate and pass once the redirected document has rendered.
    // Non-abort errors are re-thrown immediately.
    const maxAttempts = 4;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await this.page.goto(urls.signIn, { waitUntil: 'domcontentloaded' });
        break;
      } catch (error) {
        const message = (error as Error).message ?? '';
        if (!message.includes('ERR_ABORTED')) {
          throw error;
        }
        // Let the aborted redirect settle before retrying / falling through.
        await this.page.waitForLoadState('domcontentloaded').catch(() => {});
      }
    }
    // Real state-based wait: the form is interactive only once these resolve.
    // Timeout is generous so a slow post-redirect render surfaces as a precise
    // assertion failure rather than a flake.
    await expect(this.emailInput).toBeVisible({ timeout: 20_000 });
    await expect(this.submitButton).toBeVisible({ timeout: 20_000 });
  }

  /** Fill the email field. */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /** Fill the password field. */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /** Click the form's "Log in" submit button. */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /** Fill credentials and submit in one step. */
  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  /**
   * Fill credentials and submit. The auth POST to `/api/auth/sign-in/email`
   * is awaited so the test knows the backend has responded, but callers must
   * still assert on the resulting UI state (error message or redirect) with a
   * generous timeout — the React app updates the DOM after the response, and
   * that gap widens when multiple browser projects run concurrently.
   */
  async loginAndAwaitAuth(email: string, password: string): Promise<void> {
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

  /** Resolved `type` attribute of the password input ("password" | "text"). */
  async passwordFieldType(): Promise<string | null> {
    return this.passwordInput.getAttribute('type');
  }

  /** Click the password visibility toggle button. */
  async togglePasswordVisibility(): Promise<void> {
    await this.passwordToggle.click();
  }
}
