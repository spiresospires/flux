// BottomTabBar — phone-only primary navigation (navMode 'mobile').
//
// Fixed set per product decision (2026-08-17, D3): Documents · Search · Flint
// · Briefcase · More. Unlike LeftRail's full item list, this is a persistent,
// always-visible, thumb-reachable bar — correct for a small set of
// destinations switched between constantly. Rare/administrative destinations
// (Dashboard, Admin, Settings) live in the drawer behind "More" instead; see
// docs/responsive-architecture.md §6 for why a tab bar and a drawer are not
// interchangeable.
//
// Reuses useNavItems' item definitions (icon, label, onClick) rather than
// re-deriving navigation targets, so the two presentations cannot drift —
// e.g. Search's "resume last query" behaviour stays defined in exactly one
// place.
import { MoreHorizontalIcon } from 'lucide-react';
import { FlintIcon } from '../FlintIcon';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useBriefcase } from '../../contexts/BriefcaseContext';
import { useShellOverlay } from '../../contexts/ShellLayoutContext';
import { useNavItems } from './useNavItems';

export function BottomTabBar() {
  const { t } = useLocalization();
  const { count: briefcaseCount } = useBriefcase();
  const { isNavDrawerOpen, setNavDrawerOpen } = useShellOverlay();
  const { navItems, routeActiveItem } = useNavItems();

  const byId = (id: string) => navItems.find((item) => item.id === id);
  const documentsItem = byId('documents'); // absent in enterprise scope — see useNavItems
  const searchItem = byId('search');
  const flintItem = byId('chat');
  const briefcaseItem = byId('briefcase');

  return (
    <nav
      data-component="bottom-tabs"
      role="navigation"
      aria-label={t('navigation.main')}
      className="fixed bottom-0 inset-x-0 z-30 flex h-[var(--bottom-nav-h,56px)] border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)]"
    >
      {documentsItem && (
        <TabButton
          icon={documentsItem.icon}
          label={documentsItem.label}
          active={routeActiveItem === 'documents'}
          onClick={documentsItem.onClick}
        />
      )}
      {searchItem && (
        <TabButton
          icon={searchItem.icon}
          label={searchItem.label}
          active={routeActiveItem === 'search'}
          onClick={searchItem.onClick}
        />
      )}
      {flintItem && (
        <TabButton
          icon={FlintIcon}
          label={flintItem.label}
          active={routeActiveItem === 'chat'}
          onClick={flintItem.onClick}
          isFlint
        />
      )}
      {briefcaseItem && (
        <TabButton
          icon={briefcaseItem.icon}
          label={briefcaseItem.label}
          active={routeActiveItem === 'briefcase'}
          onClick={briefcaseItem.onClick}
          badgeCount={briefcaseCount}
        />
      )}
      <TabButton
        icon={MoreHorizontalIcon}
        label={t('navigation.more')}
        active={isNavDrawerOpen}
        onClick={() => setNavDrawerOpen(!isNavDrawerOpen)}
      />
    </nav>
  );
}

function TabButton({
  icon: Icon,
  label,
  active,
  onClick,
  isFlint,
  badgeCount,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
  isFlint?: boolean;
  badgeCount?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`relative flex-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
        active ? 'text-[#0461BA]' : 'text-neutral-500'
      }`}
    >
      {!!badgeCount && badgeCount > 0 && (
        <span className="absolute top-1 right-1/4 min-w-[16px] h-4 px-1 rounded-full bg-[#0461BA] text-white text-[10px] font-bold leading-4 text-center tabular-nums shadow-sm ring-2 ring-white">
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
      {isFlint ? (
        <Icon size={22} />
      ) : (
        <Icon size={22} className={active ? 'stroke-[2.25px]' : 'stroke-[1.75px]'} />
      )}
      <span className="text-[10px] leading-none font-medium">{label}</span>
    </button>
  );
}
