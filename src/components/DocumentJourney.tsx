// DocumentJourney — the document's history audit as a timeline rather than the
// grid of audit rows FusionLive shows today. Injected into the bottom of the
// properties side panel (DetailSlidePanel).
//
// Layout is VERTICAL and fluid: the panel is 360px by default and user-resizable,
// so a horizontal timeline with a branching path can't stay legible. Nothing here
// sets a width — the component fills whatever container it is given.
//
// The stage vocabulary is workspace configuration (MDR_AND_PROGRESS.md §3.1), so
// this component renders whatever steps it is handed and never switches on a
// label. It resolves the active stage from the `currentStatus` prop.
import { useMemo } from 'react';
import {
  CircleDashedIcon,
  UploadIcon,
  EyeIcon,
  StampIcon,
  HardHatIcon,
  BuildingIcon,
  XIcon
} from 'lucide-react';
import { useLocalization } from '../contexts/LocalizationContext';
import { resolveCurrentIndex, earnedAt } from '../utils/journey';
import type { DocumentStatus } from '../types/document';
import type { JourneyStep, JourneyStepIcon } from '../types/journey';

const STEP_ICONS: Record<JourneyStepIcon, React.ElementType> = {
  placeholder: CircleDashedIcon,
  upload: UploadIcon,
  review: EyeIcon,
  approval: StampIcon,
  construction: HardHatIcon,
  asBuilt: BuildingIcon,
  rejected: XIcon
};

type StepState = 'complete' | 'current' | 'upcoming' | 'rejection';

interface DocumentJourneyProps {
  steps: JourneyStep[];
  /** The document's current state. Drives which node is marked active. */
  currentStatus?: DocumentStatus;
  /** Escape hatch when status alone can't identify the step — unused today. */
  currentStepKey?: string;
  className?: string;
}

/** Node styling per state. Red is used ONLY on the rejection path. */
const NODE_STYLES: Record<StepState, string> = {
  complete: 'bg-neutral-700 border-neutral-700 text-white',
  current: 'bg-[#0461BA] border-[#0461BA] text-white ring-4 ring-[#0461BA]/15',
  upcoming: 'bg-white border-neutral-200 border-dashed text-neutral-300',
  rejection: 'bg-rose-50 border-rose-300 text-rose-600'
};

const LABEL_STYLES: Record<StepState, string> = {
  complete: 'text-neutral-800',
  current: 'text-[#0461BA] font-semibold',
  upcoming: 'text-neutral-400',
  rejection: 'text-rose-700 font-medium'
};

function formatDate(iso: string | undefined, locale: string) {
  if (!iso) return undefined;
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function DocumentJourney({ steps, currentStatus, currentStepKey, className = '' }: DocumentJourneyProps) {
  const { t, locale } = useLocalization();
  const currentIndex = useMemo(
    () => resolveCurrentIndex(steps, currentStatus, currentStepKey),
    [steps, currentStatus, currentStepKey]
  );

  if (steps.length === 0) return null;

  const earned = earnedAt(steps, currentIndex);

  const stateFor = (step: JourneyStep, index: number): StepState => {
    if (step.branch === 'rejection') return 'rejection';
    if (index === currentIndex) return 'current';
    return index < currentIndex ? 'complete' : 'upcoming';
  };

  return (
    <section className={`w-full min-w-0 ${className}`} aria-label={t('journey.ariaLabel')}>
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t('journey.title')}</h3>
        {/* [MOCK] Rules of Credit weightings are workspace configuration in real
            FusionLive — these percentages are illustrative. */}
        <span className="text-xs font-semibold text-[#0461BA] tabular-nums">{t('journey.earned', { percent: earned })}</span>
      </div>

      <div className="h-1 w-full rounded-full bg-neutral-100 overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-[#0461BA] transition-all duration-500"
          style={{ width: `${earned}%` }}
        />
      </div>

      <ol className="relative">
        {steps.map((step, index) => {
          const state = stateFor(step, index);
          const Icon = STEP_ICONS[step.icon];
          const isRejection = state === 'rejection';
          const isLast = index === steps.length - 1;
          // The connector below this node is solid once the document has got
          // past it, dashed while it is still ahead.
          const connectorReached = index < currentIndex;

          return (
            <li
              key={step.key}
              className={`relative flex gap-2.5 min-w-0 ${isLast ? '' : 'pb-4'} ${isRejection ? 'pl-6' : ''}`}
            >
              {/* Spine. Rejection steps sit off the spine, so the spine keeps
                  running past them at the parent indent. */}
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`absolute top-6 bottom-0 w-px ${
                    isRejection
                      ? 'left-[7px] bg-neutral-200'
                      : connectorReached
                        ? 'left-[11px] bg-neutral-300'
                        : 'left-[11px] border-l border-dashed border-neutral-200'
                  }`}
                  style={isRejection ? { top: 0 } : undefined}
                />
              )}

              {/* Elbow connecting the rejection node back to the spine. */}
              {isRejection && (
                <span
                  aria-hidden="true"
                  className="absolute left-[7px] top-0 h-3 w-4 border-l border-b border-rose-300 rounded-bl-md"
                />
              )}

              <span
                className={`relative z-10 shrink-0 mt-0.5 grid place-items-center rounded-full border-2 ${
                  isRejection ? 'w-5 h-5' : 'w-6 h-6'
                } ${NODE_STYLES[state]}`}
              >
                <Icon size={isRejection ? 11 : 13} strokeWidth={2.5} />
              </span>

              <div className="min-w-0 flex-1 pt-0.5">
                {/* "Current Status" badge sits immediately above the active node's
                    label, per the reference layout. */}
                {state === 'current' && (
                  <span className="inline-flex items-center mb-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#E8F1FB] text-[#0461BA]">
                    {t('journey.currentStatus')}
                  </span>
                )}
                <div className="flex items-baseline justify-between gap-2">
                  <span className={`text-[13px] leading-snug ${LABEL_STYLES[state]}`}>{step.label}</span>
                  {typeof step.earnedPercent === 'number' && (
                    <span
                      className={`text-[11px] font-medium tabular-nums shrink-0 ${
                        state === 'upcoming' ? 'text-neutral-300' : 'text-neutral-500'
                      }`}
                    >
                      {step.earnedPercent}%
                    </span>
                  )}
                </div>
                {(step.revision || step.date || step.actor) && (
                  <p className={`text-[11px] mt-0.5 ${isRejection ? 'text-rose-500' : 'text-neutral-400'}`}>
                    {[step.revision && `${t('versionStack.rev')} ${step.revision}`, formatDate(step.date, locale), step.actor]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
                {step.note && (
                  <p className={`text-[11px] mt-0.5 leading-snug ${isRejection ? 'text-rose-600' : 'text-neutral-500'}`}>
                    {step.note}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
