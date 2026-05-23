/**
 * Env-driven test data for the sign-in suite.
 * Valid credentials are read exclusively from environment variables
 * (loaded from the project-root .env by playwright.config.ts) so the suite
 * ships no hardcoded secrets. The fields below are NOT secrets — they are
 * deliberately invalid inputs used to exercise negative paths.
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

export const credentials = {
  valid: {
    email: requireEnv('SIGNIN_EMAIL'),
    password: requireEnv('SIGNIN_PASSWORD'),
  },
  wrongPassword: 'WrongPassword123!',
  unregisteredEmail: 'nonexistent-user-9921@example.com',
  invalidFormatEmail: 'notanemail',
  arbitraryPassword: 'SomePass123!',
} as const;

export const urls = {
  baseUrl: 'https://demo-saas.bugbug.io',
  signIn: 'https://demo-saas.bugbug.io/sign-in',
  resetPasswordPath: '/reset-password',
  signUpPath: '/sign-up',
  emailOtpPath: '/email-otp',
  onboardingPath: '/onboarding',
} as const;
