// Final Phase 2 bullet: the folder/filter pane as an overlay at tablet portrait
// and phone, closing on folder pick (P10).
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const TRIGGER = '[aria-label="Folders"]';
const CLOSE = '[aria-label="Close"]';
const PANE = '[data-component="left-panel"]';
const TREE_KEY = 'flux.userPref.docBrowser.treeOpen';
let failed = 0;
const check = (n, p, d) => { if (!p) failed++; console.log(`${p ? 'PASS' : 'FAIL'}  ${n}${d ? `  [${d}]` : ''}`); };

const paneShape = (page) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return { found: false };
    const r = el.getBoundingClientRect();
    return {
      found: true,
      x: Math.round(r.x), w: Math.round(r.width),
      overflows: Math.round(r.right) > window.innerWidth + 1,
      // Is anything actually beside it, or has it taken the whole row?
      gridW: Math.round(document.querySelector('[data-component="content-panel"]')?.getBoundingClientRect().width ?? 0),
    };
  }, PANE);

async function boot(page, url = `${BASE}/documents?ws=marra-ridge`) {
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('[id^="docrow-"]', { timeout: 45000 });
}

(async () => {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
  const errors = [];

  // ── Desktop unchanged: pane is a column, no trigger button ───────────────
  let ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
  let page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  await boot(page);
  let s = await paneShape(page);
  check('desktop: pane is an inline column', s.found && s.w > 200 && s.gridW > 600, `pane ${s.w}, grid ${s.gridW}`);
  check('desktop: no overlay trigger button', (await page.locator(TRIGGER).count()) === 0);
  await ctx.close();

  // ── Tablet portrait: overlay drawer ──────────────────────────────────────
  ctx = await browser.newContext({ viewport: { width: 820, height: 1100 } });
  page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  await boot(page);

  check('tablet portrait: pane is not taking a column', !(await paneShape(page)).found);
  const gridAlone = (await page.evaluate(() =>
    Math.round(document.querySelector('[data-component="content-panel"]').getBoundingClientRect().width)));
  check('tablet portrait: the table gets the full width', gridAlone > 700, `${gridAlone}px of 820`);

  // useUserPref writes its DEFAULT on mount (no dirty guard — §5), so the key
  // exists whatever we do. The question is whether opening the overlay CHANGES
  // it, so snapshot the value first and compare.
  const treeOpenBefore = await page.evaluate((k) => localStorage.getItem(k), TREE_KEY);

  check('tablet portrait: trigger button present', (await page.locator(TRIGGER).count()) > 0);
  await page.click(TRIGGER);
  await page.waitForTimeout(600);
  s = await paneShape(page);
  check('tablet portrait: opens as a drawer', s.found && s.w > 250 && s.w < 400, `${s.w}px wide`);
  check('tablet portrait: starts after the nav rail', s.found && s.x >= 50, `x=${s.x}`);
  check('tablet portrait: does not overflow', s.found && !s.overflows);

  const backdrop = await page.evaluate(() =>
    [...document.querySelectorAll('div')].some((d) => /bg-black\/40/.test(d.className)));
  check('tablet portrait: has a backdrop over the list', backdrop);

  // P10: picking a folder closes it.
  await page.locator('.folder-row', { hasText: '02 Engineering' }).first().click();
  await page.waitForTimeout(700);
  check('tablet portrait: picking a folder closes the drawer (P10)', !(await paneShape(page)).found);
  const url = await page.evaluate(() => location.search);
  check('tablet portrait: ...and the folder was actually applied', /folder=/.test(url), url.slice(0, 60));

  // Escape closes it too.
  await page.click(TRIGGER);
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  check('tablet portrait: Escape closes the drawer', !(await paneShape(page)).found);

  // Opening it must not rewrite the desktop preference (§5).
  const treeOpenAfter = await page.evaluate((k) => localStorage.getItem(k), TREE_KEY);
  check('tablet portrait: desk open-state preference unchanged by the overlay',
    treeOpenBefore === treeOpenAfter, `${treeOpenBefore} -> ${treeOpenAfter}`);

  await page.click(TRIGGER);
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'e2e/screenshots/tablet-pane-drawer.png' });
  await ctx.close();

  // ── Phone still behaves as before ────────────────────────────────────────
  ctx = await browser.newContext({ viewport: { width: 414, height: 846 }, hasTouch: true, isMobile: true });
  page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  await boot(page);
  await page.click(TRIGGER);
  await page.waitForTimeout(600);
  s = await paneShape(page);
  check('phone: opens full-bleed, not a 320px drawer', s.found && s.w >= 400, `${s.w}px of 414`);
  check('phone: close button still clears the banner', await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return r.top >= 60 && !!hit && (el === hit || el.contains(hit));
  }, CLOSE));
  await page.locator('.folder-row', { hasText: '02 Engineering' }).first().click();
  await page.waitForTimeout(700);
  check('phone: picking a folder still closes it', !(await paneShape(page)).found);
  await ctx.close();

  // ── Growing back to a column must not leave a stale overlay ─────────────
  ctx = await browser.newContext({ viewport: { width: 820, height: 1000 } });
  page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  await boot(page);
  await page.click(TRIGGER);
  await page.waitForTimeout(500);
  await page.setViewportSize({ width: 1500, height: 1000 });
  await page.waitForTimeout(800);
  const grown = await paneShape(page);
  check('widening back: exactly one pane, as a column', grown.found && grown.gridW > 600, `pane ${grown.w}, grid ${grown.gridW}`);
  const stray = await page.evaluate(() =>
    [...document.querySelectorAll('div')].filter((d) => /bg-black\/40/.test(d.className)).length);
  check('widening back: no stale backdrop', stray === 0, `${stray}`);
  await ctx.close();

  check('no uncaught page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  await browser.close();
  console.log(failed === 0 ? '\nALL CHECKS PASSED' : `\n${failed} CHECK(S) FAILED`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => { console.error('HARNESS ERROR:', e.message); process.exit(2); });
