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
// pool / fileParallelism — both the default 'forks' pool AND 'threads' would
// intermittently fail to start a worker for the jsdom test files ("Timeout
// waiting for worker to respond"). Running many workers at once starves the slow
// ones, and jsdom's setup is by far the slowest thing in the suite. Since
// `npm run check` now gates commits (.githooks/pre-commit) and CI, a flaky runner
// is worse than a slow one: files run sequentially.
//
// Cost is small — the whole suite is a few seconds warm. If it ever becomes a
// problem, raise parallelism for the node-environment files only rather than
// turning this back on globally.
export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    pool: 'threads',
    fileParallelism: false,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
