import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';
import { DocumentBrowser } from './pages/DocumentBrowser';
import { Chat } from './pages/Chat';
import { DesignSystem } from './pages/DesignSystem';
import { Packages } from './pages/Packages';
import { Dashboard } from './pages/Dashboard';
import { SearchResults } from './pages/SearchResults';
import { MyBriefcase } from './pages/MyBriefcase';
import { BrandBanner } from './components/BrandBanner';
import { FeedbackWidget } from './components/FeedbackWidget';
import { ClipboardProvider } from './contexts/ClipboardContext';
import { BriefcaseProvider } from './contexts/BriefcaseContext';
import { LocalizationProvider } from './contexts/LocalizationContext';
import { ShellLayoutProvider } from './contexts/ShellLayoutContext';
import { ScopeProvider } from './contexts/ScopeContext';
import { SearchProvider } from './contexts/SearchContext';
import { ViewStyleProvider } from './contexts/ViewStyleContext';
import { DensityProvider } from './contexts/DensityContext';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <LocalizationProvider>
        <ClipboardProvider>
         <BriefcaseProvider>
          <ScopeProvider>
            <ViewStyleProvider>
            <DensityProvider>
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
                    <Route path="/briefcase" element={<MyBriefcase />} />
                    <Route path="/design-system" element={<DesignSystem />} />
                    <Route path="/packages" element={<Packages />} />
                  </Routes>
                </BrowserRouter>
                </MotionConfig>
              </ShellLayoutProvider>
            </SearchProvider>
            </DensityProvider>
            </ViewStyleProvider>
          </ScopeProvider>
         </BriefcaseProvider>
        </ClipboardProvider>
    </LocalizationProvider>
    </QueryClientProvider>
  );
}
