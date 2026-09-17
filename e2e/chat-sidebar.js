// Chat's history sidebar swapped a hand-rolled drag handle for the shared
// component, which moves the grabber ~6px. Confirm the desktop look and that
// dragging still resizes.
import { chromium } from 'playwright';
const BASE = 'http://localhost:5173';
let failed = 0;
const check = (n, p, d) => { if (!p) failed++; console.log(`${p ? 'PASS' : 'FAIL'}  ${n}${d ? `  [${d}]` : ''}`); };

(async () => {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  // Sidebar starts collapsed by default (chat.historyOpen=false), so open it.
  await page.goto(`${BASE}/chat`, { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.evaluate(() => localStorage.setItem('flux.userPref.chat.historyOpen', 'true'));
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(2500);

  const handle = page.locator('[role="separator"]').first();
  check('desktop: drag handle present on the sidebar', (await handle.count()) > 0);

  // Presence is not enough. The aside is overflow-hidden, so a handle that
  // straddles its edge is clipped and ungrabbable while still reporting a full
  // bounding box — it measures and screenshots as if it were fine.
  check('desktop: handle is actually grabbable, not clipped', await page.evaluate(() => {
    const el = document.querySelector('[role="separator"]');
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!hit && (hit === el || el.contains(hit));
  }));

  const before = await page.evaluate(() => {
    const a = document.querySelector('aside');
    return a ? Math.round(a.getBoundingClientRect().width) : null;
  });
  check('sidebar has a width', before && before > 100, `${before}px`);

  // Drag it wider and confirm the width follows.
  const box = await handle.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 120, box.y + box.height / 2, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(400);
  }
  const after = await page.evaluate(() => {
    const a = document.querySelector('aside');
    return a ? Math.round(a.getBoundingClientRect().width) : null;
  });
  check('desktop: dragging still resizes the sidebar', after !== null && after > before, `${before} -> ${after}`);
  check('drag stayed within bounds (240-560)', after >= 240 && after <= 560, `${after}px`);

  await page.screenshot({ path: 'e2e/screenshots/chat-sidebar.png' });
  check('no uncaught page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

  await browser.close();
  console.log(failed === 0 ? '\nALL CHECKS PASSED' : `\n${failed} CHECK(S) FAILED`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => { console.error('HARNESS ERROR:', e.message); process.exit(2); });
