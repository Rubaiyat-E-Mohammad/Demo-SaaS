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

## Auth — Sign-out

`POST /api/auth/sign-out`

### Request

Headers:

- `Content-Type: application/json` (body is empty)
- Requires the `session` cookie set by sign-in.

### Responses

**200 OK** — Session cookie consumed.

```json
{ "success": true }
```

Side effect: clears the `session` cookie; subsequent calls to
`/api/auth/get-session` return `null`.

**500 Internal Server Error** — Called without a valid `session` cookie
(observed during exploration). Documented as an app bug — the endpoint
should respond 401 or 200/no-op instead of bubbling an unhandled error.
**Not** asserted as a positive test; recorded so future contributors are
aware.

---

## Tickets — tRPC tickets.create (anonymous customer submit)

`POST /api/trpc/tickets.create?batch=1`

The endpoint is **anonymous** — no `session` cookie required. It is the
public ticket-submit endpoint printed on the "Create organization" success
screen and exercised by the dashboard's "New" button.

### Request

Headers:

- `Content-Type: application/json`
- `x-organization: <org-slug>` (required — without it the endpoint returns
  403 FORBIDDEN; same response when the slug is unknown).

Body (tRPC batched envelope):

```json
{
  "0": {
    "json": {
      "title": "Bug title",
      "body": "Bug description",
      "reportedBy": "user@example.com",
      "authorName": "Reporter Name"
    }
  }
}
```

### Responses

**200 OK** — Ticket created.

```json
[
  {
    "result": {
      "data": {
        "json": {
          "id": "cmpkt5fxl0001l509yvjxm1ob",
          "title": "Bug title",
          "body": "Bug description",
          "status": "New",
          "reportedBy": "user@example.com",
          "authorName": "Reporter Name",
          "createdAt": "ISO",
          "updatedAt": "ISO",
          "organizationId": "..."
        },
        "meta": { "values": { "createdAt": ["Date"], "updatedAt": ["Date"] } }
      }
    }
  }
]
```

**400 Bad Request** — Schema validation failure (missing field, invalid
email format on `reportedBy`, empty inner JSON, ...).

```json
[
  {
    "error": {
      "json": {
        "message": "[zod validation array as a string]",
        "code": -32600,
        "data": {
          "code": "BAD_REQUEST",
          "httpStatus": 400,
          "path": "tickets.create",
          "zodError": {
            "formErrors": ["Required"],
            "fieldErrors": {
              "reportedBy": ["Invalid email"]
            }
          }
        }
      }
    }
  }
]
```

**403 Forbidden** — Missing `x-organization` header, or slug refers to an
organization the caller does not have permission to scope to (currently
also returned for unknown slugs).

```json
[
  {
    "error": {
      "json": {
        "message": "FORBIDDEN",
        "code": -32003,
        "data": { "code": "FORBIDDEN", "httpStatus": 403, "path": "tickets.create", "zodError": null }
      }
    }
  }
]
```

### Suite coupling

- API tests (`api/tests/tickets.spec.ts`):
  - `AT0001` 200 happy path, `AT0002` missing-all-fields (400 fieldErrors),
    `AT0003` invalid email (400 fieldErrors.reportedBy), `AT0004` empty inner
    JSON (400 formErrors), `AT0005` missing org header (403), `AT0006`
    unknown org slug (403).
- E2E tests (`e2e/tests/newTicket.spec.ts`):
  - `NT0001` form render, `NT0002` empty-form validation (client-side),
    `NT0003` invalid email validation (client-side), `NT0004` valid submit
    happy path → success toast + lands on `/<slug>/tickets/<id>`.

---

## Authenticated tRPC endpoints (read-only, NOT yet covered)

`GET /api/trpc/tickets.getList?batch=1` — returns paginated tickets for
the org named by `x-organization`. Requires `session` cookie; returns 401
UNAUTHORIZED without it.

`GET /api/trpc/organizations.getUserOrganizations?batch=1` — returns the
logged-in user's org memberships with their role. Requires `session`
cookie.

`GET /api/trpc/organizations.getCurrent?batch=1` — current-org metadata.

These are exercised indirectly by the E2E dashboard tests (the UI calls
them to render). They are not pinned at the API layer yet because doing so
would require a session-cookie helper; documenting them here so the future
test author has the contract handy.
