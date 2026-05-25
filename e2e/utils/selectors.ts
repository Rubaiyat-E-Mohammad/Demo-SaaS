/**
 * Central locator store. Single nested `Selectors` const, per-feature groups.
 * Locator strings — Playwright's `page.locator()` auto-detects role/CSS/XPath/text.
 * Dynamic locators expose arrow-function factories (`xyz: (arg: string) => '…'`).
 */
export const Selectors = {
  /*** Sign-in Selectors ***/
  signIn: {
    emailInput: 'role=textbox[name="Email"]',
    // Find the password input via the visibility-toggle's sibling structure so the
    // locator survives the toggle flipping `type` between password/text.
    passwordInput: '//button[contains(@class,"mantine-PasswordInput-visibilityToggle")]/ancestor::*[contains(@class,"mantine-PasswordInput-root")]//input',
    submitButton: 'form button[type="submit"]',
    passwordToggle: '.mantine-PasswordInput-visibilityToggle',

    forgotPasswordLink: 'role=link[name="Forgot password?"]',
    signUpLink: '//p[contains(normalize-space(.),"Don\'t have an account")]//a[normalize-space()="Sign up"]',
    continueWithEmailLink: 'role=link[name="Continue with Email"]',
    continueWithGoogleButton: 'role=button[name="Continue with Google"]',

    invalidEmailError: 'text=Invalid email',
    // App returns either the credential error or the per-IP rate-limit notice —
    // both prove the user is NOT signed in. text= engine lands on smallest match.
    loginRejectedError: 'text=/Invalid email or password|Too many requests/',
    welcomeMessage: 'text=Welcome to Demo SaaS',
  },
} as const;
