import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Env-driven test data for the API suite. Loads `e2e/.env` explicitly so this
 * module works even when imported outside the runner (e.g. IDE diagnostics).
 * Only `Urls.baseUrl` lives here; derived endpoint paths live on `ApiHelpers`.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../e2e/.env'), quiet: true });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Copy e2e/.env.example to e2e/.env and set it.`,
    );
  }
  return value;
}

export const Urls = {
  get baseUrl() {
    return requireEnv('BASE_URL');
  },
} as const;

export const Credentials = {
  // Lazy getter so the IDE / Playwright extension can import this module
  // for test discovery without `.env` loaded. The error fires only when a
  // test actually reads `Credentials.valid`.
  get valid() {
    return {
      email: requireEnv('SIGNIN_EMAIL'),
      password: requireEnv('SIGNIN_PASSWORD'),
    };
  },
  wrongPassword: 'WrongPassword123!',
  unregisteredEmail: 'nonexistent-user-9921@example.com',
  invalidFormatEmail: 'notanemail',
  arbitraryPassword: 'SomePass123!',
} as const;
