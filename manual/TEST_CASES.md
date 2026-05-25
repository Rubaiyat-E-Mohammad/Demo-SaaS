# Demo SaaS — Test Cases Index

Human-readable pointer from Test ID → Spec File. The xlsx workbook
(`TEST-CASES.xlsx`) is the source of truth — regenerate via
`node manual/generate-xlsx.mjs`. This md mirrors the latest state for
quick code-review browsing.

Target app: `${BASE_URL}` (BASE_URL set in `e2e/.env`, gitignored).

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

## Dashboard (DB) — Tickets list

| ID | Test Title | Spec File | Status |
| --- | --- | --- | --- |
| DB0001 | User lands on /<slug>/tickets with all core chrome visible | `e2e/tests/dashboard.spec.ts` | Pass |
| DB0002 | Header has Tickets and Settings tabs, Tickets is active by default | `e2e/tests/dashboard.spec.ts` | Pass |
| DB0003 | Sidebar nav exposes Tickets, Organization settings, Manage account, Sign out | `e2e/tests/dashboard.spec.ts` | Pass |
| DB0004 | Seeded sample tickets are findable in the org's ticket list | `e2e/tests/dashboard.spec.ts` | Pass |
| DB0005 | Clicking "Settings" header tab routes to /<slug>/settings | `e2e/tests/dashboard.spec.ts` | Pass |
| DB0006 | Clicking "New" routes to /<slug>/tickets/new | `e2e/tests/dashboard.spec.ts` | Pass |
| DB0007 | Search by title puts the term in ?search and narrows the table | `e2e/tests/dashboard.spec.ts` | Pass |
| DB0008 | Search with a guaranteed-unique gibberish term yields zero rows | `e2e/tests/dashboard.spec.ts` | Pass |
| DB0009 | Status filter "In Progress" sets ?status=InProgress and shows only matching rows | `e2e/tests/dashboard.spec.ts` | Pass |
| DB0010 | Reverting the status filter to "Any" clears ?status from the URL | `e2e/tests/dashboard.spec.ts` | Pass |

## Ticket Detail (TK) — Dialog

| ID | Test Title | Spec File | Status |
| --- | --- | --- | --- |
| TK0001 | Clicking a ticket row opens the detail dialog with all core fields | `e2e/tests/ticketDetail.spec.ts` | Pass |
| TK0002 | URL gains ?selectedId=<id> while the dialog is open | `e2e/tests/ticketDetail.spec.ts` | Pass |
| TK0003 | Dialog status button shows the ticket's current status | `e2e/tests/ticketDetail.spec.ts` | Pass |
| TK0004 | Opening the status menu reveals all four status options | `e2e/tests/ticketDetail.spec.ts` | Pass |
| TK0005 | Close (X) button closes the dialog and clears ?selectedId | `e2e/tests/ticketDetail.spec.ts` | Pass |
| TK0006 | Empty ticket shows "No comments yet" placeholder and comment input | `e2e/tests/ticketDetail.spec.ts` | Pass |

## New Ticket (NT) — Public submit form

| ID | Test Title | Spec File | Status |
| --- | --- | --- | --- |
| NT0001 | The submit form renders all four required fields | `e2e/tests/newTicket.spec.ts` | Pass |
| NT0002 | Submitting an empty form shows validation errors on every field | `e2e/tests/newTicket.spec.ts` | Pass |
| NT0003 | Submitting with a malformed reported-by email shows "Invalid email" | `e2e/tests/newTicket.spec.ts` | Pass |
| NT0004 | Valid submission shows the success toast and lands on the new ticket's detail page | `e2e/tests/newTicket.spec.ts` | Pass |

## Organization Settings (OS) — Members

| ID | Test Title | Spec File | Status |
| --- | --- | --- | --- |
| OS0001 | Page renders the "Organization members" heading and an "Add member" button | `e2e/tests/organizationSettings.spec.ts` | Pass |
| OS0002 | Logged-in user is listed as an Admin in the members roster | `e2e/tests/organizationSettings.spec.ts` | Pass |
| OS0003 | "Add member" opens a dialog with Email + Role inputs and submit button | `e2e/tests/organizationSettings.spec.ts` | Pass |
| OS0004 | Submitting the Add Member dialog with empty email shows "Invalid email" | `e2e/tests/organizationSettings.spec.ts` | Pass |
| OS0005 | Submitting with a malformed email shows "Invalid email" without sending the invite | `e2e/tests/organizationSettings.spec.ts` | Pass |
| OS0006 | Role dropdown exposes both Admin and Member options | `e2e/tests/organizationSettings.spec.ts` | Pass |
| OS0007 | Closing the dialog removes it from the DOM | `e2e/tests/organizationSettings.spec.ts` | Pass |

## Manage Account (MA) — User profile & security

