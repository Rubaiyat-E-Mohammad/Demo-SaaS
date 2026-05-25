import { type Page } from '@playwright/test';
import { HelperFunctions } from '../utils/helperFunctions.ts';
import { Selectors } from '../utils/selectors.ts';
import { SignInPage } from './signIn.ts';

/**
 * Session bootstrap for post-login specs.
 *
 * Demo SaaS routes a logged-in user with an organization straight to
 * `/<org-slug>/tickets`, while a user with no organization lands on
 * `/onboarding`. This helper signs in once per spec and exposes the active
 * organization slug so other POMs can build org-scoped URLs.
 *
 * Sharding policy: each spec must own its own sign-in via `signInAndCaptureSlug`
 * inside `test.beforeAll`. Do NOT pre-bake a `storageState` file — sharing
 * cookies across specs breaks parallel CI shards (one shard signing out
 * invalidates the others' session) and hides per-spec auth-flow failures.
 */
export class Session extends HelperFunctions {
  /** Set by `signInAndCaptureSlug` after the post-login redirect resolves. */
  organizationSlug = '';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Sign in with the given credentials, then capture the org slug from the
   * landing URL. If the account has no organization yet, slug is left empty
   * and the caller is expected to inspect `page.url()` (e.g. /onboarding).
   */
  async signInAndCaptureSlug(email: string, password: string): Promise<string> {
    const signIn = new SignInPage(this.page);
    await signIn.goto();
    await signIn.loginAndAwaitAuth(email, password);
    // App can route to /<slug>/tickets (has org), /onboarding (no org), or
    // /create-organization. Wait for any of these to settle.
    await this.waitForUrl(/\/(onboarding|create-organization|[^/]+\/tickets)/, 30_000);
    const url = new URL(this.page.url());
    const match = url.pathname.match(/^\/([^/]+)\/tickets/);
    this.organizationSlug = match?.[1] ?? '';
    console.log('\x1b[34m%s\x1b[0m', `✅ Signed in; organization slug = ${this.organizationSlug || '(none)'}`);
    return this.organizationSlug;
  }

  /** Open the header user-menu and click "Sign out". */
  async signOut() {
    await this.validateAndClick(Selectors.postLoginNav.userMenuTrigger);
    await this.validateAndClick(Selectors.postLoginNav.userMenuSignOut);
    await this.waitForUrl(/\/$/, 15_000);
  }

  /** Assert the header user-menu trigger is visible — proves we're authenticated. */
  async assertSignedIn() {
    await this.assertionValidate(Selectors.postLoginNav.userMenuTrigger);
  }

  /** Assert the anon header is back — proves session was cleared. */
  async assertSignedOut() {
    await this.assertionValidate(Selectors.postLoginNav.anonHeaderSignInLink);
    await this.assertElementCount(Selectors.postLoginNav.userMenuTrigger, 0);
  }
}
