// ReasoningTrace — the step list an Advanced-effort Flint reply narrates while
// it works, and the collapsed record of those steps left behind on the finished
// message.
//
// Two presentations, one component:
//   running  (activeIndex is a number) — always expanded, steps tick over live.
//   finished (activeIndex is null)     — collapsed to a one-line summary the
//                                        reader can expand.
//
// THE "SIMULATED" CHIP IS NOT OPTIONAL. This is a document-control product: a
// list of steps that looks like an audit trail, in a UI where every other trail
// is real, is the kind of thing that gets screenshotted out of a demo and
// believed. The steps below are canned strings on a timer. The chip says so, on
// screen, where the fabrication is — a [MOCK] marker in the source is invisible
// to the room. Remove it only when these steps are genuinely emitted by G29.
//
// [MOCK] Canned step list on a fixed timer — see TRACE_STEP_KEYS in
//        src/types/effort.ts.
// [API] G29:POST /workspaces/{wsId}/assistant/conversations/{convId}/messages —
//       the real SSE stream emits tool_use / tool_result events; map one step
//       per event and delete TRACE_STEP_KEYS.
// [AUTH]
// [PHASE-1]
import { useState } from 'react';
import { CheckIcon, ChevronRightIcon, LoaderIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocalization } from '../contexts/LocalizationContext';

export interface ReasoningTraceProps {
  /** Already-translated step labels, in order. */
  steps: string[];
  /**
   * Index of the step currently running, or null when the run has finished.
   * A number forces the expanded presentation; null collapses it.
   */
  activeIndex?: number | null;
}

export function ReasoningTrace({ steps, activeIndex = null }: ReasoningTraceProps) {
  const { t } = useLocalization();
  const running = activeIndex !== null;
  const [expanded, setExpanded] = useState(false);
  const open = running || expanded;

  if (steps.length === 0) return null;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2">
        {running ? (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
            className="text-[#0461BA] shrink-0 inline-flex"
          >
            <LoaderIcon size={13} />
          </motion.span>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="flex items-center gap-2 min-w-0 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0461BA] rounded"
          >
            <ChevronRightIcon
              size={13}
              className={`text-neutral-500 shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`}
            />
            <span className="text-[11px] font-semibold text-neutral-600 truncate">
              {t('chat.effort.traceSummary', { count: steps.length })}
            </span>
          </button>
        )}
        {running && (
          <span className="text-[11px] font-semibold text-neutral-600 flex-1 min-w-0 truncate">
            {t('chat.effort.traceRunning')}
          </span>
        )}
        <span className="shrink-0 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-neutral-500">
          {t('chat.effort.simulated')}
        </span>
      </div>

      {open && (
        <ol className="px-3 pb-2.5 pt-0.5 space-y-1.5 border-t border-neutral-100">
          {steps.map((step, i) => {
            const done = !running || i < (activeIndex as number);
            const current = running && i === activeIndex;
            // Steps the run has not reached yet are rendered but dimmed, so the
            // block does not grow row by row and shove the composer around.
            return (
              <li key={step} className="flex items-start gap-2 text-[11px] leading-snug">
                <span className="mt-[3px] shrink-0 w-3 inline-flex justify-center">
                  {done ? (
                    <CheckIcon size={11} className="text-[#0461BA]" />
                  ) : (
                    <span
                      className={`block w-1.5 h-1.5 rounded-full ${
                        current ? 'bg-[#0461BA]' : 'bg-neutral-200'
                      }`}
                    />
                  )}
                </span>
                {/* No opacity on the not-yet-reached rows: `text-neutral-500`
                    (#676767 here — the repo overrides Tailwind's ramp) is 5.66:1
                    on white, but half-opacity composites it to #B3B3B3 at
                    2.10:1, under the 4.5:1 AA floor. The dot/tick in the gutter
                    carries the state instead of a contrast difference. */}
                <span className={done || current ? 'text-neutral-600' : 'text-neutral-500'}>
                  {step}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
