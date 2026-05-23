# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview
Playwright browser-automation sandbox — web-app E2E testing.

## Commands
- `npm test` — run all tests across chromium, firefox, webkit
- `npx playwright test --project=chromium` — single browser
- `npx playwright test tests/example.spec.ts:3` — single test by file:line
- `npm run test:ui` — interactive UI mode
- `npx playwright test --debug` / `--headed` — step debugger / visible browser
- `npm run report` — open last HTML report
- `npx playwright codegen <url>` — record actions, generate test code

## Architecture
- `playwright.config.ts` — test-runner config; `testDir: ./tests`, chromium project, `list` + `html` + feature-map reporters, trace on first retry.
- `tests/*.spec.ts` — test specs; run only by the Playwright test runner.
- `utils/singleBrowser.ts` — manual one-browser-per-spec-file lifecycle helper.
- `utils/featureMapReporter.ts` — custom reporter; renders the test-summary from `feature-map/feature-map.yml`.

## Conventions
- `package.json` is `"type": "module"` — use ESM `import`, not `require`. TypeScript runs with no build step (Playwright transpiles specs/config/reporters).
- Tests use `@playwright/test` fixtures (`test`, `expect`). The browser lifecycle is managed manually by `utils/singleBrowser.ts` (one browser per spec file), not via the default `page` fixture.
- Failed tests capture a full-page screenshot. The config sets `screenshot: 'only-on-failure'`, but the manually-launched browser is outside the runner's fixtures so that setting does not reach it — `utils/singleBrowser.ts`'s `afterEach` re-creates the capture and attaches it.
