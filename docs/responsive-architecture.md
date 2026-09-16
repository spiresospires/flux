# Responsive architecture

Status: **partially implemented.** Last verified against the code 2026-09-15.

> ## Implementation status — read this before using any file:line below
>
> This document was written as a proposal on 2026-08-16 and said "no code changed". That is no
> longer true, and **many of its file:line references are stale** — files have grown, shrunk and
> been rewritten since. Treat every citation as a hint, not an address: grep for the symbol.
>
> **Landed on master** (2026-08-25, commits `cdde096`, `bbf5dc5`, `d3b6b72`, `960733b`):
> viewport classification store; pluggable Apryse viewer backend; phone folder/filter sheet;
> `AppShell` layout route with `BottomTabBar`/`NavDrawer`; `RequiresViewport` route guard.
>
> **Phase 0 is complete.** Every bullet in its list below is done, including the two that this
> document still describes as outstanding (the viewer close button, and a `touchAction: 'none'`
> on the column resizer that no longer exists anywhere in `src/`).
>
> **Phase 1 is complete** as of 2026-09-15, though not as originally scoped — see §12. Its two
> remaining items (the grid prefixes and the hover-reveal rule) landed 2026-09-16; the only thing
> still parked inside Phase 1 is `--touch-btn-min`, which needs a per-surface pass.
>
> **Phases 2 and 4 are partly landed**; Phase 3 (tables) is untouched.
>
> ### Decisions that supersede the text below
>
> | # | Decision | Where it lands |
> |---|---|---|
> | P1 | **Laptop/large monitor is the design centre.** Document Controllers are office-based ~90% of the time. Tablets and phones must be *functional*, not equal. | Scope of every phase |
> | P2 | **A row of buttons that does not fit collapses into a three-dot overflow menu.** The standard answer to crowding, chosen over hiding or wrapping. | §7, §9 |
> | P3 | **Phone document list shows Title · Rev · Status · Date.** Settles the §13 open question; recency was chosen over the reference code. | §9 |
> | P4 | **Markup and redlining are NOT gated off on touch.** §10 says to disable them on any coarse pointer. That is wrong: annotation is Apryse's, not ours, and Apryse ships a Mobile SDK for exactly this. Gate on *which viewer backend is active*, never on pointer type or width. | §10 |
> | P5 | **Activities (RFI, TQ, Formal Review + decision codes) is a planned product area** that must work on mobile. It does not exist in FLUX yet. Leave room for it in primary navigation rather than fitting navigation to today's feature set. | §6 |
> | P6 | **The JS tier uses `matchMedia`, not `window.innerWidth`.** Reverses §2. See "Tier 2" there for why — do not revert it. | §2 |
>
> ### Phase 2 decisions, taken with the product owner 2026-09-16
>
> | # | Decision | Where it lands |
> |---|---|---|
> | P7 | **Desk intent is only ever set at a desk.** A drag below the desktop class applies for that visit and is never written to the stored preference. Settles §5 in favour of one stored width per panel rather than one per viewport class — the alternative was rejected as more for the engineering team to carry, and for making "why is my panel this width?" unanswerable. | §5 |
> | P8 | **Touch resizes panels by preset widths, not by dragging.** The drag handles stay mouse-only. Touch tiers get a control that steps through set widths, per §7's "replace, don't port". | §7 |
> | P9 | **Column reorder keeps desktop drag *and* gains a non-drag route.** §9 offered up/down controls as a replacement; the decision is that it is an addition. Mouse users lose nothing, and touch and keyboard users get the first route they have ever had. | §9 |
> | P10 | **The tablet-portrait folder/filter pane closes when a folder is picked.** It slides over the document list rather than sitting beside it, and a folder tap returns the user straight to the documents. | §8 |
>
> *FLUX is the internal Idox project name for this user-experience work. The product is
> **FusionLive**.*

Companion to `ARCHITECTURE.md`. Covers how FLUX moves from a fixed ~1280px desktop shell to
full tablet-landscape support, usable tablet portrait, and core mobile workflows.

Objectives, as set by the product owner:

| Class | Target |
|---|---|
| Desktop / laptop | Primary experience. Do not regress. |
| Tablet landscape | Fully supported |
| Tablet portrait | Usable |
| Phone | Core workflows only — explicitly not parity |

---

## 0a. Decisions taken

Agreed with the product owner, 2026-08-17. These are settled; the sections below are written
against them.

| # | Decision | Detail |
|---|---|---|
| D1 | **Phone scope** | Find, view, document grid, filter, My Briefcase, Ask Flint. *Not* "what's assigned to me" — that depends on the Activities phase. |
| D2 | **Scope switcher** | Nav drawer, plus an always-visible context strip under the header on Documents and Search. |
| D3 | **Bottom tab bar** | `Documents · Search · Flint · Briefcase · More`. Five slots, all filled. |
| D4 | **Gated routes** | `/design-system` only. Automatic Distribution and the Packages wizard **must be made to work** at tablet portrait and phone. |
| D5 | **Touch targets** | Grow controls, not rows. Checkboxes and icon buttons to 44px on coarse pointers; row padding rises only slightly. |
| D6 | **Narrow column set** | ~~Reference, Title, Rev, Status.~~ **Title · Rev · Status · Date** — superseded by P3 (2026-09-15). Recency was chosen over the reference code. |
| D7 | **iPad Mini portrait (744px)** | Phone layout. Boundary stays at Tailwind's 768px. |
| D8 | **Offline** | Not a web concern — see §0b. |
| D9 | **Phone web is fully supported** | FLUX in mobile Safari/Chrome outside the native app must work. The web layer owns the complete phone experience; the wrapper only adds download. |
| D10 | **Native app is a full-screen webview** | No native navigation chrome, so D3's tab bar stands with no collision — and safe-area insets are ours to handle. |
| D11 | **Build the desktop-layout override** | A user setting that pins the desktop layout regardless of viewport width. See §2. |

Two consequences to carry forward:

- **D3 leaves no room to grow.** When Activities lands and "My work" needs a slot, Flint or
  Briefcase moves into More. Decide then, but know it now.
- **D4 is a scope increase** over the original proposal. The Automatic Distribution conditions ×
  recipients matrix at 768px is not a CSS problem — it needs a genuine narrow-screen form design,
  most likely one condition per step. Cost it separately.

---

## 0b. The native wrapper changes the offline story

A FusionLive mobile app already ships on iOS and Play Store. In My Briefcase it offers a **Download**
button; downloaded documents remain available in airplane mode or with no signal. The intended
direction is to **wrap this responsive web UI inside that native app**, with the native layer
storing documents locally.

**This removes an entire workstream from the web side.** No service worker, no Cache Storage, no
IndexedDB, no quota management, no sync engine. The web UI renders; the native layer persists.

What it adds instead is a **bridge**, and that is the part worth designing:

- **Detecting the wrapper is capability detection, not device detection**, and does not contradict
  §2. Test for an injected object the wrapper controls — `window.FusionLiveNative?.download` — never
  a User-Agent string. It is reliable precisely because we own both sides of it. Layout still keys
  off width; only the *download affordance* keys off the bridge.
- **Download state is UI the web must render**: not downloaded / downloading / downloaded / stale.
  That is a component and a state machine, not a byte of storage.
