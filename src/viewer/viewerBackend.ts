// ═══════════════════════════════════════════════════════════════════════════
// VIEWER BACKEND CONTRACT
// ═══════════════════════════════════════════════════════════════════════════
//
// WHY THIS FILE EXISTS
// ---------------------
// FLUX's document viewer is currently a hand-built mock (see mockViewerBackend.ts):
// the "page" is a raster thumbnail, and markups/comments are generated fake data.
// In production, FusionLive renders documents with Apryse (formerly PDFTron):
//   - Desktop / tablet / phone BROWSER  → Apryse WebViewer, mounted in the page
//   - Inside the FusionLive NATIVE APP  → Apryse Mobile SDK, a native full-screen
//                                         view outside the DOM entirely
// Backend choice depends on WHERE the app is running (browser vs. native
// wrapper) — never on screen size. A phone browser and a desktop browser both
// get WebViewer; only the native app gets the Mobile SDK. See
// docs/responsive-architecture.md §0b and §2 ("What triggers a layout change")
// for why device/viewport detection must never drive this choice.
//
// This file defines the `ViewerBackend` interface that all three
// implementations (mock, Apryse Web, Apryse Native) satisfy, so that
// `DocumentViewer.tsx` and `useDocumentViewer.ts` never need to know which one
// is actually running. Swapping the mock for the real SDK should mean writing
// ONE new file that implements this interface — not touching the component
// tree, the FLUX chrome, or any call site that opens a document today.
//
// ═══════════════════════════════════════════════════════════════════════════
// HANDOVER MAP — start here if you are wiring up the real Apryse SDKs
// ═══════════════════════════════════════════════════════════════════════════
//   1. This file            — the contract. Should need NO changes.
//   2. mockViewerBackend.ts  — reference implementation showing every callback
//                              actually being used. Read this first.
//   3. apryseWebViewerBackend.ts    — replace the throws with real WebViewer calls.
//   4. apryseNativeViewerBackend.ts — replace the throws with real bridge calls.
//   5. selectViewerBackend.ts — flip ONE line to make Apryse Web the default
//                                once it's implemented (currently defaults to
//                                mock everywhere).
//   6. DocumentViewer.tsx    — FLUX's own chrome (frame, maximise, close,
//                              open-in-new-tab). Roughly 17 of its current ~20
//                              toolbar controls (zoom, pan/select/marquee, the
//                              5 tool tabs, the 5 side-panel switchers, search,
//                              save) are mock-only scaffolding and should be
//                              DELETED once a `surface`-presentation backend
//                              provides its own UI inside the host element.
//                              Only the 3 FLUX-chrome controls survive.
// ═══════════════════════════════════════════════════════════════════════════

import type { ViewerComment, ViewerMarkup, ViewerTarget } from '../types/viewer';

/** Which concrete implementation is active. Used for backend-specific
 *  behaviour at the call site (e.g. `DocumentViewer.tsx` only renders its own
 *  mock toolbar/panels when `backend.id === 'mock'`). */
export type ViewerBackendId = 'mock' | 'apryse-web' | 'apryse-native';

/**
 * How the backend puts pixels on screen — the axis that actually matters for
 * how `DocumentViewer.tsx` has to render around it.
 *
 * 'surface'  — the backend needs a DOM node to mount into. FLUX renders the
 *              frame (header, chrome, a host <div>) and hands the host element
 *              to the backend. This is how Apryse WebViewer works, and how the
 *              mock behaves today (though the mock renders its content as
 *              ordinary React JSX rather than mounting into the host node —
 *              see the comment in mockViewerBackend.ts).
 *
 * 'external' — the backend takes over presentation itself and FLUX renders no
 *              canvas at all. This is the Apryse Mobile SDK case: the native
 *              layer pushes its own full-screen view, FLUX's React tree is not
 *              involved in rendering the document, and the only thing FLUX
 *              does is wait for `onRequestClose` to fire when the user
 *              dismisses the native viewer.
 *
 * `DocumentViewer.tsx` MUST branch on this before rendering its frame content —
 * an 'external' backend should not receive a host div, and should not have
 * FLUX's own toolbar rendered underneath/behind it.
 */
export type ViewerPresentation = 'surface' | 'external';

/** Lifecycle of a single open document. Mirrors what any real SDK actually
 *  goes through: bring-up (licence + worker/WASM), then per-document decode,
 *  then interactive. Modelled explicitly (rather than a boolean `isLoading`)
 *  so loading and error UI can be designed against the SAME states the real
 *  integration will report — decided in advance rather than retrofitted. */
export type ViewerSessionStatus =
  | 'idle'          // no target open
  | 'initializing'  // backend bring-up in progress (licence/worker/WASM)
  | 'loading'       // backend ready; this specific document is being fetched/decoded
  | 'ready'         // document is interactive
  | 'error';        // either init or this document's load failed — see `error`

/**
 * Backend bring-up configuration.
 * [TODO-ENG] Populate this from env vars when wiring the real SDKs — see the
 * `[TODO-ENG]` block in apryseWebViewerBackend.ts / apryseNativeViewerBackend.ts
 * for exactly which Apryse fields belong here (licence key, worker/WASM paths).
 * Deliberately empty of Apryse-specific fields today so this file compiles and
 * means the same thing regardless of which backend is selected.
 */
export interface ViewerBackendConfig {
  [key: string]: unknown;
}

