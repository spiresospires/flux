// ShellLayoutContext — viewport-derived layout state (what device class are
// we in, how is navigation presented) — and ShellOverlayContext — transient
// UI state (is the nav drawer/search overlay/colour customiser open).
//
// Split deliberately into two contexts: `viewport`/`navMode`/`isRailCollapsed`
// change only on resize or an explicit collapse toggle, while the overlay
// flags toggle constantly (opening/closing the drawer on every tap). One
// context would re-render every consumer — including large page components —
// on every drawer tap. See docs/responsive-architecture.md §6.
//
// `useShellLayout` previously had zero consumers and its only effect was
// `document.documentElement.style.setProperty('--left-rail-width', '88px')`
// — an inline style that outranks every CSS rule, which silently defeated
// the whole `index.css` breakpoint layer. That call is gone: the variable
// now lives ONLY in index.css (see the SHELL LAYOUT TOKENS block there).
// This provider writes ATTRIBUTES; CSS owns the numbers.
import React, { createContext, useContext, useLayoutEffect, useMemo, useState } from 'react';
import { useUserPref } from '../hooks/useUserPref';
import { useViewportClass } from '../shell/useViewportClass';
import { resolveNavMode, type NavMode, type ViewportClass } from '../shell/viewport';

export interface ShellLayoutValue {
  viewport: ViewportClass;
  navMode: NavMode;
  /** User-chosen collapse. Honoured only at tablet-landscape/desktop — see
   *  resolveNavMode: tablet-portrait and phone ignore it entirely. */
  isRailCollapsed: boolean;
  setRailCollapsed: (collapsed: boolean) => void;
}

export interface ShellOverlayValue {
  isNavDrawerOpen: boolean;
  setNavDrawerOpen: (open: boolean) => void;
  isSearchOverlayOpen: boolean;
  setSearchOverlayOpen: (open: boolean) => void;
  /** Lifted out of LeftRail so the phone nav drawer's Settings item opens the
   *  same panel as the rail's Settings item — there is exactly one
   *  ColorCustomizer instance, mounted once in AppShell. */
  isColorCustomizerOpen: boolean;
  setColorCustomizerOpen: (open: boolean) => void;
}

const ShellLayoutContext = createContext<ShellLayoutValue | undefined>(undefined);
const ShellOverlayContext = createContext<ShellOverlayValue | undefined>(undefined);

export function ShellLayoutProvider({ children }: { children: React.ReactNode }) {
  const viewport = useViewportClass();
  const [isRailCollapsed, setRailCollapsed] = useUserPref<boolean>('shell.railCollapsed', false);

  const navMode = resolveNavMode(viewport, isRailCollapsed);

  const [isNavDrawerOpen, setNavDrawerOpen] = useState(false);
  const [isSearchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [isColorCustomizerOpen, setColorCustomizerOpen] = useState(false);

  // Pre-paint, mirroring DensityContext/ViewStyleContext's useLayoutEffect
  // pattern — the root attributes are correct before the browser ever paints.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.viewport = viewport;
    root.dataset.navMode = navMode;
  }, [viewport, navMode]);

  // An overlay that no longer applies at the new viewport must close, or a
  // phone drawer survives a rotation into tablet-landscape as dead chrome
  // sitting on top of a now-fully-labelled rail.
  useLayoutEffect(() => {
    setNavDrawerOpen(false);
    setSearchOverlayOpen(false);
  }, [viewport]);

  const layout = useMemo<ShellLayoutValue>(
    () => ({
      viewport,
      navMode,
      isRailCollapsed,
      setRailCollapsed: (collapsed: boolean) => setRailCollapsed(collapsed),
    }),
    [viewport, navMode, isRailCollapsed, setRailCollapsed]
  );

  const overlay = useMemo<ShellOverlayValue>(
    () => ({
      isNavDrawerOpen,
      setNavDrawerOpen,
      isSearchOverlayOpen,
      setSearchOverlayOpen,
      isColorCustomizerOpen,
      setColorCustomizerOpen,
    }),
    [isNavDrawerOpen, isSearchOverlayOpen, isColorCustomizerOpen]
  );

  return (
    <ShellLayoutContext.Provider value={layout}>
      <ShellOverlayContext.Provider value={overlay}>{children}</ShellOverlayContext.Provider>
    </ShellLayoutContext.Provider>
  );
}

export function useShellLayout(): ShellLayoutValue {
  const context = useContext(ShellLayoutContext);
  if (!context) {
    throw new Error('useShellLayout must be used within a ShellLayoutProvider');
  }
  return context;
}

export function useShellOverlay(): ShellOverlayValue {
  const context = useContext(ShellOverlayContext);
  if (!context) {
    throw new Error('useShellOverlay must be used within a ShellLayoutProvider');
  }
  return context;
}

/** Helper for viewport-gated affordances (e.g. RequiresViewport). */
const VIEWPORT_ORDER: readonly ViewportClass[] = ['phone', 'tablet-portrait', 'tablet-landscape', 'desktop'];
export function atLeastViewport(current: ViewportClass, min: ViewportClass): boolean {
  return VIEWPORT_ORDER.indexOf(current) >= VIEWPORT_ORDER.indexOf(min);
}
