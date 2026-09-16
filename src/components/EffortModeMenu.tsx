// EffortModeMenu — the Flint effort picker that sits on the chat composer, plus
// the small transcript chip recording which mode answered a given message.
//
// Popup mechanics follow the house rule (CLAUDE.md, "All popups/dropdowns"):
// createPortal to document.body, position: fixed, zIndex 9999, position
// measured from getBoundingClientRect() at click time. That is not decorative
// here — the chat content panel is overflow-hidden and the empty-state composer
// additionally sits inside the overflow-y-auto messages region, so an
// absolutely-positioned menu opening upward would be clipped in both composers.
//
// The panel is anchored by its BOTTOM edge to the trigger's TOP edge, so its own
// height never needs measuring and there is no mispositioned first frame.
//
// [MOCK] Choosing a mode only reshapes a canned reply today — see handleSend in
//        src/pages/Chat.tsx.
// [API] G29:POST /workspaces/{wsId}/assistant/conversations/{convId}/messages
// [AUTH]
// [PHASE-1]
import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckIcon } from 'lucide-react';
import { useLocalization } from '../contexts/LocalizationContext';
import { EFFORT_MODES, effortMeta } from './effortModes';
import type { EffortMode } from '../types/effort';

const MENU_WIDTH = 272;
/** Upper bound for two option rows plus padding. Used only to stop the
 *  bottom-anchored panel being pushed off the top of a short viewport. */
const MENU_MAX_H = 150;
const EDGE = 8;
const GAP = 8;

interface MenuPosition {
  bottom: number;
  left: number;
  width: number;
}

export interface EffortModeMenuProps {
  value: EffortMode;
  onChange: (mode: EffortMode) => void;
  /** Fires on open/close so the composer can hold its focus ring steady while
   *  the portalled panel owns focus — focus-within goes false the moment focus
   *  leaves the wrapper, and the ring would otherwise blink on every open. */
  onOpenChange?: (open: boolean) => void;
  /** Positioning classes supplied by the composer that hosts the trigger. */
  className?: string;
}

