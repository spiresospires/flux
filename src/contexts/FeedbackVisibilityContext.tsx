import React, { createContext, useContext, useMemo } from 'react';
import { useUserPref } from '../hooks/useUserPref';

interface FeedbackVisibilityContextType {
  /** True when the user has hidden the floating feedback pill. */
  isHidden: boolean;
  setHidden: (hidden: boolean) => void;
}

const FeedbackVisibilityContext = createContext<FeedbackVisibilityContextType | undefined>(undefined);

/**
 * Whether the floating feedback pill is showing.
 *
 * Shared through context rather than read twice, because two components in
 * different parts of the tree act on it: the pill hides itself, and the profile
 * menu turns it back on. Two independent `useUserPref` calls on one key do NOT
 * converge within a single document — the hook's `storage` listener only hears
 * OTHER windows — so the banner and the pill would disagree until a reload.
 */
export function FeedbackVisibilityProvider({ children }: { children: React.ReactNode }) {
  // [MOCK] Persisted via useUserPref (localStorage) — swaps to the Oracle
  // preferences table with no change here or at either call site.
  // [API] G02:GET /api/user/preferences/ui.feedbackHidden
  // [API] G02:POST /api/user/preferences/ui.feedbackHidden  body: { value: boolean }
  // [AUTH] User-scoped: this is a per-user display choice, not per-workspace.
  // [PHASE-1]
  const [isHidden, setHidden] = useUserPref<boolean>('ui.feedbackHidden', false);

  const value = useMemo(() => ({ isHidden, setHidden }), [isHidden, setHidden]);

  return (
    <FeedbackVisibilityContext.Provider value={value}>
      {children}
    </FeedbackVisibilityContext.Provider>
  );
}

export function useFeedbackVisibility() {
  const ctx = useContext(FeedbackVisibilityContext);
  if (!ctx) {
    throw new Error('useFeedbackVisibility must be used within FeedbackVisibilityProvider');
  }
  return ctx;
}
