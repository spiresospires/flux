# Quality Gates — Testing, Lint & CI

> **Audience:** engineers picking up FLUX at handover. This is the current-state
> reference for how the code is checked. For the chronology of how it got here see
> `DEVELOPMENT_LOG.md` §17–18 (repo hygiene baseline, first test suite) and §29–30
> (test coverage for the placeholder/journey work, CI + pre-commit added).
>
> FLUX is a UX prototype, not production code. The gate exists so the prototype
> stays *handover-ready* — a broken typecheck or a failing test can't sit unnoticed
> in a branch — not to certify production quality.

## The one command

```bash
npm run check
```

`check` runs **typecheck → lint → test**, sequentially, failing fast on the first
error. It is the single gate. The same command runs in all three enforcement
points below, so "it passes locally" and "it passes in CI" mean the same thing.

| script | what it does |
|---|---|
| `npm run typecheck` | `tsc --noEmit` — type-check only, no emit |
| `npm run lint` | `eslint . --ext .js,.jsx,.ts,.tsx` |
| `npm test` | prewarm (see the open issue below), then `vitest run` — single pass |
| `npm run test:watch` | prewarm, then `vitest` — watch mode for development |
| `npm run check` | all three above, in order, fail-fast |

**Current state (verified 2026-08-10):** typecheck clean · lint **0 errors, 0
warnings** · **180 tests across 10 files** pass. Wall-clock varies a lot with filesystem
cache state on Windows — ~45–65s is typical here; see the open issue below for why.

## Where it runs — three enforcement points

1. **On demand (local):** `npm run check`.
2. **Pre-commit hook:** [`.githooks/pre-commit`](../.githooks/pre-commit) runs
   `npm run check` before every commit. Zero-dependency (no husky) — the `prepare`
   npm script points git at the hooks dir via `git config core.hooksPath .githooks`,
   and npm runs `prepare` automatically after `npm install`, so a fresh clone is
   covered without anyone remembering a setup step. Bypass deliberately with
   `git commit --no-verify` (e.g. a WIP spike) — CI runs the same command, so a
   bypass only defers the failure.
3. **CI:** [`.github/workflows/check.yml`](../.github/workflows/check.yml) runs on
   every push (all branches) and every pull request — `ubuntu-latest`, Node 20,
   `npm ci` then `npm run check`.

> **Note on the remote:** the repo is on GitHub now and moves to GitLab at handover.
> `check.yml` is GitHub Actions; the equivalent GitLab CI pipeline should be written
> when the repo actually moves, running the same `npm ci → npm run check`.

> **Hook executable bit:** `.githooks/pre-commit` must have its executable bit set,
> or macOS/Linux clones silently ignore it (Windows is unaffected):
> `git update-index --chmod=+x .githooks/pre-commit`.

## Typecheck — why it's separate from the build

`npm run build` succeeding tells you **nothing about type safety.** Vite strips
TypeScript types during bundling without checking them, so the build compiles code
that `tsc` would reject. `npm run typecheck` (`tsc --noEmit`) is the only thing that
actually type-checks the project. This is the single most important line in this doc
for a new contributor: **run `check`, not `build`, to know the types hold.**

## Lint — ESLint

Config: [`.eslintrc.cjs`](../.eslintrc.cjs) (classic eslintrc, ESLint 8). Extends
`eslint:recommended` + `@typescript-eslint/recommended` + `react-hooks/recommended`,
with the `react-refresh` plugin.

**Keep lint at zero — errors *and* warnings.** This matters more than the findings
themselves did: a lint that always reports something is indistinguishable from a
newly-broken one, so a non-empty lint carries no signal. At zero, anything new is
unambiguously something just introduced. The 6-warning baseline that stood through
the first suites has since been burned down to zero (2026-08-10); keep it there.

Two config decisions worth knowing:

- **`no-unused-vars` honours a leading `_`** (`argsIgnorePattern`/`varsIgnorePattern`/
  `caughtErrorsIgnorePattern: '^_'`, `ignoreRestSiblings: true`). The codebase uses
  the destructure-to-omit idiom in several places —
  `const { updatedAt: _at, updatedBy: _by, ...rest } = rule` — where discarding the
  named bindings is the *point*. Without this rule config ESLint flags the idiom and
  every "auto-fix" is wrong. Don't delete the underscore-prefixed bindings.
