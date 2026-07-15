// PermissionContext — FLUX's first permission concept, introduced for
// Automatic Distribution (AUTO_DISTRIBUTION_PLAN.md §1).
// 'ad.manage' gates rule authoring; 'ad.view' grants the read-only view
// (e.g. PMs). Manage implies view. No grant → the Admin rail section is hidden.
//
// [MOCK] The grant is a dev preference (useUserPref 'dev.adPermission') with a
// switcher in the BrandBanner profile menu so demos can flip between
// manage / read-only / none.
// [API] [TODO-ENG] Replace with real grants from the workspace-membership /
// roles endpoint once G01 auth lands — the hasPermission() call-sites stay.
// [PHASE-1]
import React, { createContext, useContext, useMemo } from 'react';
import { useUserPref } from '../hooks/useUserPref';

export type AdPermissionLevel = 'manage' | 'view' | 'none';

interface PermissionContextValue {
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  /** Demo switcher state — BrandBanner profile menu only. */
  adLevel: AdPermissionLevel;
  setAdLevel: (level: AdPermissionLevel) => void;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

const PERMISSIONS_BY_LEVEL: Record<AdPermissionLevel, string[]> = {
  manage: ['ad.manage', 'ad.view'],
  view: ['ad.view'],
  none: [],
};

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const [adLevel, setAdLevel] = useUserPref<AdPermissionLevel>('dev.adPermission', 'manage');

  const value = useMemo<PermissionContextValue>(() => {
    const permissions = PERMISSIONS_BY_LEVEL[adLevel] ?? [];
    return {
      permissions,
      hasPermission: (permission: string) => permissions.includes(permission),
      adLevel,
      setAdLevel,
    };
  }, [adLevel, setAdLevel]);

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermissions(): PermissionContextValue {
  const context = useContext(PermissionContext);
  if (!context) throw new Error('usePermissions must be used within a PermissionProvider');
  return context;
}
