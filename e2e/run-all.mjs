// Runs every browser harness in sequence against an ALREADY-RUNNING dev server.
// Sequential on purpose: they drive real browser windows and several resize the
// viewport, so running them in parallel makes failures hard to attribute.
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.FLUX_BASE_URL ?? 'http://localhost:5173';

const files = readdirSync(here)
  .filter((f) => f.endsWith('.js'))
  .sort();

try {
  const res = await fetch(BASE, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error(`status ${res.status}`);
} catch (err) {
  console.error(`No dev server at ${BASE} (${err.message}).\nStart one with \`npm run dev\`, then re-run.`);
  process.exit(2);
}

const failures = [];
for (const file of files) {
  console.log(`\n──────── ${file} ────────`);
  const code = await new Promise((resolve) => {
    spawn(process.execPath, [join(here, file)], { stdio: 'inherit' }).on('close', resolve);
  });
  if (code !== 0) failures.push(file);
}

console.log('\n════════════════════════════════');
if (failures.length === 0) {
  console.log(`All ${files.length} harnesses passed.`);
} else {
  console.log(`${failures.length} of ${files.length} failed: ${failures.join(', ')}`);
}
process.exit(failures.length === 0 ? 0 : 1);
