// viewportStore — a module-level, framework-agnostic store for the current
// ViewportClass, subscribed to via useViewportClass (useSyncExternalStore).
//
// Uses `window.innerWidth` + a `resize` listener, NOT `matchMedia`. This is
// deliberate, not a style choice: a probe against the installed jsdom
// (29.1.1) found `window.matchMedia` undefined with no polyfill anywhere in
// the repo, while `window.innerWidth` and `addEventListener` both work. This
// sidesteps the test problem entirely rather than stubbing around it — no
// `setupFiles` needed, so the two existing jsdom test files (and the
// documented Windows worker-start flake that already affects them) are
// untouched. See docs/responsive-architecture.md §2.
//
// A SINGLE module-level store (not one MediaQueryList/listener per hook
// instance) is required, not optional: React 18 StrictMode double-invokes
// effects in development, and if every mounting component created its own
// listener, dozens of components resolving one resize event in listener
// order would produce genuine intra-commit tearing (different components
// reading different tiers within the same render). One store, one listener,
// one atomic mutation before any subscriber is notified.
import { classifyViewport, type ViewportClass } from './viewport';

const SERVER_SNAPSHOT: ViewportClass = 'desktop';

let snapshot: ViewportClass =
  typeof window === 'undefined' ? SERVER_SNAPSHOT : classifyViewport(window.innerWidth);

const listeners = new Set<() => void>();

function recompute(): void {
  const next = classifyViewport(window.innerWidth);
  if (next === snapshot) return; // pixel-level resizes inside a class cost nothing
  snapshot = next;
  listeners.forEach((listener) => listener());
}

export function subscribeViewport(onStoreChange: () => void): () => void {
  if (listeners.size === 0) {
    window.addEventListener('resize', recompute, { passive: true });
    window.addEventListener('orientationchange', recompute);
  }
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0) {
      window.removeEventListener('resize', recompute);
      window.removeEventListener('orientationchange', recompute);
    }
  };
}

export const getViewportSnapshot = (): ViewportClass => snapshot;
export const getViewportServerSnapshot = (): ViewportClass => SERVER_SNAPSHOT;