| ID | Test Title | Spec File | Status |
| --- | --- | --- | --- |
| MA0001 | User details tab renders First name, Last name, Save | `e2e/tests/manageAccount.spec.ts` | Pass |
| MA0002 | First name and Last name are pre-filled from the logged-in user's profile | `e2e/tests/manageAccount.spec.ts` | Pass |
| MA0003 | The page exposes both "User details" and "Security" tabs | `e2e/tests/manageAccount.spec.ts` | Pass |
| MA0004 | Security tab renders Sessions list section heading | `e2e/tests/manageAccount.spec.ts` | Pass |
| MA0005 | Password section exposes Current/New inputs + Sign-out-other-sessions checkbox + Change password button | `e2e/tests/manageAccount.spec.ts` | Pass |
| MA0006 | Clicking Change password with empty fields keeps the user on the page (no destructive call) | `e2e/tests/manageAccount.spec.ts` | Pass |
| MA0007 | Switching back to User details tab restores the name form | `e2e/tests/manageAccount.spec.ts` | Pass |

## Navigation (NV) — Session persistence & sign-out

| ID | Test Title | Spec File | Status |
| --- | --- | --- | --- |
| NV0001 | Session persists across a full page reload | `e2e/tests/navigation.spec.ts` | Pass |
| NV0002 | Navigating to /onboarding while signed in with an org redirects to /<slug>/tickets | `e2e/tests/navigation.spec.ts` | Pass |
| NV0003 | User-menu dropdown lists "Manage account" and "Sign out" | `e2e/tests/navigation.spec.ts` | Pass |
| NV0004 | Sign out returns user to home, clears session, and blocks protected URLs | `e2e/tests/navigation.spec.ts` | Pass |
| NV0005 | Org switcher dropdown shows current org and a "Create organization" option | `e2e/tests/navigation.spec.ts` | Pass |

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

## Tickets API (AT) — POST /api/trpc/tickets.create

| ID | Test Title | Spec File | Status |
| --- | --- | --- | --- |
| AT0001 | Valid payload returns the new ticket with status "New" | `api/tests/tickets.spec.ts` | Pass |
| AT0002 | Missing all required fields returns 400 with zod fieldErrors | `api/tests/tickets.spec.ts` | Pass |
| AT0003 | Invalid email in reportedBy returns 400 with zod fieldErrors | `api/tests/tickets.spec.ts` | Pass |
| AT0004 | Empty inner JSON returns 400 with zod formErrors "Required" | `api/tests/tickets.spec.ts` | Pass |
| AT0005 | Missing x-organization header returns 403 FORBIDDEN | `api/tests/tickets.spec.ts` | Pass |
| AT0006 | Unknown organization slug returns 403 FORBIDDEN | `api/tests/tickets.spec.ts` | Pass |

## Test ID Prefix Registry

Two-letter feature codes; numbering starts at 0001 within each prefix.

| Prefix | Surface | Example file |
| --- | --- | --- |
| SI | Sign-in UI (existing) | `e2e/tests/signin.spec.ts` |
| AS | Sign-in API (existing) | `api/tests/signin.spec.ts` |
| DB | Dashboard / Tickets list | `e2e/tests/dashboard.spec.ts` |
| TK | Ticket detail dialog | `e2e/tests/ticketDetail.spec.ts` |
| NT | New-ticket public form (UI) | `e2e/tests/newTicket.spec.ts` |
| AT | tickets.create tRPC (API) | `api/tests/tickets.spec.ts` |
| OS | Organization settings | `e2e/tests/organizationSettings.spec.ts` |
| MA | Manage account (user profile + security) | `e2e/tests/manageAccount.spec.ts` |
| NV | Post-login navigation, session, sign-out | `e2e/tests/navigation.spec.ts` |

## Test Data Contract

Static (env-driven, in `e2e/utils/testData.ts` → `Credentials.valid`):

- `Credentials.valid.email` ← `SIGNIN_EMAIL`
- `Credentials.valid.password` ← `SIGNIN_PASSWORD`

Static (negative-path literals, in `e2e/utils/testData.ts`):

- `Credentials.wrongPassword` — known-bad password
- `Credentials.unregisteredEmail` — non-existent account
- `Credentials.invalidFormatEmail` — fails client-side email regex
- `Credentials.arbitraryPassword` — placeholder for negative-path forms

Generated per-run (test files create their own with timestamps to keep
records distinguishable):

- `qa-bot@example.com` / `QA Bot` — non-PII reporter identity for public
  ticket submissions (NT0004, AT0001).
- `NT0004 e2e probe <timestamp>`, `AT0001 happy path <timestamp>` —
  unique titles so live-app state remains testable.

## Org-scoped fixtures

The test account `${SIGNIN_EMAIL}` belongs to organization
`qa-exploration-org` (created during initial exploration with "Import
example tickets" enabled). Every post-login E2E spec signs in fresh in
its own `test.beforeAll` via `Session.signInAndCaptureSlug(...)` and
captures the slug from the post-login redirect URL. No shared
`storageState`, no `globalSetup` — this is required so CI sharding can
distribute spec files across runners independently (each shard gets its
own IP and its own auth budget).
