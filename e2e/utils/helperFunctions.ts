import dotenv from 'dotenv';
dotenv.config({ quiet: true });
import { expect, type Page } from '@playwright/test';
import { Urls } from './testData.ts';

/**
 * Action-wrapper base class every POM extends.
 * Centralises Playwright primitives (`page.goto`, `locator.click`, `locator.fill`, …)
 * and per-suite URL fields built from `Urls.baseUrl`.
 */
export class HelperFunctions {
  readonly page: Page;

  // Non-base URLs the suite touches. Add new paths here, never inside a POM or spec.
  readonly signInPage: string = Urls.baseUrl + '/sign-in';
  readonly resetPasswordPage: string = Urls.baseUrl + '/reset-password';
  readonly signUpPage: string = Urls.baseUrl + '/sign-up';
  readonly emailOtpPage: string = Urls.baseUrl + '/email-otp';
  readonly onboardingPage: string = Urls.baseUrl + '/onboarding';
  readonly createOrganizationPage: string = Urls.baseUrl + '/create-organization';
  readonly manageAccountPage: string = Urls.baseUrl + '/manage-account';
  readonly homePage: string = Urls.baseUrl + '/';
  // Org-scoped URL factories — every authenticated app surface lives under /<slug>.
  ticketsListPage(slug: string): string {
    return `${Urls.baseUrl}/${slug}/tickets`;
  }
  newTicketPage(slug: string): string {
    return `${Urls.baseUrl}/${slug}/tickets/new`;
  }
  organizationSettingsPage(slug: string): string {
    return `${Urls.baseUrl}/${slug}/settings`;
  }

  constructor(page: Page) {
    this.page = page;
  }

  async waitForLoading() {
    await this.page.waitForLoadState('domcontentloaded');
  }

  async navigateToURL(url: string) {
    try {
      await this.waitForLoading();
      // Demo SaaS triggers an in-flight redirect (ERR_ABORTED) on first nav;
      // the post-redirect document still resolves, so swallow that one error.
      try {
        await this.page.goto(url, { waitUntil: 'domcontentloaded' });
      } catch (err) {
        const msg = (err as Error).message ?? '';
        if (!msg.includes('ERR_ABORTED')) throw err;
      }
      await this.waitForLoading();
      console.log('\x1b[34m%s\x1b[0m', `✅ Navigated to ${url}`);
    } catch (error) {
      console.log('\x1b[31m%s\x1b[0m', `❌ Failed to navigate to ${url}: ${error}`);
      throw error;
    }
  }

  async assertionValidate(locator: string) {
    try {
      await this.waitForLoading();
      const el = this.page.locator(locator);
      await el.waitFor();
      await this.waitForLoading();
      console.log('\x1b[34m%s\x1b[0m', `✅ Asserted ${locator}`);
      expect(await el.isVisible()).toBeTruthy();
    } catch (error) {
      console.log('\x1b[31m%s\x1b[0m', `❌ Failed to assert ${locator}: ${error}`);
      throw error;
    }
  }

  async validateAndClick(locator: string) {
    try {
      await this.waitForLoading();
      const el = this.page.locator(locator);
      await el.waitFor();
      await el.click();
      await this.waitForLoading();
      console.log('\x1b[35m%s\x1b[0m', `✅ Clicked ${locator}`);
    } catch (error) {
      console.log('\x1b[31m%s\x1b[0m', `❌ Failed to click ${locator}: ${error}`);
      throw error;
    }
  }

  async validateAndFillStrings(locator: string, value: string) {
    try {
      await this.waitForLoading();
      const el = this.page.locator(locator);
      await el.waitFor();
      await el.fill(value);
      await this.waitForLoading();
      console.log('\x1b[35m%s\x1b[0m', `✅ Filled ${locator} with ${value.length} chars`);
    } catch (error) {
      console.log('\x1b[31m%s\x1b[0m', `❌ Failed to fill ${locator}: ${error}`);
      throw error;
    }
  }

  async validateAndFillNumbers(locator: string, value: number) {
    await this.validateAndFillStrings(locator, value.toString());
  }

  async validateAndCheckBox(locator: string) {
    try {
      await this.waitForLoading();
      const el = this.page.locator(locator);
      await el.waitFor();
      await el.check();
      await this.waitForLoading();
      console.log('\x1b[35m%s\x1b[0m', `✅ Checked ${locator}`);
    } catch (error) {
      console.log('\x1b[31m%s\x1b[0m', `❌ Failed to check ${locator}: ${error}`);
      throw error;
    }
  }

  async selectOptionWithLabel(locator: string, label: string) {
    try {
      await this.waitForLoading();
      const el = this.page.locator(locator);
      await el.waitFor();
      await this.page.selectOption(locator, { label });
      await this.waitForLoading();
      console.log('\x1b[33m%s\x1b[0m', `✅ Selected ${locator} = ${label}`);
    } catch (error) {
      console.log('\x1b[31m%s\x1b[0m', `❌ Failed to select ${locator} with label ${label}: ${error}`);
      throw error;
    }
  }

  async selectOptionWithValue(locator: string, value: string) {
    try {
      await this.waitForLoading();
      const el = this.page.locator(locator);
      await el.waitFor();
      await this.page.selectOption(locator, { value });
      await this.waitForLoading();
      console.log('\x1b[33m%s\x1b[0m', `✅ Selected ${locator} = ${value}`);
    } catch (error) {
      console.log('\x1b[31m%s\x1b[0m', `❌ Failed to select ${locator} with value ${value}: ${error}`);
      throw error;
    }
  }

