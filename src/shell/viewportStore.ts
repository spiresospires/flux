// viewportStore — a module-level, framework-agnostic store for the current
// ViewportClass, subscribed to via useViewportClass (useSyncExternalStore).
//
// PRIMARY SOURCE: matchMedia, fed the query strings exported from viewport.ts,
// which are character-identical to the @media blocks in index.css. Both tiers
// then evaluate the same predicate in the same engine against the same value,
// so the CSS tier and the JS tier cannot disagree. The previous innerWidth
// implementation could: innerWidth is integer-rounded while @media evaluates
// the fractional CSS viewport width, so at widths reachable through browser
// zoom and Windows 125%/150% display scaling the two tiers could settle on
// opposite sides of a boundary and STAY there. See docs/responsive-architecture.md §2.
//
// FALLBACK: classifyViewport(window.innerWidth), behind a capability guard.
// The guard is mandatory, not defensive. This module is evaluated at IMPORT
// time (the snapshot below) by ShellLayoutContext, which wraps the entire app,
// so an unguarded matchMedia call is a white screen — not a degraded layout —
// anywhere the API is absent: jsdom, an SSR probe, an older native webview.
// It mirrors the guard already shipped at FlintIcon.tsx:85, and it costs
// nothing in test config: no new test file, no setupFiles entry, no extra
// jsdom worker start (see viewport.ts on why that matters here).
//
// Do NOT add a global matchMedia stub to vitest. framer-motion probes
// window.matchMedia and then calls the DEPRECATED addListener, so a
// modern-only stub throws the moment any jsdom test mounts a motion
// component — and 14 files in src/ import framer-motion, including the shell
// surfaces a future responsive test would target.
//
// A SINGLE module-level store (not one MediaQueryList per hook instance) is
// required, not optional: React 18 StrictMode double-invokes effects, and
// dozens of components resolving one change event in listener order would
// produce genuine intra-commit tearing — different components reading
// different tiers within the same render. One store, one funnel, one atomic
// mutation before any subscriber is notified.
import {
  VIEWPORT_QUERIES,
  classifyFromMatches,
  classifyViewport,
  type ViewportClass,
} from './viewport';

const SERVER_SNAPSHOT: ViewportClass = 'desktop';

const hasMatchMedia = typeof window !== 'undefined' && typeof window.matchMedia === 'function';

/** Created once, at module scope — never per hook instance. */
const queries = hasMatchMedia
  ? {
      phone: window.matchMedia(VIEWPORT_QUERIES.phone),
      tabletPortrait: window.matchMedia(VIEWPORT_QUERIES.tabletPortrait),
      tabletLandscape: window.matchMedia(VIEWPORT_QUERIES.tabletLandscape),
    }
  : null;

function readViewport(): ViewportClass {
  if (typeof window === 'undefined') return SERVER_SNAPSHOT;
  if (queries) {
    return classifyFromMatches({
      phone: queries.phone.matches,
      tabletPortrait: queries.tabletPortrait.matches,
      tabletLandscape: queries.tabletLandscape.matches,
    });
  }
  return classifyViewport(window.innerWidth);
}

// Computed at module load, not in an effect, so the FIRST render is already
// correct rather than flashing the desktop layout and correcting itself.
// Nothing is listening yet at this point — subscribeViewport re-reads on its
// first bind to close the gap between here and the first subscriber mounting.
let snapshot: ViewportClass = readViewport();

const listeners = new Set<() => void>();

// Pull-based on purpose: every trigger funnels through one recompute, so a
// future source can drive the same derivation without a second mechanism —
// iOS fires no resize event when the keyboard opens (visualViewport), and the
// native shell may need to push a viewport change over its bridge.
//
// The equality guard is MORE necessary under matchMedia, not less: one
// boundary crossing fires TWO change events (one query going false, one going
// true), and the guard collapses them into exactly one subscriber notification.
function recompute(): void {
  const next = readViewport();
  if (next === snapshot) return;
  snapshot = next;
  listeners.forEach((listener) => listener());
}

// MediaQueryList.addEventListener('change') needs Safari 14+ (Sept 2020); the
// deprecated addListener is the only alternative on older WebKit. Choosing the
// modern API deliberately — the FusionLive native shell and every supported
// desktop browser are well past that floor.
function bind(): void {
  if (queries) {
    queries.phone.addEventListener('change', recompute);
    queries.tabletPortrait.addEventListener('change', recompute);
    queries.tabletLandscape.addEventListener('change', recompute);
    return;
  }
  // Fallback path only. No { passive: true } — resize is not cancelable, so
  // the option is a silent no-op; the equality guard above is the real
  // mitigation against per-frame churn during a window drag.
  window.addEventListener('resize', recompute);
  window.addEventListener('orientationchange', recompute);
}

function unbind(): void {
  if (queries) {
    queries.phone.removeEventListener('change', recompute);
    queries.tabletPortrait.removeEventListener('change', recompute);
    queries.tabletLandscape.removeEventListener('change', recompute);
    return;
  }
  window.removeEventListener('resize', recompute);
  window.removeEventListener('orientationchange', recompute);
}

export function subscribeViewport(onStoreChange: () => void): () => void {
  if (listeners.size === 0) {
    bind();
    // The snapshot was taken at module load, but nothing was listening between
    // then and now — a viewport change in that window fired an event we had no
    // handler for. Re-read once on binding so the first render cannot be stale.
    // Safe to call before `listeners.add`: with no subscribers yet this only
    // refreshes the snapshot, which useSyncExternalStore reads immediately after.
    recompute();
  }
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0) unbind();
  };
}

export const getViewportSnapshot = (): ViewportClass => snapshot;
export const getViewportServerSnapshot = (): ViewportClass => SERVER_SNAPSHOT;