- **`react-refresh/only-export-components` is off for `src/contexts/*.tsx`** — context
  files legitimately export a provider component *and* a hook/value from the same file.

There were 6 baseline warnings through the first test suites; all are now fixed
(2026-08-10). How each was resolved, since the same shapes will recur:

- **`react-hooks/exhaustive-deps` on `useUserPref` setters** (`CollapsibleFilterPanel`,
  `Chat`, `DocumentBrowser`) — the setter returned by `useUserPref` is
  `useCallback(…, [])`, referentially stable, so it was added to the effect's dep array
  directly. Safe because a stable identity never re-fires the effect.
- **`react-hooks/exhaustive-deps` on a local function** (`FeedbackWidget`'s
  `handleClose`) — a function recreated every render, so adding it to the deps would
  re-subscribe each render. Fixed instead by inlining its body into the effect, which
  then depends only on the reactive value it actually uses.
- **`react-refresh/only-export-components`** (`DocumentCard`, `RuleEditor`) — a module
  can't export both a component and a non-component helper without breaking Fast
  Refresh. The helpers were moved to sibling modules: `getFileTypeIcon` →
  `fileTypeIcon.tsx`, `newRuleTemplate` → `distribution/ruleTemplate.ts`. Note the
  extracted `.tsx` must contain **no named (PascalCase) component** either — the DWG
  glyph was inlined as an anonymous factory so `fileTypeIcon.tsx` stays component-free.

## Tests — Vitest

Runner: **Vitest 4**, config in [`vitest.config.ts`](../vitest.config.ts) (kept
separate from `vite.config.ts` so the build config stays focused on bundling; Vitest
reuses Vite's TS transform, so there's no separate babel/ts-jest setup). **Vitest,
not Jest** — this is a Vite project, so the test runner reuses the existing transform
pipeline rather than maintaining a second parallel build config.

### Three config traps — read before writing a test

These are invisible landmines. All three are documented in `vitest.config.ts`; they're
repeated here because they *will* bite a new contributor.

1. **`environment: 'node'` by default.** Most of the suite is pure functions (business
   rules, icon geometry) that need no DOM. A component test opts into jsdom **per file**
   with `// @vitest-environment jsdom` on the *first line* — jsdom's setup costs several
   seconds and only a couple of files need it.
2. **`globals: false`** — `describe`/`it`/`expect` are imported explicitly (keeps tests
   honest under `tsc --noEmit`). The consequence: `@testing-library/react` does **not**
   auto-register cleanup. **Every component test file must call `afterEach(cleanup)`
   itself**, or renders accumulate in `document.body` and queries start matching stale
   duplicates from earlier tests.
3. **`fileParallelism: false`** — forces a single worker. Note this is *not* a
   perf tuning knob here; see the open issue below, which it does **not** solve.

### ⚠️ Open issue: intermittent worker-start failure on Windows

**Status: OPEN — not fixed.** Two attempted fixes failed; don't assume it's handled.

Symptom — intermittent, on Windows only, never seen on CI (ubuntu):

```
Error: [vitest-pool]: Failed to start threads worker for test files …/VersionStack.test.tsx
Caused by: Error: [vitest-pool-runner]: Timeout waiting for worker to respond
```

It hits only the two jsdom files, and *which* one varies per run. **The tests are not
failing** — the worker never starts, so that file's tests never run and the run exits
non-zero. Check the arithmetic to confirm you're looking at this and not a real failure:
`171 passed` = 180 − 9 (DocumentJourney's count); `172 passed` = 180 − 8 (VersionStack's).

**Mechanism** (verified against vitest 4.1.10 source, `node_modules/vitest/dist/chunks/
cli-api.BK8pd4xc.js`): `START_TIMEOUT` at `:2794` is a hardcoded `6e4` — 60s — applied at
`:2906` via `withTimeout(waitForStart(), …)`; `WORKER_START_TIMEOUT` at `:3395` is a
hardcoded `9e4`. **Neither is configurable** by config key, CLI flag or env var. Measured
on the affected machine: `import('jsdom')` costs **~80s cold vs ~1.6s warm**, while
`new JSDOM()` costs **99ms** — so ~99.9% of the cost is cold-reading jsdom's 1,728-file
module tree at ~35ms/file (antivirus scanning `node_modules`), not DOM work. That read cost
is what breaches the 60s ceiling.

