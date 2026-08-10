import { defineConfig } from 'vitest/config';

// Vitest config is kept separate from vite.config.ts so the build config stays
// focused on bundling. Vitest still reuses Vite's TypeScript transform, which is
// why no extra babel/ts-jest setup is needed.
//
// environment: 'node' — most of the suite covers pure functions (business rules
// and icon geometry), which need no DOM. Component tests opt in per-file with
// `// @vitest-environment jsdom` on the FIRST line, rather than slowing the whole
// suite down: jsdom costs several seconds of setup and only a few files need it.
//
// globals: false — describe/it/expect are imported explicitly. Keeps the tests
// honest under `tsc --noEmit` without adding ambient global types.
//
// ⚠️ Because globals are off, @testing-library/react does NOT auto-register its
// cleanup. Every component test file must call `afterEach(cleanup)` itself, or
// renders accumulate in document.body and queries start matching duplicates left
// over from earlier tests. See DocumentJourney.test.tsx / VersionStack.test.tsx.
// ⚠️ KNOWN OPEN ISSUE (2026-08-10) — intermittent worker-start failure on Windows:
//   [vitest-pool]: Failed to start threads worker for test files …/*.test.tsx
//   Caused by: [vitest-pool-runner]: Timeout waiting for worker to respond
// It hits only the two jsdom files. The tests themselves are fine — the worker never
// starts, so its file is skipped and the run exits non-zero, aborting the commit.
//
// Mechanism (verified against vitest 4.1.10 source, node_modules/vitest/dist/chunks/
// cli-api.BK8pd4xc.js): START_TIMEOUT at :2794 is a hardcoded `6e4` (60s), applied at
// :2906 via withTimeout(waitForStart(), …). WORKER_START_TIMEOUT at :3395 is likewise a
// hardcoded 9e4. Neither is reachable from config, CLI or env. Measured on this machine,
// `import('jsdom')` costs ~80s COLD vs ~1.6s warm, while `new JSDOM()` costs 99ms — so
// ~99.9% of the cost is cold-reading jsdom's 1,728-file module tree at ~35ms/file
// (antivirus scanning node_modules), not DOM work. That is what breaches the 60s ceiling.
//
// ⚠️ ONE PREVIOUS "FIX" WAS A NO-OP — do not re-apply it:
// `poolOptions: { threads: { singleThread: true } }` was REMOVED because it is DEAD
// CONFIG in vitest 4. The string `singleThread` does not exist anywhere in the vitest
// 4.1.10 package, and `poolOptions` itself only emits a deprecation warning. It changed
// nothing, while its comment claimed a "single long-lived worker" mechanism that vitest 4
// does not implement. Verify a pool option exists before trusting it.
//
// MITIGATION (current): `scripts/prewarm-test-env.mjs`, chained ahead of vitest by the
// `test` npm script. It imports jsdom and the vitest worker graph in a plain node process
// — which has NO timeout — so the expensive cold read happens outside the 60s window and
// the in-handshake read hits a warm cache. The cost moves; it does not vanish.
//
// The general trap: anything that reduces the NUMBER of worker startups cannot beat a
// fixed PER-startup ceiling. Both `singleThread` and `fileParallelism: false` made that
// mistake. Only reducing in-window DURATION works.
//
// `fileParallelism: false` is KEPT, but for its real reason: serial cold reads beat
// concurrent ones on a contended disk, and running serially lets the second jsdom file
// ride the first one's warm cache. It is not a fix for the flake.
//
// Rejected after investigation: `isolate: false` (ThreadsPoolWorker defines no canReuse,
// so a node-env runner can never serve a jsdom task — it would only eliminate the second,
// already-warm jsdom startup, ~1.5s, while making afterEach(cleanup) cross-file
// load-bearing); `happy-dom` (only makes DOM construction cheaper — 99ms of an 80,000ms
// cost); patching the vendored constant (content-hashed bundle, changes every release).
//
// See docs/quality-gates.md → "Open issue: intermittent worker-start failure on Windows"
// for the full mechanism, the real cure (an AV exclusion for node_modules), and why a
// clean local run does NOT demonstrate a fix here.
export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    pool: 'threads',
    fileParallelism: false,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
