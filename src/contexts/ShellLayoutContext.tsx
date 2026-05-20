import React, { createContext, useContext, useEffect } from 'react';

interface ShellLayoutContextValue {
  isLeftRailVisible: true;
}

const ShellLayoutContext = createContext<ShellLayoutContextValue | undefined>(undefined);

export function ShellLayoutProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.style.setProperty('--left-rail-width', '88px');
  }, []);

  return (
    <ShellLayoutContext.Provider value={{ isLeftRailVisible: true }}>
      {children}
    </ShellLayoutContext.Provider>
  );
}

export function useShellLayout() {
  const context = useContext(ShellLayoutContext);
  if (!context) {
    throw new Error('useShellLayout must be used within a ShellLayoutProvider');
  }
  return context;
}