import { useCallback, useState } from 'react';
import { useUserPref } from '../hooks/useUserPref';
import { useViewportClass } from './useViewportClass';
import { clampPanelWidth, isDeskIntent, type PanelWidthBounds } from './panelWidth';

/** A resizable side panel's width, with the persistence rule (P7) applied.
 *
 *  Reads like useState and is used like it, but the width it hands back is
 *  derived, not stored: the stored preference is desk intent, capped at consume
 *  time for whatever screen the user is on.
 *
 *  Resizing below desktop is kept for the visit and then forgotten, so a tablet
 *  session cannot rewrite a desk layout. That is the whole point — see
 *  panelWidth.ts for what goes wrong without it.
 *
 *  All three resizable panels go through this, so the rule has exactly one
 *  definition. If you are about to write a fourth panel that clamps its own
 *  width inline, use this instead. */
export function usePanelWidth(
  prefKey: string,
  bounds: PanelWidthBounds
): [number, (next: number) => void] {
  const viewport = useViewportClass();
  const [stored, setStored] = useUserPref<number>(prefKey, bounds.fallback);
  const [visitWidth, setVisitWidth] = useState<number | null>(null);

  const intent = isDeskIntent(viewport) ? stored : visitWidth ?? stored;
  const width = clampPanelWidth(intent, viewport, bounds);

  const setWidth = useCallback(
    (next: number) => {
      if (isDeskIntent(viewport)) setStored(next);
      else setVisitWidth(next);
    },
    // setStored is the useUserPref setter — useCallback(…, []), referentially
    // stable, so this only re-creates when the viewport class actually changes.
    [viewport, setStored]
  );

  return [width, setWidth];
}
