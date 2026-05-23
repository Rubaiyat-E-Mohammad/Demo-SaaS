import { test, expect } from '@playwright/test';
import { SignInPage } from '../pages/SignInPage.ts';
import { credentials, urls } from '../utils/testData.ts';
import { useSingleBrowser } from '../utils/singleBrowser.ts';

/**
 * E2E coverage for the Demo SaaS sign-in flow.
 * Target: https://demo-saas.bugbug.io/sign-in
 * Every test title is prefixed with its feature id (SIxxxx); those ids are
 * registered in feature-map/feature-map.yml and read by the reporter.
 * All element access goes through the SignInPage Page Object.
 *
 * Browser lifecycle: useSingleBrowser() launches ONE browser for this whole
 * spec file, shares its page across every test, and closes it once at the
 * end — no per-test browser open/close. Tests therefore run serially.
 *
 * The suite is split into two groups:
 *  - "UI and validation" — stateless, client-side checks.
 *  - "Authentication" — each test makes a real auth API call; spaced apart so
 *    the shared demo backend does not rate-limit the sign-in attempts.
 */

const getPage = useSingleBrowser();

test.describe('Sign-in — UI and validation', () => {
  let signIn: SignInPage;

  test.beforeEach(async () => {
    signIn = new SignInPage(getPage());
    await signIn.goto();
  });

  // Sign-in page renders all core elements (smoke).
  test('SI0011 — user sees all core sign-in elements on page load', async () => {
    await expect(signIn.emailInput).toBeVisible();
    await expect(signIn.passwordInput).toBeVisible();
    await expect(signIn.submitButton).toBeVisible();
    await expect(signIn.forgotPasswordLink).toBeVisible();
    await expect(signIn.signUpLink).toBeVisible();
    await expect(signIn.continueWithEmailLink).toBeVisible();
    await expect(signIn.continueWithGoogleButton).toBeVisible();
  });

  // User submits an empty form (negative).
  test('SI0002 — user sees validation error when submitting an empty form', async () => {
    await signIn.submit();

    await expect(signIn.invalidEmailError).toBeVisible();
    await expect(getPage()).toHaveURL(/\/sign-in$/);
  });

  // User submits an invalid email format (negative / boundary).
  test('SI0003 — user sees validation error for an invalid email format', async () => {
    await signIn.fillEmail(credentials.invalidFormatEmail);
    await signIn.fillPassword(credentials.arbitraryPassword);
    await signIn.submit();

    await expect(signIn.invalidEmailError).toBeVisible();
    await expect(getPage()).toHaveURL(/\/sign-in$/);
  });

  // User submits with email only, no password (negative).
  test('SI0006 — user cannot log in with email only and no password', async () => {
    await signIn.fillEmail(credentials.valid.email);
    await signIn.submit();

    // The form must not authenticate without a password.
    await expect(getPage()).toHaveURL(/\/sign-in$/);
    await expect(signIn.emailInput).toBeVisible();
  });

  // User toggles password visibility (UI).
  test('SI0007 — user can toggle password field visibility', async () => {
    await signIn.fillPassword(credentials.arbitraryPassword);

    // Default state: password is masked.
    await expect(signIn.passwordInput).toHaveAttribute('type', 'password');

    // First toggle reveals the password as plain text.
    await signIn.togglePasswordVisibility();
    await expect(signIn.passwordInput).toHaveAttribute('type', 'text');

    // Second toggle masks it again.
    await signIn.togglePasswordVisibility();
    await expect(signIn.passwordInput).toHaveAttribute('type', 'password');
  });

  // Forgot password link navigates to the reset page (navigation).
  test('SI0008 — user navigates to the reset-password page via "Forgot password?"', async () => {
    await signIn.forgotPasswordLink.click();

    await getPage().waitForURL(`**${urls.resetPasswordPath}`);
    await expect(getPage()).toHaveURL(new RegExp(`${urls.resetPasswordPath}$`));
  });

  // Sign up link navigates to the sign-up page (navigation).
  test('SI0009 — user navigates to the sign-up page via the "Sign up" link', async () => {
    await signIn.signUpLink.click();

    await getPage().waitForURL(`**${urls.signUpPath}`);
    await expect(getPage()).toHaveURL(new RegExp(`${urls.signUpPath}$`));
  });

  // Continue with Email link navigates to the OTP page (navigation).
  test('SI0010 — user navigates to the email-OTP page via "Continue with Email"', async () => {
    await signIn.continueWithEmailLink.click();

    await getPage().waitForURL(`**${urls.emailOtpPath}`);
    await expect(getPage()).toHaveURL(new RegExp(`${urls.emailOtpPath}$`));
  });
});

