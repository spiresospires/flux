// ScopeContext — enterprise vs project mode. `scope.id` maps directly to the `wsId`
// path parameter used by every workspace-scoped endpoint.
// [AUTH] When scope changes in production, the old workspace token must be discarded
// and a new one obtained via G01:POST /auth/workspace-token (ADR-005).
// [PHASE-1]
// [TODO-ENG] Migrate to a Zustand scopeStore alongside auth wiring; consolidate with
// WorkspaceContext (ARCHITECTURE.md open question 6). Preserve the localStorage key.
import React, { createContext, useContext, useState } from 'react';
import { PROJECTS } from '../data/projects';

export type ChatScope = { kind: 'enterprise' } | { kind: 'project'; id: string; name: string };

interface ScopeContextType {
  scope: ChatScope;
  setScope: (scope: ChatScope) => void;
}

const SCOPE_STORAGE_KEY = 'flux.currentScope';

function loadPersistedScope(): ChatScope {
  try {
    const saved = localStorage.getItem(SCOPE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as ChatScope;
      if (parsed.kind === 'enterprise') return parsed;
      // Re-resolve the persisted id against the current project list so a stale
      // id (e.g. after the project set changes) falls back to enterprise instead
      // of rendering a workspace that no longer exists.
      if (parsed.kind === 'project') {
        const project = PROJECTS.find((p) => p.id === parsed.id);
        if (project) return { kind: 'project', id: project.id, name: project.name };
      }
    }
  } catch {}
  return { kind: 'enterprise' };
}

const ScopeContext = createContext<ScopeContextType | undefined>(undefined);

export function ScopeProvider({ children }: { children: React.ReactNode }) {
  const [scope, setScopeState] = useState<ChatScope>(loadPersistedScope);

  const setScope = (newScope: ChatScope) => {
    setScopeState(newScope);
    localStorage.setItem(SCOPE_STORAGE_KEY, JSON.stringify(newScope));
  };

  return (
    <ScopeContext.Provider value={{ scope, setScope }}>
      {children}
    </ScopeContext.Provider>
  );
}

export function useScope(): ScopeContextType {
  const context = useContext(ScopeContext);
  if (!context) {
    throw new Error('useScope must be used within a ScopeProvider');
  }
  return context;
}
