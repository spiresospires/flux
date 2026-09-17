# Browser harnesses

Plain Node scripts that drive the running app in a real browser and assert what
the unit suite structurally cannot: that a control is where it should be, is not
covered by something else, and does what it claims when pressed.

```bash
npm run dev          # in one terminal
npm run test:e2e     # in another
```

Each file is standalone — run one directly while working on it:

```bash
node e2e/filter-pane.js
```

| File | Covers |
|---|---|
| `panel-widths.js` | Desk width survives a tablet visit untouched (P7); the phone folder sheet has a reachable way out |
| `touch-presets.js` | Drag handle swaps for the preset-width button where a pointer cannot hover (P8) |
| `chat-sidebar.js` | The Chat history handle is grabbable and still resizes |
| `detail-panel-variants.js` | Properties panel is a column / drawer / bottom sheet per tier, and survives a live resize across the boundary |
| `filter-pane.js` | Folder-filter pane as an overlay at tablet portrait, closing on folder pick (P10) |
| `feedback-pill.js` | Hiding the feedback pill, the notice, and the profile-menu toggle |

## Why these are not in CI

They are **not** part of `npm run check` and do not gate a commit.

They launch **installed Edge** (`channel: 'msedge'`) rather than Playwright's own
browser build, because this project's development machines block executing
binaries out of `AppData` — `npx playwright install` downloads a Firefox or
Chromium that then cannot start ("spawn UNKNOWN"). Edge is already present and
allowed.

That choice is what keeps them off the Linux CI runner, which has no Edge. The
channel is overridable, so wiring them into CI means installing Playwright's
browsers there and setting the variable — no script changes:

```bash
npx playwright install chromium
PLAYWRIGHT_CHANNEL=chromium FLUX_BASE_URL=http://localhost:4173 node e2e/run-all.mjs
```

Worth doing when someone owns it. Until then they are a local gate you run
before handing work over.

## Writing a new one

**Assert that a control can be hit, not that it exists.** Every genuine bug these
found was invisible to a presence check:

- The phone folder sheet's close button rendered, reported a full bounding box,
  and was painted over by the top banner. Tapping it hit the profile avatar.
- The Chat resize handle rendered and measured correctly while being clipped by
  its `overflow-hidden` parent, so it could not be grabbed at all.

Both are caught by `document.elementFromPoint` at the element's centre, checking
the hit is that element:

```js
const r = el.getBoundingClientRect();
const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
return !!hit && (el === hit || el.contains(hit));
```

**Prove a new check fails against the broken code before trusting it.** A check
that passes either way is worse than none, because it looks like coverage.

**Move the cursor with the keyboard, not a click.** Clicking a row's centre is
hit-target roulette once row actions are revealed on narrow layouts — at 500px
it lands on the Ask Flint icon and navigates away, and the harness then reports
a missing panel rather than the click going astray.

Screenshots land in `e2e/screenshots/`, which is gitignored.
