// PanelResizeHandle — shared resize affordance for resizable side panels in the
// document browser. Two presentations for one job, chosen by input capability:
//
//   pointer can hover  → a drag grabber (unchanged)
//   pointer cannot     → a tap target that steps through preset widths (P8)
//
// The host panel already has its own always-visible edge (in flush view,
// [data-component='left-panel'] renders a real 1px border-right — see
// index.css). This must sit CENTRED exactly on that real edge, not offset into
// the neighbour, otherwise the hover accent floats in empty space instead of
// recolouring the edge that's actually there. The hit-zone straddles the edge
// (6px into the host, 6px into the neighbour) — invisible at idle, fades to a
// blue line in place on hover/drag. Host owns the width state and mouse-move
// maths; this is purely the visual treatment + mousedown trigger.
//
// This component reads the pointer capability itself rather than taking it as a
// prop. That is a deliberate exception to "the caller decides the variant": the
// two presentations are the same control, both call sites would pass the same
// value, and a component that can be mounted with the wrong one is a component
// that will be. The reason the convention exists elsewhere — keeping viewport
// logic out of a jsdom-tested subtree — does not apply to this leaf.
//
// Used by: CollapsibleFilterPanel (side="right" — folder tree / filter island)
//          DocumentBrowser split detail panel (side="left")
//          Chat conversation history sidebar (side="right")
import type { MouseEvent } from 'react';
import { ChevronsLeftRightIcon } from 'lucide-react';
import { useTouchOnly } from '../shell/useTouchOnly';

interface PanelResizeHandleProps {
  /** Which edge of the host panel the handle hangs off. */
  side: 'left' | 'right';
  onResizeStart: (e: MouseEvent) => void;
  ariaLabel: string;
  /** Step to the next preset width. Where this is absent the panel simply has
   *  no touch resize, rather than an inert grabber. */
  onStepWidth?: () => void;
  /** Names the action, not the control: "Change panel width" beats "resize
   *  handle" for anyone who cannot see that it is one. */
  stepAriaLabel?: string;
  /**
   * Where the control sits relative to the host panel's edge.
   *
   * `'straddle'` (default) centres it ON the edge, half outside the panel —
   * correct when the host does not clip, because in flush view the edge is a
   * real 1px border and the hover accent has to recolour it in place.
   *
   * `'inside'` keeps every pixel within the host. Required when the host sets
   * `overflow: hidden`, which silently clips the outside half AND makes it
   * untargetable: the element keeps its full bounding box, so it still looks
   * present and measures correctly while `elementFromPoint` returns the host.
   * Chat's history sidebar is `overflow-hidden` for its rounded corners, and
   * straddling there produced a handle that could not be grabbed at all.
   */
  placement?: 'straddle' | 'inside';
}

export function PanelResizeHandle({
  side,
  onResizeStart,
  ariaLabel,
  onStepWidth,
  stepAriaLabel,
  placement = 'straddle',
}: PanelResizeHandleProps) {
  const touchOnly = useTouchOnly();
  const inside = placement === 'inside';

  if (touchOnly) {
    if (!onStepWidth) return null;
    const edge = side === 'right'
      ? (inside ? 'right-0' : '-right-3')
      : (inside ? 'left-0' : '-left-3');
    return (
      <button
        type="button"
        onClick={onStepWidth}
        aria-label={stepAriaLabel ?? ariaLabel}
        title={stepAriaLabel ?? ariaLabel}
        // 44px tall: this is the one control on the surface that exists only
        // for touch, so it has no excuse for being under the target floor.
        className={`absolute top-1/2 -translate-y-1/2 ${edge} z-10 h-11 w-6 rounded-full border border-neutral-200 bg-white shadow-md flex items-center justify-center text-neutral-500 active:bg-[#E8F1FB] active:text-[#0461BA] transition-colors`}
      >
        <ChevronsLeftRightIcon size={14} strokeWidth={2.25} />
      </button>
    );
  }

  const edge = side === 'right'
    ? (inside ? 'right-0' : '-right-1.5')
    : (inside ? 'left-0' : '-left-1.5');
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={ariaLabel}
      title={ariaLabel}
      onMouseDown={(e) => { e.preventDefault(); onResizeStart(e); }}
      className={`absolute inset-y-0 ${edge} w-3 cursor-col-resize group z-10`}
    >
      <div
        className={`absolute inset-y-0 ${inside ? (side === 'right' ? 'right-0' : 'left-0') : 'left-1/2 -translate-x-1/2'} w-0.5 bg-[#0461BA] opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-150`}
      />
    </div>
  );
}
