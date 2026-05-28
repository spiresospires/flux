import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { PROJECTS } from '../data/projects';
import { useScope } from './ScopeContext';

export type Appearance = 'light' | 'dark' | 'basic';
export type Layout = 'floating' | 'flush';

export interface ViewStyle {
  appearance: Appearance;
  layout: Layout;
}

interface ViewStyleContextType {
  /** The currently active view style (appearance + layout). */
  style: ViewStyle;
  /** True when the active project is the FLUX demo project. */
  isFluxProject: boolean;
  /**
   * Update appearance + layout together. Only meaningful on the FLUX project;
   * the choice is persisted to localStorage under `flux-view-style`.
   */
  setFluxStyle: (style: ViewStyle) => void;
  /**
   * Update appearance only. Used by the standard dark/light toggle on
   * non-FLUX projects; persisted to localStorage under `theme`.
   */
  setAppearance: (appearance: Appearance) => void;
}

const FLUX_STYLE_KEY = 'flux-view-style';
const GLOBAL_APPEARANCE_KEY = 'theme';

/** Default style — floating layout, light appearance — for all users on all projects. */
export const DEFAULT_VIEW_STYLE: ViewStyle = { appearance: 'light', layout: 'floating' };

function loadFluxStyle(): ViewStyle | null {
  try {
    const saved = localStorage.getItem(FLUX_STYLE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as Partial<ViewStyle>;
    if (
      (parsed.appearance === 'light' || parsed.appearance === 'dark') &&
      (parsed.layout === 'floating' || parsed.layout === 'flush')
    ) {
      return parsed as ViewStyle;
    }
  } catch {}
  return null;
}

function applyViewStyle(style: ViewStyle) {
  document.documentElement.dataset.appearance = style.appearance;
  document.documentElement.dataset.view = style.layout;
  // Keep backward compat: existing dark-mode CSS is scoped to html[data-theme]
  document.documentElement.dataset.theme = style.appearance;
}

const ViewStyleContext = createContext<ViewStyleContextType | undefined>(undefined);

export function ViewStyleProvider({ children }: { children: React.ReactNode }) {
  const { scope } = useScope();

  const isFluxProject = useMemo(
    () => scope.kind === 'project' && PROJECTS.some(p => p.id === scope.id && p.isFluxRefactor),
    [scope]
  );

  // Persisted FLUX project preference (appearance + layout together)
  const [fluxStyle, setFluxStyleState] = useState<ViewStyle>(
    () => loadFluxStyle() ?? DEFAULT_VIEW_STYLE
  );

  // Global appearance for non-FLUX projects (synced with the legacy `theme` key)
  const [globalAppearance, setGlobalAppearanceState] = useState<Appearance>(
    () => (localStorage.getItem(GLOBAL_APPEARANCE_KEY) as Appearance | null) ?? 'light'
  );

  // The currently active style depends on which project is selected
  const currentStyle = useMemo<ViewStyle>(
    () =>
      isFluxProject
        ? fluxStyle
        : { appearance: globalAppearance, layout: 'floating' },
    [isFluxProject, fluxStyle, globalAppearance]
  );

  // Synchronise root data attributes before the browser paints to avoid flash
  useLayoutEffect(() => {
    applyViewStyle(currentStyle);
  }, [currentStyle]);

  const setFluxStyle = useCallback((style: ViewStyle) => {
    setFluxStyleState(style);
    localStorage.setItem(FLUX_STYLE_KEY, JSON.stringify(style));
  }, []);

  const setAppearance = useCallback((appearance: Appearance) => {
    setGlobalAppearanceState(appearance);
    localStorage.setItem(GLOBAL_APPEARANCE_KEY, appearance);
  }, []);

  const value = useMemo(
    () => ({ style: currentStyle, isFluxProject, setFluxStyle, setAppearance }),
    [currentStyle, isFluxProject, setFluxStyle, setAppearance]
  );

  return <ViewStyleContext.Provider value={value}>{children}</ViewStyleContext.Provider>;
}

export function useViewStyle(): ViewStyleContextType {
  const ctx = useContext(ViewStyleContext);
  if (!ctx) throw new Error('useViewStyle must be used within ViewStyleProvider');
  return ctx;
}
