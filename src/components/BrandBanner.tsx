import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BellIcon, Building2Icon, CheckIcon, ChevronDownIcon, Globe2Icon, SearchIcon, Settings2Icon } from 'lucide-react';
import cloughLogo from '../../artifacts/Clough_Colore.png';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLocalization } from '../contexts/LocalizationContext';
import { useScope } from '../contexts/ScopeContext';
import { mockNotifications } from '../data/mockDashboard';
import profilePhoto from '../assets/profile-user.png';
import { PROJECTS } from '../data/projects';

export function BrandBanner() {
  const { t } = useLocalization();
  const { scope, setScope } = useScope();
  const LEFT_RAIL_WIDTH = 88;
  const [scopeMenuOpen, setScopeMenuOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const scopeDropdownRef = useRef<HTMLDivElement>(null);
  const scopeMenuRef = useRef<HTMLDivElement>(null);
  const scopeMeasureRef = useRef<HTMLSpanElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const notifButtonRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [scopeButtonWidth, setScopeButtonWidth] = useState<number | undefined>(undefined);

  // Portal anchor positions — calculated when a menu opens so popups render
  // via createPortal at document.body, escaping all parent stacking contexts.
  const [scopeMenuPos, setScopeMenuPos] = useState({ top: 0, left: 0, width: 0 });
  const [notifMenuPos, setNotifMenuPos] = useState({ top: 0, right: 0 });
  const [profileMenuPos, setProfileMenuPos] = useState({ top: 0, right: 0 });
  const navigate = useNavigate();

  const longestScopeName = useMemo(() => {
    const names = [t('banner.homeScope'), ...PROJECTS.map((p) => p.name)];
    return names.reduce((a, b) => (a.length >= b.length ? a : b));
  }, [t]);

  useLayoutEffect(() => {
    const compute = () => {
      if (!scopeMeasureRef.current || !scopeDropdownRef.current || !searchContainerRef.current) return;
      const naturalWidth = scopeMeasureRef.current.getBoundingClientRect().width + 2; // +2 for button border
      const dropLeft = scopeDropdownRef.current.getBoundingClientRect().left;
      const searchLeft = searchContainerRef.current.getBoundingClientRect().left;
      const maxAllowed = searchLeft - dropLeft - 100;
      setScopeButtonWidth(Math.min(naturalWidth, Math.max(maxAllowed, 60)));
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (searchContainerRef.current) ro.observe(searchContainerRef.current);
    return () => ro.disconnect();
  }, [longestScopeName]);
  const location = useLocation();
  const unreadCount = mockNotifications.filter((n) => !n.isRead).length;
  const notifPreview = mockNotifications.slice(0, 4);

  const filteredProjects = useMemo(
    () => PROJECTS.filter((p) => p.name.toLowerCase().includes(projectSearch.toLowerCase())),
    [projectSearch]
  );

  useEffect(() => {
    if (!scopeMenuOpen) setProjectSearch('');
  }, [scopeMenuOpen]);

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

  // Single document-level handler closes whichever menu was open when the
  // user clicks/taps outside both the anchor button and the portal menu.
  useEffect(() => {
    const handleOutside = (event: MouseEvent | TouchEvent) => {
      const target = (event instanceof TouchEvent ? event.touches[0]?.target : event.target) as Node | null;
      if (!target) return;
      if (!scopeDropdownRef.current?.contains(target) && !scopeMenuRef.current?.contains(target))
        setScopeMenuOpen(false);
      if (!notifButtonRef.current?.contains(target) && !notifMenuRef.current?.contains(target))
        setShowNotifMenu(false);
      if (!profileButtonRef.current?.contains(target) && !profileMenuRef.current?.contains(target))
        setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(location.search).get('q') ?? '';
    setSearchValue(location.pathname === '/search' ? query : '');
  }, [location.pathname, location.search]);

  const submitSearch = () => {
    const trimmedSearch = searchValue.trim();

    if (!trimmedSearch) {
      navigate('/search');
      return;
    }

    navigate(`/search?q=${encodeURIComponent(trimmedSearch)}`);
  };

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
      data-component="topbar"
      className="fixed top-0 left-0 right-0 h-[60px] bg-white text-neutral-800 border-b border-white flex items-center pr-3 z-[60]"
      role="banner">

      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center shrink-0 px-1"
          style={{ width: LEFT_RAIL_WIDTH }}
        >
          <img
            src={cloughLogo}
            alt="Clough"
            className="h-10 w-full object-contain"
          />
        </div>

        {/* Scope Selector */}
        <div className="relative" ref={scopeDropdownRef}>
          {/* Hidden element to measure natural width of the longest project name */}
          <span
            ref={scopeMeasureRef}
            aria-hidden="true"
            className="absolute opacity-0 pointer-events-none h-7 px-2.5 inline-flex items-center gap-2 text-xs font-medium whitespace-nowrap"
            style={{ top: 0, left: -9999 }}
          >
            <Building2Icon size={14} className="shrink-0" />
            <span>{longestScopeName}</span>
            <ChevronDownIcon size={12} className="shrink-0" />
          </span>

          <button
            onClick={() => {
              if (!scopeMenuOpen && scopeDropdownRef.current) {
                const r = scopeDropdownRef.current.getBoundingClientRect();
                setScopeMenuPos({ top: r.bottom + 6, left: r.left, width: Math.max(r.width, 220) });
              }
              setScopeMenuOpen(!scopeMenuOpen);
            }}
            style={{ width: scopeButtonWidth }}
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
            <span className="flex-1 min-w-0 truncate">
              {scope.kind === 'enterprise' ? t('banner.homeScope') : scope.name}
            </span>
            <ChevronDownIcon
              size={12}
              className={`shrink-0 ml-auto transition-transform ${scopeMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {scopeMenuOpen && createPortal(
            <div
              ref={scopeMenuRef}
              role="listbox"
              style={{ position: 'fixed', top: scopeMenuPos.top, left: scopeMenuPos.left, minWidth: scopeMenuPos.width, zIndex: 9999 }}
              className="bg-white border border-neutral-200 rounded-md shadow-xl overflow-hidden"
            >
              <button
                onClick={() => { setScope({ kind: 'enterprise' }); setScopeMenuOpen(false); }}
                role="option"
                aria-selected={scope.kind === 'enterprise'}
                className="w-full px-3 py-2 inline-flex items-center gap-2 text-sm hover:bg-violet-50 text-left"
              >
                <Globe2Icon size={14} className="text-violet-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-neutral-900">{t('banner.homeScope')}</div>
                </div>
                {scope.kind === 'enterprise' && <CheckIcon size={14} className="text-violet-600 shrink-0" />}
              </button>
              <div className="border-t border-neutral-100 px-2 py-2">
                <div className="relative">
                  <SearchIcon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                  <input
                    autoFocus={false}
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    placeholder="Search projects…"
                    className="w-full h-7 pl-7 pr-2 rounded-md border border-neutral-200 bg-[#F0F4F8] text-xs text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#0461BA] focus:bg-white"
                  />
                </div>
              </div>
              {filteredProjects.length === 0 && (
                <p className="px-3 py-2 text-xs text-neutral-400">No projects match</p>
              )}
              {filteredProjects.map((proj) => {
                const selected = scope.kind === 'project' && scope.id === proj.id;
                return (
                  <button
                    key={proj.id}
                    onClick={() => { setScope({ kind: 'project', id: proj.id, name: proj.name }); setScopeMenuOpen(false); }}
                    role="option"
                    aria-selected={selected}
                    className="w-full px-3 py-2 inline-flex items-center gap-2 text-sm hover:bg-[#E8F1FB] text-left"
                  >
                    <Building2Icon size={14} className="text-[#0461BA] shrink-0" />
                    <span className="flex-1 truncate text-neutral-900">{proj.name}</span>
                    {selected && <CheckIcon size={14} className="text-[#0461BA] shrink-0" />}
                  </button>
                );
              })}
            </div>,
            document.body
          )}
        </div>
      </div>

      <div className="flex-1 px-4 flex items-center justify-center">
        <div className="w-full max-w-xl" ref={searchContainerRef}>
          <div className="relative">
            <SearchIcon size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              aria-label={t('banner.searchLabel')}
              placeholder={t('banner.searchPlaceholder')}
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  submitSearch();
                }
              }}
              className="w-full h-7 pl-8 pr-2 rounded-md border border-neutral-200 bg-[#F0F4F8] text-xs text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#0461BA] focus:bg-white"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <div
          ref={notifButtonRef}
          className="relative"
        >
          <button
            onClick={() => {
              if (notifButtonRef.current) {
                const r = notifButtonRef.current.getBoundingClientRect();
                setNotifMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
              }
              setShowNotifMenu(prev => !prev);
            }}
            className="relative h-7 w-7 rounded-md border border-neutral-200 bg-white text-neutral-600 hover:text-neutral-800 hover:bg-[#F0F4F8] transition-colors flex items-center justify-center"
            aria-label={t('banner.notifications')}
            aria-expanded={showNotifMenu}
            aria-haspopup="true"
          >
            <BellIcon size={15} />
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#E10613] text-white text-[10px] leading-4 text-center font-semibold">
              {Math.min(unreadCount, 9)}
            </span>
          </button>

          {showNotifMenu && createPortal(
            <div
              ref={notifMenuRef}
              style={{ position: 'fixed', top: notifMenuPos.top, right: notifMenuPos.right, width: 320, zIndex: 9999 }}
              className="bg-white border border-neutral-200 rounded-md shadow-xl overflow-hidden"
            >
              <div className="px-3 py-2 border-b border-neutral-100">
                <p className="text-xs font-semibold text-neutral-800">{t('banner.notifications')}</p>
                <p className="text-[11px] text-neutral-500">{t('banner.unreadUpdates', { count: unreadCount })}</p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifPreview.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => { openNotificationsArea(); setShowNotifMenu(false); }}
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
            </div>,
            document.body
          )}
        </div>

        <div
          ref={profileButtonRef}
          className="relative"
        >
          <button
            onClick={() => {
              if (profileButtonRef.current) {
                const r = profileButtonRef.current.getBoundingClientRect();
                setProfileMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
              }
              setShowProfileMenu(prev => !prev);
            }}
            className="h-7 w-7 rounded-full border border-neutral-200 overflow-hidden bg-[#F0F4F8] flex items-center justify-center"
            aria-label="Profile"
            aria-expanded={showProfileMenu}
            aria-haspopup="true"
          >
            <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
          </button>

          {showProfileMenu && createPortal(
            <div
              ref={profileMenuRef}
              style={{ position: 'fixed', top: profileMenuPos.top, right: profileMenuPos.right, width: 176, zIndex: 9999 }}
              className="bg-white border border-neutral-200 rounded-md shadow-xl overflow-hidden"
            >
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-[#F0F4F8] transition-colors">
                <Settings2Icon size={14} />
                Profile Settings
              </button>
            </div>,
            document.body
          )}
        </div>

        <span className="text-xs font-semibold tracking-wide text-neutral-700">FusionLive</span>
      </div>
    </div>
  );
}
