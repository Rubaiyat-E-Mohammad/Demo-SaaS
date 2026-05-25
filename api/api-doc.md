# Demo SaaS — API Contract

Backend reference for the API + E2E suites that interact with the auth API.
Source of truth for endpoint shape so specs do not reverse-engineer responses.

Base URL: `${BASE_URL}` (set in `e2e/.env`; never committed in source).

---

## Auth — Sign-in (email + password)

`POST /api/auth/sign-in/email`

### Request

Headers:

- `Content-Type: application/json`

Body:

```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

### Responses

**200 OK** — Valid credentials.

- Body (observed):

  ```json
  {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "name": "User Name",
      "image": null,
      "emailVerified": true,
      "createdAt": "ISO",
      "updatedAt": "ISO"
    },
    "redirect": false
  }
  ```

- Sets `session` cookie (HTTP-only).
- UI: redirects to `/onboarding` (or `/dashboard` for returning users).

**401 Unauthorized** — Bad credentials (wrong password OR unregistered email).

- Body (observed):

  ```json
  { "message": "Invalid email or password", "code": "INVALID_EMAIL_OR_PASSWORD" }
  ```

- UI: inline error "Invalid email or password".

**400 Bad Request — malformed email** — Email fails server-side regex.

- Body (observed):

  ```json
  { "message": "Invalid email", "code": "INVALID_EMAIL" }
  ```

**400 Bad Request — missing fields** — Required keys missing from body.

- Body: zod-style validation array under `details`, repeated in `message` as
  a JSON string. `code` is a generated identifier mirroring the violation.

**429 Too Many Requests** — Per-IP rate limit reached.

- UI: "Too many requests" notice.
- E2E negative tests accept either 401 or 429 via
  `text=/Invalid email or password|Too many requests/`.

### Suite coupling

- API tests (`api/tests/signin.spec.ts`):
  - `AS0001` 200 happy path, `AS0002` wrong password (401), `AS0003`
    unregistered email (401), `AS0004` malformed email (400), `AS0005`
    missing email (400), `AS0006` missing password (400), `AS0007` empty
    body (400).
- E2E tests (`e2e/tests/signin.spec.ts`):
  - `e2e/pages/signIn.ts` → `loginAndAwaitAuth(email, password)` awaits this
    endpoint via `page.waitForResponse(...)` before asserting on UI state.
  - Test IDs that hit this endpoint via the UI: `SI0001` (200), `SI0004`
    (401, wrong password), `SI0005` (401, unregistered email).

---

## Auth — Sign-up

`POST /api/auth/sign-up` — not currently covered. Document when first test
(`SU0001` UI or `AU0001` API) is added.

## Auth — Reset password

`POST /api/auth/reset-password` — not currently covered. Document when first
test is added.

## Auth — Email OTP

`POST /api/auth/email-otp/request` — not currently covered. Document when
first test is added.
