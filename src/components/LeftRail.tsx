import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SettingsIcon } from 'lucide-react';
import { FlintIcon } from './FlintIcon';
import { useLocalization } from '../contexts/LocalizationContext';
import { useScope } from '../contexts/ScopeContext';
import { useBriefcase } from '../contexts/BriefcaseContext';
import { useShellOverlay } from '../contexts/ShellLayoutContext';
import { useNavItems, type NavItem } from './nav/useNavItems';

// LeftRail is mounted ONCE, in AppShell — never per-page. Both former props
// (`activeItem`, `onItemClick`) were dead: the active item was always
// overridden by the route (`routeActiveItem` below), and `onItemClick` was
// unreachable through every click path except a keyboard-only corner case on
// the Settings item — which navigated AWAY from the page instead of opening
// the colour customiser (each page wired a different, page-specific
// onItemClick). Settings is now handled once, uniformly, by this component
// alone, so that bug cannot recur. See docs/responsive-architecture.md §6.
export function LeftRail() {
  const { t } = useLocalization();
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const { scope } = useScope();
  const { count: briefcaseCount } = useBriefcase();
  const { isColorCustomizerOpen, setColorCustomizerOpen } = useShellOverlay();
  const { navItems, adminItems, routeActiveItem } = useNavItems();

  // ── Documents icon highlight ───────────────────────────────────────────────
  // When the user selects a project workspace the Documents nav item appears.
  // We flash the folder icon amber once to draw attention to the new option.
  // The CSS animation (animate-docs-appear) runs for 1.3 s then releases
  // control back to the normal Tailwind colour class.
  const [documentsHighlight, setDocumentsHighlight] = useState(false);
  const prevScopeKindRef = useRef(scope.kind);
  useEffect(() => {
    const prev = prevScopeKindRef.current;
    prevScopeKindRef.current = scope.kind;
    // Only trigger on a real enterprise → project transition, never on first mount.
    if (prev === scope.kind) return;
    if (scope.kind !== 'project') return;
    setDocumentsHighlight(true);
    const t = setTimeout(() => setDocumentsHighlight(false), 1400);
    return () => clearTimeout(t);
  }, [scope.kind]);

  const bottomItems: NavItem[] = [
    {
      id: 'settings',
      icon: SettingsIcon,
      label: t('navigation.settings'),
      onClick: () => setColorCustomizerOpen(!isColorCustomizerOpen),
    },
  ];

  const allItems = [...navItems, ...adminItems, ...bottomItems];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % allItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      allItems[focusedIndex].onClick();
    }
  };

  const renderNavItem = (item: NavItem, index: number) => {
    const isActive = routeActiveItem === item.id;
    const isFocused = focusedIndex === index;
    const isFlint = item.id === 'chat';
    const isSettings = item.id === 'settings';
    const isHighlightable = item.id === 'documents';
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        onClick={item.onClick}
        onFocus={() => setFocusedIndex(index)}
        onMouseEnter={() => setHoveredId(item.id)}
        onMouseLeave={() => setHoveredId(null)}
        className={`
          relative w-full flex flex-col items-center justify-center gap-1 px-1 py-2 rounded-md transition-colors duration-200
          ${isActive || (isSettings && isColorCustomizerOpen) ? 'text-[#0461BA] bg-[#E8F1FB]' : 'text-neutral-500 hover:text-neutral-700 hover:bg-[#F0F4F8]'}
          ${isFocused ? 'ring-2 ring-[#0461BA] ring-offset-1' : ''}
        `}
        aria-current={isActive ? 'page' : undefined}
      >
        {isActive &&
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-[#0461BA] rounded-r-full" />
        }
        {item.id === 'briefcase' && briefcaseCount > 0 &&
          <span
            className="absolute top-1 right-3 min-w-[16px] h-4 px-1 rounded-full bg-[#0461BA] text-white text-[10px] font-bold leading-4 text-center tabular-nums shadow-sm ring-2 ring-white"
            aria-label={t('navigation.briefcaseCount', { count: briefcaseCount })}
          >
            {briefcaseCount > 99 ? '99+' : briefcaseCount}
          </span>
        }
        {isFlint ? (
          <FlintIcon
            isHovered={hoveredId === 'chat'}
            isActive={isActive}
            size={20}
          />
        ) : (
          // For the Documents item: wrap the icon in a span that carries the
          // amber CSS animation on first appearance.  The class is keyed so
          // it re-triggers every time the item mounts (i.e. every time the user
          // switches into a project workspace).
          <span
            key={isHighlightable && documentsHighlight ? 'highlighted' : 'normal'}
            className={isHighlightable && documentsHighlight ? 'animate-docs-appear flex items-center justify-center' : 'flex items-center justify-center'}
          >
            <Icon
              size={20}
              className={`flex-shrink-0 ${isActive || (isSettings && isColorCustomizerOpen) ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`}
            />
          </span>
        )}
        {/* data-part="rail-label": hidden in icon-only mode via
            html[data-nav-mode='rail-icon'] in index.css — the label's own
            height is what keeps the button above the 44px touch floor at
            full size, so hiding it there is paired with a min-height rule
            rather than just `display: none` on the label alone. */}
        <span data-part="rail-label" className="text-[11px] leading-none font-medium text-center w-full truncate px-1">
          {item.label}
        </span>
      </button>
    );
  };
  return (
    <>
      <nav
        onKeyDown={handleKeyDown}
        data-component="leftrail"
        className="fixed left-0 top-[60px] h-[calc(100svh-60px)] bg-white border-r border-neutral-200 z-20 flex flex-col py-2 overflow-hidden"
        style={{ width: 'var(--left-rail-width, 88px)' }}
        role="navigation"
        aria-label={t('navigation.main')}
      >
        {/* Main Nav Items */}
        <div className="flex-1 px-1 space-y-1">
          <AnimatePresence initial={false}>
            {navItems.map((item, index) =>
              item.id === 'documents' ? (
                // Slide the Documents button in from below when it first appears,
                // and out upward when the scope reverts to enterprise.
                <motion.div
                  key="documents"
                  initial={{ opacity: 0, y: 10, scale: 0.88 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.88 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  {renderNavItem(item, index)}
                </motion.div>
              ) : (
                <React.Fragment key={item.id}>
                  {renderNavItem(item, index)}
                </React.Fragment>
              )
            )}
          </AnimatePresence>
        </div>

        {/* Admin section — permission-gated workspace governance */}
        {adminItems.length > 0 && (
          <div className="px-1 space-y-1">
            <div className="mx-2 mt-1 border-t border-neutral-200 pt-1.5">
              <p className="text-center text-[9px] font-semibold uppercase tracking-wider text-neutral-400">
                {t('navigation.admin')}
              </p>
            </div>
            {adminItems.map((item, index) => renderNavItem(item, navItems.length + index))}
          </div>
        )}

        {/* Bottom Items */}
        <div className="px-1 mt-auto space-y-1">
          {bottomItems.map((item, index) =>
          renderNavItem(item, navItems.length + adminItems.length + index)
          )}
        </div>
      </nav>

    </>);

}
