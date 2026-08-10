import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SunIcon, MoonIcon, CheckIcon, ZapIcon } from 'lucide-react';
import { useLocalization } from '../contexts/LocalizationContext';
import { useViewStyle } from '../contexts/ViewStyleContext';
import type { Appearance, Layout, ViewStyle } from '../contexts/ViewStyleContext';

interface ColorCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Standard two-option dark / light toggle (non-FLUX projects) ─────────────
// Parked: complete but not currently wired into any screen — FLUX projects use
// the four-option picker below. Exported rather than left as a private unused
// symbol so it survives `noUnusedLocals` without being deleted.

export interface AppearanceOption {
  id: Appearance;
  label: string;
  desc: string;
  icon: React.ElementType;
}

export function StandardPicker({
  appearance,
  onSelect,
  options,
}: {
  appearance: Appearance;
  onSelect: (a: Appearance) => void;
  options: AppearanceOption[];
}) {
  return (
    <div className="p-2 space-y-1">
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = appearance === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className={`w-full flex items-center gap-3 p-2.5 rounded-md transition-all ${
              active
                ? 'bg-[#E8F1FB] border border-[#0461BA]'
                : 'hover:bg-[#F0F4F8] border border-transparent'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-md flex items-center justify-center ${
                active ? 'bg-[#0461BA] text-white' : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              <Icon size={16} />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-neutral-900">{opt.label}</div>
              <div className="text-xs text-neutral-500">{opt.desc}</div>
            </div>
            {active && <CheckIcon size={16} className="text-[#0461BA]" />}
          </button>
        );
      })}
    </div>
  );
}

// ─── Two-option FLUX appearance picker (Light / Dark, flush layout only) ─────

interface FluxOption {
  appearance: Appearance;
  layout: Layout;
  label: string;
  desc: string;
  Icon: React.ElementType;
}

function FluxPicker({
  currentStyle,
  onSelect,
  options,
  t,
}: {
  currentStyle: ViewStyle;
  onSelect: (style: ViewStyle) => void;
  options: FluxOption[];
  t: (key: string) => string;
}) {
  return (
    <div className="p-3">
      {/* FLUX refactor badge row */}
      <div className="flex items-center gap-1.5 mb-3">
        <ZapIcon size={11} className="text-purple-600 shrink-0" />
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
          {t('appearance.fluxBadge')}
        </span>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
          {t('appearance.demoBadge')}
        </span>
      </div>

      {/* Light / Dark tiles */}
      <div className="grid grid-cols-2 gap-1.5">
        {options.map((opt) => {
          const active = currentStyle.appearance === opt.appearance;
          const Icon = opt.Icon;
          return (
            <button
              key={opt.appearance}
              onClick={() => onSelect({ appearance: opt.appearance, layout: opt.layout })}
              className={`relative flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                active
                  ? 'bg-[#E8F1FB] border-[#0461BA]'
                  : 'bg-neutral-50 hover:bg-[#F0F4F8] border-neutral-200'
              }`}
            >
              {active && (
                <CheckIcon
                  size={11}
                  className="absolute top-1.5 right-1.5 text-[#0461BA]"
                />
              )}
              <div
                className={`w-7 h-7 rounded flex items-center justify-center ${
                  active ? 'bg-[#0461BA] text-white' : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                <Icon size={14} />
              </div>
              {/* Label */}
              <div className="text-center">
                <div className="text-[11px] font-semibold text-neutral-900 leading-tight">
                  {opt.label}
                </div>
                <div className="text-[10px] text-neutral-500 leading-tight mt-0.5">
                  {opt.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ColorCustomizer({ isOpen, onClose }: ColorCustomizerProps) {
  const { t } = useLocalization();
  const { style, setFluxStyle } = useViewStyle();

  const fluxOptions: FluxOption[] = [
    {
      appearance: 'basic',
      layout: 'flush',
      label: t('appearance.lightMode'),
      desc: t('appearance.lightModeDesc'),
      Icon: SunIcon,
    },
    {
      appearance: 'dark',
      layout: 'flush',
      label: t('appearance.darkMode'),
      desc: t('appearance.darkModeDesc'),
      Icon: MoonIcon,
    },
  ];

  const panelTitle = t('appearance.fluxTitle');

  // Escape closes the picker for keyboard users (WCAG 2.1.2).
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
          />

          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed left-12 bottom-4 z-50 bg-white border border-neutral-200 rounded-lg shadow-2xl w-64"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100">
              <h3 className="text-sm font-semibold text-neutral-900">{panelTitle}</h3>
            </div>

            <FluxPicker
              currentStyle={style}
              onSelect={setFluxStyle}
              options={fluxOptions}
              t={t}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
