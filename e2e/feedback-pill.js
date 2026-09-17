import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const KEY = 'flux.userPref.ui.feedbackHidden';
let failed = 0;
function check(name, pass, detail) {
  if (!pass) failed++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${detail}]` : ''}`);
}

const hittable = (page, sel) =>
  page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return { found: false };
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { found: true, reached: !!hit && (el === hit || el.contains(hit)) };
  }, sel);

(async () => {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForSelector('[aria-label="Hide the feedback button"]', { timeout: 45000 });
  check('pill shows by default with a close control', true);

  const x = await hittable(page, '[aria-label="Hide the feedback button"]');
  check('close control is actually clickable', !!x.reached);

  // The pill must still open the panel — the button split must not break it.
  await page.click('[aria-label="Give feedback on your experience with this page"]');
  await page.waitForTimeout(400);
  check('pill still opens the feedback panel', (await page.locator('[role="dialog"]').count()) > 0);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // Hide it.
  await page.click('[aria-label="Hide the feedback button"]');
  await page.waitForTimeout(500);
  check('pill disappears when closed', (await page.locator('[aria-label="Give feedback on your experience with this page"]').count()) === 0);

  // Scoped by text: the documents page has its own sr-only role="status" live
  // region, which a bare [role="status"] count picks up as a false positive.
  const NOTICE = '[role="status"]:has-text("Feedback hidden")';
  const noticeText = (await page.locator(NOTICE).count())
    ? (await page.locator(NOTICE).first().textContent()).trim()
    : '';
  check('a notice explains where it went', /profile menu/i.test(noticeText), noticeText.slice(0, 70));

  check('preference saved', (await page.evaluate((k) => localStorage.getItem(k), KEY)) === 'true');

  // Gone on another page too, and after a reload.
  await page.goto(`${BASE}/documents?ws=marra-ridge`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  check('still hidden on another page', (await page.locator('[aria-label="Give feedback on your experience with this page"]').count()) === 0);
  check('notice does not replay on load', (await page.locator(NOTICE).count()) === 0);

  // Turn it back on from the profile menu.
  await page.click('button[aria-label="Profile"]');
  await page.waitForTimeout(400);
  const showBtn = page.locator('text=Show feedback');
  check('profile menu offers "Show feedback"', (await showBtn.count()) > 0);
  await showBtn.first().click();
  await page.waitForTimeout(600);

  check('pill returns without a reload', (await page.locator('[aria-label="Give feedback on your experience with this page"]').count()) > 0);
  check('preference cleared', (await page.evaluate((k) => localStorage.getItem(k), KEY)) === 'false');

  await page.click('button[aria-label="Profile"]');
  await page.waitForTimeout(400);
  check('menu now offers "Hide feedback"', (await page.locator('text=Hide feedback').count()) > 0);
  await page.keyboard.press('Escape');

  await page.screenshot({ path: 'e2e/screenshots/feedback-pill.png' });
  check('no uncaught page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

  await browser.close();
  console.log(failed === 0 ? '\nALL CHECKS PASSED' : `\n${failed} CHECK(S) FAILED`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => { console.error('HARNESS ERROR:', e.message); process.exit(2); });
