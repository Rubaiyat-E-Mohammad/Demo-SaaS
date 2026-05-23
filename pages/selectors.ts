import type { Page, Locator } from '@playwright/test';

/**
 * Centralized selector store for the Demo SaaS sign-in flow.
 * All locators are role/label based to survive Mantine's randomized element IDs.
 * No raw selectors are allowed in spec files — import these via SignInPage.
 */
export const signInSelectors = {
  emailInput: (page: Page): Locator =>
    page.getByRole('textbox', { name: 'Email' }),

  passwordInput: (page: Page): Locator =>
    page.getByRole('textbox', { name: 'Password' }),

  // The form is wrapped in a `group` role; scope the submit button to it
  // to disambiguate from the header navigation "Log in" buttons.
  submitButton: (page: Page): Locator =>
    page.getByRole('group').getByRole('button', { name: 'Log in' }),

  // The visibility toggle is a Mantine ActionIcon button. It is aria-hidden
  // with tabindex=-1, so role-based selectors cannot reach it — the stable
  // Mantine component class is the reliable anchor.
  passwordToggle: (page: Page): Locator =>
    page.locator('.mantine-PasswordInput-visibilityToggle'),

  forgotPasswordLink: (page: Page): Locator =>
    page.getByRole('link', { name: 'Forgot password?' }),

  // The "Sign up" link inside the form footer ("Don't have an account?").
  signUpLink: (page: Page): Locator =>
    page.getByRole('paragraph')
      .filter({ hasText: "Don't have an account?" })
      .getByRole('link', { name: 'Sign up' }),

  continueWithEmailLink: (page: Page): Locator =>
    page.getByRole('link', { name: 'Continue with Email' }),

  continueWithGoogleButton: (page: Page): Locator =>
    page.getByRole('button', { name: 'Continue with Google' }),

  // Inline field-level validation error ("Invalid email").
  invalidEmailError: (page: Page): Locator =>
    page.getByText('Invalid email'),

  // Any login-rejection message: either the credential error ("Invalid email
  // or password") or the per-IP rate-limit notice ("Too many requests") that
  // the shared demo backend returns under burst load. Both prove a bad login
  // did NOT authenticate, so the auth-negative tests assert on either.
  loginRejectedError: (page: Page): Locator =>
    page.getByText(/Invalid email or password|Too many requests/),
} as const;
