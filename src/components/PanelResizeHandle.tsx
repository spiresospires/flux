// PanelResizeHandle — shared drag grabber for resizable side panels in the
// document browser. Renders INSIDE the 16px browser-layout gap between two
// islands (positioned off the host panel's edge via `side`): a faint centred
// vertical line plus a small always-visible grip pill. Hover/drag turns both
// brand blue. The host owns the width state and mouse-move maths; this is
// purely the visual handle + mousedown trigger.
//
// Used by: CollapsibleFilterPanel (side="right" — folder tree / filter island)
//          DocumentBrowser split detail panel (side="left")
import type { MouseEvent } from 'react';
import { GripVerticalIcon } from 'lucide-react';

interface PanelResizeHandleProps {
  /** Which edge of the host panel the handle hangs off, into the layout gap. */
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
      className={`absolute inset-y-0 ${side === 'right' ? '-right-4' : '-left-4'} w-4 cursor-col-resize group z-10 flex items-center justify-center`}
    >
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-neutral-200 group-hover:bg-[#0461BA] group-active:bg-[#0461BA] transition-colors" />
      <div className="relative h-7 w-3.5 rounded-full bg-white border border-neutral-200 shadow-sm flex items-center justify-center group-hover:border-[#0461BA] transition-colors">
        <GripVerticalIcon size={11} className="text-neutral-400 group-hover:text-[#0461BA] transition-colors" />
      </div>
    </div>
  );
}