export function EffortModeMenu({ value, onChange, onOpenChange, className = '' }: EffortModeMenuProps) {
  const { t } = useLocalization();
  const menuId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState<MenuPosition | null>(null);
  // Focus index is deliberately local rather than derived from `value`:
  // useUserPref syncs across browser windows (ADR-010), and deriving it would
  // yank the highlight mid-arrow-key when another window changes the pref.
  const [focusedIndex, setFocusedIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const frameRef = useRef(0);

  const meta = effortMeta(value);
  const activeIndex = Math.max(0, EFFORT_MODES.findIndex((m) => m.id === meta.id));
  const TriggerIcon = meta.Icon;
  const triggerLabel = t('chat.effort.triggerAria', { mode: t(meta.labelKey) });

  const place = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    // visualViewport rather than innerHeight: on iOS the soft keyboard does not
    // shrink innerHeight, so an innerHeight anchor hides the menu behind it.
    const vv = window.visualViewport;
    const viewH = vv ? vv.height + vv.offsetTop : window.innerHeight;
    const viewW = vv ? vv.width : window.innerWidth;
    const width = Math.min(MENU_WIDTH, Math.max(160, viewW - EDGE * 2));
    const rawBottom = viewH - rect.top + GAP;
    const maxBottom = Math.max(EDGE, viewH - MENU_MAX_H - EDGE);
    setPos({
      bottom: Math.max(EDGE, Math.min(rawBottom, maxBottom)),
      left: Math.min(Math.max(EDGE, rect.right - width), Math.max(EDGE, viewW - width - EDGE)),
      width,
    });
  }, []);

  const open = useCallback(
    (index: number) => {
      place();
      setFocusedIndex(index);
      setIsOpen(true);
    },
    [place]
  );

  const close = useCallback((returnFocus: boolean) => {
    setIsOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  // Listeners exist only while the menu is open, rather than permanently from
  // mount — two composers each mount one of these, so a permanent per-instance
  // document listener would be pure overhead for a menu nobody has opened.
  useEffect(() => {
    if (!isOpen) return;
    const schedule = () => {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = window.requestAnimationFrame(place);
    };
    // Deliberately no `instanceof TouchEvent` narrowing: that identifier is
    // undefined in desktop Safari and in Firefox without touch hardware, and
    // referencing it would throw on every mousedown.
    const onOutside = (e: Event) => {
      const target = e.target as Node | null;
      if (!target) return;
      // The panel is portalled to document.body and so is NOT a descendant of
      // the trigger — both refs must be tested, or every click on an option
      // would count as an outside click and close the menu before it fires.
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setIsOpen(false); // clicked elsewhere — leave focus where the user put it
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(true);
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('touchstart', onOutside);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    window.visualViewport?.addEventListener('resize', schedule);
    return () => {
      window.cancelAnimationFrame(frameRef.current);
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('touchstart', onOutside);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      window.visualViewport?.removeEventListener('resize', schedule);
    };
  }, [isOpen, close, place]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    itemRefs.current[focusedIndex]?.focus();
  }, [isOpen, focusedIndex]);

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      open(activeIndex);
    }
  };

  // Enter and Space are left to the native <button> click handler — handling
  // them here as well would fire onChange twice for keyboard users.
  const onPanelKeyDown = (e: React.KeyboardEvent) => {
    const last = EFFORT_MODES.length - 1;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((i) => (i >= last ? 0 : i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((i) => (i <= 0 ? last : i - 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setFocusedIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setFocusedIndex(last);
    } else if (e.key === 'Tab') {
      // The panel is the last child of document.body; letting Tab run its
      // course would unmount the focused node and drop focus to the very start
      // of the document.
      e.preventDefault();
      close(true);
    }
  };

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (isOpen ? close(true) : open(activeIndex))}
        onKeyDown={onTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        aria-label={triggerLabel}
        title={triggerLabel}
        className={`h-9 w-9 inline-flex items-center justify-center rounded-full border shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0461BA] focus-visible:ring-offset-1 ${
          meta.id === 'advanced'
            ? `border-[#0461BA]/30 text-[#0461BA] ${
                isOpen ? 'bg-[#dbe9f9]' : 'bg-[#E8F1FB] hover:bg-[#dbe9f9]'
              }`
            : `border-neutral-200 text-neutral-600 ${
                isOpen ? 'bg-neutral-200' : 'bg-neutral-100 hover:bg-neutral-200'
              }`
        }`}
      >
        <TriggerIcon size={15} className="shrink-0" />
      </button>

      {isOpen && pos &&
        createPortal(
          <div
            ref={panelRef}
            id={menuId}
            role="menu"
            aria-label={t('chat.effort.menuAria')}
            onKeyDown={onPanelKeyDown}
            style={{
              position: 'fixed',
              bottom: pos.bottom,
              left: pos.left,
              width: pos.width,
              zIndex: 9999,
            }}
            className="bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden py-1 animate-mode-menu"
          >
            {EFFORT_MODES.map((mode, i) => {
              const checked = mode.id === meta.id;
              const RowIcon = mode.Icon;
              return (
                <button
                  key={mode.id}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  type="button"
                  role="menuitemradio"
                  aria-checked={checked}
                  tabIndex={i === focusedIndex ? 0 : -1}
                  onClick={() => {
                    onChange(mode.id);
                    close(true);
                  }}
                  className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0461BA] ${
                    checked ? 'bg-[#E8F1FB]' : ''
                  }`}
                >
                  <RowIcon
                    size={15}
                    className={`mt-0.5 shrink-0 ${checked ? 'text-[#0461BA]' : 'text-neutral-500'}`}
                  />
                  <span className="flex-1 min-w-0">
                    <span
                      className={`block text-[13px] ${
                        checked ? 'font-semibold text-[#0461BA]' : 'font-medium text-neutral-800'
                      }`}
                    >
                      {t(mode.labelKey)}
                    </span>
                    <span className="block text-[11px] leading-snug text-neutral-500">
                      {t(mode.descriptionKey)}
                    </span>
                  </span>
                  {checked && <CheckIcon size={14} className="text-[#0461BA] shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}

/** Transcript chip recording which mode answered a message. */
export function EffortBadge({ mode }: { mode: EffortMode }) {
  const { t } = useLocalization();
  const meta = effortMeta(mode);
  const Icon = meta.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        meta.id === 'advanced' ? 'bg-[#E8F1FB] text-[#0461BA]' : 'bg-neutral-100 text-neutral-600'
      }`}
    >
      <Icon size={10} />
      {t(meta.labelKey)}
    </span>
  );
}
