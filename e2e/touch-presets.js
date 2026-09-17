// Step 3: preset panel widths on touch.
//
// `(pointer: coarse) and (hover: none)` cannot be forced with
// Emulation.setEmulatedMedia — those features follow from DEVICE emulation, not
// the media override list. Playwright's isMobile/hasTouch context options set
// the device metrics that make them match, so each pointer type gets its own
// browser context.
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const TREE_KEY = 'flux.userPref.docBrowser.treeWidth';
const STEP = '[aria-label="Change panel width"]';
const DRAG = '[role="separator"][aria-label="Drag to resize panel"]';
let failed = 0;
function check(name, pass, detail) {
  if (!pass) failed++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${detail}]` : ''}`);
}

const treeWidth = (page) =>
  page.evaluate(() => {
    const el = document.querySelector('[data-component="left-panel"]');
    return el ? Math.round(el.getBoundingClientRect().width) : null;
  });

(async () => {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
  const errors = [];

  // ── A mouse keeps dragging ────────────────────────────────────────────────
  const mouseCtx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
  const mousePage = await mouseCtx.newPage();
  mousePage.on('pageerror', (e) => errors.push(String(e)));
  await mousePage.goto(`${BASE}/documents?ws=marra-ridge`, { waitUntil: 'load' });
  await mousePage.waitForSelector('.folder-row', { timeout: 45000 });

  check('mouse: reports a hovering pointer',
    !(await mousePage.evaluate(() => matchMedia('(pointer: coarse) and (hover: none)').matches)));
  check('mouse: drag handle present', (await mousePage.locator(DRAG).count()) > 0);
  check('mouse: no step button', (await mousePage.locator(STEP).count()) === 0);
  await mouseCtx.close();

  // ── Touch gets the preset control ────────────────────────────────────────
  // Tablet LANDSCAPE, not portrait. At portrait the folder pane is an overlay
  // with no resize handle at all, so there is nothing to step — the preset
  // control only exists where the pane is still an inline column.
  const touchCtx = await browser.newContext({
    viewport: { width: 1100, height: 900 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await touchCtx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${BASE}/documents?ws=marra-ridge`, { waitUntil: 'load' });
  await page.waitForSelector('.folder-row', { timeout: 45000 });

  const isTouch = await page.evaluate(() => matchMedia('(pointer: coarse) and (hover: none)').matches);
  check('touch: reports a coarse, hoverless pointer', isTouch);
  check('touch: step button present', (await page.locator(STEP).count()) > 0);
  check('touch: drag handle gone', (await page.locator(DRAG).count()) === 0);

  const box = await page.locator(STEP).first().boundingBox();
  check('touch: target meets the 44px floor', box && box.height >= 44, box ? `${Math.round(box.height)}px tall` : 'no box');

  check('touch: step button is actually tappable', await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!hit && (el === hit || el.contains(hit));
  }, STEP));

  // ── Stepping cycles the presets, and leaves the desk setting alone ───────
  // Tree panel at tablet-landscape: min 240, class ceiling 360 -> [240, 300, 360].
  await page.evaluate((k) => localStorage.setItem(k, '520'), TREE_KEY);
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('.folder-row', { timeout: 45000 });

  const seen = [await treeWidth(page)];
  for (let i = 0; i < 4; i++) {
    await page.locator(STEP).first().click();
    await page.waitForTimeout(250);
    seen.push(await treeWidth(page));
  }
  const stops = [...new Set(seen)].sort((a, b) => a - b);
  check('touch: only preset widths are produced', stops.every((w) => [240, 300, 360].includes(w)), seen.join(' -> '));
  check('touch: more than one width is reachable', stops.length > 1, `${stops.length} distinct`);
  check('touch: it cycles rather than sticking', new Set(seen.slice(1)).size > 1, seen.join(' -> '));
  check('touch: desk width survives untouched (P7)',
    (await page.evaluate((k) => localStorage.getItem(k), TREE_KEY)) === '520');

  await page.screenshot({ path: 'e2e/screenshots/touch-preset-control.png' });

  check('no uncaught page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

  await browser.close();
  console.log(failed === 0 ? '\nALL CHECKS PASSED' : `\n${failed} CHECK(S) FAILED`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => { console.error('HARNESS ERROR:', e.message); process.exit(2); });
