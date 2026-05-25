import { Browser, BrowserContext, Page, test, expect, chromium } from '@playwright/test';
import { SignInPage } from '../pages/signIn.ts';
import { Credentials } from '../utils/testData.ts';

let browser: Browser;
let context: BrowserContext;
let page: Page;

test.beforeAll(async () => {
  browser = await chromium.launch({ headless: process.env.HEADED !== '1' });
  context = await browser.newContext();
  page = await context.newPage();
});

test.afterAll(async () => {
  await context?.close();
  await browser?.close();
});

test.describe('Sign-in — UI and validation', () => {

  /**
   * @Test_Scenarios : [SIGN-IN — UI & VALIDATION]
   * @Test_SI0011 : User sees all core sign-in elements on page load
   * @Test_SI0002 : User sees validation error when submitting an empty form
   * @Test_SI0003 : User sees validation error for an invalid email format
   * @Test_SI0006 : User cannot log in with email only and no password
   * @Test_SI0007 : User can toggle password field visibility
   * @Test_SI0008 : User navigates to the reset-password page via "Forgot password?"
   * @Test_SI0009 : User navigates to the sign-up page via the "Sign up" link
   * @Test_SI0010 : User navigates to the email-OTP page via "Continue with Email"
   */

  let signIn: SignInPage;

  test.beforeEach(async () => {
    signIn = new SignInPage(page);
    await signIn.goto();
  });

  test('SI0011 : User sees all core sign-in elements on page load', async () => {
    await signIn.assertCoreElementsVisible();
  });

  test('SI0002 : User sees validation error when submitting an empty form', async () => {
    await signIn.submit();
    await signIn.assertInvalidEmailErrorVisible();
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test('SI0003 : User sees validation error for an invalid email format', async () => {
    await signIn.login(Credentials.invalidFormatEmail, Credentials.arbitraryPassword);
    await signIn.assertInvalidEmailErrorVisible();
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test('SI0006 : User cannot log in with email only and no password', async () => {
    await signIn.fillEmail(Credentials.valid.email);
    await signIn.submit();
    await expect(page).toHaveURL(/\/sign-in$/);
    await signIn.assertionValidate('role=textbox[name="Email"]');
  });

  test('SI0007 : User can toggle password field visibility', async () => {
    await signIn.fillPassword(Credentials.arbitraryPassword);
    await signIn.assertPasswordFieldType('password');
    await signIn.togglePasswordVisibility();
    await signIn.assertPasswordFieldType('text');
    await signIn.togglePasswordVisibility();
    await signIn.assertPasswordFieldType('password');
  });

  test('SI0008 : User navigates to the reset-password page via "Forgot password?"', async () => {
    await signIn.clickForgotPassword();
    await page.waitForURL('**/reset-password');
    await expect(page).toHaveURL(/\/reset-password$/);
  });

  test('SI0009 : User navigates to the sign-up page via the "Sign up" link', async () => {
    await signIn.clickSignUp();
    await page.waitForURL('**/sign-up');
    await expect(page).toHaveURL(/\/sign-up$/);
  });

  test('SI0010 : User navigates to the email-OTP page via "Continue with Email"', async () => {
    await signIn.clickContinueWithEmail();
    await page.waitForURL('**/email-otp');
    await expect(page).toHaveURL(/\/email-otp$/);
  });
});

test.describe('Sign-in — Authentication', () => {

  /**
   * @Test_Scenarios : [SIGN-IN — AUTH]
   * @Test_SI0001 : User logs in successfully with valid credentials
   * @Test_SI0004 : User sees auth error when password is wrong
   * @Test_SI0005 : User sees auth error when email is not registered
   *
   * Each test fires a real auth POST against the shared Demo SaaS backend, which
   * rate-limits bursts per IP. SI0001 runs first while the quota is fresh; the
   * negative tests tolerate either the credential error or the rate-limit notice.
   * `context.clearCookies()` resets session so a successful login does not leak
   * authentication into the next test.
   */

  let signIn: SignInPage;

  test.beforeEach(async () => {
    await context.clearCookies();
    signIn = new SignInPage(page);
    await signIn.goto();
  });

  test('SI0001 : User logs in successfully with valid credentials', async () => {
    await signIn.loginAndAwaitAuth(Credentials.valid.email, Credentials.valid.password);
    await page.waitForURL('**/onboarding');
    await expect(page).toHaveURL(/\/onboarding$/);
    await signIn.assertWelcomeMessageVisible();
  });

  test('SI0004 : User sees auth error when password is wrong', async () => {
    await signIn.loginAndAwaitAuth(Credentials.valid.email, Credentials.wrongPassword);
    await expect(page.locator('text=/Invalid email or password|Too many requests/').first()).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test('SI0005 : User sees auth error when email is not registered', async () => {
    await signIn.loginAndAwaitAuth(Credentials.unregisteredEmail, Credentials.arbitraryPassword);
    await expect(page.locator('text=/Invalid email or password|Too many requests/').first()).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in$/);
  });
});
