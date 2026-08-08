import { defineConfig } from 'vitest/config';

// Vitest config is kept separate from vite.config.ts so the build config stays
// focused on bundling. Vitest still reuses Vite's TypeScript transform, which is
// why no extra babel/ts-jest setup is needed.
//
// environment: 'node' — the current suite covers pure functions (business rules
// and icon geometry), which need no DOM. When hook/context tests arrive they can
// opt in per-file with `// @vitest-environment jsdom` rather than slowing the
// whole suite down.
//
// globals: false — describe/it/expect are imported explicitly. Keeps the tests
// honest under `tsc --noEmit` without adding ambient global types.
export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
