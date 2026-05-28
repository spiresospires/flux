import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';

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
  // View style (appearance + layout) is a global UX setting — applies across all projects.
  const [viewStyle, setViewStyleState] = useState<ViewStyle>(
    () => loadFluxStyle() ?? DEFAULT_VIEW_STYLE
  );

  // Synchronise root data attributes before the browser paints to avoid flash
  useLayoutEffect(() => {
    applyViewStyle(viewStyle);
  }, [viewStyle]);

  const setFluxStyle = useCallback((style: ViewStyle) => {
    setViewStyleState(style);
    localStorage.setItem(FLUX_STYLE_KEY, JSON.stringify(style));
  }, []);

  const setAppearance = useCallback((appearance: Appearance) => {
    setViewStyleState(prev => {
      const next = { ...prev, appearance };
      localStorage.setItem(FLUX_STYLE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ style: viewStyle, isFluxProject: true as const, setFluxStyle, setAppearance }),
    [viewStyle, setFluxStyle, setAppearance]
  );

  return <ViewStyleContext.Provider value={value}>{children}</ViewStyleContext.Provider>;
}

export function useViewStyle(): ViewStyleContextType {
  const ctx = useContext(ViewStyleContext);
  if (!ctx) throw new Error('useViewStyle must be used within ViewStyleProvider');
  return ctx;
}
