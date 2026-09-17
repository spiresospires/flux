import { useSyncExternalStore } from 'react';
import { getTouchOnlySnapshot, getTouchOnlyServerSnapshot, subscribeViewport } from './viewportStore';

/** True where the pointer cannot hover — a phone or tablet, but NOT a
 *  touchscreen laptop, which keeps its mouse affordances (decision P1).
 *
 *  Ask this before mounting anything that replaces a drag interaction. Do not
 *  reach for the viewport class instead: a landscape iPad and a snapped desktop
 *  window are both 1024px wide and need opposite answers. Backed by the same
 *  store as useViewportClass, against the query index.css uses. */
export function useTouchOnly(): boolean {
  return useSyncExternalStore(subscribeViewport, getTouchOnlySnapshot, getTouchOnlyServerSnapshot);
}
