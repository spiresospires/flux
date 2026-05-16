import React, { useEffect, useRef, useState } from 'react';
import { BellIcon, Building2Icon, CheckIcon, ChevronDownIcon, Globe2Icon, PanelLeftCloseIcon, PanelLeftOpenIcon, SearchIcon, Settings2Icon } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLocalization } from '../contexts/LocalizationContext';
import { useShellLayout } from '../contexts/ShellLayoutContext';
import { useScope } from '../contexts/ScopeContext';
import { mockNotifications } from '../data/mockDashboard';
import profilePhoto from '../assets/profile-user.png';

const PROJECTS = [
  { id: 'shard', name: 'The Shard, London' },
  { id: 'skyline', name: 'Skyline' },
  { id: 'tower', name: 'Tower' },
  { id: 'empire', name: 'Empire State' }
];

export function BrandBanner() {
  const { t } = useLocalization();
  const { isLeftRailVisible, toggleLeftRail } = useShellLayout();
  const { scope, setScope } = useScope();
  const LEFT_RAIL_WIDTH = 88;
  const [scopeMenuOpen, setScopeMenuOpen] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const scopeDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isHomeRoute = location.pathname === '/';
  const unreadCount = mockNotifications.filter((n) => !n.isRead).length;
  const notifPreview = mockNotifications.slice(0, 4);

  const formatRelativeTime = (timestamp: string) => {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return t('common.justNow');
    if (mins < 60) return t('common.minutesAgo', { count: mins });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t('common.hoursAgo', { count: hrs });
    const days = Math.floor(hrs / 24);
    return t('common.daysAgo', { count: days });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (scopeDropdownRef.current && !scopeDropdownRef.current.contains(event.target as Node)) {
        setScopeMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openNotificationsArea = () => {
    const requestId = Date.now();
    if (location.pathname === '/') {
      navigate('/', { state: { focusSection: 'notifications', requestId }, replace: false });
      return;
    }

    navigate('/', { state: { focusSection: 'notifications', requestId }, replace: false });
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[45px] bg-white text-neutral-800 border-b border-neutral-200 flex items-center pr-3 z-[60]"
      role="banner">

      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center shrink-0"
          style={{ width: isLeftRailVisible ? LEFT_RAIL_WIDTH : 40 }}
        >
          <button
            onClick={toggleLeftRail}
            className="h-7 w-7 rounded-md border border-neutral-200 bg-white text-neutral-600 hover:text-neutral-800 hover:bg-[#F0F4F8] transition-colors flex items-center justify-center"
            aria-label={isLeftRailVisible ? t('banner.hideNavigation') : t('banner.showNavigation')}
          >
            {isLeftRailVisible ? <PanelLeftCloseIcon size={15} /> : <PanelLeftOpenIcon size={15} />}
          </button>
        </div>

        {/* Scope Selector */}
        <div className="relative" ref={scopeDropdownRef}>
          <button
            onClick={() => setScopeMenuOpen(!scopeMenuOpen)}
            className={`h-7 px-2.5 rounded-md border inline-flex items-center gap-2 text-xs font-medium transition-colors ${
              scope.kind === 'enterprise'
                ? 'border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100'
                : 'border-[#0461BA]/30 bg-[#E8F1FB] text-[#0461BA] hover:bg-[#d6e7f8]'
            }`}
            aria-haspopup="listbox"
            aria-expanded={scopeMenuOpen}
          >
            {scope.kind === 'enterprise' ? (
              <Globe2Icon size={14} className="shrink-0" />
            ) : (
              <Building2Icon size={14} className="shrink-0" />
            )}
            <span className="truncate">
              {scope.kind === 'enterprise' ? t('banner.homeScope') : scope.name}
            </span>
            <ChevronDownIcon
              size={12}
              className={`shrink-0 transition-transform ${scopeMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {scopeMenuOpen && (
            <div
              role="listbox"
              className="absolute left-0 right-0 top-full mt-1.5 z-20 bg-white border border-neutral-200 rounded-md shadow-lg overflow-hidden"
            >
              <button
                onClick={() => {
                  setScope({ kind: 'enterprise' });
                  setScopeMenuOpen(false);
                }}
                role="option"
                aria-selected={scope.kind === 'enterprise'}
                className="w-full px-3 py-2 inline-flex items-center gap-2 text-sm hover:bg-violet-50 text-left"
              >
                <Globe2Icon size={14} className="text-violet-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-neutral-900">{t('banner.homeScope')}</div>
                </div>
                {scope.kind === 'enterprise' && (
                  <CheckIcon size={14} className="text-violet-600 shrink-0" />
                )}
              </button>
              <div className="border-t border-neutral-100 px-3 pt-2 pb-1 text-[10px] uppercase tracking-wide text-neutral-400 font-semibold">
                {t('banner.projects')}
              </div>
              {PROJECTS.map((proj) => {
                const selected = scope.kind === 'project' && scope.id === proj.id;
                return (
                  <button
                    key={proj.id}
                    onClick={() => {
                      setScope({ kind: 'project', id: proj.id, name: proj.name });
                      setScopeMenuOpen(false);
                    }}
                    role="option"
                    aria-selected={selected}
                    className="w-full px-3 py-2 inline-flex items-center gap-2 text-sm hover:bg-[#E8F1FB] text-left"
                  >
                    <Building2Icon size={14} className="text-[#0461BA] shrink-0" />
                    <span className="flex-1 truncate text-neutral-900">{proj.name}</span>
                    {selected && (
                      <CheckIcon size={14} className="text-[#0461BA] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 flex items-center justify-center">
        <div className="w-full max-w-xl">
          <div className="relative">
            <SearchIcon size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              aria-label={t('banner.searchLabel')}
              placeholder={t('banner.searchPlaceholder')}
              className="w-full h-7 pl-8 pr-2 rounded-md border border-neutral-200 bg-[#F0F4F8] text-xs text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#0461BA] focus:bg-white"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <div
          className="relative"
          onMouseEnter={() => setShowNotifMenu(true)}
          onMouseLeave={() => setShowNotifMenu(false)}
        >
          <button
            onClick={openNotificationsArea}
            className="relative h-7 w-7 rounded-md border border-neutral-200 bg-white text-neutral-600 hover:text-neutral-800 hover:bg-[#F0F4F8] transition-colors flex items-center justify-center"
            aria-label={t('banner.notifications')}
          >
            <BellIcon size={15} />
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#E10613] text-white text-[10px] leading-4 text-center font-semibold">
              {Math.min(unreadCount, 9)}
            </span>
          </button>

          {showNotifMenu && (
            <div className="absolute top-full right-0 mt-1.5 w-80 bg-white border border-neutral-200 rounded-md shadow-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-neutral-100">
                <p className="text-xs font-semibold text-neutral-800">{t('banner.notifications')}</p>
                <p className="text-[11px] text-neutral-500">{t('banner.unreadUpdates', { count: unreadCount })}</p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifPreview.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={openNotificationsArea}
                    className="w-full text-left px-3 py-2.5 border-b border-neutral-100 last:border-b-0 hover:bg-[#F0F4F8] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-neutral-800 line-clamp-1">{notif.title}</p>
                      {!notif.isRead && <span className="w-1.5 h-1.5 rounded-full bg-[#0461BA] mt-1 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">{notif.description}</p>
                    <p className="text-[10px] text-neutral-400 mt-1">{formatRelativeTime(notif.timestamp)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          className="relative"
          onMouseEnter={() => setShowProfileMenu(true)}
          onMouseLeave={() => setShowProfileMenu(false)}
        >
          <button
            className="h-7 w-7 rounded-full border border-neutral-200 overflow-hidden bg-[#F0F4F8] flex items-center justify-center"
            aria-label="Profile"
          >
            <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
          </button>

          {showProfileMenu && (
            <div className="absolute top-full right-0 mt-1.5 w-44 bg-white border border-neutral-200 rounded-md shadow-lg overflow-hidden">
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-[#F0F4F8] transition-colors">
                <Settings2Icon size={14} />
                Profile Settings
              </button>
            </div>
          )}
        </div>

        <span className="text-xs font-semibold tracking-wide text-neutral-700">FusionLive</span>
      </div>
    </div>
  );
}
