// PanelResizeHandle — shared drag grabber for resizable side panels in the
// document browser. The host panel already has its own always-visible edge
// (in flush view, [data-component='left-panel'] renders a real 1px
// border-right — see index.css). This must sit CENTRED exactly on that real
// edge, not offset into the neighbour, otherwise the hover accent floats in
// empty space instead of recolouring the edge that's actually there. The
// hit-zone straddles the edge (6px into the host, 6px into the neighbour) —
// invisible at idle, fades to a blue line in place on hover/drag. Host owns
// the width state and mouse-move maths; this is purely the visual treatment
// + mousedown trigger.
//
// Used by: CollapsibleFilterPanel (side="right" — folder tree / filter island)
//          DocumentBrowser split detail panel (side="left")
import type { MouseEvent } from 'react';

interface PanelResizeHandleProps {
  /** Which edge of the host panel the handle hangs off. */
  side: 'left' | 'right';
  onResizeStart: (e: MouseEvent) => void;
  ariaLabel: string;
}

export function PanelResizeHandle({ side, onResizeStart, ariaLabel }: PanelResizeHandleProps) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={ariaLabel}
      title={ariaLabel}
      onMouseDown={(e) => { e.preventDefault(); onResizeStart(e); }}
      className={`absolute inset-y-0 ${side === 'right' ? '-right-1.5' : '-left-1.5'} w-3 cursor-col-resize group z-10`}
    >
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-[#0461BA] opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-150" />
    </div>
  );
}
