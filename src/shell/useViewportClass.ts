import { useSyncExternalStore } from 'react';
import { getViewportServerSnapshot, getViewportSnapshot, subscribeViewport } from './viewportStore';
import type { ViewportClass } from './viewport';

/** The current viewport class, re-rendering only when it actually changes
 *  (not on every pixel of a resize). See viewportStore.ts for why this is
 *  `innerWidth`-based rather than `matchMedia`-based. */
export function useViewportClass(): ViewportClass {
  return useSyncExternalStore(subscribeViewport, getViewportSnapshot, getViewportServerSnapshot);
}
