// effortModes — presentation metadata for the Flint effort modes.
//
// Split from src/types/effort.ts because this file imports lucide-react; the
// type module stays dependency-free so non-UI code can use it.
//
// ICON NOTE: the design mock drew a star on Advanced. StarIcon already means
// "favourite this conversation" in the chat history sidebar, and SparklesIcon is
// Flint's own avatar in the transcript — both on the Chat page, so reusing
// either would give one glyph two meanings on one screen. LayersIcon stays crisp
// at 14 px and reads as "works across the stack of revisions", which is what
// Advanced claims to do. It is used elsewhere in the app (DocumentViewer's
// Markup tab, the map basemap toggle) but nowhere on the Chat page, so the
// one-screen rule still holds. To go back to the mock, change the one `Icon:`
// line below.
// [PHASE-1]
import { LayersIcon, ZapIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { EffortMode } from '../types/effort';
import { DEFAULT_EFFORT_MODE, normaliseEffortMode } from '../types/effort';

export interface EffortModeMeta {
  id: EffortMode;
  /** Translation key for the short name shown on the pill and in the menu. */
  labelKey: string;
  /** Translation key for the one-line explanation shown in the menu only. */
  descriptionKey: string;
  Icon: LucideIcon;
}

/** Menu order. Cheapest first, matching the mock. */
export const EFFORT_MODES: readonly EffortModeMeta[] = [
  {
    id: 'regular',
    labelKey: 'chat.effort.regular.label',
    descriptionKey: 'chat.effort.regular.description',
    Icon: ZapIcon,
  },
  {
    id: 'advanced',
    labelKey: 'chat.effort.advanced.label',
    descriptionKey: 'chat.effort.advanced.description',
    Icon: LayersIcon,
  },
];

const FALLBACK = EFFORT_MODES.find((m) => m.id === DEFAULT_EFFORT_MODE) as EffortModeMeta;

/** Metadata for a mode id, narrowing anything unrecognised to the default. */
export function effortMeta(mode: unknown): EffortModeMeta {
  const id = normaliseEffortMode(mode);
  return EFFORT_MODES.find((m) => m.id === id) ?? FALLBACK;
}
