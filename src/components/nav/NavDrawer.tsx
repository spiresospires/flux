// NavDrawer — the "everything else" surface for phone and tablet-portrait,
// where the rail is either unmounted (phone) or icon-only (tablet-portrait).
// Opened via BottomTabBar's "More" tab or BrandBanner's hamburger.
//
// Carries what a persistent bar/rail cannot afford room for: the full
// labelled nav list, the Admin section, Settings, and the workspace scope
// switcher (lifted out of BrandBanner per product decision D2 — the switcher
// is a low-frequency, high-consequence mode change with its own searchable
// list, not a destination, so it belongs in a drawer rather than competing
// for topbar width). See docs/responsive-architecture.md §6.
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2Icon, CheckIcon, ChevronRightIcon, Globe2Icon, SearchIcon, SettingsIcon, XIcon } from 'lucide-react';
import { FlintIcon } from '../FlintIcon';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useScope } from '../../contexts/ScopeContext';
import { useShellLayout, useShellOverlay } from '../../contexts/ShellLayoutContext';
import { PROJECTS } from '../../data/projects';
import { useNavItems, type NavItem } from './useNavItems';

export function NavDrawer() {
  const { t } = useLocalization();
  const { scope, setScope } = useScope();
  const { navMode } = useShellLayout();
  const { isNavDrawerOpen, setNavDrawerOpen, isColorCustomizerOpen, setColorCustomizerOpen } = useShellOverlay();
  const { navItems, adminItems, routeActiveItem } = useNavItems();
  const [isSwitchingScope, setIsSwitchingScope] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');

  // Only meaningful at the two navModes that don't already show full labels.
  if (navMode === 'rail') return null;

  const close = () => setNavDrawerOpen(false);
  const activate = (item: NavItem) => {
    item.onClick();
    close();
  };

  const filteredProjects = PROJECTS.filter((p) =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isNavDrawerOpen && (
        <div className="fixed inset-0 z-[65]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-neutral-900/40"
            onClick={close}
            aria-hidden="true"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label={t('navigation.main')}
          >
            {/* ── Scope switcher ──────────────────────────────────────── */}
            <div className="shrink-0 border-b border-neutral-100">
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  {t('banner.projects')}
                </p>
                <button
                  type="button"
                  onClick={close}
                  aria-label={t('common.close')}
                  className="w-9 h-9 -mr-1.5 rounded-md flex items-center justify-center text-neutral-500 hover:bg-neutral-100"
                >
                  <XIcon size={18} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsSwitchingScope((v) => !v)}
                className="w-full flex items-center gap-2.5 px-4 pb-3 text-left"
                aria-expanded={isSwitchingScope}
              >
                <span className="w-9 h-9 shrink-0 rounded-md bg-[#E8F1FB] text-[#0461BA] flex items-center justify-center">
                  {scope.kind === 'enterprise' ? <Globe2Icon size={17} /> : <Building2Icon size={17} />}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-neutral-900 truncate">
                    {scope.kind === 'enterprise' ? t('banner.homeScope') : scope.name}
                  </span>
                  <span className="block text-xs text-neutral-500">{t('navigation.switchWorkspace')}</span>
                </span>
                <ChevronRightIcon
                  size={16}
                  className={`shrink-0 text-neutral-400 transition-transform ${isSwitchingScope ? 'rotate-90' : ''}`}
                />
              </button>

              {isSwitchingScope && (
                <div className="pb-3 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => { setScope({ kind: 'enterprise' }); setIsSwitchingScope(false); close(); }}
                    className="w-full px-4 py-2 flex items-center gap-2 text-sm hover:bg-violet-50 text-left"
                  >
                    <Globe2Icon size={14} className="text-violet-600 shrink-0" />
                    <span className="flex-1 min-w-0 truncate">{t('banner.homeScope')}</span>
                    {scope.kind === 'enterprise' && <CheckIcon size={14} className="text-violet-600 shrink-0" />}
                  </button>
                  <div className="px-4 py-2">
                    <div className="relative">
                      <SearchIcon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        value={projectSearch}
                        onChange={(e) => setProjectSearch(e.target.value)}
                        aria-label="Search projects"
                        placeholder="Search projects…"
                        className="w-full h-8 pl-7 pr-2 rounded-md border border-neutral-200 bg-[#F0F4F8] text-xs text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#0461BA] focus:bg-white"
                      />
                    </div>
                  </div>
                  {filteredProjects.map((proj) => {
                    const selected = scope.kind === 'project' && scope.id === proj.id;
                    return (
                      <button
                        key={proj.id}
                        onClick={() => { setScope({ kind: 'project', id: proj.id, name: proj.name }); setIsSwitchingScope(false); close(); }}
                        className="w-full px-4 py-2 flex items-center gap-2 text-sm hover:bg-[#E8F1FB] text-left"
                      >
                        <Building2Icon size={14} className="text-[#0461BA] shrink-0" />
                        <span className="flex-1 min-w-0 truncate">{proj.name}</span>
                        {selected && <CheckIcon size={14} className="text-[#0461BA] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Primary nav ─────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto py-2">
              {navItems.map((item) => (
                <DrawerRow
                  key={item.id}
                  item={item}
                  active={routeActiveItem === item.id}
                  onActivate={activate}
                />
              ))}

              {adminItems.length > 0 && (
                <>
                  <div className="mx-4 mt-2 mb-1 border-t border-neutral-100 pt-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      {t('navigation.admin')}
                    </p>
                  </div>
                  {adminItems.map((item) => (
                    <DrawerRow
                      key={item.id}
                      item={item}
                      active={routeActiveItem === item.id}
                      onActivate={activate}
                    />
                  ))}
                </>
              )}
            </div>

            {/* ── Settings ─────────────────────────────────────────────── */}
            <div className="shrink-0 border-t border-neutral-100 py-2">
              <button
                onClick={() => { setColorCustomizerOpen(!isColorCustomizerOpen); close(); }}
                className={`w-full min-h-[44px] flex items-center gap-3 px-4 text-left transition-colors ${
                  isColorCustomizerOpen ? 'text-[#0461BA] bg-[#E8F1FB]' : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <SettingsIcon size={18} className="shrink-0" />
                <span className="text-sm font-medium">{t('navigation.settings')}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function DrawerRow({
  item,
  active,
  onActivate,
}: {
  item: NavItem;
  active: boolean;
  onActivate: (item: NavItem) => void;
}) {
  const isFlint = item.id === 'chat';
  const Icon = item.icon;
  return (
    <button
      onClick={() => onActivate(item)}
      aria-current={active ? 'page' : undefined}
      className={`relative w-full min-h-[44px] flex items-center gap-3 px-4 text-left transition-colors ${
        active ? 'text-[#0461BA] bg-[#E8F1FB]' : 'text-neutral-700 hover:bg-neutral-50'
      }`}
    >
      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#0461BA] rounded-r-full" />}
      {isFlint ? (
        <FlintIcon size={18} />
      ) : (
        <Icon size={18} className="shrink-0" />
      )}
      <span className="text-sm font-medium">{item.label}</span>
    </button>
  );
}
