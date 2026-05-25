# Demo SaaS — End-to-End Test Suite

Playwright-based QA suite for [Demo SaaS](https://demo-saas.bugbug.io), a public bug-tracking SaaS used as a test target. Covers sign-in, ticket dashboard, ticket detail, public new-ticket form, organization settings, account management, and post-login navigation — at both the UI (browser) and HTTP (API) layers.

The suite was designed, generated, validated, and maintained end-to-end with **Claude AI** (Anthropic Claude Code + the autoqa agent). The "How Claude was used" section below documents that workflow in detail because that is the actually interesting part of this repository.

---

## Repository layout

```
Demo_SaaS/
├── e2e/                          # Playwright UI suite (chromium-only)
│   ├── pages/                    # Page Object Model per feature
│   ├── tests/                    # Specs — one per feature area
│   ├── utils/
│   │   ├── helperFunctions.ts    # The ONLY file allowed to touch Playwright primitives
│   │   ├── selectors.ts          # All locator strings, grouped by feature
│   │   ├── testData.ts           # Credentials + URLs
│   │   └── featureMapReporter.ts # Custom Markdown summary reporter
│   ├── feature-map/feature-map.yml
│   ├── playwright.config.ts
│   └── .env                      # BASE_URL + credentials (gitignored)
│
├── api/                          # Playwright API suite (no browser)
│   ├── clients/                  # One per endpoint surface
│   ├── tests/
│   ├── utils/apiHelpers.ts       # APIRequestContext wrappers
│   ├── feature-map/feature-map.yml
│   ├── api-doc.md                # HTTP contract reference
│   └── playwright.config.ts
│
├── manual/
│   ├── TEST-CASES.xlsx           # Source-of-truth test plan (regen via generate-xlsx.mjs)
│   ├── TEST_CASES.md             # Human-readable index
│   └── generate-xlsx.mjs
│
├── .github/workflows/
│   ├── e2e_tests.yml             # Sharded matrix + merge-reports + cleanup
│   └── api_tests.yml
│
├── CLAUDE.md                     # Project conventions for Claude Code
└── README.md                     # This file
```

### Three-layer architecture (enforced)

```
spec → POM (extends HelperFunctions) → HelperFunctions (the only Playwright caller)
```

* **Specs** only call POM methods. No `page.click`, no `page.locator`, no `expect(page).toHaveURL()` — those are primitives.
* **POMs** only call `HelperFunctions` wrappers. No inline locator strings — every locator lives in `utils/selectors.ts`.
* **HelperFunctions** owns every `page.*` / `expect(page.*)` call. When a primitive is needed and no wrapper exists, the rule is: add the wrapper first, then use it.

This separation is what makes the suite refactor-safe. When an app upgrade changes a selector, only `selectors.ts` is touched.

---

## How to run

```bash
# E2E (UI)
cd e2e
npm install
npm test               # headless
npm run test:local     # headed (HEADED=1)
npm run test:ui        # Playwright UI mode
npm run report         # open HTML report

# E2E, one test by file:line
npx playwright test tests/signin.spec.ts:42

# E2E, one shard (4-shard matrix)
npx playwright test --shard=1/4

# API
cd api
npm install
npm test
```

Credentials live in `e2e/.env` (gitignored):
```
BASE_URL=https://demo-saas.bugbug.io
SIGNIN_EMAIL=...
SIGNIN_PASSWORD=...
```

The API suite reuses the same `.env` via `dotenv.config({ path: '../e2e/.env' })`.

### CI

Pushes and PRs to `main` trigger `.github/workflows/e2e_tests.yml`:

1. A 4-shard matrix runs `--shard=N/4 --reporter=blob` in parallel — separate runner IPs sidestep the per-IP auth rate limit.
2. A downstream `merge-reports` job downloads every blob, runs `playwright merge-reports --reporter=html,./utils/featureMapReporter.ts`, and uploads one combined HTML report.
3. A cleanup step deletes the intermediate `blob-report-*` artifacts via the GitHub API so only the merged `playwright-report` remains visible.

The feature-map reporter writes a Markdown summary table to `$GITHUB_STEP_SUMMARY` so reviewers see pass/fail per test ID directly on the run page.

---

## How Claude AI was used to build this project

This suite was built by treating Claude — specifically Claude Code with the autoqa subagent — as the primary author, and using a human (me) as reviewer / direction setter / git-push gate. Every line of code, every test, every CI tweak in this repository was produced by Claude under instruction. The interesting parts are *how* the collaboration was structured and *what* lessons emerged.

### Tools used

* **Claude Code CLI** with the Sonnet/Opus 4 family — the interactive agent the suite was authored through.
* **autoqa subagent** — a specialized Claude agent (definition in `.claude/agents/autoqa.md`) that owns the explore → plan → generate → run → heal loop end-to-end for a given feature area.
* **Playwright MCP browser tools** — Claude drove a real Chromium instance to explore the live app, snapshot the DOM, and discover selectors. No selector was guessed from training data; every locator was harvested from a live session.
* **Auto-memory** at `~/.claude/projects/.../memory/` — persistent feedback across sessions. Recorded rules like "never `git push` without per-action permission" so the agent doesn't repeat onboarding-day mistakes.

### Workflow per feature area

For each new feature surface (e.g. "post-login dashboard"), the loop was:

1. **Explore.** The autoqa agent opened the live app via Playwright MCP, signed in with real credentials, and clicked through every reachable page in the surface. It captured DOM snapshots, network calls, and rendered text — building a model of what selectors exist and what behaviours matter.
2. **Plan.** It drafted a test plan as Markdown — golden paths, validation paths, edge cases, negative paths — assigned a two-letter prefix per feature (`DB`, `TK`, `NT`, …) and numbered each scenario.
3. **Generate.** It wrote one Page Object per feature under `e2e/pages/`, one spec per feature under `e2e/tests/`, added new selector groups in `selectors.ts`, added URL fields and helper wrappers in `HelperFunctions` only when an existing one didn't fit.
4. **Run.** It executed `npm test` and reported pass/fail counts.
5. **Heal.** When tests failed it diagnosed the root cause — strict-mode collision, timing race, hidden-element opacity, rate-limit cascade, app state drift — and patched the smallest possible surface. It self-healed until the suite was twice-green (consecutive runs).
6. **Sync.** It updated `manual/TEST-CASES.xlsx`, `manual/TEST_CASES.md`, and `feature-map/feature-map.yml` so the test plan, the human-readable index, and the CI feature-map reporter all stayed in lockstep.

I, the human, owned the goal-setting ("now do post-login surfaces"), the trade-off calls ("4 shards, not 7"), and the git-push gate. Nothing was pushed without explicit "yes push" for that specific commit.

### Concrete examples of where the AI saved real time

* **Selector discovery via MCP.** When the OS0002 test failed on CI with `text=Admin` not found, the agent opened the live members page in MCP, ran `document.querySelectorAll` in browser context to inspect the actual DOM, found that the role is rendered as `<input class="mantine-Select-input" value="Admin">` (not a text node), patched the selector + auto-waiting helper, and verified the fix on a real run — all in one pass. A human doing the same would have spent the same time but with more context-switching cost.
* **Sharded reporting fix.** When the CI run page showed four stacked feature-map tables (one per shard) instead of one merged table, the agent diagnosed it as "the reporter ran once per shard against a partial result set", moved the reporter into the merge-reports job, added a `gh api` cleanup step for intermediate blob artifacts, and trained the autoqa agent definition with the canonical YAML pattern so future projects start out right. That same training is reusable across every future test suite I build with this agent.
* **Three-layer enforcement refactor.** A first-pass build had 22 direct `page.*` calls leaking through spec files and inline locator strings in POMs. The agent fixed every one of them, added the missing `HelperFunctions` wrappers (`pressKey`, `reload`, `waitForUrl`, `assertUrlMatches`, `getUrlSearchParam`, `clickAndWaitForResponse`, `fillSubmitAndWaitForResponse`, `getInputValue`, `getElementCount`, `getAllTextContents`, `assertElementCount`, `getAttribute`), and re-ran the entire suite to verify nothing regressed.
* **Session pattern rewrite for sharding.** Original build used Playwright `globalSetup` to sign in once and persist a `storageState` file for all post-login specs to reuse. This blocked sharding because each runner has its own filesystem. The agent rewrote every post-login spec to sign in fresh in its own `test.beforeAll` via a shared `Session` POM, deleted `globalSetup.ts` + `sessionFixture.ts` + the `.auth/` directory, updated `playwright.config.ts`, and validated the same 50/50 green output. Then it added that pattern to the autoqa agent definition as a permanent rule.

### What the AI is bad at (and how the workflow worked around it)

* **Stale assumptions about live state.** The MCP browser session and the test runner sometimes saw different DOM (e.g. paragraph vs. input for the member role, depending on Mantine hydration timing). The agent's first instinct is to trust the most recent snapshot — but the most recent snapshot isn't always the runtime state. Workaround: when a fix is non-obvious, force the agent to re-open MCP and inspect the live page again rather than reason from training data.
* **Confidence without verification.** Default phrasing is too confident ("all tests pass"). I trained the autoqa agent to always report exact pass/fail counts from a real run, and to call out what was *not* actually executed (e.g. "CI workflow file edited but not run in real GitHub environment").
* **Over-eager remote actions.** Early in the project the agent pushed a commit without asking. Now there's a hard rule in auto-memory: never push or change remote state without explicit per-action permission. A prior "yes push" does not carry forward. This pattern is the kind of thing only persistent memory can enforce reliably.

### Lessons recorded in `~/.claude/agents/autoqa.md`

Each time the agent worked through a non-obvious problem in this project, I had it write the lesson into the standing autoqa instructions so future projects start out with that knowledge. The sections currently recorded:

* `### Folder layout` — `utils/` not `helpers/`; feature map in `feature-map/feature-map.yml`.
* `### Feature map & test IDs` — embed the ID in test titles, keep yml + spec titles in sync.
* `### Reporting` — feature-map Markdown reporter + GitHub step summary integration.
* `### CI` — secret-verification step, Playwright browser cache, Node-24-native action pins.
* `### Sharding policy` — when to introduce sharding, shard count threshold.
* `### Sharded reporting mechanism` — canonical YAML for blob → merge → cleanup, with the "run reporter only in merge job" gotcha.
* `### Strict three-layer enforcement` — explicit lists of forbidden primitives in specs and POMs, plus selector strict-mode scoping rules.
* `### Authenticated-spec session pattern` — fresh login per spec, isolated context for sign-out tests, no `storageState`.
* `### Git push & remote-state changes` — per-action permission, validate locally first.
* `### Live-app exploration discipline` — treat the shared test account as production data; ask before creating persistent state.

These ten subsections are the institutional knowledge layer. The next time autoqa builds a Playwright suite for a different app, it starts from this baseline and skips the mistakes that produced it.

---

## Project conventions

See [`CLAUDE.md`](./CLAUDE.md) for the conventions Claude follows on this codebase (test ID format, coloured-log contract, ESM-only, etc.).

See [`manual/TEST_CASES.md`](./manual/TEST_CASES.md) for the per-test plan index.

## Status

* E2E: 50/50 green locally and on isolated CI shards.
* API: 13/13 green.
* CI: 4-shard matrix with merged HTML report and feature-map step summary.
