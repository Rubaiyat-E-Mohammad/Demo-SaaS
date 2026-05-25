/**
 * Env-driven test data. Only `Urls.baseUrl` lives here — derived paths live on
 * `HelperFunctions`. Valid credentials come from `.env`; negative-path literals
 * are reviewable named constants.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Copy .env.example to .env and set it.`,
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
