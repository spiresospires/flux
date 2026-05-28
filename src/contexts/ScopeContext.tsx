import React, { createContext, useContext, useState } from 'react';

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
      if (parsed.kind === 'enterprise' || (parsed.kind === 'project' && parsed.id && parsed.name)) {
        return parsed;
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