test.describe('Sign-in — Authentication', () => {
  // Each test makes a real auth API call against the shared Demo SaaS backend,
  // which rate-limits bursts of sign-in attempts per IP. The tests run serially
  // (the whole file does) and are spaced apart so each real login attempt
  // stays under the throttle threshold. Retry twice to ride out a transient
  // throttle.
  test.describe.configure({ retries: 2 });

  // UI-outcome assertion budget. The overall test timeout is raised above it
  // so a slow render surfaces as a precise assertion failure, not a blunt
  // test timeout.
  const AUTH_UI_TIMEOUT = 20_000;
  test.setTimeout(120_000);

  // Counts auth tests that have already run in this block so each subsequent
  // login attempt can be spaced apart from the previous one.
  let authTestsRun = 0;

  let signIn: SignInPage;

  test.beforeEach(async ({}, testInfo) => {
    // The backend rate-limits consecutive sign-in attempts per IP. Space the
    // serial auth tests apart — and add extra spacing on retries — so each
    // real login attempt stays under the throttle threshold. The first auth
    // test needs no pause.
    //
    // This pause is a deliberate rate-limit cooldown, NOT a wait for app
    // state — so it uses a plain timer rather than page.waitForTimeout().
    const gap = 15_000 * authTestsRun + 15_000 * testInfo.retry;
    if (gap > 0) {
      await new Promise((resolve) => setTimeout(resolve, gap));
    }
    authTestsRun += 1;
    signIn = new SignInPage(getPage());
    await signIn.goto();
  });

  // User submits a valid email with the wrong password (negative).
  test('SI0004 — user sees auth error when password is wrong', async () => {
    await signIn.loginAndAwaitAuth(credentials.valid.email, credentials.wrongPassword);

    // The login must be rejected: the app shows either the credential error
    // or the backend rate-limit notice — both mean the user is NOT signed in.
    await expect(signIn.loginRejectedError).toBeVisible({ timeout: AUTH_UI_TIMEOUT });
    await expect(getPage()).toHaveURL(/\/sign-in$/);
  });

  // User submits an unregistered email (negative).
  test('SI0005 — user sees auth error when email is not registered', async () => {
    await signIn.loginAndAwaitAuth(credentials.unregisteredEmail, credentials.arbitraryPassword);

    await expect(signIn.loginRejectedError).toBeVisible({ timeout: AUTH_UI_TIMEOUT });
    await expect(getPage()).toHaveURL(/\/sign-in$/);
  });

  // User logs in with valid credentials (happy path).
  test('SI0001 — user logs in successfully with valid credentials', async () => {
    const page = getPage();
    await signIn.loginAndAwaitAuth(credentials.valid.email, credentials.valid.password);

    // Successful auth redirects away from /sign-in to the onboarding page.
    await page.waitForURL(`**${urls.onboardingPath}`, { timeout: AUTH_UI_TIMEOUT });
    await expect(page).toHaveURL(new RegExp(`${urls.onboardingPath}$`));
    await expect(page.getByText('Welcome to Demo SaaS')).toBeVisible({
      timeout: AUTH_UI_TIMEOUT,
    });
  });
});