- **Staleness must be honest.** Offline, neither layer can know whether a newer revision was issued.
  Show the download timestamp and last-checked time; never present a cached revision as current.
  This is the one place where the offline feature can cause a document-control incident.

Because phone web is fully supported (D9) and the wrapper adds no navigation of its own (D10),
there is **one navigation implementation, not two**. The tab bar always renders on phone; only the
download affordance is conditional on the bridge.

### To confirm with the mobile app team

- **What viewport does the webview use?** The width tiers assume `device-width`. A wrapper that
  pins a fixed or desktop-width viewport breaks every breakpoint silently. Highest-risk unknown.
- **Does the native back gesture map to webview history?** §8's folder drill-down relies on browser
  back popping `?folder=`. If it does not, the stack needs explicit handling.
- **Does the webview extend under the notch and home indicator?** Determines whether
  `viewport-fit=cover` and `env(safe-area-inset-*)` are ours to set or the wrapper's.

---

## 0. The blocker

`ShellLayoutContext.tsx:11` sets `--left-rail-width` via
`document.documentElement.style.setProperty()`. That is an **inline style on the root element**,
and it outranks every stylesheet rule — including the media queries this design depends on.

Any CSS-driven responsive layer built on that variable silently does nothing. No error, no
warning, just a struck-through rule in devtools that someone has to notice.

**Fix before anything else:** delete `ShellLayoutContext.tsx:10-12` and declare the variable in
`index.css :root`. JS writes attributes; CSS owns numbers.

---

## 1. Corrections to earlier audit claims

Verified against the repo. Each changes a recommendation.

| Claim | Reality |
|---|---|
| Zero Tailwind responsive prefixes in `src/` | ~18 hits across 6 files (`Dashboard`, `MyBriefcase`, `DesignSystem`, `admin/Workgroups`, `distribution/SettingsTab`, `distribution/RulesTab`). **Never redefine `theme.screens`** — it would silently re-target all of them. |
| `visibleColumns` is persisted | Only `order` and `widths` are. The column chooser is session-only — a live bug. The "phone destroys desktop layout" hazard is one we'd *introduce*, not inherit. |
| ESLint gate is 0 errors and 0 warnings | `package.json:12` has no `--max-warnings 0`; warnings exit 0. The real hard gate is `tsc --noEmit` with `noUnusedLocals`. |
| `MetadataPanel` / `RelationshipsPanel` are live | Neither is imported anywhere. `ARCHITECTURE.md` cites them as live — stale. |
| 194 tests | Docs say 180; repo has 11 test files. All three disagree. Re-measure. |

`ClipboardPanel.tsx` is a complete, working bottom sheet (`fixed bottom-0 left-0 right-0
max-h-[70vh]`, Framer Motion slide-up) that **no page imports**. It is the sheet primitive this
plan needs, already written in the repo's idiom.

---

## 2. Architecture: two tiers, two axes

CSS cannot unmount a component. That single constraint partitions the problem.

**Tier 1 — CSS, plain `@media` blocks in `index.css`.** Owns every value that is purely a
function of width: rail width, page height, card min-width, touch-target floors, grid gaps.
No runtime cost, no re-render, no test impact.

Use ordinary media queries, **not** a `data-viewport` root attribute. The `data-density` pattern
exists because density is a user preference with no CSS equivalent; width has a first-class CSS
equivalent. An attribute would add a second source of truth that can disagree with the media
queries by a frame during resize. The exception is `data-nav-mode`, which blends viewport with a
user preference (`shell.railCollapsed`) — CSS genuinely cannot express that.

**Tier 2 — JS, a module-level store on `resize`.** Owns the few genuine mount decisions: rail vs
bottom tab bar, table vs card list, panel vs sheet, viewer vs read mode.

Use `window.innerWidth` + a `resize` listener, **not `matchMedia`**. Probed against the installed
jsdom 29.1.1:

```
typeof window.matchMedia = undefined
typeof ResizeObserver    = undefined
typeof visualViewport    = undefined
setPointerCapture on el  = undefined
window.innerWidth        = 1024
```

> **⚠️ REVERSED 2026-09-15 (decision P6). The paragraphs above are kept as history — do not
> implement them, and do not revert the code back to them.**
>
> `src/shell/viewportStore.ts` now uses **`matchMedia` as the primary source**, fed the query
> strings exported from `viewport.ts`, which are character-identical to the `@media` blocks in
> `index.css`. `classifyViewport(window.innerWidth)` survives only as a capability-guarded
> fallback.
>
> **Why the jsdom argument did not hold.** Every benefit it claimed was either non-existent or
> equally available to `matchMedia`: there is no `setupFiles` entry to change; the worker-start
> flake is gated per test *file*, so no new file means no new exposure; `viewportStore.ts` is
> covered by no test under either design; and the repo already ships `matchMedia` in production at
> `FlintIcon.tsx` behind `?.`. The decision was justified against a cost that was never going to
> be paid.
>
> **The real defect it fixes.** `innerWidth` is integer-rounded; `@media` evaluates the
> *fractional* CSS viewport width. The two tiers therefore compared in different numeric domains
> and could settle on opposite sides of a boundary and **stay there** — reachable through browser
> zoom and Windows 125%/150% display scaling, which is ordinary hardware here. Mirroring the
> breakpoint *numbers* could never fix that; only moving the JS predicate into the CSS engine
> could. The `@media` blocks now end in `.98` for the same reason: `max-width: 767px` is not the
> complement of Tailwind's `min-width: 768px`, so a 767.5px viewport matched neither tier.
>
> **The decisive forward reason.** Several remaining items in §9 and §10 are *pointer-triggered
> unmounts*, and §2's own opening line is that CSS cannot unmount a component. `window.innerWidth`
> cannot observe pointer type at all. Keeping it would have deferred this same question by one
> phase to a query with no width-shaped fallback.
>
> **What must not be lost if anyone touches this again:** the single module-level store with one
> atomic mutation before any subscriber is notified; the equality guard (a single boundary crossing
> fires *two* `change` events, one query going false and one true); the primitive-string snapshot
> `useSyncExternalStore` requires; module-load initialisation plus the re-read on first bind; and
> the capability guard — the module is evaluated at import time by a provider that wraps the whole
> app, so an unguarded `matchMedia` call is a white screen, not a degraded layout.
>
> **Do NOT add a global `matchMedia` stub to vitest.** framer-motion probes `window.matchMedia` and
> then calls the *deprecated* `addListener`, so a modern-only stub throws the moment any jsdom test
> mounts a motion component — and 14 files in `src/` import framer-motion.

The pure mapping functions still live in `src/shell/viewport.ts` and are still tested in the cheap
`node` environment with zero jsdom exposure — `classifyFromMatches` for the live path,
`classifyViewport` for the fallback, plus a tripwire test pinning the query strings to `index.css`.

Three ways to get the store wrong:

- **Returning an object from `getSnapshot`.** React compares with `Object.is` and throws
  *"The result of getSnapshot should be cached to avoid an infinite loop."* Return the primitive
  class string from a module-level cache; derive booleans in the component.
- **Per-instance subscriptions.** One listener per mounting component means dozens resolving in
  arbitrary order — genuine tearing within a commit. One store, one listener, one atomic mutation.
