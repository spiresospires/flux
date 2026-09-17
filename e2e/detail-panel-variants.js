// Step 4: detail-panel presentation per viewport — split / drawer / sheet,
// the rotation remount, and the narrow metadata layout.
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
let failed = 0;
const check = (n, p, d) => { if (!p) failed++; console.log(`${p ? 'PASS' : 'FAIL'}  ${n}${d ? `  [${d}]` : ''}`); };

// Open the properties panel by clicking the first document row.
// Move the cursor with the keyboard, not a click. Clicking a row's CENTRE is
// hit-target roulette once the row actions are revealed on narrow/touch
// layouts — at 500px it lands on the Ask Flint icon and navigates away instead
// of selecting. ArrowDown is the documented way to move the cursor.
async function openPanel(page) {
  await page.waitForSelector('[id^="docrow-"]', { timeout: 45000 });
  await page.locator('table[role="grid"]').focus();
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(900);
}

const panelShape = (page) =>
  page.evaluate(() => {
    // The label is "<title> details" — it ENDS with the word, it does not start
    // with it. An `^=` selector here silently matches nothing and every shape
    // check passes as "not found".
    const el = document.querySelector('aside[aria-label$=" details"]');
    if (!el) return { found: false };
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const grid = el.querySelector('.detail-field-grid');
    return {
      found: true,
      role: el.getAttribute('role'),
      position: cs.position,
      x: Math.round(r.x), y: Math.round(r.y),
      w: Math.round(r.width), h: Math.round(r.height),
      overflowsRight: Math.round(r.right) > window.innerWidth + 1,
      // A 70svh sheet on an 846px screen has its TOP at ~254 — the thing that
      // makes it a bottom sheet is its bottom edge sitting on the viewport
      // floor, not how far down it starts.
      atBottom: Math.abs(Math.round(r.bottom) - window.innerHeight) <= 2,
      cols: grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').length : null,
    };
  });

(async () => {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
  const errors = [];

  // ── Desktop: inline split column ─────────────────────────────────────────
  let ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
  let page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${BASE}/documents?ws=marra-ridge`, { waitUntil: 'load' });
  // The default panel width is 360, which is UNDER the 420 two-column threshold,
  // so widen it first or "desktop shows two columns" tests the wrong thing.
  await page.evaluate(() => localStorage.setItem('flux.userPref.docBrowser.panelWidth', '560'));
  await page.reload({ waitUntil: 'load' });
  await openPanel(page);
  let s = await panelShape(page);
  check('desktop: panel is an inline column', s.found && s.role === 'complementary' && s.position !== 'fixed', `${s.role}/${s.position}`);
  check('desktop: two metadata columns', s.cols === 2, `${s.cols} cols`);
  check('desktop: does not overflow the screen', !s.overflowsRight);
  await ctx.close();

  // ── Tablet portrait: right-hand drawer ───────────────────────────────────
  ctx = await browser.newContext({ viewport: { width: 820, height: 1100 } });
  page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${BASE}/documents?ws=marra-ridge`, { waitUntil: 'load' });
  await openPanel(page);
  s = await panelShape(page);
  check('tablet portrait: panel is an overlay drawer', s.found && s.role === 'dialog' && s.position === 'fixed', `${s.role}/${s.position}`);
  check('tablet portrait: does not overflow the screen', s.found && !s.overflowsRight, `right edge vs ${820}`);
  check('tablet portrait: single metadata column', s.cols === 1, `${s.cols} cols`);
  await ctx.close();

  // ── Phone: bottom sheet ──────────────────────────────────────────────────
  ctx = await browser.newContext({ viewport: { width: 414, height: 846 }, hasTouch: true, isMobile: true });
  page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${BASE}/documents?ws=marra-ridge`, { waitUntil: 'load' });
  await openPanel(page);
  s = await panelShape(page);
  check('phone: panel is a bottom sheet', s.found && s.position === 'fixed' && s.w >= 400, `w=${s.w} of 414`);
  check('phone: anchored to the bottom, not the side', s.found && s.atBottom, `bottom edge at ${s.y + s.h} of 846`);
  check('phone: does not overflow the screen', s.found && !s.overflowsRight && s.w <= 414, `w=${s.w}`);
  check('phone: single metadata column', s.cols === 1, `${s.cols} cols`);

  // The bug the sheet exists to fix: a drawer here would be 380px wide on a
  // 414px screen and leave the grid unusable.
  const gridWidth = await page.evaluate(() => {
    const el = document.querySelector('[data-component="content-panel"]');
    return el ? Math.round(el.getBoundingClientRect().width) : null;
  });
  check('phone: the document grid keeps its full width', gridWidth !== null && gridWidth > 350, `${gridWidth}px`);

  await page.screenshot({ path: 'e2e/screenshots/phone-detail-sheet.png' });

  // Backdrop dismiss — after the screenshot, or the picture is of an empty page.
  await page.mouse.click(207, 60);
  await page.waitForTimeout(700);
  check('phone: tapping the backdrop closes the sheet', !(await panelShape(page)).found);
  await ctx.close();

  // ── Rotation: variant flips on a live instance ───────────────────────────
  ctx = await browser.newContext({ viewport: { width: 500, height: 900 } });
  page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${BASE}/documents?ws=marra-ridge`, { waitUntil: 'load' });
  await openPanel(page);
  check('rotation: starts as a sheet', (await panelShape(page)).atBottom);
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.waitForTimeout(900);
  const after = await panelShape(page);
  check('rotation: becomes an inline column, no ghost overlay', after.found && after.role === 'complementary', `${after.role}`);
  const backdrops = await page.evaluate(() =>
    [...document.querySelectorAll('div')].filter((d) => /bg-black\/40/.test(d.className)).length);
  check('rotation: no orphaned backdrop left behind', backdrops === 0, `${backdrops} found`);
  await ctx.close();

  check('no uncaught page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  await browser.close();
  console.log(failed === 0 ? '\nALL CHECKS PASSED' : `\n${failed} CHECK(S) FAILED`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => { console.error('HARNESS ERROR:', e.message); process.exit(2); });
