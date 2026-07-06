import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
} from 'react';
import { useUserPref } from '../hooks/useUserPref';

/**
 * Display density — a global UX preference applied across every list and grid
 * surface. Reflected onto `html[data-density]`, which drives the density CSS
 * custom properties defined in index.css (--cell-pad-*, --row-text, --row-icon,
 * --row-btn, --grid-gap, --card-pad, --list-pad-y).
 *
 * - 'comfortable' (default): recalibrated tighter than the old p-4 row so large
 *   monitors no longer feel gappy.
 * - 'compact': dense, holding the WCAG 2.2 AA 24px Target Size (Minimum) floor.
 */
export type Density = 'compact' | 'comfortable';

interface DensityContextType {
  density: Density;
  setDensity: (d: Density) => void;
}

const DensityContext = createContext<DensityContextType | undefined>(undefined);

export function DensityProvider({ children }: { children: React.ReactNode }) {
  // Persisted via useUserPref — localStorage now, Oracle/FusionLive preferences
  // table later (see useUserPref: [API] G02 GET/POST /api/user/preferences/ui.density [PHASE-1]).
  const [density, setDensity] = useUserPref<Density>('ui.density', 'compact');

  // Reflect onto the root element before paint so the density vars apply without
  // a flash on load (mirrors ViewStyleContext's data-appearance / data-view).
  useLayoutEffect(() => {
    document.documentElement.dataset.density = density;
  }, [density]);

  const value = useMemo<DensityContextType>(
    () => ({ density, setDensity }),
    [density, setDensity]
  );

  return <DensityContext.Provider value={value}>{children}</DensityContext.Provider>;
}

export function useDensity(): DensityContextType {
  const ctx = useContext(DensityContext);
  if (!ctx) throw new Error('useDensity must be used within DensityProvider');
  return ctx;
}
