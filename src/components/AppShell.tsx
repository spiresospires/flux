// AppShell — the react-router layout route wrapping every page that carries
// primary navigation. Replaces LeftRail being imported and mounted
// separately inside 8 page files: LeftRail is `position: fixed`, so hoisting
// it here is layout-neutral by construction, and both of its former props
// were dead (see LeftRail.tsx's header comment). See
// docs/responsive-architecture.md §6.
//
// Renders exactly one primary-nav surface at a time — LeftRail (full or
// icon-only, depending on navMode; the visual difference is pure CSS driven
// by `data-nav-mode`) or BottomTabBar — never both, since two primary navs
// would mean two sources of `aria-current` to keep in sync.
//
// ColorCustomizer is mounted here, not inside LeftRail, because it must stay
// reachable from NavDrawer's Settings row even when LeftRail itself isn't
// rendered (navMode 'mobile') — there is exactly one instance regardless of
// navMode.
import { Outlet } from 'react-router-dom';
import { LeftRail } from './LeftRail';
import { ColorCustomizer } from './ColorCustomizer';
import { BottomTabBar } from './nav/BottomTabBar';
import { NavDrawer } from './nav/NavDrawer';
import { useShellLayout, useShellOverlay } from '../contexts/ShellLayoutContext';

export function AppShell() {
  const { navMode } = useShellLayout();
  const { isColorCustomizerOpen, setColorCustomizerOpen } = useShellOverlay();

  return (
    <>
      {navMode === 'mobile' ? <BottomTabBar /> : <LeftRail />}
      <NavDrawer />
      <ColorCustomizer isOpen={isColorCustomizerOpen} onClose={() => setColorCustomizerOpen(false)} />
      <Outlet />
    </>
  );
}
