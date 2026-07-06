import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { FlintIcon } from './FlintIcon';
import {
  LayoutDashboardIcon,
  SettingsIcon,
  SearchIcon,
  PackageIcon,
  FolderIcon,
  BriefcaseIcon,
} from 'lucide-react';
import { ColorCustomizer } from './ColorCustomizer';
import { useLocalization } from '../contexts/LocalizationContext';
import { useScope } from '../contexts/ScopeContext';
import { useSearch } from '../contexts/SearchContext';
import { useBriefcase } from '../contexts/BriefcaseContext';
interface LeftRailProps {
  activeItem: string;
  onItemClick: (item: string) => void;
}
interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}
export function LeftRail({
  activeItem,
  onItemClick
}: LeftRailProps) {
  const { t } = useLocalization();
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showColorCustomizer, setShowColorCustomizer] = useState(false);
  const { scope } = useScope();
  const { lastQuery } = useSearch();
  const { count: briefcaseCount } = useBriefcase();
  const navigate = useNavigate();
  const location = useLocation();

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

  const routeActiveItem =
    location.pathname === '/' ? 'dashboard' :
    location.pathname.startsWith('/briefcase') ? 'briefcase' :
    location.pathname.startsWith('/documents') ? 'documents' :
    location.pathname.startsWith('/search') ? 'search' :
    location.pathname.startsWith('/packages') ? 'packages' :
    location.pathname.startsWith('/chat') ? 'chat' :
    activeItem;

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      icon: LayoutDashboardIcon,
      label: t('navigation.dashboard'),
      onClick: () => navigate('/'),
    },
    {
      // Briefcase is a cross-workspace, user-level collection — always visible in both scopes.
      id: 'briefcase',
      icon: BriefcaseIcon,
      label: t('navigation.briefcase'),
      onClick: () => navigate('/briefcase'),
    },
    {
      id: 'chat',
      icon: LayoutDashboardIcon, // placeholder — FlintIcon is rendered directly below
      label: 'Flint',
      onClick: () => navigate('/chat'),
    },
    {
      id: 'search',
      icon: SearchIcon,
      label: t('navigation.search'),
      onClick: () => navigate(lastQuery ? `/search?q=${encodeURIComponent(lastQuery)}` : '/search'),
    },
    ...(scope.kind === 'project'
      ? [{
          id: 'documents' as const,
          icon: FolderIcon,
          label: t('navigation.documents'),
          onClick: () => navigate('/documents'),
        }]
      : []),
  ];

  const bottomItems: NavItem[] = [
    {
      id: 'settings',
      icon: SettingsIcon,
      label: t('navigation.settings'),
    },
  ];

  const allItems = [...navItems, ...bottomItems];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % allItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      const item = allItems[focusedIndex];
      if (item.onClick) {
        item.onClick();
      } else {
        onItemClick(item.id);
      }
    }
  };
  const renderNavItem = (item: NavItem, index: number) => {
    const isActive = routeActiveItem === item.id;
    const isFocused = focusedIndex === index;
    const isFlint = item.id === 'chat';
    const Icon = item.icon;
    const isSettings = item.id === 'settings';
    return (
      <button
        key={item.id}
        onClick={() => {
          if (isSettings) {
            setShowColorCustomizer(!showColorCustomizer);
          } else if (item.onClick) {
            item.onClick();
          } else {
            onItemClick(item.id);
          }
        }}
        onFocus={() => setFocusedIndex(index)}
        onMouseEnter={() => setHoveredId(item.id)}
        onMouseLeave={() => setHoveredId(null)}
        className={`
          relative w-full flex flex-col items-center justify-center gap-1 px-1 py-2 rounded-md transition-colors duration-200
          ${isActive || isSettings && showColorCustomizer ? 'text-[#0461BA] bg-[#E8F1FB]' : 'text-neutral-500 hover:text-neutral-700 hover:bg-[#F0F4F8]'}
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
            key={item.id === 'documents' && documentsHighlight ? 'highlighted' : 'normal'}
            className={item.id === 'documents' && documentsHighlight ? 'animate-docs-appear flex items-center justify-center' : 'flex items-center justify-center'}
          >
            <Icon
              size={20}
              className={`flex-shrink-0 ${isActive || isSettings && showColorCustomizer ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`}
            />
          </span>
        )}
        <span className="text-[11px] leading-none font-medium text-center w-full truncate px-1">
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
        className="fixed left-0 top-[60px] h-[calc(100vh-60px)] bg-white border-r border-neutral-200 z-20 flex flex-col py-2 overflow-hidden"
        style={{ width: 88 }}
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

        {/* Bottom Items */}
        <div className="px-1 mt-auto space-y-1">
          {bottomItems.map((item, index) =>
          renderNavItem(item, navItems.length + index)
          )}
        </div>
      </nav>

      {/* Color Customizer Popover */}
      <ColorCustomizer
        isOpen={showColorCustomizer}
        onClose={() => setShowColorCustomizer(false)} />
      
    </>);

}
