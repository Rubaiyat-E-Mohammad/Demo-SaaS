# Demo SaaS — Test Cases Index

Human-readable pointer from Test ID → Spec File. The xlsx workbook
(`TEST-CASES.xlsx`) is the source of truth — regenerate via
`node manual/generate-xlsx.mjs`. This md mirrors the latest state for
quick code-review browsing.

Target app: `${BASE_URL}/sign-in` (BASE_URL set in `e2e/.env`, gitignored).

## Sign-in (SI) — UI & Validation

| ID | Test Title | Spec File | Status |
| --- | --- | --- | --- |
| SI0011 | User sees all core sign-in elements on page load | `e2e/tests/signin.spec.ts` | Pass |
| SI0002 | User sees validation error when submitting an empty form | `e2e/tests/signin.spec.ts` | Pass |
| SI0003 | User sees validation error for an invalid email format | `e2e/tests/signin.spec.ts` | Pass |
| SI0006 | User cannot log in with email only and no password | `e2e/tests/signin.spec.ts` | Pass |
| SI0007 | User can toggle password field visibility | `e2e/tests/signin.spec.ts` | Pass |
| SI0008 | User navigates to the reset-password page via "Forgot password?" | `e2e/tests/signin.spec.ts` | Pass |
| SI0009 | User navigates to the sign-up page via the "Sign up" link | `e2e/tests/signin.spec.ts` | Pass |
| SI0010 | User navigates to the email-OTP page via "Continue with Email" | `e2e/tests/signin.spec.ts` | Pass |

## Sign-in (SI) — Authentication

| ID | Test Title | Spec File | Status |
| --- | --- | --- | --- |
| SI0001 | User logs in successfully with valid credentials | `e2e/tests/signin.spec.ts` | Pass |
| SI0004 | User sees auth error when password is wrong | `e2e/tests/signin.spec.ts` | Pass |
| SI0005 | User sees auth error when email is not registered | `e2e/tests/signin.spec.ts` | Pass |

## Sign-in API (AS) — POST /api/auth/sign-in/email

| ID | Test Title | Spec File | Status |
| --- | --- | --- | --- |
| AS0001 | Valid credentials return 200 with user object | `api/tests/signin.spec.ts` | Pass |
| AS0002 | Wrong password returns 401 INVALID_EMAIL_OR_PASSWORD | `api/tests/signin.spec.ts` | Pass |
| AS0003 | Unregistered email returns 401 INVALID_EMAIL_OR_PASSWORD | `api/tests/signin.spec.ts` | Pass |
| AS0004 | Malformed email returns 400 INVALID_EMAIL | `api/tests/signin.spec.ts` | Pass |
| AS0005 | Missing email field returns 400 with zod details | `api/tests/signin.spec.ts` | Pass |
| AS0006 | Missing password field returns 400 with zod details | `api/tests/signin.spec.ts` | Pass |
| AS0007 | Empty JSON body returns 400 with zod details | `api/tests/signin.spec.ts` | Pass |

## Test Data Contract

Static (env-driven, in `e2e/utils/testData.ts` → `Credentials.valid`):

- `Credentials.valid.email` ← `SIGNIN_EMAIL`
- `Credentials.valid.password` ← `SIGNIN_PASSWORD`

Static (negative-path literals, in `e2e/utils/testData.ts`):

- `Credentials.wrongPassword` — known-bad password
- `Credentials.unregisteredEmail` — non-existent account
- `Credentials.invalidFormatEmail` — fails client-side email regex
- `Credentials.arbitraryPassword` — placeholder for negative-path forms
