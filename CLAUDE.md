# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Playwright suites for Demo SaaS. Target URL lives in `e2e/.env` as `BASE_URL` — never committed in source.
Three top-level folders, per autoqa canonical layout:

- `e2e/` — Playwright UI suite (config, POMs, tests, helpers, selectors).
- `api/` — Playwright API suite (Playwright `APIRequestContext`, no browser) + `api-doc.md` contract reference.
- `manual/` — `TEST-CASES.xlsx` (source of truth, generated via `manual/generate-xlsx.mjs`) and `TEST_CASES.md` (human-readable index).

## Commands

E2E (UI) suite — run from `e2e/`:

- `cd e2e && npm test` — headless run across chromium.
- `cd e2e && npm run test:local` — headed run for local debugging (sets `HEADED=1`).
- `cd e2e && npm run test:ui` — Playwright UI mode.
- `cd e2e && npm run report` — open last HTML report.
- `cd e2e && npx playwright test tests/signin.spec.ts:42` — single test by file:line.
- `cd e2e && npx playwright codegen <url>` — record actions.

API suite — run from `api/`:

- `cd api && npm test` — serial run against the live Demo SaaS backend.
- `cd api && npm run report` — open last HTML report.

Reads credentials from `e2e/.env` (shared via `dotenv.config({ path: '../e2e/.env' })`).
Runs `workers: 1` + a built-in cooldown between tests so the per-IP rate limit
on `/api/auth/sign-in/email` does not throttle the suite.

## Architecture

E2E (`e2e/`):

- `playwright.config.ts` — `testDir: ./tests`, chromium project, `list` + `html` + feature-map reporters, `use: { trace: 'on-first-retry', screenshot: 'only-on-failure', headless: true }`.
- `utils/helperFunctions.ts` — `HelperFunctions` class. Holds non-base URLs as `readonly` fields + every action wrapper (`navigateToURL`, `validateAndClick`, `validateAndFillStrings`, `assertionValidate`, `selectOptionWithLabel`, …). Only file that calls Playwright primitives.
- `utils/selectors.ts` — single nested `Selectors` const. Locator strings (role / XPath / text / CSS) per feature group.
- `utils/testData.ts` — `Urls.baseUrl` only; `Credentials` (env-driven `requireEnv` + named negative-path literals).
- `utils/featureMapReporter.ts` — reads `feature-map/feature-map.yml`; renders Markdown summary to `$GITHUB_STEP_SUMMARY` and `playwright-report/feature-map-summary.md`.
- `pages/<feature>.ts` — one POM per feature area, `extends HelperFunctions`.
- `tests/*.spec.ts` — raw `chromium.launch({ headless: process.env.HEADED !== '1' })` in `test.beforeAll`, JSDoc `@Test_Scenarios` header, ` : ` separator between Test ID and title, one POM call per test.

API (`api/`):

- `playwright.config.ts` — `testDir: ./tests`, no browser, `use: { baseURL, extraHTTPHeaders }`, `fullyParallel: false`, `workers: 1`.
- `utils/apiHelpers.ts` — `ApiHelpers` class. Holds endpoint paths + action wrappers (`postJson`, `postRaw`, `getJson`, `assertStatus`, `assertJsonField`, `parseJson`). Only file that calls `APIRequestContext` primitives.
- `utils/testData.ts` — reuses `e2e/.env` for `SIGNIN_EMAIL`/`SIGNIN_PASSWORD`; exports same `Credentials` shape as e2e.
- `utils/featureMapReporter.ts` — same reporter as e2e (copied per-suite so each gets its own summary).
- `clients/<endpoint>.ts` — one client per API surface, `extends ApiHelpers`. e.g. `SignInApi.signInWithEmail(email, password)`.
- `tests/*.spec.ts` — `test('AS00xx : …', async ({ request }) => { const api = new SignInApi(request); … })`. Built-in cooldown in `beforeEach` keeps the burst under the per-IP throttle.

## Conventions

- ESM (`"type": "module"`) — `import`, never `require`. TypeScript runs without a build step (Playwright transpiles specs/config/reporters).
- Three-layer flow: **spec → POM (extends `HelperFunctions`) → `HelperFunctions`**. Specs never call `page.click`/`fill`/`goto`; POMs never call Playwright primitives directly.
- Selectors are strings; the `HelperFunctions` wrappers accept `locator: string` and call `page.locator(...)` internally.
- Every URL except `Urls.baseUrl` lives on `HelperFunctions` as a `readonly` field.
- Coloured-log contract inside `HelperFunctions`: `\x1b[34m` blue navigate/assert, `\x1b[35m` magenta click/fill, `\x1b[33m` yellow select, `\x1b[31m` red failure.
- Test ID separator is ` : ` (space-colon-space). Regex `/\b([A-Z]{2}\d{4})\b/` extracts the ID for the feature-map reporter.
- The `chromium.launch()` lives outside the runner's fixtures, so `screenshot: 'only-on-failure'` in config does not reach it. Attach failure screenshots manually in an `afterEach` if needed.

## Regenerating the test plan

```
ln -s ../e2e/node_modules manual/node_modules   # one-time, if missing
node manual/generate-xlsx.mjs                   # writes manual/TEST-CASES.xlsx
```

Update `manual/TEST_CASES.md` rows when adding/removing tests so the index stays in sync.
