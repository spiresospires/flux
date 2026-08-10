// Warms the OS file cache (and the antivirus scan cache) for everything Vitest reads
// INSIDE its worker-startup handshake — in a plain node process, which has no timeout.
//
// ─── Why this exists ─────────────────────────────────────────────────────────────
// Symptom (Windows only, intermittent, never on CI):
//   [vitest-pool]: Failed to start threads worker for test files …/*.test.tsx
//   Caused by: [vitest-pool-runner]: Timeout waiting for worker to respond
//
// Vitest kills any worker that has not reported "started" within START_TIMEOUT — a
// hardcoded `6e4` (60s) at node_modules/vitest/dist/chunks/cli-api.BK8pd4xc.js:2794,
// armed at :2906 via withTimeout(waitForStart(), …). It is not reachable from config,
// CLI or env, so the ceiling cannot be raised — only the work inside it made cheaper.
//
// The DOM environment is imported inside that window. Measured on the affected machine:
// `import('jsdom')` costs ~80,000ms COLD vs ~1,600ms warm, while `new JSDOM()` costs
// 99ms. So ~99.9% of the cost is cold-reading jsdom's ~1,730-file module tree at
// ~35ms/file (antivirus scanning node_modules) — file I/O, not DOM work. A cold read
// blows the 60s ceiling; a warm one clears it by ~40x.
//
// Filesystem warmth transfers across processes, so paying that read HERE bounds the
// in-handshake cost to the warm cost by construction. The total work is unchanged —
// it moves out of the timed window into an untimed one.
//
// ⚠️ This is an optimisation, never a gate: it must ALWAYS exit 0. A prewarm failure
// must never block the test run — `npm test` chains on it with &&.
//
// Note this mitigates rather than cures. The actual cause is the ~35ms/file cold read;
// an antivirus exclusion for the repo's node_modules is the only real cure, and needs
// admin rights. See docs/quality-gates.md → "Open issue: intermittent worker-start
// failure on Windows".
// ─────────────────────────────────────────────────────────────────────────────────

import { performance } from 'node:perf_hooks';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const t0 = performance.now();
const elapsed = () => Math.round(performance.now() - t0);

try {
  // 1. The DOM environment — the dominant cost, and the one that breaches 60s.
  //    Constructing a JSDOM instance too, so any subtree that only loads on first
  //    use is read here rather than inside the handshake.
  try {
    const jsdom = await import('jsdom');
    new jsdom.JSDOM('<!doctype html><html><body></body></html>');
  } catch (err) {
    console.warn(`prewarm: jsdom skipped (${err.message})`);
  }

  // 2. The worker's own static graph (@vitest/runner, /expect, /snapshot, /spy,
  //    /mocker, /utils, chai, tinypool, magic-string, pathe …), also read inside the
  //    handshake. Importing the worker entry by file URL pulls that graph off disk.
  //    It may throw for want of a parentPort — harmless, the read already happened.
  //    This filename is stable, unlike the content-hashed cli-api chunk.
  try {
    const workerEntry = path.join(process.cwd(), 'node_modules', 'vitest', 'dist', 'workers', 'threads.js');
    await import(pathToFileURL(workerEntry).href);
  } catch {
    /* expected outside a worker thread — the disk read is the point */
  }

  console.log(`prewarm: test environment warmed in ${elapsed()}ms`);
} catch (err) {
  // Never block the suite on a prewarm problem.
  console.warn(`prewarm: skipped after ${elapsed()}ms (${err?.message ?? err})`);
}

process.exit(0);
