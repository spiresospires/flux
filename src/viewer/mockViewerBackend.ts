// mockViewerBackend — the ONLY backend that is actually implemented today.
// Everything DocumentViewer.tsx currently shows (raster thumbnail as the
// "page", generated markups and comments) is driven from here.
//
// This file is also the REFERENCE for what a real backend must do: every
// callback in `ViewerSessionCallbacks` is exercised below, in the same order
// a real SDK would fire them. When implementing apryseWebViewerBackend.ts or
// apryseNativeViewerBackend.ts, this is the file to imitate the SHAPE of —
// swap the setTimeout-based simulation for real SDK calls/events.
//
// [MOCK] Delete this file's *usage* from selectViewerBackend.ts once a real
// backend is wired up for production — see the note there. Per product
// decision (2026-08-17), keep the FILE ITSELF as a permanent dev/test
// fallback, selectable via VITE_VIEWER_BACKEND=mock, so local development
// works without an Apryse licence and so tests never depend on the real SDK.
import { buildViewerComments, buildViewerMarkups } from '../data/mockMarkups';
import type { ViewerBackend, ViewerSessionCallbacks, ViewerSessionHandle } from './viewerBackend';

/** Simulated latency, split into two stages to mirror a real SDK: bring-up
 *  (licence/worker check) is normally much faster than decoding a specific
 *  document, so the mock fakes that same two-stage shape rather than a single
 *  delay — otherwise the 'initializing' vs 'loading' distinction in
 *  `ViewerSessionStatus` would never be visible in the prototype. */
const SIMULATED_INIT_DELAY_MS = 180;
const SIMULATED_LOAD_DELAY_MS = 220;

export function createMockViewerBackend(): ViewerBackend {
  return {
    id: 'mock',
    presentation: 'surface',
    // The mock generates markups/comments synchronously and can report them
    // at any time — same as a real in-page SDK (Apryse WebViewer) would.
    supportsLiveMarkup: true,

    async init() {
      // Nothing to bring up: no licence, no worker, no WASM. Real backends do
      // meaningful async work here — see the [TODO-ENG] block in
      // apryseWebViewerBackend.ts's `init()`.
    },

    open(target, _host, callbacks: ViewerSessionCallbacks): ViewerSessionHandle {
      let cancelled = false;
      let loadTimer: ReturnType<typeof setTimeout> | undefined;

      callbacks.onStatusChange('initializing');

      const initTimer = setTimeout(() => {
        if (cancelled) return;

        // Dev/test lever: force the error path on demand without touching
        // product code. Documented here rather than left to be discovered —
        // set VITE_VIEWER_MOCK_FORCE_ERROR=true to exercise the viewer's
        // error state (e.g. to build/verify the retry UI).
        if (import.meta.env.VITE_VIEWER_MOCK_FORCE_ERROR === 'true') {
          callbacks.onStatusChange(
            'error',
            new Error('Mock viewer forced failure (VITE_VIEWER_MOCK_FORCE_ERROR=true)')
          );
          return;
        }

        callbacks.onStatusChange('loading');

        loadTimer = setTimeout(() => {
          if (cancelled) return;
          callbacks.onMarkupsChange(buildViewerMarkups(target.docId));
          callbacks.onCommentsChange(buildViewerComments(target.docId));
          callbacks.onStatusChange('ready');
        }, SIMULATED_LOAD_DELAY_MS);
      }, SIMULATED_INIT_DELAY_MS);

      return {
        close() {
          // Idempotent: clearing an already-fired timeout is a no-op, and
          // `cancelled` guards against a timer that is already mid-flight.
          cancelled = true;
          clearTimeout(initTimer);
          clearTimeout(loadTimer);
        },
      };
    },
  };
}