  async checkElementText(locator: string, expectedText: string) {
    try {
      await this.waitForLoading();
      const el = this.page.locator(locator);
      await el.waitFor();
      const actual = (await el.textContent())?.trim();
      expect(actual).toContain(expectedText);
      console.log('\x1b[34m%s\x1b[0m', `✅ Text on ${locator} contains "${expectedText}"`);
    } catch (error) {
      console.log('\x1b[31m%s\x1b[0m', `❌ Text mismatch on ${locator}: ${error}`);
      throw error;
    }
  }

  async validateAndClickAny(locator: string) {
    try {
      await this.waitForLoading();
      const elements = this.page.locator(locator);
      const count = await elements.count();
      for (let i = 0; i < count; i++) {
        const el = elements.nth(i);
        if (await el.isVisible()) {
          await el.click();
          await this.waitForLoading();
          console.log('\x1b[35m%s\x1b[0m', `✅ Clicked visible element ${locator}[${i}]`);
          return;
        }
      }
      throw new Error(`No visible elements found for locator: ${locator}`);
    } catch (error) {
      console.log('\x1b[31m%s\x1b[0m', `❌ Failed to click any ${locator}: ${error}`);
      throw error;
    }
  }

  async validateAny(locator: string) {
    try {
      await this.waitForLoading();
      const elements = this.page.locator(locator);
      const count = await elements.count();
      for (let i = 0; i < count; i++) {
        if (await elements.nth(i).isVisible()) {
          console.log('\x1b[34m%s\x1b[0m', `✅ Found visible ${locator}[${i}]`);
          return;
        }
      }
      throw new Error(`No visible elements found for locator: ${locator}`);
    } catch (error) {
      console.log('\x1b[31m%s\x1b[0m', `❌ Failed to validate any ${locator}: ${error}`);
      throw error;
    }
  }

  async pressKey(key: string) {
    try {
      await this.page.keyboard.press(key);
      await this.waitForLoading();
      console.log('\x1b[33m%s\x1b[0m', `✅ Pressed ${key}`);
    } catch (error) {
      console.log('\x1b[31m%s\x1b[0m', `❌ Failed to press ${key}: ${error}`);
      throw error;
    }
  }

  async reload() {
    try {
      await this.page.reload({ waitUntil: 'domcontentloaded' });
      await this.waitForLoading();
      console.log('\x1b[34m%s\x1b[0m', `✅ Reloaded ${this.page.url()}`);
    } catch (error) {
      console.log('\x1b[31m%s\x1b[0m', `❌ Failed to reload: ${error}`);
      throw error;
    }
  }

  async waitForUrl(pattern: RegExp | string, timeout = 15_000) {
    try {
      await this.page.waitForURL(pattern, { timeout });
      console.log('\x1b[34m%s\x1b[0m', `✅ URL matched ${pattern}`);
    } catch (error) {
      console.log('\x1b[31m%s\x1b[0m', `❌ URL never matched ${pattern}: ${error}`);
      throw error;
    }
  }

  async assertUrlMatches(pattern: RegExp | string) {
    await this.waitForLoading();
    await expect(this.page).toHaveURL(pattern);
    console.log('\x1b[34m%s\x1b[0m', `✅ URL matches ${pattern}`);
  }

  async assertUrlNotMatches(pattern: RegExp | string) {
    await this.waitForLoading();
    await expect(this.page).not.toHaveURL(pattern);
    console.log('\x1b[34m%s\x1b[0m', `✅ URL does not match ${pattern}`);
  }

  /**
   * Read the current URL's search params. Returns `null` for absent keys,
   * matching `URLSearchParams.get()` semantics.
   */
  getUrlSearchParam(name: string): string | null {
    return new URL(this.page.url()).searchParams.get(name);
  }

  /**
   * Race a click against a network response so the caller can deterministically
   * wait for an XHR-style refetch after a UI action. Returns the matched
   * response or `null` if the wait timed out — callers usually don't care
   * about the body, they just want the DOM to have settled.
   */
  async clickAndWaitForResponse(
    locator: string,
    urlSubstring: string,
    status = 200,
    timeout = 15_000,
  ) {
    const responsePromise = this.page
      .waitForResponse(
        (res) => res.url().includes(urlSubstring) && res.status() === status,
        { timeout },
      )
      .catch(() => null);
    await this.validateAndClick(locator);
    await responsePromise;
    await this.waitForLoading();
  }

  /**
   * Fill a field, press Enter, and await an XHR-style refetch. Used by
   * search/filter UIs whose results re-render only after the network call.
   */
  async fillSubmitAndWaitForResponse(
    locator: string,
    value: string,
    urlSubstring: string,
    status = 200,
    timeout = 15_000,
  ) {
    await this.validateAndFillStrings(locator, value);
    const responsePromise = this.page
      .waitForResponse(
        (res) => res.url().includes(urlSubstring) && res.status() === status,
        { timeout },
      )
      .catch(() => null);
    await this.page.keyboard.press('Enter');
    await responsePromise;
    await this.waitForLoading();
    console.log('\x1b[33m%s\x1b[0m', `✅ Submitted ${locator} and awaited ${urlSubstring}`);
  }

  async getInputValue(locator: string): Promise<string> {
    return this.page.locator(locator).inputValue();
  }

  async getElementCount(locator: string): Promise<number> {
    return this.page.locator(locator).count();
  }

  async getAllTextContents(locator: string): Promise<string[]> {
    return this.page.locator(locator).allTextContents();
  }

  async assertElementCount(locator: string, expected: number) {
    await this.waitForLoading();
    await expect(this.page.locator(locator)).toHaveCount(expected);
    console.log('\x1b[34m%s\x1b[0m', `✅ ${locator} count = ${expected}`);
  }

  async getAttribute(locator: string, name: string): Promise<string | null> {
    return this.page.locator(locator).getAttribute(name);
  }
}