- **Computing the initial value in an effect.** Compute at module load so first render is correct.

**Second axis: pointer type.** Width and pointer are orthogonal. A 1024×768 iPad and a 1024px
window on a 27" monitor are the same width and need different hit targets. Pointer needs no JS —
`@media (pointer: coarse)` is already used at `index.css:480`. Extend that block.

### What triggers a layout change

**Viewport width and input capability. Never device identity.** No User-Agent sniffing, no
`Sec-CH-UA-Mobile` client hint, no "is this a phone" flag from the client. The strings `iPhone`,
`Android` and `isMobile` should never appear in `src/`.

| Decision | Trigger | Mechanism |
|---|---|---|
| What is on screen and how it is arranged | Viewport width | `@media (max-width: …)`, `classifyViewport(window.innerWidth)` |
| Hit-target size, hover-reveal, drag vs tap | Input capability | `@media (pointer: coarse)` |
| Forcing a layout against both of the above | Explicit user choice | `data-viewport-override`, read from `useUserPref` |

Width is the correct trigger because **a browser window is not a device**, and the constraint the
layout responds to is the space it actually has:

- A desktop user who snaps a window to half a 1280px screen has 640px. A two-pane browse genuinely
  does not work in 640px, whatever hardware it is running on.
- A user at 200% browser zoom on a 1440px laptop has a 720px CSS viewport. They need the narrow
  layout, and device detection would deny it to them. This is an accessibility requirement, not a
  nicety.
- iPad Split View and Slide Over hand the browser 320–507px on a device that identifies as a
  tablet. Android foldables change width mid-session.
- **iPadOS Safari reports itself as macOS by default** ("Request Desktop Website" is on out of the
  box). Under UA sniffing an iPad receives the desktop layout — a decisive, unfixable failure.
- Width is verifiable by dragging a browser window, so QA can test every tier without a device lab
  and developers can build against it directly.

Pointer type is a separate query because it answers a different question — *can this user hit a
24px target?* — and the answer does not correlate with width. Tablet landscape is wide and coarse;
a snapped desktop window is narrow and fine. Treating them as one axis gets both wrong.

### The desktop-layout override (D11)

The one case neither query can express: a site engineer on an iPad who genuinely wants the full
desktop grid. It is a user preference, not device detection, and per §5 it is stored intent —
never written from a viewport-derived value.

Mechanism, both tiers:

```css
/* Placed after the @media blocks. Wins on specificity (0,1,1) vs :root (0,1,0),
   so source order is belt-and-braces rather than load-bearing. */
html[data-viewport-override='desktop'] {
  --left-rail-width: 88px;
  --bottom-nav-h: 0px;
  --card-min-w: 220px;
}
```

```ts
// Tier 2 must respect it too, or CSS and JS disagree about what tier we are in.
const effective = override ?? classifyViewport(window.innerWidth);
```

Two implementation notes that are easy to miss:

- **Override mode must permit horizontal scrolling.** Forcing the desktop layout onto a 768px
  screen is *meant* to overflow — the user wants the full grid and expects to pan. But six of the
  nine page roots are `overflow-hidden` (§4), so today that overflow would be clipped and
  unreachable rather than scrollable. The override must relax those roots to `overflow-x: auto`.
- **Touch targets stay coarse.** The override changes *layout*, not *input capability*. The
  `@media (pointer: coarse)` rules are orthogonal and must continue to apply — the user asked for
  the desktop grid, not for 24px tap targets on a touchscreen.

Surface the setting alongside the existing density and appearance controls, so all three
display preferences live in one place.

---

## 3. Breakpoints

| Class | Range | Tailwind | Devices | Objective |
|---|---|---|---|---|
| `phone` | < 768 | below `md` | phones; iPad Mini portrait (744) | Core workflows |
| `tablet-portrait` | 768–1023 | `md` | iPad portrait (810 / 834) | Usable |
| `tablet-landscape` | 1024–1279 | `lg` | iPad landscape (1180 / 1194) | Fully supported |
| `desktop` | ≥ 1280 | `xl` | laptop, desktop, ultra-wide | Primary |

Maps 1:1 onto Tailwind's unmodified defaults, so the CSS and JS tiers cannot drift and the ~18
existing prefix usages keep their meaning. **Do not add `theme.screens`.**

