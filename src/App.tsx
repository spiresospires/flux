import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DocumentBrowser } from './pages/DocumentBrowser';
import { DesignSystem } from './pages/DesignSystem';
import { Packages } from './pages/Packages';
import { Dashboard } from './pages/Dashboard';
import { BrandBanner } from './components/BrandBanner';
import { ClipboardProvider } from './contexts/ClipboardContext';
import { LocalizationProvider } from './contexts/LocalizationContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { ShellLayoutProvider } from './contexts/ShellLayoutContext';
import { ScopeProvider } from './contexts/ScopeContext';
export function App() {
  return (
    <LocalizationProvider>
      <WorkspaceProvider>
        <ClipboardProvider>
          <ScopeProvider>
            <ShellLayoutProvider>
              <BrowserRouter>
                <BrandBanner />
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/documents" element={<DocumentBrowser />} />
                  <Route path="/chat" element={<DocumentBrowser />} />
                  <Route path="/design-system" element={<DesignSystem />} />
                  <Route path="/packages" element={<Packages />} />
                </Routes>
              </BrowserRouter>
            </ShellLayoutProvider>
          </ScopeProvider>
        </ClipboardProvider>
      </WorkspaceProvider>
    </LocalizationProvider>);

}