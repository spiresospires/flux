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
// Bloom network: 1 centre node + 8 outer nodes connected by spokes.
//
// Idle  : each outer node drifts in its own direction at its own speed.
//         Unique amplitude (1–1.3 SVG units) and duration (2.6–3.5 s) so no
//         two nodes sync.  Uses module-level animate/transition constants so
//         Framer Motion never restarts the loop on re-render.
//
// Hover : spokes draw outward (staggered 38 ms), nodes radius-pulse, centre
//         pulses, then a white corona ring expands and 4 sparkle dots flash at
//         cardinal spoke midpoints.

const _FCX = 12, _FCY = 12, _FR = 8.2;

const _FOUTER = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
  return {
    x: _FCX + _FR * Math.cos(a),
    y: _FCY + _FR * Math.sin(a),
    color: (['#F472B6','#34D399','#FBBF24','#A78BFA',
             '#F472B6','#34D399','#FBBF24','#A78BFA'] as const)[i],
  };
});

const _FDRIFT = [
  { dx:  1.3, dy: -0.8, dur: 3.2 },
  { dx:  0.7, dy:  1.1, dur: 2.7 },
  { dx: -1.1, dy:  0.5, dur: 3.5 },
  { dx:  0.9, dy:  0.9, dur: 2.9 },
  { dx: -0.8, dy: -1.2, dur: 3.1 },
  { dx:  1.0, dy: -0.7, dur: 2.6 },
  { dx: -1.2, dy:  0.6, dur: 3.4 },
  { dx:  0.5, dy:  1.0, dur: 3.0 },
];

// Stable refs — prevents Framer Motion restarting the drift on re-render
const _FDRIFT_ANIMS = _FDRIFT.map(d => ({
  x: [0, d.dx, -d.dx * 0.6, d.dx * 0.25, 0] as number[],
  y: [0, d.dy,  d.dy * 0.35, -d.dy * 0.5, 0] as number[],
}));
const _FDRIFT_TRANS = _FDRIFT.map(d => ({
  duration: d.dur,
  repeat: Infinity,
  ease: 'easeInOut' as const,
  repeatType: 'loop' as const,
}));

function FlintIcon({ isHovered, isActive, size = 20 }: {
  isHovered: boolean;
  isActive: boolean;
  size?: number;
}) {
  const hoverState = isHovered ? 'hover' : 'idle';
  const sw       = isActive ? 1.1 : 0.85;
  const outerR   = 1.45;
  const centreR  = isActive ? 2.3 : 2.1;

  const lineMk = (delay: number) => ({
    idle: { pathLength: 1, transition: { duration: 0.15 } },
    hover: { pathLength: [0, 1] as number[], transition: { duration: 0.38, delay, ease: 'easeOut' as const } },
  });

  return (
    <motion.svg
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{
        filter: isHovered
          ? 'drop-shadow(0 0 5px rgba(4,97,186,0.5)) drop-shadow(0 0 3px rgba(255,255,255,0.85))'
          : isActive
            ? 'drop-shadow(0 0 3px rgba(4,97,186,0.3))'
            : 'drop-shadow(0 0 0px rgba(4,97,186,0))',
      }}
      transition={{ duration: isHovered ? 0.2 : 0.6 }}
    >
      {/* Spokes — draw outward on hover, staggered every 38 ms */}
      {_FOUTER.map((node, i) => (
        <motion.path
          key={`spoke-${i}`}
          d={`M${_FCX},${_FCY}L${node.x.toFixed(2)},${node.y.toFixed(2)}`}
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinecap="round"
          fill="none"
          initial="idle"
          animate={hoverState}
          variants={lineMk(i * 0.038)}
        />
      ))}

      {/* Outer nodes — drifting g wrapper, radius pulse on hover */}
      {_FOUTER.map((node, i) => (
        <motion.g
          key={`outer-${i}`}
          animate={_FDRIFT_ANIMS[i]}
          transition={_FDRIFT_TRANS[i]}
        >
          <motion.circle
            cx={node.x} cy={node.y}
            fill={node.color}
            initial={{ r: outerR }}
            animate={{ r: isHovered ? [outerR, outerR + 0.55, outerR] : outerR }}
            transition={{ duration: 0.34, delay: i * 0.04 }}
          />
        </motion.g>
      ))}

      {/* Centre node — brand blue, pulses on hover */}
      <motion.circle
        cx={_FCX} cy={_FCY}
        r={centreR}
        fill="#0461BA"
        animate={{ r: isHovered ? [centreR, centreR + 0.9, centreR] : centreR }}
        transition={{ duration: 0.4, delay: 0.12 }}
      />

      {/* White corona ring — expands and fades after spokes finish */}
      <motion.circle
        cx={_FCX} cy={_FCY}
        fill="none"
        stroke="white"
        initial="idle"
        animate={hoverState}
        variants={{
          idle: { r: centreR, opacity: 0, strokeWidth: 1.5 },
          hover: {
            r: [centreR, centreR + 7],
            opacity: [0, 0.9, 0],
            strokeWidth: [2.5, 0.2],
            transition: { duration: 0.52, delay: 0.5 },
          },
        }}
      />

      {/* White sparkle dots at cardinal spoke midpoints (nodes 0, 2, 4, 6) */}
      {([0, 2, 4, 6] as const).map((idx) => {
        const n = _FOUTER[idx];
        return (
          <motion.circle
            key={`spark-${idx}`}
            cx={(_FCX + n.x) / 2}
            cy={(_FCY + n.y) / 2}
            fill="white"
            initial="idle"
            animate={hoverState}
            variants={{
              idle: { r: 0, opacity: 0 },
              hover: {
                r: [0, 0.85, 0],
                opacity: [0, 1, 0],
                transition: { duration: 0.3, delay: 0.52 + idx * 0.04 },
              },
            }}
          />
        );
      })}
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
            size={20}
          />
        ) : (
          <Icon
            size={20}
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