Two consequences: tablet-landscape behaves identically to desktop for the shell (which is what
"fully supported" should mean, and means jsdom's default 1024px sees no behaviour change); and
iPad Mini portrait (744) lands in `phone` — defensible, but the PO should sign it off.

Class names avoid `compact`, which would collide with `html[data-density='compact']`.

### Principles

1. **Desktop is the reference implementation.** Breakpoints are opt-in departures per surface.
2. **Width and pointer are orthogonal.** Never infer touch from width.
3. **CSS restyles, JS remounts.** Never spend a subscription where a variable does the job.
4. **Prefer removing over shrinking.** Drop a capability honestly and offer a route back to desktop.
5. **Persist intent, derive presentation.** See §5. Highest-consequence rule here.
6. **One source of truth per layout constant.** Three files means it belongs in `:root`.
7. **Responsive logic is a pure function**, tested in node. Components consume it, and are not tested.

---

## 4. The shell

`--left-rail-width` is consumed by all 8 pages plus `DocumentViewer.tsx:162`. Changing its value
reflows all of them — but it is disarmed in two ways.

| File:line | Today | Change to |
|---|---|---|
| `ShellLayoutContext.tsx:11` | `style.setProperty(…)` | Delete; declare in `index.css :root` |
| `LeftRail.tsx:229` | `style={{ width: 88 }}` | `style={{ width: 'var(--left-rail-width, 88px)' }}` |
| `BrandBanner.tsx:54, :196` | `LEFT_RAIL_WIDTH = 88` | Delete the constant; use the variable |

Without the second, offsets shrink while the rail does not, and a `position: fixed` 88px rail
permanently overlaps content on nine surfaces.

```css
:root {
  --left-rail-width: 88px;   /* the only place this number lives */
  --banner-h: 60px;
  --bottom-nav-h: 0px;
  --card-min-w: 220px;
  --touch-btn-min: 0px;
}
@media (max-width: 1023px) { :root { --left-rail-width: 56px; } }
@media (max-width: 767px)  { :root { --left-rail-width: 0px; --bottom-nav-h: 56px; --card-min-w: 150px; } }
@media (pointer: coarse)   { :root { --touch-btn-min: 2.75rem; } }
```

Tablet portrait ships from those four lines and nothing else.

### Viewport height

`h-[calc(100vh-60px)]` appears on nine surfaces; no `dvh`/`svh` anywhere. On iOS Safari `100vh`
is the *large* viewport, so with the URL bar showing every one is 60–115px taller than the visible
area. Six of the nine roots are `overflow-hidden`, making the overflow **unreachable** — including
`LeftRail`'s `mt-auto` Settings block.

Fix in the existing `[data-component='page-shell']` rule, which already owns padding for these
roots and documents why it wins on specificity. Use `height: calc(100svh - var(--banner-h))` plus
a `padding-bottom` carrying `--bottom-nav-h`. Prefer `svh` over `dvh` for a fixed shell — `dvh`
reflows continuously as the toolbar collapses, which reads as scroll jitter.

Three sites fall outside that selector: `LeftRail.tsx:228`, `Chat.tsx:879` (root is `fixed`), and
the `max-h-[70vh]`/`max-h-[85vh]` modals.

> Found while measuring: `h-[calc(100vh-92px)]` at `Dashboard.tsx:810, :820, :861` assumes a 60px
> banner plus 2×16px padding, but `index.css:352` zeroes that padding under
> `html[data-view='flush']` — the default for every user. Those elements are **32px short on
> desktop today**. Fold the fix into this pass.

---

## 5. The persistence rule

`useUserPref` writes on **mount**, not only on change — there is no dirty guard:

```ts
useEffect(() => { writePref(prefKey, value); }, [prefKey, value]);
```

So the moment any viewport-derived value passes through its state, it is persisted immediately and
permanently. Escalating consequences:

1. **One window.** A user with `panelWidth = 620` narrows the browser, a clamp writes 380, they
   restore. 380 is their desktop width forever — the existing clamps only run during an active drag.
2. **Two windows.** `useUserPref` broadcasts via `storage` events. A wide second window adopts the
   clamped value mid-session.
3. **After the Oracle migration** (`G02 POST /api/user/preferences/:prefKey`, already documented in
   the hook). The preference becomes account-wide and server-side. A thirty-second glance on a
   phone rewrites the user's desktop layout across every device, with no undo.

**Invariant: the stored preference is desktop intent, and is never written from a viewport-derived
value.** Clamp at consume time:

```ts
const [storedWidth] = useUserPref<number>('docBrowser.panelWidth', 360);
const effectiveWidth = clampPanelWidth(storedWidth, viewport);  // pure, node-tested
// setPanelWidth is called ONLY from the drag handler, never from a tier effect
```

Same rule for boolean open/closed prefs — derive `effectiveOpen`, never call `setOpen(false)`.
`clampPanelWidth` being pure is the point: it is the single highest-value test to add.

---

## 6. Navigation

| Class | Mode | Detail |
|---|---|---|
| desktop | `rail` | 88px, icon + label. Unchanged. |
| tablet-landscape | `rail` | 88px, unchanged. Do not auto-narrow. |
| tablet-portrait | `rail-icon` | 56px, labels hidden, 44px buttons. Pure CSS, zero page edits. |
| phone | `mobile` | Rail unmounted, `--left-rail-width: 0px`. Bottom tabs + drawer. |

**Do not narrow the rail at tablet landscape.** It buys 32px and costs the `text-[11px]` labels,
which are the rail's entire wayfinding affordance — seven Lucide glyphs at 20px are not
self-describing in an EDMS. The real squeeze at 1024px is the 360px detail panel plus the 320px
folder tree; that is a panel problem, not a nav problem. Offer collapse as a *user* toggle
(`shell.railCollapsed`); never let the viewport set it.

> Hiding labels without restoring height is the classic icon-rail mistake. Each rail button is
> `flex-col gap-1 px-1 py-2` — ~51px tall *because of* the label. Delete the label and it collapses
> to ~36px, below the touch floor, on the exact class where touch is guaranteed. Pair
> `display: none` on the label with `min-height: 44px` on the button.

### Phone: tabs and a drawer, because they are not interchangeable

A **bottom tab bar** is persistent, thumb-reachable, and continuously shows location — correct for
a small fixed set of destinations you switch between constantly. A **drawer** is modal, costs two
taps, occludes content, shows no persistent location — correct for rare or administrative
destinations and controls that need width.

The mistake to avoid is putting Documents or Search behind a hamburger in a document management
system. The mirror-image mistake is putting the workspace scope switcher in a tab — it is a mode
switch, not a destination, and carries a searchable project list that needs full width.

- **Tabs (5):** Dashboard · Documents · Search · Briefcase · More. Documents stays scope-gated
  exactly as the rail does today, so the bar never has a hole.
- **Drawer:** scope switcher (lifted from the banner), full labelled nav, Admin behind its existing
  permission guard, Settings, profile.
- **Search on phone:** a 44px icon opening a full-screen overlay. An inline input in that row gets
  ~120px — not enough to type `2100-PR-DS-0042-R3` while reading it back.

`index.html`'s viewport meta needs `viewport-fit=cover`, or `env(safe-area-inset-bottom)` is zero
and the tab bar sits under the iPhone home indicator.

### The eight-way rail duplication

Fix with a **React Router layout route** and `<Outlet/>`, not a wrapper component: a wrapper
requires re-parenting and re-indenting each page's root JSX including a 3,200-line
`DocumentBrowser`, where a layout route is eight two-line deletions.

Two facts make it safer than it looks. `LeftRail` is `position: fixed`, so hoisting it is
layout-neutral by construction. And **both its props are effectively dead** — `activeItem` is
overridden on every route by a value computed from `location.pathname`, and `onItemClick` is
unreachable through the click path. Its only live route is a keyboard handler that omits the
Settings check, so today pressing Enter on Settings inside Flint navigates you out of Flint. The
refactor deletes that bug for free.

Two mandatory fixes the hoist creates:

- **`Chat.tsx:879` `z-30` → `z-10`.** Chat's root is opaque and `fixed`. Today the rail renders
  inside it; hoisted, the rail becomes a sibling at `z-20` and Chat paints over it — Flint would
  appear to have no navigation.
- **Lift `ColorCustomizer`'s open state to context.** The rail stops remounting on navigation, so
  the panel would stay open across routes. The phone drawer must open the same panel anyway.

This refactor is **not** a prerequisite for tablet support — the CSS variable delivers tablet
portrait with the rail where it is. Sequence it with phone work, where it is genuinely required.

### Desktop-only routes

Gate with a component inside the route element, not a redirect, so a link shared from a laptop
still lands somewhere coherent. Reuse the existing guard card, already written twice in the admin
pages and worth promoting to a shared component.

- `/design-system` — gate at desktop. Internal reference page.
- `/admin/distribution` — gate at tablet-landscape. Rule authoring is a conditions × recipients
  matrix. Gate the route, not individual tabs: a tabbed page where two of four tabs work reads as
  broken, not as scoped.
- `/packages` — gate the *wizard*, not the library, and hide its entry point below that class.
- `/admin/workgroups` — **do not gate.** Already a responsive card grid; gating regresses shipped work.
- Dashboard, Documents, Search, Briefcase, Chat — never gated. These are the objectives.

---

## 7. Panels, drawers, split views

`DetailSlidePanel` already carries `variant?: 'drawer' | 'split'` with shared inner content
factored out. Add a third member rather than building anything new.

| Variant | Used at | Geometry |
|---|---|---|
| `split` | desktop, tablet-landscape | Inline flex column, caller owns width |
| `drawer` | tablet-portrait | `w-1/2 min-w-[380px] max-w-[640px]`, right overlay |
| `sheet` *(new)* | phone | Bottom sheet — copy `ClipboardPanel`'s geometry, animate `y` not `x` |

The `sheet` variant is provably necessary: at 375px, `min-w-[380px]` wins over `w-1/2` and the
drawer renders 5px wider than the screen.

**The caller decides the variant, not the component.** There are only two call sites and both
already own their geometry. This keeps viewport logic out of a subtree containing `VersionStack` —
one of only two jsdom-tested components in the repo.

### The five two-column metadata grids

These look like a breakpoint problem and are not. The split panel's width is a user-draggable
260–640px value *independent of viewport*: on a 1920px monitor with the panel at 260px, every
`md:` prefix is satisfied and the grid is still broken. A responsive prefix would break the primary
desktop experience to fix a phone.

A container query is the textbook answer. The cheaper one, and the recommendation, is a
`fieldColumns?: 1 | 2` prop threaded through the existing presentation-props seam, with
`DocumentBrowser` passing `panelWidth < 420 ? 1 : 2`. It already holds that value in state.

### Drag-resize on touch: replace, don't port

All five resize handles are `mousedown`/`mousemove`/`mouseup`. `onPointerDown` and
`setPointerCapture` appear zero times in `src/` — panels cannot be resized on a tablet at all.

The obvious fix is Pointer Events plus `setPointerCapture`. **Recommend against it:**
`setPointerCapture` is undefined in jsdom so the handler is untestable, the coarse-pointer rule
only widens the *column* resizer to 18px, and a 12px drag strip is poor touch UX regardless.
Replace with **discrete snap widths** on touch tiers — better UX, no pointer capture, pure function.

> ~~Live bug: `DocumentBrowser.tsx:3002` sets `touchAction: 'none'` on the column resizer.~~
> **FIXED 2026-09-15.** `touchAction` now has zero occurrences in `src/`. The residual issue is
> different and still worth knowing: the resizer is mouse-only (`onMouseDown`, no touch or pointer
> equivalent), and the coarse-pointer rule used to *widen* it to 18px — enlarging a target that
> cannot be operated by finger, over roughly half the adjacent column-filter button. It is now
> `display: none` on touch-only devices until the snap-width work below exists.

### Framer Motion: the variant swap double-mounts

The split and drawer branches root an `AnimatePresence` at the same tree position with different
child keys. Flipping `variant` on a live instance — what a tablet rotation does — keeps the exiting
panel mounted for 200ms *while* mounting a `fixed inset-0 bg-black/40` backdrop and a 280ms drawer.
The user rotating an iPad sees the page go black behind a ghost panel.

Fix with `key={variant}` to force an atomic remount. Accept the trade: it re-runs the Escape effect
and loses internal scroll position.

> `MotionConfig reducedMotion="user"` drops transform animations, so with OS reduced-motion on the
> ghost window collapses to nothing. **Verify every presentation-mode change with reduced motion off.**

---

## 8. Folder tree and filter

Product Phase 1 of the new UI is find-and-browse — document browser, filter, folder tree. Activities
(reviews, commenting, annotation, RFIs, Technical Queries) come later. So this is the **primary**
small-screen surface, not a secondary one.

### What already exists

Three things make this much cheaper than it looks:

- **`CollapsibleFilterPanel` is not a tree panel.** It is one pane hosting two modes behind a
  segmented toggle (`:137`), with `FilterPanel` and `FolderTree` arriving as `children` (`:170`).
  "One surface, two modes" maps directly onto a sheet with two tabs.
- **`breadcrumbPath` is already computed** (`DocumentBrowser.tsx:988`) by walking `folderLookup` up
  from the selected folder, and already rendered (`:2384`).
- **Folder selection lives in the URL**, not local state — `searchParams.get('folder')` (`:938`),
  written back at `:941`, with `selectedFolderId` derived from it (`:939`). Per ADR-010, the URL is
  the shareable view state.

That last point is the important one: **browser back pops the drill-down stack for free.** The
stack needs no navigation history of its own, because the URL already *is* the stack position.

### Per tier

**desktop / tablet-landscape — unchanged.** Two-pane: tree or filter on the left at 240–560px
(default 320), documents on the right.

**tablet-portrait — the pane becomes an overlay drawer** over the document list rather than an
inline column. At 768px, subtracting a 320px pane leaves too little for the table. Same two modes,
same components, different presentation — reuse the `drawer` variant from §7.

**phone — drill-down stack.** The tree stops being a tree and becomes a navigation stack:

- The route opens at the current folder's contents, with the breadcrumb at the top.
- Folders and documents render in one list, folders first. Tapping a folder pushes into it;
  tapping a breadcrumb crumb, or the browser back gesture, pops.
- **No indentation and no expand/collapse chevrons.** Depth is expressed by the breadcrumb, so
  `paddingLeft: 8 + level * 12` (`FolderTree.tsx:72`) is dropped in stack mode.
- Filter moves to its own bottom sheet, with an active-filter count on its trigger.

### Why drill-down rather than the tree in a sheet

EDMS hierarchies are deep — project → discipline → document type → area. At level 4 the existing
indentation consumes 56px before the name starts, leaving ~330px of a 390px screen for a folder
name that is already `truncate`d. Worse, every expansion pushes the thing you were reaching for
further down the list, so the deeper you go the more scrolling each step costs.

Drill-down gives every level the full width and a constant interaction cost. It is the model users
already have from Files and Explorer, and it is what `breadcrumbPath` was built to support.

### What needs building

- **`FolderTree` gains a presentation mode**, following the same convention as `DetailSlidePanel`'s
  variant union: `tree | stack`. Shared row rendering; different container, and different tap
  semantics — `stack` navigates instead of toggling expansion.
- **A compact breadcrumb.** At 390px a four-level path will not fit. Collapse the middle —
  `Project / … / Area 12 / Civil`. The path is already computed; only the render changes.
- **Folder row actions** (subscribe, favourite, ask-Flint — currently 24px and hover-only at
  `FolderTree.tsx:124`) collapse into a row overflow menu on coarse pointers, exactly as document
  rows do in §9.
- **The filter sheet** reuses the `sheet` variant and the `Sheet` primitive extracted from the
  orphaned `ClipboardPanel`. No new machinery.

Nothing here requires new state, a new route, or a change to how folders are selected.

---

## 9. Data tables

`DocumentBrowser` already has `columnOrder`, `visibleColumns`, `columnWidths`, drag-reorder,
per-column filters and persistence. Do not rebuild any of it. Add one pure derivation on top.

> **Hard invariant: `allColumns` must never be filtered by viewport.** It feeds the reconciliation
> effect that writes and persists `columnOrder`, so a viewport filter there silently truncates and
> saves the user's desktop column order on their next phone visit. **This destruction path is
> already live** and needs no new persistence to fire.

Two variables that must never cross:

```ts
// Canonical: the user's intent. Feeds the column chooser and CSV export.
const userColumns = /* order ∩ visible */;

// Derived: what this viewport renders. NEVER assigned to state,
// NEVER passed to saveColumnPreferences, NEVER exported.
const renderedColumns = resolveColumns(allColumns, columnOrder, visibleColumns, cutoff);
```

The naming is the firewall — a grep for `saveColumnPreferences` must never co-occur with
`renderedColumns`. This survives the round trip because the chooser already toggles one key at a
time against `allColumns`: a phone user can only toggle keys they can see.

| Priority | Columns | Rendered at |
|---|---|---|
| 1 | Reference, Title | All classes — the reference *is* the row's identity in an EDMS |
| 2 | Revision, Status | phone and up (~360px, fits a 390px viewport) |
| 3 | Type, Modified, Expected | tablet-portrait and up |
| 4 | Author, Responsible party, category custom columns | tablet-landscape and up |

Three consequences that must ship in the same commit:

- **Lock the priority-1 columns.** The chooser has no exclusions, so Reference and Title can both be
  unchecked — previously survivable, now it means a phone renders an empty table.
- **CSV export reads the canonical set.** A tablet user exporting 4 columns instead of 9 into a
  transmittal is a data-integrity bug. Relabel the menu item "Export chosen columns".
- **A filter on a dropped column becomes an unclearable dead end** — the header vanishes while the
  filter still applies, and the empty state says "Clear the filter above" with nothing above. *Do
  not clear the filter*: results must not differ by device. Surface it as a chip row.

### Table, card or list

Auto-select the default, allow user override, and **remember the override per viewport class** — a
phone user who picks list view must not find their laptop in list view on Monday. Default phone to
the existing *list* branch, already a single-column stack of full-width rows. Do not force-hide the
table: document controllers want the reference list, and at cutoff 2 it fits.

**Horizontal scroll is the right answer at tablet landscape** — ship it. Containment is already
correct, with `whitespace-nowrap` inside the overflow so the page body never scrolls sideways. It
stops being acceptable below ~600px, where you are panning to read a single record.

### Touch, in value order

1. **Reveal on coarse pointer — pure CSS, highest value per line.** The row selection checkbox is
   `opacity-0 group-hover:opacity-100`. On iOS Safari `:hover` latches on first tap, producing the
   tap-to-reveal-then-tap-to-press bug — and that checkbox is the entry point to the entire bulk
   workflow. One rule in the existing `pointer: coarse` block fixes it, plus `FolderTree` and
   `DocumentCard`.
2. **Touch-target floor as a separate token.** Do *not* raise `--row-btn` — it is shared with the
   density scale, and overloading it makes density and touch fight forever. Density is a taste
   preference about text rhythm; touch-target size is a correctness constraint. Use
   `min-height: max(var(--row-btn), var(--touch-btn-min))`.
3. **Collapse three row buttons to one overflow menu** on phone and tablet portrait — unmount them,
   don't hide them, or they stay in the tab order.

Ruled out: *swipe actions* (undiscoverable, holds 2–3 actions against a menu carrying seven, and
conflicts with the horizontal table pan), *long-press as primary* (no affordance, collides with iOS
text selection), *drag-to-select* (auto-scroll edge detection that fights the same pan). For range
selection, replace shift-click with **"Select through here"** in the row menu — a document
controller selecting 200 revision-B drawings will not tap 200 checkboxes.

> **Nothing bottom-fixed may be load-bearing on touch.** iOS Safari does not resize the layout
> viewport for the on-screen keyboard — it shrinks the *visual* viewport, so fixed-bottom elements
> sit behind the keyboard with no resize event. `dvh` does not help; it responds to browser chrome,
> not keyboards. This condemns the hand-rolled fixed scrollbar at `bottom: 12px`, which
> additionally disables native horizontal scrolling on the card grid when it overflows. Unmount it
> below desktop. Keep the bulk-action bar in flow, where it already is.

### Virtualisation: out of scope, but cap grouped mode

Pagination at 20 plus infinite scroll already windows the ungrouped table. The exception: grouped
mode fetches **1,000 documents** with one `IntersectionObserver` per group, re-rendering a
3,200-line component whose row renderer is an inline closure over ~20 state values. Cap the fetch
and default groups to collapsed on phone — do not virtualise. Virtualisation here is a rewrite: the
table is a real `<table role="grid">` with `aria-activedescendant`, sticky `thead`, `colSpan` group
headers and pixel column widths, and absolutely-positioned rows break table layout, column
auto-sizing and the accessibility tree simultaneously.

> **The one thing CSS cannot reach.** Column reorder is HTML5 drag-and-drop, which does not fire on
> iOS Safari or Android Chrome touch *at all*. On tablet it is not degraded, it is absent. "Tablet
> landscape fully supported" therefore requires a pointer-based rewrite or an explicit non-drag
> reorder affordance — up/down controls in the column chooser is the cheap, correct answer.

---

## 10. The document viewer

The framed viewer reserves 112px of horizontal chrome, then opens a 256px left aside and a 288px
right aside **by default**.

| Viewport | Frame | Canvas | |
|---|---|---|---|
| 1440 desktop | 1328 | 736 | fine |
| 1024 tablet landscape | 912 | 320 | cramped |
| 768 tablet portrait | 656 | 64 | broken |
| 390 phone | 278 | 0 | annihilated |

> **Ship this first, regardless of everything else.** The ~20-button toolbar is a single
> non-wrapping row ~900px wide, clipped by the frame's `overflow-hidden`. The clipped tail contains
> Maximise, Open-in-new-tab and **Close**. The remaining exits are keyboard `Escape` — which a phone
> does not have — and a backdrop tap, which does not exist when maximised. **On any narrow screen
> the viewer cannot be closed.**

Two pre-existing desktop bugs in the same file:

- **Zoom defaults to 139%** of the canvas content box, so the document is wider than its container
  at every viewport out of the box, and `mx-auto` on an overflowing child scrolls the drawing's
  left edge out of reach on first paint. Default to fit-width.
- **At 768px the right aside is pushed past the frame's clip** while `showRight` still reads `true`
  — so the comments toggle appears to do nothing.

### Per-tier behaviour

- **desktop / tablet-landscape** — unchanged, except zoom defaults to fit-width. At landscape,
  default the left aside closed to recover the canvas to ~624px.
- **tablet-portrait** — both asides default closed; when opened they render as an in-frame overlay
  drawer, one at a time. A genuine mount change, not a width swap.
- **phone** — a distinct `ViewerReadMode` branch: 56px header with a 44px close, fit-width canvas,
  three-button bottom bar, comments as a sheet.

### Why read mode, and why not a route

~70% of the viewer's chrome is inert in the prototype — only 7 of ~20 controls have handlers, four
of five tool tabs render a "not built" chip, four of five side panels do the same.

**No new route.** The viewer target is constructed from data the caller already holds; there is no
id-to-target resolver, so `/viewer/:docId` would require inventing a fetch path plus loading and
404 states for a mocked surface. And it is unnecessary: `/documents?doc=<id>` is already a working
bidirectional deep link, and the viewer already constructs exactly that URL. "Continue on desktop"
is a copy-to-clipboard affordance, not a feature.

**Read mode is a chrome shell, not a second viewer.** It owns a header, a bottom bar and a sheet;
the canvas it wraps must be the same component the desktop branch renders. The file's own TODO
records that the real viewer will be either an iframe or the Apryse SDK — either way, one DOM node
with one lifecycle. Two maintained viewers would mean two SDK instances and two teardown paths.

> Write into the TODO now: an early-return branch means the canvas sits under a different parent per
> tier, so React will unmount and remount it on any rotation crossing 768px. Today that costs an
> `<img>` reload. With a real SDK mounted it is a full teardown and re-init mid-read. Accept it and
> record it as a constraint, rather than building portal machinery against a mock.

**Out of scope on any coarse pointer:** ~~markup and redlining,~~ the layer list, precise zoom,
side-by-side compare, the side-panel switcher. An A1 drawing fit to a 375px canvas is ~1.6mm per CSS
pixel. Gate on **pointer type, not width** — a 1024px tablet is wide enough to look capable and is
exactly where the bad decision gets made.

> **⚠️ Markup and redlining struck out per decision P4 (2026-09-15).** Annotation is **not ours to
> gate**. FusionLive delegates it to **Apryse**, and Apryse ships a Mobile SDK precisely so that
> annotation works on touch — `src/viewer/apryseNativeViewerBackend.ts` already exists for it.
> Disabling markup on coarse pointers would switch off a capability the vendor supplies.
>
> The correct gate is **which viewer backend is active**, never pointer type and never width.
> `ViewerBackend` already carries a `supportsLiveMarkup` flag for exactly this, and
> `selectViewerBackend.ts` chooses the backend by capability detection on the host — browser vs the
> FusionLive native shell. FLUX's job is the hooks, not the tools.

What remains on a phone is a complete task: see the drawing, read review comments, confirm the
revision, download, close.

> Native pinch-zoom already works — the viewport meta sets no `user-scalable=no` or `maximum-scale`.
> Do not write a custom gesture handler.

---

## 11. Patterns to standardise

| Pattern | Status | Note |
|---|---|---|
| `classifyViewport` + store + `useViewportClass` | new | Pure function; module store; primitive snapshot |
| `AppShell` layout route | new | Kills the eight-way rail duplication |
| Presentation-variant convention | exists | `drawer \| split` → add `sheet`. The caller decides. |
| `Sheet` primitive | exists | Extract from the orphaned `ClipboardPanel` |
| Progressive column disclosure | exists | `MyBriefcase`'s `hidden sm:/md:/lg:` is the precedent |
| Fluid card grid | exists | `auto-fill/minmax` — parameterise the floor, keep the approach |
| `clampPanelWidth` at consume time | new | Pure, node-tested. §5 made mechanical. |
| `RequiresViewport` route guard | new | Wraps the guard card promoted from the admin pages |
| Density tokens | exists | Add `--touch-btn-min` *beside* `--row-btn`, never instead of it |
| Viewport-capped modals | exists | `max-w-[94vw]` in the distribution dialogs — apply to the rest |

> **Testing policy.** Responsive logic is a pure function in `src/shell/`, tested in the default
> **node** environment. Components consume it and are not tested. `fileParallelism: false` means
> every new `.test.tsx` adds one more independently 60-second-gated worker start, so the known
> flake surface grows *linearly* with component tests. Two jsdom files exist today. Keep it that way.

---

## 12. Phases

Each phase ships something. None blocks on the next.

**Phase 0 — unblock** — ✅ **COMPLETE**
- ✅ Delete `ShellLayoutContext`'s `setProperty`; declare `--left-rail-width` in `index.css :root`.
- ✅ Point `LeftRail` and `BrandBanner`'s hardcoded `88`s at the variable.
- ✅ **Add a 44px close button to the viewer.**
- ✅ Remove the orphaned `touchAction: 'none'` on the column resizer.
- ✅ Add `--max-warnings 0` to the lint script (2026-09-15; the lint baseline was already zero).
- ⚠️ Dead panel components: there are **three**, not two — `MetadataPanel.tsx`,
  `RelationshipsPanel.tsx` and `ClipboardPanel.tsx` are all unimported. Ownership still unresolved.
  Test count as of 2026-09-16: **196 tests across 13 files** (every earlier number in this document
  is stale). The drop from 204 is not lost coverage: the FlintIcon rebuild (`f3c539c`) replaced
  `flintGeometry.test.ts` with the smaller `flintArt.test.ts`, since the new mark is supplied path
  data rather than geometry derived in code, and there is far less arithmetic left to assert.

**Phase 1 — tablet portrait** — ✅ **COMPLETE 2026-09-15**

> **"CSS only, zero page edits" was never achievable** and should not be used as an acceptance
> criterion. The grid fixes, the shell-height fixes and the Leaflet hook are all `.tsx` edits. The
> honest phase boundary is **"no new state, no new components"**, which this work did hold to.

- ✅ The `@media` block and the icon-only rail rule paired with a 44px min-height.
- ✅ `100vh` → `100svh` in the shared `page-shell` rule *(landed early, inside `960733b`)*.
- ✅ **The 32px shell-height error.** Four elements hardcoded `calc(100vh - 92px)` — 60px banner
  plus 32px of padding that flush view zeroes — so each came up 32px short on *every* viewport,
  desktop included. The document listed three of them; there is a fourth, `Chat.tsx`. All four now
  read `--shell-content-h`, defined once in `:root`, so they follow `--banner-h` and
  `--bottom-nav-h` automatically instead of drifting apart again.
- ✅ **The phone bottom-nav reserve.** `padding: 0 !important` in the flush-view rule was
  overriding the base rule's `padding-bottom`, so the reserve had never applied to anyone and the
  56px tab bar covered the bottom of every page — unreachable, since five of the seven roots are
  `overflow-hidden`.
- ✅ **Leaflet `invalidateSize()`** via a `ResizeObserver` on the map container.
- ✅ **Rail buttons keep an accessible name in icon-only mode.** Hiding the label with
  `display: none` removed the *only* source of each button's name; they are now named explicitly,
  with the briefcase count preserved.
- ⚠️ **`--touch-btn-min` is declared but has zero consumers** — deliberately. See the warning below
  before wiring it up.
- ✅ **Unprefixed grids and the `col-span-2` ordering trap** (2026-09-16). The span fixes landed
  first, as the document warned they must. Not every `col-span-2` wanted `col-span-full`: in the
  Packages wizard's `Field full` it did, because that genuinely means “span the row” and so holds
  at any column count; but the two spans in the *three*-column main+sidebar layouts meant
  “two thirds”, and became `lg:col-span-2` so they keep that proportion once three columns exist
  and simply fill the single column below it. Grids prefixed: the four Packages wizard/detail
  grids and `DetailSlidePanel`'s five metadata pair grids.
  **Breakpoints are `md:`/`lg:`, never `sm:`** — `src/shell/viewport.ts` pins the tier
  boundaries to Tailwind’s unmodified `md` (768) and `lg` (1024) precisely so prefixes and
  `ViewportClass` cannot drift apart. `sm:` (640) is not a tier here, and using it would invent
  a fourth boundary no other rule in the app observes. So pair grids stack below `md`, i.e.
  exactly the phone tier, and the two three-column main+sidebar layouts stack below `lg`, since
  three columns inside a tablet-portrait width would leave ~250px per column.
  Deliberately left unprefixed, all verified rather than assumed: `DesignSystem.tsx` (two grids —
  the route is behind `RequiresViewport min="desktop"`, so it never renders below desktop),
  `ColorCustomizer` (a swatch pair grid — stacking only makes the picker taller),
  `ProjectMapView` (inside a Leaflet popup, already narrow by construction), and
  `RuleEditor` (Automatic Distribution admin — desktop intent, and pending the
  `RequiresViewport` guard Phase 4 still owes the admin routes).
- ✅ **Hover-gated controls revealed where hover cannot happen** (2026-09-16). `.touch-reveal`
  in the `(pointer: coarse) and (hover: none)` block, opted into by 11 controls. The worst case
  was exactly as predicted: `DocumentBrowser`’s row checkbox is hidden while unchecked, so there
  was no way to *begin* a multi-select by finger. Also restored: the column filter button, the
  row overflow menu, the open and clipboard row buttons in both table and card views, folder-tree
  row actions, document-card actions, the clipboard remove button and the Chat conversation menu.
  **Opt-in, not a blanket rule on `.group-hover:opacity-100`** — the panel and column resize
  indicators use the same utility and are drag-only with no touch handler, so revealing them
  would paint a permanent affordance over a target no finger can operate, which is the same
  mistake hiding `.column-resizer` was meant to undo. Opt-in also forces new hover-gated code to
  state its intent instead of being captured silently.

> **⚠️ `pointer: coarse` is not a stand-in for "small screen."** It matches on the *primary
> pointing device*, so a touchscreen laptop, a Surface or a touch-enabled all-in-one reports coarse
> at 1920px — ordinary hardware in a site office, and desktop is the design centre (P1). Any **size**
> rule placed under bare `pointer: coarse` will inflate every button on a full monitor. Size rules
> now live under `@media (pointer: coarse) and (hover: none)`; `hover: none` still catches a
> landscape iPad while excluding a touchscreen laptop with a trackpad. Verify on real touchscreen
> hardware — DevTools device emulation forces coarse and will not reproduce the hazard.

**Phase 1 as originally written** *(kept for reference)*
- The `@media` block: rail to 56px, icon-only rule paired with 44px min-height.
- `100vh` → `100svh` in the shared `page-shell` rule plus the three outliers. Fold in the 32px
  Dashboard discrepancy.
- `--touch-btn-min` under `pointer: coarse`; reveal hover-gated row actions on coarse pointers.
- Unprefixed grids: the Dashboard shell, the Packages wizard steps. Fix `col-span-2` →
  `col-span-full` *first*, or a two-column span in a one-column grid makes the "full width" field
  narrowest.
- Leaflet `invalidateSize()` on container resize — the map goes stale the moment CSS changes its
  container without a window resize.

**Phase 2 — the JS tier and the persistence rule** *(ships tablet landscape as "fully supported")*

> **Status, 2026-09-16: in progress.** The first bullet landed early, inside the Phase 4 groundwork
> of `cdde096` — which is what the banner at the top of this document means by "Phase 2 partly
> landed". Anyone reading this list alone would conclude nothing had started. Keep the marks
> current.

- ✅ `classifyViewport`, the store, the hook. Pure-function tests in node. *(landed early in
  `cdde096`, 2026-08-25; revised to `matchMedia` 2026-09-15 under P6. Live consumers:
  `ShellLayoutContext`, `DocumentBrowser`, `DocumentViewer`.)*
- `clampPanelWidth` at consume time across all three persisted widths; derived `effectiveOpen`.
  - ✅ **`effectiveOpen` needs nothing.** Both persisted open/closed prefs already hold the rule:
    `docBrowser.treeOpen` gives phone a separate unpersisted `phoneTreeSheetOpen` (landed with the
    phone sheet in `d3b6b72`), and no viewport effect anywhere writes `chat.historyOpen`. The gap
    was only ever the widths.
- Discrete snap widths replacing drag-resize on touch tiers (P8).
- Non-drag column reorder **added beside** the existing desktop drag, not replacing it (P9).
- Panel `sheet` variant, `key={variant}`, and the `fieldColumns` prop.
- The filter/tree pane becomes an overlay drawer at tablet portrait, closing on folder pick (§8, P10).

**Phase 3 — tables** *(the highest-risk phase)*
- Extract the column logic as a standalone, tested commit *before* any behaviour change.
- `visibleColumns` persistence and the priority layer land **together**, with the guard test written
  first — they cannot be sequenced apart.
- Locked identity columns, canonical-set CSV export, orphaned-filter chips.
- Per-class view-mode default; list view on phone.
- Unmount the fixed scrollbar below desktop; cap grouped-mode fetch.

**Phase 4 — phone** *(ships core workflows)*
- **`FolderTree` stack mode, compact breadcrumb, filter sheet (§8)** — the primary phone surface,
  since product Phase 1 is find-and-browse. Do this first within the phase.
- The `AppShell` layout route; the `z-30` → `z-10` Chat fix; the `ColorCustomizer` state lift.
- Bottom tab bar (`Documents · Search · Briefcase · More` — sized to today's product, grown when
  Activities lands), nav drawer, full-screen search overlay, `viewport-fit=cover`.
- `ViewerReadMode` and the "send to desktop" affordance.
- `RequiresViewport` guards on the wizard and the two admin routes.

---

## 13. Conclusions

### Biggest architectural changes

1. **Layout constants move from JavaScript into CSS.** Deleting three lines of `setProperty`
   converts `--left-rail-width` from an inert value into the lever the CSS tier runs on.
2. **Viewport class becomes first-class application state** — one pure function, one module store,
   consumed by a handful of genuine mount decisions and nothing else.
3. **Persisted preferences split into intent and presentation.** Stored values become desktop
   intent, clamped at consume time and never written back.
4. **Navigation is hoisted out of eight pages into a layout route.**
5. **Presentation mode becomes an explicit, caller-owned prop.**

### Highest risks

| Area | Risk | Why |
|---|---|---|
| Preference persistence | Critical | Silent, permanent, cross-device and unfixable after the Oracle migration |
| `DocumentBrowser.tsx` | Critical | 3,200 lines, five entangled subsystems, ~zero component test coverage |
| Column reorder on touch | High | HTML5 DnD does not fire on touch — a rewrite, not a breakpoint |
| iOS visual viewport | High | Keyboard hides fixed-bottom elements with no resize event |
| Framer Motion mode swaps | High | Double-mount on rotation; reduced-motion hides it from testers |
| The rail hoist | Medium | Four silent-regression vectors. Mitigated by deferring to Phase 4. |

### Quick wins

1. ✅ **The four-line `@media` block.** Tablet portrait, all eight pages.
2. ✅ **Revealing hover-gated row actions where hover does not exist** — restores multi-select.
   Landed 2026-09-16 as `.touch-reveal`, gated on `hover: none` as instructed. It took one rule
   plus an opt-in class on 11 controls rather than one rule alone; see Phase 1 in §12 for why a
   blanket rule would have revealed dead drag affordances too.
3. ✅ **The viewer's close button.** Converts an unexitable screen into a usable one.
4. ✅ **`100vh` → `100svh` in one shared rule.**
5. ✅ **Removing the orphaned `touchAction: 'none'`.**

### Order

Phases 0 → 1 → 2 → 3 → 4. Phase 0 unblocks everything; Phase 1 delivers a stated objective with no
JavaScript, no new state and no page edits, so it can ship independently; Phase 3 is the risky one,
sequenced behind the persistence rule that makes it safe.

Phases 1 and 2 together satisfy "tablet landscape fully supported" and "tablet portrait usable".
If the programme stopped there it would have delivered most of its worth.

### Two decisions that are not the front-end's to make

- **Which metadata fields survive on a phone.** The two-column grids reduce to ~170px per pair at
  375px. A content-model question, not a CSS one.
- **Whether iPad Mini portrait (744px) should get the phone layout.** Defensible either way; better
  decided than discovered.
