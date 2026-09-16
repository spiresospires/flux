// Flint effort modes — how hard Flint works on a question.
//
// Kept free of React and lucide-react so the type and its helpers can be
// imported by an API layer (or a cheap node-env test) without pulling in a
// component tree. The icon/label metadata lives in
// src/components/effortModes.ts, which does depend on lucide.
//
// [MOCK] The mode currently only changes the shape and timing of a canned
//        reply — see buildResponseForQuery / handleSend in src/pages/Chat.tsx.
// [API] G29:POST /workspaces/{wsId}/assistant/conversations/{convId}/messages —
//       the request payload gains `effort: 'regular' | 'advanced'`.
// [AUTH]
// [TODO-ENG] Confirm the G29 field name, and whether the backend may downgrade
//            an Advanced request under load. If it may, the response has to
//            echo the effort actually spent — which is why ChatMessage.effort
//            is recorded per message rather than read back off the live
//            preference at render time.
// [PHASE-1]

export type EffortMode = 'regular' | 'advanced';

export const EFFORT_MODE_IDS: readonly EffortMode[] = ['regular', 'advanced'];

export const DEFAULT_EFFORT_MODE: EffortMode = 'regular';

/**
 * useUserPref hands back whatever JSON.parse produced, typed as T but never
 * validated (see src/hooks/useUserPref.ts readPref). A stale or hand-edited
 * localStorage value would otherwise index into EFFORT_MODES as undefined, so
 * every read is narrowed through here.
 */
export function normaliseEffortMode(value: unknown): EffortMode {
  return EFFORT_MODE_IDS.includes(value as EffortMode)
    ? (value as EffortMode)
    : DEFAULT_EFFORT_MODE;
}

// ---------- Reply timing ----------
// Regular keeps the original 1200 ms delay so nothing about today's demo
// changes. Advanced is deliberately slower AND narrated: a mode that costs more
// has to look like it costs more, or the choice reads as cosmetic.

/** Regular: unchanged from the original canned-reply delay. */
export const REGULAR_REPLY_MS = 1200;
/** Advanced: how long each narrated step is shown before the next one starts. */
export const STEP_MS = 450;
/** Advanced: pause between the last step completing and the answer appearing. */
export const TAIL_MS = 350;

/** Translation keys for the steps Advanced narrates while it "works". */
export const TRACE_STEP_KEYS: readonly string[] = [
  'chat.effort.step.search',
  'chat.effort.step.revisions',
  'chat.effort.step.crossRef',
  'chat.effort.step.compose',
];

/** Total time an Advanced reply takes, derived so the two can never drift. */
export const ADVANCED_REPLY_MS = TRACE_STEP_KEYS.length * STEP_MS + TAIL_MS;

/** How long a reply in this mode takes to arrive. */
export function replyDelayMs(mode: EffortMode): number {
  return mode === 'advanced' ? ADVANCED_REPLY_MS : REGULAR_REPLY_MS;
}
