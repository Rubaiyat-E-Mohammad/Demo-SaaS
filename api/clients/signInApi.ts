import type { APIRequestContext, APIResponse } from '@playwright/test';
import { ApiHelpers } from '../utils/apiHelpers.ts';

/**
 * Sign-in API client. Mirrors the e2e POM layering: spec calls these methods,
 * methods delegate every HTTP call to inherited `ApiHelpers` wrappers.
 */
export class SignInApi extends ApiHelpers {
  constructor(request: APIRequestContext) {
    super(request);
  }

  /** POST /api/auth/sign-in/email with full email+password body. */
  async signInWithEmail(email: string, password: string): Promise<APIResponse> {
    return this.postJson(this.signInEmailEndpoint, { email, password });
  }

  /** POST /api/auth/sign-in/email with an arbitrary body — used for negative cases. */
  async signInWithBody(body: unknown): Promise<APIResponse> {
    return this.postJson(this.signInEmailEndpoint, body);
  }

  /** POST /api/auth/sign-in/email with a raw string body — used for malformed-JSON case. */
  async signInWithRawBody(body: string, headers: Record<string, string> = {}): Promise<APIResponse> {
    return this.postRaw(this.signInEmailEndpoint, body, headers);
  }
}
