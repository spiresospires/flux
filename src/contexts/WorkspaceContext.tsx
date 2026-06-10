// [MOCK] Hardcoded workspace name list — overlaps with ScopeContext + data/projects.ts.
// [API] G03:GET /workspaces
// [TODO-ENG] Delete this context and merge into a single Zustand scopeStore before
// wiring auth (ARCHITECTURE.md open question 6). The `flux.currentProject` localStorage
// key is legacy — consolidate with `flux.currentScope`.
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface WorkspaceContextType {
  workspaces: string[];
  currentWorkspace: string;
  setCurrentWorkspace: (workspace: string) => void;
}

const WORKSPACES = [
  'Marra Ridge Iron Ore Mine',
  'Port Hedland Berth 6 Expansion',
  'Kwinana Lithium Hydroxide Plant',
  'Goldfields Rail Duplication',
];
const STORAGE_KEY = 'flux.currentProject';

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [currentWorkspace, setCurrentWorkspaceState] = useState<string>(() => {
    if (typeof window === 'undefined') return WORKSPACES[0];
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && WORKSPACES.includes(saved) ? saved : WORKSPACES[0];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentWorkspace);
  }, [currentWorkspace]);

  const setCurrentWorkspace = (workspace: string) => {
    if (WORKSPACES.includes(workspace)) {
      setCurrentWorkspaceState(workspace);
    }
  };

  const value = useMemo(
    () => ({
      workspaces: WORKSPACES,
      currentWorkspace,
      setCurrentWorkspace,
    }),
    [currentWorkspace]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return ctx;
}
