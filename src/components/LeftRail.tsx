import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboardIcon,
  SettingsIcon,
  SearchIcon,
  PackageIcon,
  FolderIcon,
} from 'lucide-react';

// ─── Flint AI icon ────────────────────────────────────────────────────────────
// Three nodes in a triangle joined by lines. On hover the lines re-draw
// themselves (pathLength 0→1, staggered) and the nodes pulse their radius.
// A soft blue drop-shadow breathes in on hover and lingers as a gentle glow.

function FlintIcon({ isHovered, isActive, size = 17 }: {
  isHovered: boolean;
  isActive: boolean;
  size?: number;
}) {
  const sw = isActive ? 1.8 : 1.3;
  const hoverState = isHovered ? 'hover' : 'idle';

  const lineMk = (delay: number) => ({
    idle: { pathLength: 1 as number, transition: { duration: 0.2 } },
    hover: { pathLength: [0, 1] as number[], transition: { duration: 0.45, delay, ease: 'easeOut' as const } },
  });

  const nodeMk = (delay: number) => ({
    idle: { r: isActive ? 2.0 : 1.8 },
    hover: { r: [isActive ? 2.0 : 1.8, isActive ? 2.6 : 2.4, isActive ? 2.0 : 1.8] as number[], transition: { duration: 0.38, delay } },
  });

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      animate={{
        filter: isHovered
          ? 'drop-shadow(0 0 4px rgba(4,97,186,0.65))'
          : isActive
            ? 'drop-shadow(0 0 2px rgba(4,97,186,0.25))'
            : 'drop-shadow(0 0 0px rgba(4,97,186,0))',
      }}
      transition={{ duration: isHovered ? 0.25 : 0.55 }}
    >
      {/* Connection lines — top→BL, top→BR, BL→BR */}
      <motion.path d="M8 2L2.5 13"     stroke="currentColor" strokeWidth={sw} strokeLinecap="round" fill="none" initial="idle" animate={hoverState} variants={lineMk(0)} />
      <motion.path d="M8 2L13.5 13"    stroke="currentColor" strokeWidth={sw} strokeLinecap="round" fill="none" initial="idle" animate={hoverState} variants={lineMk(0.07)} />
      <motion.path d="M2.5 13L13.5 13" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" fill="none" initial="idle" animate={hoverState} variants={lineMk(0.2)} />
      {/* Nodes — radius animates instead of scale to avoid SVG transform-origin issues */}
      <motion.circle cx={8}    cy={2}  fill="currentColor" initial="idle" animate={hoverState} variants={nodeMk(0)} />
      <motion.circle cx={2.5}  cy={13} fill="currentColor" initial="idle" animate={hoverState} variants={nodeMk(0.07)} />
      <motion.circle cx={13.5} cy={13} fill="currentColor" initial="idle" animate={hoverState} variants={nodeMk(0.2)} />
    </motion.svg>
  );
}
import { ColorCustomizer } from './ColorCustomizer';
import { useLocalization } from '../contexts/LocalizationContext';
import { useScope } from '../contexts/ScopeContext';
import { useSearch } from '../contexts/SearchContext';
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
  const navigate = useNavigate();
  const location = useLocation();

  const routeActiveItem =
    location.pathname === '/' ? 'dashboard' :
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
        {isFlint ? (
          <FlintIcon
            isHovered={hoveredId === 'chat'}
            isActive={isActive}
            size={17}
          />
        ) : (
          <Icon
            size={17}
            className={`flex-shrink-0 ${isActive || isSettings && showColorCustomizer ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`}
          />
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
          {navItems.map((item, index) => renderNavItem(item, index))}
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
