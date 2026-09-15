import { useSyncExternalStore } from 'react';
import { getViewportServerSnapshot, getViewportSnapshot, subscribeViewport } from './viewportStore';
import type { ViewportClass } from './viewport';

/** The current viewport class, re-rendering only when it actually changes —
 *  never on a resize that stays inside one class. Backed by matchMedia against
 *  the same query strings index.css uses, with an innerWidth fallback; see
 *  viewportStore.ts for why it is built that way. */
export function useViewportClass(): ViewportClass {
  return useSyncExternalStore(subscribeViewport, getViewportSnapshot, getViewportServerSnapshot);
}
