import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BrandBanner } from './components/BrandBanner';
import { ClipboardProvider } from './contexts/ClipboardContext';
import { LocalizationProvider } from './contexts/LocalizationContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { ShellLayoutProvider } from './contexts/ShellLayoutContext';
import { ScopeProvider } from './contexts/ScopeContext';

const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const DocumentBrowser = lazy(() => import('./pages/DocumentBrowser').then((module) => ({ default: module.DocumentBrowser })));
const DesignSystem = lazy(() => import('./pages/DesignSystem').then((module) => ({ default: module.DesignSystem })));
const Packages = lazy(() => import('./pages/Packages').then((module) => ({ default: module.Packages })));

export function App() {
  return (
    <LocalizationProvider>
      <WorkspaceProvider>
        <ClipboardProvider>
          <ScopeProvider>
            <ShellLayoutProvider>
              <BrowserRouter>
                <BrandBanner />
                <Suspense fallback={<div className="min-h-screen bg-[var(--main-bg-color)]" aria-hidden="true" />}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/documents" element={<DocumentBrowser />} />
                    <Route path="/chat" element={<DocumentBrowser />} />
                    <Route path="/design-system" element={<DesignSystem />} />
                    <Route path="/packages" element={<Packages />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </ShellLayoutProvider>
          </ScopeProvider>
        </ClipboardProvider>
      </WorkspaceProvider>
    </LocalizationProvider>);

}