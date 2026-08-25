// selectViewerBackend — chooses which ViewerBackend implementation runs.
//
// Selection is based on WHERE FLUX is running (an explicit override, then
// whether the native app bridge is present), NEVER on screen size or device
// identity. Apryse WebViewer is the intended backend for every browser
// context — desktop, tablet AND phone — once it exists; the Mobile SDK is
// only for the native app wrapper. See docs/responsive-architecture.md §0b
// and §2 ("What triggers a layout change") for the reasoning.
//
// [MOCK] → [APRYSE-WEB] CUTOVER: once apryseWebViewerBackend.ts is
// implemented, flip the DEFAULT_BACKEND_FACTORY below from
// `createMockViewerBackend` to `createApryseWebViewerBackend`. That is the
// ONLY line that needs to change to make Apryse the production default for
// every browser context — everything else in this file (override handling,
// native detection) stays as-is.
import { createApryseNativeViewerBackend } from './apryseNativeViewerBackend';
import { createApryseWebViewerBackend } from './apryseWebViewerBackend';
import { createMockViewerBackend } from './mockViewerBackend';
import type { ViewerBackend, ViewerBackendId } from './viewerBackend';

/** [MOCK] → [APRYSE-WEB] CUTOVER POINT — see the file header. */
const DEFAULT_BACKEND_FACTORY = createMockViewerBackend;

function createBackend(id: ViewerBackendId): ViewerBackend {
  switch (id) {
    case 'mock':
      return createMockViewerBackend();
    case 'apryse-web':
      return createApryseWebViewerBackend();
    case 'apryse-native':
      return createApryseNativeViewerBackend();
  }
}

/**
 * Runtime backend selection, in priority order:
 *
 *   1. VITE_VIEWER_BACKEND — an explicit override, for local development and
 *      for testing a specific backend's [TODO-ENG] implementation in
 *      isolation once it exists. Mirrors the existing VITE_API_MODE
 *      convention (see src/index.tsx) rather than inventing a new one.
 *   2. Native bridge presence — `window.FusionLiveNative` is CAPABILITY
 *      detection (does the native wrapper's injected object exist?), not
 *      device detection. A phone browser with no wrapper does NOT match this
 *      and falls through to the default below.
 *   3. DEFAULT_BACKEND_FACTORY — today the mock, everywhere. Once Apryse
 *      WebViewer is implemented, this becomes the default for every browser
 *      context per the cutover note above.
 */
export function selectViewerBackend(): ViewerBackend {
  const override = import.meta.env.VITE_VIEWER_BACKEND;
  if (override === 'mock' || override === 'apryse-web' || override === 'apryse-native') {
    return createBackend(override);
  }

  if (typeof window !== 'undefined' && window.FusionLiveNative?.viewer) {
    return createApryseNativeViewerBackend();
  }

  return DEFAULT_BACKEND_FACTORY();
}
