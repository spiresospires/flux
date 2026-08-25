// useNavItems — the primary-navigation item list, shared between LeftRail
// (rail / rail-icon presentation) and NavDrawer (full-label list presentation
// at tablet-portrait and phone). One source of truth for what the destinations
// are and where they navigate to, so the two presentations cannot drift.
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboardIcon, SearchIcon, FolderIcon, BriefcaseIcon, Share2Icon, UsersIcon } from 'lucide-react';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useScope } from '../../contexts/ScopeContext';
import { useSearch } from '../../contexts/SearchContext';
import { usePermissions } from '../../contexts/PermissionContext';

export interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}

export function useNavItems() {
  const { t } = useLocalization();
  const { scope } = useScope();
  const { lastQuery } = useSearch();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      icon: LayoutDashboardIcon,
      label: t('navigation.dashboard'),
      onClick: () => navigate('/'),
    },
    // Briefcase is a cross-workspace, user-level collection — always visible
    // in both scopes.
    {
      id: 'briefcase',
      icon: BriefcaseIcon,
      label: t('navigation.briefcase'),
      onClick: () => navigate('/briefcase'),
    },
    {
      id: 'chat',
      icon: LayoutDashboardIcon, // placeholder — FlintIcon is rendered directly by each consumer
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
      ? [
          {
            id: 'documents' as const,
            icon: FolderIcon,
            label: t('navigation.documents'),
            onClick: () => navigate('/documents'),
          },
        ]
      : []),
  ];

  // Admin section — workspace governance (AUTO_DISTRIBUTION_PLAN.md). Only
  // for users holding an AD grant, and only in project scope: rule sets and
  // workgroups are workspace-scoped, so enterprise scope has nothing to show.
  const adminItems: NavItem[] =
    scope.kind === 'project' && hasPermission('ad.view')
      ? [
          {
            id: 'distribution',
            icon: Share2Icon,
            label: t('navigation.distribution'),
            onClick: () => navigate('/admin/distribution'),
          },
          {
            id: 'workgroups',
            icon: UsersIcon,
            label: t('navigation.workgroups'),
            onClick: () => navigate('/admin/workgroups'),
          },
        ]
      : [];

  const routeActiveItem =
    location.pathname === '/' ? 'dashboard' :
    location.pathname.startsWith('/briefcase') ? 'briefcase' :
    location.pathname.startsWith('/documents') ? 'documents' :
    location.pathname.startsWith('/search') ? 'search' :
    location.pathname.startsWith('/packages') ? 'packages' :
    location.pathname.startsWith('/chat') ? 'chat' :
    location.pathname.startsWith('/admin/distribution') ? 'distribution' :
    location.pathname.startsWith('/admin/workgroups') ? 'workgroups' :
    '';

  return { navItems, adminItems, routeActiveItem };
}