**Two fixes that did NOT work — don't re-apply:**

1. `poolOptions: { threads: { singleThread: true } }` — **dead config in vitest 4.** The
   string `singleThread` does not appear anywhere in the vitest 4.1.10 package; `poolOptions`
   only emits a deprecation warning. It was a silent no-op.
2. `fileParallelism: false` — kept, but not a fix, and possibly counterproductive: it forces
   `maxWorkers=1`, which (`cli-api:3817`) puts every spec in its own single-spec group — one
   60s-gated startup *per file*, i.e. ten independent chances to fail.

**The lesson generalises:** anything that reduces the *number* of worker startups cannot beat
a fixed *per-startup* ceiling. Both failed attempts made that mistake. The real levers are
cutting the cold-read cost (an AV exclusion for `node_modules` — machine-level, needs admin)
or sharing one DOM environment across both jsdom files (`isolate: false`, ideally via a
project split). Note `happy-dom` is **not** the answer despite looking like one: it only makes
DOM construction cheaper, which is 99ms of an 80,000ms cost.

**Current mitigation: [`scripts/prewarm-test-env.mjs`](../scripts/prewarm-test-env.mjs).**
The `test` npm script chains it ahead of vitest. It imports jsdom (and the vitest worker
module graph) in a **plain node process, which has no timeout**, so the expensive cold read
happens *outside* the 60s window and the in-handshake read hits a warm cache. Total work is
unchanged — the cost moves out of the timed window rather than disappearing. It always exits
0, so a prewarm problem can never block the suite.

Effect on the quantity that actually matters — vitest's reported `environment` time, i.e. the
in-window DOM setup cost:

| | reported `environment` |
|---|---|
| Failing runs (before) | 28.11s – 53.99s |
| Passing-but-marginal runs (before) | 17s – 22s |
| With prewarm | **3.57s** |

**⚠️ Honestly scoped: this is a mitigation, not a cure, and it is NOT fully verified.** The
run above had a warm cache (prewarm reported 1,738ms). The decisive test needs a genuinely
cold cache — see the protocol below. The real cure is removing the ~35ms/file cold-read cost:
**an antivirus exclusion for `C:\GitHub\flux\node_modules`**, which needs admin rights and is
a machine/IT action. That also cannot travel with the handover, whereas the prewarm script can.

### How to verify a fix here (and why clean runs prove nothing)

**No number of consecutive clean runs justifies confidence.** Two earlier attempts were
"verified" by five and then four clean runs, and both were later falsified — one of them was
literally dead config that changed nothing. The reason is structural: the affected machine has
32GB RAM with ~15.6GB free, so `node_modules` (237MB) cannot be evicted from page cache on
demand. **Warm runs therefore cannot reproduce the failure**, which makes warm clean runs
uninformative — 20 ≈ 5 ≈ 0. Verification has to be mechanism-based:

1. **Stage A — cold/warm asymmetry.** Must be run on a genuinely cold cache: immediately after
   a reboot, as the first command of the day. Run the jsdom import twice back to back and
   compare. PASS = first is tens of seconds, second ~1.5s. This validates the whole premise
   (that filesystem warmth transfers across processes). If the *second* is still tens of
   seconds, the prewarm approach is worthless and only the AV exclusion remains.
2. **Stage B — cold end-to-end.** In that same post-reboot session, run the real chained gate
   (`npm run check`, not a bare `npm test` — `tsc` and `eslint` churn the cache first). The
   result that matters is a run where prewarm logs a **large** number (tens of seconds) *and*
   the suite passes with `environment` in single-digit seconds. That is a positive
   demonstration under the exact condition that breaks the gate.
3. **Stage C — standing invariant.** Every run logs its prewarm duration. The invariant to
   watch: *prewarm duration may be arbitrarily large; reported `environment` must stay in
   single-digit seconds.* If `environment` climbs back into the tens of seconds, the prewarm
   is no longer covering what the worker reads, and it needs extending (add a read-and-discard
   walk of `node_modules/vitest/dist`, `node_modules/@vitest` and `node_modules/vite/dist`).

Don't use `npm ci` as the cold rig: npm has just written those files, so they're page-cache
warm and only the AV scan cache is cold — a non-reproduction would be ambiguous. (And this
repo already has one `npm ci` lockfile-sync incident.)

