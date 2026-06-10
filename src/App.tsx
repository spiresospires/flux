import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { DocumentBrowser } from './pages/DocumentBrowser';
import { Chat } from './pages/Chat';
import { DesignSystem } from './pages/DesignSystem';
import { Packages } from './pages/Packages';
import { Dashboard } from './pages/Dashboard';
import { SearchResults } from './pages/SearchResults';
import { BrandBanner } from './components/BrandBanner';
import { FeedbackWidget } from './components/FeedbackWidget';
import { ClipboardProvider } from './contexts/ClipboardContext';
import { LocalizationProvider } from './contexts/LocalizationContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { ShellLayoutProvider } from './contexts/ShellLayoutContext';
import { ScopeProvider } from './contexts/ScopeContext';
import { SearchProvider } from './contexts/SearchContext';
import { ViewStyleProvider } from './contexts/ViewStyleContext';

export function App() {
  return (
    <LocalizationProvider>
      <WorkspaceProvider>
        <ClipboardProvider>
          <ScopeProvider>
            <ViewStyleProvider>
            <SearchProvider>
              <ShellLayoutProvider>
                {/* reducedMotion="user" disables all Framer Motion transforms when the OS
                    prefers-reduced-motion setting is on (WCAG 2.3.3). CSS keyframes are
                    handled separately in index.css. */}
                <MotionConfig reducedMotion="user">
                <BrowserRouter>
                  <BrandBanner />
                  <FeedbackWidget />
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/documents" element={<DocumentBrowser />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/search" element={<SearchResults />} />
                    <Route path="/design-system" element={<DesignSystem />} />
                    <Route path="/packages" element={<Packages />} />
                  </Routes>
                </BrowserRouter>
                </MotionConfig>
              </ShellLayoutProvider>
            </SearchProvider>
            </ViewStyleProvider>
          </ScopeProvider>
        </ClipboardProvider>
      </WorkspaceProvider>
    </LocalizationProvider>
  );
}