/** Handle returned by `open()`. `close()` must be idempotent — callers (the
 *  `useDocumentViewer` hook's effect cleanup, and an explicit user close) may
 *  both invoke it, and a real SDK's teardown must tolerate that. */
export interface ViewerSessionHandle {
  close(): void;
}

/**
 * Callbacks a backend uses to report state back into React. Callback-based
 * (rather than a Promise or an object the hook polls) because every real
 * annotation SDK is fundamentally event-driven — WebViewer and the Mobile SDK
 * both fire events for load progress, annotation changes, and viewer-initiated
 * close. Modelling that from day one avoids an awkward Promise-to-events
 * adapter being invented at integration time.
 */
export interface ViewerSessionCallbacks {
  /** Fire on every lifecycle transition. Pass `error` only when status is 'error'. */
  onStatusChange(status: ViewerSessionStatus, error?: Error): void;

  /** Full replacement of the markup layer list for the currently open document.
   *  [TODO-ENG] The real Apryse annotation store is incremental (add/update/
   *  remove individual annotations), not a full-list replace. When wiring the
   *  SDK, either (a) keep this full-replace shape and have the backend
   *  reconcile its own event stream into a full list before calling this, or
   *  (b) widen the callback to incremental ops and update `useDocumentViewer`
   *  accordingly. Not decided — flagged here rather than guessed at. */
  onMarkupsChange(markups: ViewerMarkup[]): void;

  /** Full replacement of the review-comment list. Same [TODO-ENG] note as
   *  `onMarkupsChange` applies. */
  onCommentsChange(comments: ViewerComment[]): void;

  /**
   * The backend is asking FLUX to close the viewer entirely.
   *
   * Only meaningful for 'external' presentation today (the native Mobile SDK
   * has its own close/back UI with nothing FLUX renders on top of it, so the
   * ONLY way FLUX finds out the user is done is this callback). A 'surface'
   * backend normally leaves closing to FLUX's own chrome (the X button in
   * DocumentViewer.tsx's header) and should not need to call this — but the
   * hook wires it up unconditionally so a 'surface' backend to add an
   * internal close affordance later (e.g. a keyboard shortcut inside
   * WebViewer) without an interface change.
   */
  onRequestClose(): void;
}

/**
 * The contract every viewer backend implements. See the three implementations:
 *   - mockViewerBackend.ts           (real, used today)
 *   - apryseWebViewerBackend.ts      (placeholder — [TODO-ENG] to implement)
 *   - apryseNativeViewerBackend.ts   (placeholder — [TODO-ENG] to implement)
 */
export interface ViewerBackend {
  readonly id: ViewerBackendId;
  readonly presentation: ViewerPresentation;

  /**
   * Whether markup/comment state is available WHILE the document is open, or
   * only once the session closes.
   *
   * True for the mock and (expected) for Apryse WebViewer, since both run
   * inside the same JS runtime as the rest of FLUX and can fire events live.
   * Likely FALSE for the native handoff case: a fully native full-screen SDK
   * may only be able to hand annotation state back to the web layer at
   * hand-back time via the bridge, not stream it live. Consumers that render
   * markups/comments alongside the viewer (there are none today — see
   * DocumentViewer.tsx's own left/right panels, which only exist for the
   * mock) must check this flag before assuming live updates.
   */
  readonly supportsLiveMarkup: boolean;

  /**
   * One-time SDK bring-up. Called once per backend instance, before the first
   * `open()`. For the mock this is a no-op; for a real SDK this is where a
   * licence key is validated and worker/WASM assets are registered.
   *
   * Must be idempotent-safe to await multiple times if the hook calls it more
   * than once (StrictMode double-invokes effects in development) — see the
   * [TODO-ENG] note in each real-backend file.
   */
  init(config: ViewerBackendConfig): Promise<void>;

  /**
   * Opens a document.
   *
   * @param target    what to open.
   * @param host      the DOM node to mount into. Present only when
   *                  `presentation === 'surface'`; the caller passes
   *                  `undefined` for an 'external' backend, and an 'external'
   *                  backend must not require one.
   * @param callbacks how this open session reports state back to React.
   * @returns a handle whose `close()` tears the session down. Must be safe to
   *          call even if the session never reached 'ready' (e.g. closed
   *          while still 'initializing').
   */
  open(
    target: ViewerTarget,
    host: HTMLElement | undefined,
    callbacks: ViewerSessionCallbacks
  ): ViewerSessionHandle;
}

// ─────────────────────────────────────────────────────────────────────────
// Native bridge detection
// ─────────────────────────────────────────────────────────────────────────
// `selectViewerBackend.ts` looks for this global to decide whether FLUX is
// running inside the FusionLive native wrapper. This is CAPABILITY detection
// (does this bridge object exist?), never device/User-Agent detection — see
// docs/responsive-architecture.md §2. The native shell is expected to inject
// `window.FusionLiveNative` before the webview's page scripts run.
//
// [TODO-ENG] This shape is a placeholder pending the actual bridge contract
// from the mobile app team. At minimum it needs a way to open the native
// viewer and a way to be notified of its lifecycle; the `viewer` sub-object
// below is a guess at that shape, not an agreed API.
declare global {
  interface Window {
    FusionLiveNative?: {
      viewer?: {
        /** [TODO-ENG] Placeholder — confirm the real bridge method signature
         *  with the mobile app team before implementing apryseNativeViewerBackend.ts. */
        open?: (target: ViewerTarget) => void;
      };
    };
  }
}
