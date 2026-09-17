// Drives the real Flux dev server in Firefox. Lives outside the repo on purpose:
// this is a verification tool, not part of the project's test suite.
// Drives installed Edge: corporate policy blocks executing Playwright's own
// browser builds out of AppData, and viewport sizes are set programmatically
// anyway, so the browser's built-in device presets are irrelevant here.
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const KEY = 'flux.userPref.docBrowser.treeWidth';
let failed = 0;

function check(name, pass, detail) {
  if (!pass) failed++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${detail}]` : ''}`);
}

const panelWidth = (page) =>
  page.evaluate(() => {
    const el = document.querySelector('[data-component="left-panel"]');
    return el ? Math.round(el.getBoundingClientRect().width) : null;
  });

const stored = (page) => page.evaluate((k) => localStorage.getItem(k), KEY);

// The real question for any control: if a finger lands on it, does the click
// reach it — or something painted on top? Presence and visibility both answer
// "yes" for a button sitting under the banner.
const hittable = (page, selector) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return { found: false };
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const hit = document.elementFromPoint(x, y);
    return {
      found: true,
      top: Math.round(r.top),
      reached: !!hit && (el === hit || el.contains(hit) || hit.contains(el)),
      blockedBy: hit ? `${hit.tagName.toLowerCase()}.${(hit.className || '').toString().slice(0, 40)}` : 'nothing',
    };
  }, selector);

(async () => {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  // ── Boot ────────────────────────────────────────────────────────────────
  await page.goto(`${BASE}/documents?ws=marra-ridge`, { waitUntil: 'load' });
  await page.waitForSelector('[data-component="left-panel"]', { timeout: 45000 });
  await page.waitForSelector('.folder-row', { timeout: 45000 });
  check('app boots and MSW serves the folder tree', true);

  // ── Phase 2: the panel-width persistence rule ───────────────────────────
  await page.evaluate((k) => localStorage.setItem(k, '520'), KEY);
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('.folder-row', { timeout: 45000 });
  check('desk width honoured at desktop', (await panelWidth(page)) === 520, `${await panelWidth(page)}px, want 520`);

  await page.setViewportSize({ width: 900, height: 900 });
  await page.waitForTimeout(400);
  // The pane stopped being an inline column at this tier — it is now an
  // on-demand overlay, so there is no column to measure. verify-pane.js covers
  // the overlay itself.
  check('tablet portrait: pane is no longer an inline column', (await panelWidth(page)) === null);
  check('...and leaves the saved setting alone', (await stored(page)) === '520', `stored=${await stored(page)}`);

  await page.setViewportSize({ width: 1150, height: 900 });
  await page.waitForTimeout(400);
  const landscape = await panelWidth(page);
  check('tablet landscape caps the panel', landscape !== null && landscape <= 360, `${landscape}px, want <=360`);
  check('...and still leaves the saved setting alone', (await stored(page)) === '520', `stored=${await stored(page)}`);

  await page.setViewportSize({ width: 1500, height: 900 });
  await page.waitForTimeout(400);
  const restored = await panelWidth(page);
  check('returning to desktop restores the desk width exactly', restored === 520, `${restored}px, want 520`);

  // ── The phone folder sheet ──────────────────────────────────────────────
  await page.setViewportSize({ width: 414, height: 846 });
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('[aria-label="Folders"]', { timeout: 45000 });
  await page.click('[aria-label="Folders"]');
  await page.waitForTimeout(500);

  const close = await hittable(page, '[aria-label="Close"]');
  check('sheet close button exists', close.found);
  check('close button clears the banner', close.found && close.top >= 60, `top=${close.top}px, banner is 60px`);
  check('close button is actually clickable', !!close.reached, `hit ${close.blockedBy}`);

  const tabs = await hittable(page, '[data-component="bottom-tabs"] button');
  check('bottom tab bar is still reachable', !!tabs.reached, tabs.found ? `hit ${tabs.blockedBy}` : 'not found');

  await page.screenshot({ path: 'e2e/screenshots/phone-sheet-open.png' });

  const rows = await page.locator('.folder-row').count();
  check('folder rows render in the sheet', rows > 0, `${rows} rows`);

  // Last row must be reachable — the sheet now stops above the bottom nav.
  const lastVisible = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.folder-row')];
    const last = rows[rows.length - 1];
    last.scrollIntoView({ block: 'nearest' });
    const r = last.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { text: last.textContent.trim().slice(0, 30), reached: !!hit && last.contains(hit) };
  });
  check('last folder row is reachable, not clipped', lastVisible.reached, lastVisible.text);

  await page.locator('.folder-row', { hasText: '02 Engineering' }).first().click();
  await page.waitForTimeout(600);
  const stillOpen = await page.locator('[aria-label="Close"]').count();
  check('picking a folder closes the sheet (P10)', stillOpen === 0, `${stillOpen} close buttons left`);

  await page.screenshot({ path: 'e2e/screenshots/phone-after-folder-pick.png' });

  check('no uncaught page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

  await browser.close();
  console.log(failed === 0 ? '\nALL CHECKS PASSED' : `\n${failed} CHECK(S) FAILED`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => {
  console.error('HARNESS ERROR:', e.message);
  process.exit(2);
});
