import dotenv from 'dotenv';
dotenv.config({ path: '../e2e/.env', quiet: true });
import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';
import { Urls } from './testData.ts';

/**
 * Action-wrapper base class every API client extends.
 * Centralises Playwright `APIRequestContext` primitives (`post`, `get`, …)
 * and per-suite endpoint paths built from `Urls.baseUrl`.
 *
 * Coloured-log contract mirrors `e2e/utils/helperFunctions.ts`:
 *   \x1b[34m blue  — issued request / assertion
 *   \x1b[35m magenta — response received
 *   \x1b[33m yellow — JSON-body inspection
 *   \x1b[31m red   — failure
 */
export class ApiHelpers {
  readonly request: APIRequestContext;

  // Endpoint paths the suite touches. Add new endpoints here, never inline.
  readonly signInEmailEndpoint: string = Urls.baseUrl + '/api/auth/sign-in/email';
  readonly signOutEndpoint: string = Urls.baseUrl + '/api/auth/sign-out';
  readonly sessionEndpoint: string = Urls.baseUrl + '/api/auth/get-session';
  readonly ticketsCreateEndpoint: string = Urls.baseUrl + '/api/trpc/tickets.create?batch=1';

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  async postJson(endpoint: string, body: unknown, headers: Record<string, string> = {}): Promise<APIResponse> {
    try {
      console.log('\x1b[34m%s\x1b[0m', `→ POST ${endpoint}`);
      const res = await this.request.post(endpoint, { data: body as object, headers });
      console.log('\x1b[35m%s\x1b[0m', `← ${res.status()} ${endpoint}`);
      return res;
    } catch (error) {
      console.log('\x1b[31m%s\x1b[0m', `✗ POST ${endpoint}: ${error}`);
      throw error;
    }
  }

  async postRaw(endpoint: string, body: string, headers: Record<string, string> = {}): Promise<APIResponse> {
    try {
      console.log('\x1b[34m%s\x1b[0m', `→ POST ${endpoint} (raw body)`);
      const res = await this.request.post(endpoint, { data: body, headers });
      console.log('\x1b[35m%s\x1b[0m', `← ${res.status()} ${endpoint}`);
      return res;
    } catch (error) {
      console.log('\x1b[31m%s\x1b[0m', `✗ POST ${endpoint}: ${error}`);
      throw error;
    }
  }

  async getJson(endpoint: string): Promise<APIResponse> {
    try {
      console.log('\x1b[34m%s\x1b[0m', `→ GET  ${endpoint}`);
      const res = await this.request.get(endpoint);
      console.log('\x1b[35m%s\x1b[0m', `← ${res.status()} ${endpoint}`);
      return res;
    } catch (error) {
      console.log('\x1b[31m%s\x1b[0m', `✗ GET  ${endpoint}: ${error}`);
      throw error;
    }
  }

  async assertStatus(res: APIResponse, expected: number) {
    try {
      expect(res.status()).toBe(expected);
      console.log('\x1b[34m%s\x1b[0m', `✅ status = ${expected}`);
    } catch (error) {
      console.log('\x1b[31m%s\x1b[0m', `❌ expected status ${expected}, got ${res.status()}`);
      throw error;
    }
  }

  /**
   * Read response as JSON and assert a top-level field matches the expected
   * value. Returns the parsed body for follow-up assertions.
   */
  async assertJsonField<T = unknown>(res: APIResponse, field: string, expected: unknown): Promise<T> {
    const body = (await res.json()) as Record<string, unknown>;
    try {
      expect(body[field]).toBe(expected);
      console.log('\x1b[33m%s\x1b[0m', `✅ body.${field} = ${JSON.stringify(expected)}`);
      return body as T;
    } catch (error) {
      console.log('\x1b[31m%s\x1b[0m', `❌ body.${field} mismatch: ${JSON.stringify(body[field])}`);
      throw error;
    }
  }

  async parseJson<T = unknown>(res: APIResponse): Promise<T> {
    const body = (await res.json()) as T;
    console.log('\x1b[33m%s\x1b[0m', `↳ body = ${JSON.stringify(body).slice(0, 160)}`);
    return body;
  }
}