**If it blocks a commit:** the tests genuinely pass and CI enforces the same gate on Linux,
so `git commit --no-verify` is legitimate here — this is the documented bypass, and this
failure is exactly the case it exists for.

### What's covered (180 tests / 10 files)

Coverage is deliberately narrow and chosen for value, not count: the **pure-function
engines** encode decisions that are invisible from the UI and that a new team cannot
recover by clicking around.

| test file | env | covers |
|---|---|---|
| `src/utils/distributionEngine.test.ts` | node | AD rules: priority conflicts, rule warnings, draft/published & version diffs, condition/trigger rendering, category-scoped field widening |
| `src/utils/search.test.ts` | node | query normalisation, what drives a match, `matchedFields`, snippet fallbacks, facet counts |
| `src/data/mockJourneys.test.ts` | node | journey determinism, revision progression, review-rejection loop, version-stack ordering, placeholder-on-top-of-stack |
| `src/data/documentCorpus.test.ts` | node | corpus invariants: status vocabulary, placeholder field rules, folder-count exclusion, search classification |
| `src/components/flintGeometry.test.ts` | node | Flint icon containment at every tier × state over 360°, rotation rigidity, tier boundaries, spoke/centre colour invariant |
| `src/utils/journey.test.ts` | node | which journey node is "current" (last status match, so a post-rejection revisit wins) and what a doc has earned on a non-rung |
| `src/types/document.test.ts` | node | `isPlaceholder` / `isOverdue` — the predicates content affordances key off instead of a customer-renamable status string |
| `src/data/mockMarkups.test.ts` | node | viewer markup/comment generators — sweeps the corpus for `undefined` from hashed array indexing (a signed-shift bug shipped once this way) |
| `src/components/DocumentJourney.test.tsx` | **jsdom** | current-status badge tracks doc state, red confined to the rejection path, no hard-coded width |
| `src/components/VersionStack.test.tsx` | **jsdom** | placeholder version disables view/download, current row marked once, view opens the framed viewer for that revision |

**A caution for whoever adds the next tests:** prefer checks that assert an *invariant*
with a known expected value over checks that merely report a plausible-looking number.
The Flint containment check earned its place by catching real bugs — but an earlier
PowerShell version of it *looked* correct while silently sweeping a garbage angle range;
its reported maximum was accidentally right. The current `flintGeometry.test.ts` imports
the geometry and asserts invariants instead, and — decisively — runs in CI (the
PowerShell script never could: runners are Linux).

**Deliberately not tested:** animation timing and hover-state DOM behaviour (timing-
dependent, flaky — a suite people learn to ignore is worse than none; the Flint spin is
covered by its geometry invariants instead), and visual regression (needs infrastructure
not worth it at this stage).

## Operational gotchas

- **`npm ci` needs the lockfile in sync.** CI uses `npm ci`, which refuses to run if
  `package-lock.json` is out of sync with `package.json` (this failed once on 2026-08-10
  when a transitive `yaml` dep had never been resolved into the lockfile). Fix by
  regenerating: `rm -rf node_modules package-lock.json && npm install`, then commit the
  refreshed `package-lock.json`.
- **Windows: a running Vite dev server locks `esbuild.exe`.** `npm install` / `npm ci`
  fail with `EPERM: operation not permitted, unlink` on
  `node_modules/@esbuild/win32-x64/esbuild.exe` while the dev server is up. Stop the dev
  server first, then install. (`npm run check` itself doesn't install, so it's unaffected.)
- **Never round-trip repo files through PowerShell** (`Get-Content -Raw` →
  `Set-Content`): it has twice corrupted UTF-8 files (BOM added, em-dashes mangled).
  Edit with a tool that preserves encoding.

## Known gaps

Documenting what's *not* here, so the receiving team can prioritise:

- **No coverage reporting / thresholds.** The suite is curated by hand, not gated on a %.
- **Component/context coverage is thin.** `jsdom` + Testing Library are installed and two
  component suites exist, but contexts and `useUserPref` (localStorage persistence, parse-
  failure fallbacks, cross-window `storage` sync) are still only exercised by clicking
  through the app.
- **No GitLab pipeline yet** — intentional; write it when the repo moves off GitHub (see
  the remote note above).
- **No `npm audit` / dependency-scanning step** in CI.
