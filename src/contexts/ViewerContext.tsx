import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ViewerTarget } from '../types/viewer';

// The viewer is opened from several places — the grid row action menu, the
// properties panel action bar, and each revision in the version stack — so the
// open/close state lives in context rather than being duplicated per page.
// "Same experience from wherever someone clicks the eye icon."

interface ViewerContextValue {
  /** The document being viewed, or null when the viewer is closed. */
  target: ViewerTarget | null;
  /** Full-viewport rather than framed inside the FLUX shell. */
  isMaximised: boolean;
  openViewer: (target: ViewerTarget) => void;
  closeViewer: () => void;
  toggleMaximised: () => void;
}

const ViewerContext = createContext<ViewerContextValue | undefined>(undefined);

export function ViewerProvider({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<ViewerTarget | null>(null);
  const [isMaximised, setIsMaximised] = useState(false);

  const openViewer = useCallback((next: ViewerTarget) => {
    setTarget(next);
    // Always open framed — maximise is a per-session choice, not sticky, so the
    // user always sees the document in context first.
    setIsMaximised(false);
  }, []);

  const closeViewer = useCallback(() => setTarget(null), []);
  const toggleMaximised = useCallback(() => setIsMaximised((v) => !v), []);

  const value = useMemo(
    () => ({ target, isMaximised, openViewer, closeViewer, toggleMaximised }),
    [target, isMaximised, openViewer, closeViewer, toggleMaximised]
  );

  return <ViewerContext.Provider value={value}>{children}</ViewerContext.Provider>;
}

export function useViewer() {
  const context = useContext(ViewerContext);
  if (!context) {
    throw new Error('useViewer must be used within a ViewerProvider');
  }
  return context;
}
