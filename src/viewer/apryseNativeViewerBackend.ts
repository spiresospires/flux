// ═══════════════════════════════════════════════════════════════════════════
// [TODO-ENG] APRYSE MOBILE SDK (NATIVE) BACKEND — NOT YET IMPLEMENTED
// ═══════════════════════════════════════════════════════════════════════════
//
// This backend is selected ONLY when FLUX is running inside the FusionLive
// native app wrapper (iOS/Android), detected via the `window.FusionLiveNative`
// bridge object — see the "Native bridge detection" section at the bottom of
// viewerBackend.ts. It is NOT selected for phone browsers: a phone opening
// FLUX in mobile Safari/Chrome gets apryseWebViewerBackend.ts, same as
// desktop. See docs/responsive-architecture.md §0b/§2.
//
// WHY THIS IS A FUNDAMENTALLY DIFFERENT SHAPE FROM THE WEB BACKEND
// -------------------------------------------------------------------
// Apryse WebViewer mounts into a DOM node FLUX controls — React stays in
// charge of the page. The Apryse MOBILE SDK is a native view that the native
// app shell pushes on top of the webview, OUTSIDE the DOM entirely. FLUX's
// React tree cannot render "into" it, cannot see its toolbar, and does not
// control when it closes — the user might hit a native back button or swipe
// gesture that FLUX's JavaScript never observes directly.
//
// That is exactly what `presentation: 'external'` and the
// `onRequestClose` callback in viewerBackend.ts exist for. `DocumentViewer.tsx`
// must render NOTHING (no frame, no host div, no toolbar) when this backend
// is active — its only job is to ask the native layer to open, then wait to
// be told when the user is done.
//
// WHAT TO DO WHEN THIS IS BUILT
// ------------------------------
// 1. Confirm the actual bridge contract with the mobile app team. The
//    `window.FusionLiveNative.viewer` shape in viewerBackend.ts is a
//    PLACEHOLDER GUESS, not an agreed API — this is flagged as an open
//    question in docs/responsive-architecture.md §0b.
// 2. Confirm whether the bridge is synchronous (fire-and-forget `open()` call)
//    or promise/callback-based, and whether it uses `postMessage`, a native
//    bridge library (e.g. a WebView JS interface), or something else.
// 3. Confirm how the native layer reports back: does it fire a JS event on
//    `window`, call a global callback function FLUX registers, or use
//    `postMessage`? Wire that into `onStatusChange('ready' | 'error')` and
//    `onRequestClose()` below.
// 4. Confirm markup/comment handback timing — per `supportsLiveMarkup: false`
//    below, the working assumption is that annotation state is only available
//    once the native viewer closes and hands control back, NOT streamed live.
//    If the native SDK can actually push live annotation events to the
//    webview, flip this to `true` and wire `onMarkupsChange`/
//    `onCommentsChange` during the open session instead of only at close.
// 5. Confirm how downloaded/offline documents (see docs/responsive-architecture.md
//    §0b — the existing FusionLive app's My Briefcase download feature)
//    interact with this backend: does opening a downloaded document still
//    go through this same bridge call, or a different offline-aware one?
// ═══════════════════════════════════════════════════════════════════════════

import type { ViewerBackend, ViewerSessionHandle } from './viewerBackend';

const NOT_IMPLEMENTED =
  'apryseNativeViewerBackend is not implemented yet — see the [TODO-ENG] block ' +
  'at the top of src/viewer/apryseNativeViewerBackend.ts. This backend should ' +
  'only be reachable once window.FusionLiveNative.viewer is a real, agreed ' +
  'bridge contract.';

export function createApryseNativeViewerBackend(): ViewerBackend {
  return {
    id: 'apryse-native',

    // No DOM node — the native layer renders its own full-screen view outside
    // the webview's document. See the file header above.
    presentation: 'external',

    // Working assumption, NOT confirmed — see step 4 in the header comment.
    // A fully native handoff may only be able to report annotation state once
    // the session closes, not while it is open.
    supportsLiveMarkup: false,

    async init() {
      // [TODO-ENG] Real implementation, roughly:
      //
      //   if (!window.FusionLiveNative?.viewer) {
      //     throw new Error('Native viewer bridge unavailable');
      //   }
      //   // Whatever one-time handshake the bridge needs — e.g. registering a
      //   // callback the native layer will invoke, or confirming bridge
      //   // protocol version.
      //
      throw new Error(NOT_IMPLEMENTED);
    },

    open(_target, _host, _callbacks): ViewerSessionHandle {
      // [TODO-ENG] Real implementation, roughly:
      //
      //   window.FusionLiveNative.viewer.open(target);
      //
      //   // The native layer must call back into JS somehow when the user
      //   // closes its full-screen view. Exact mechanism TBD — placeholder
      //   // shown as a global callback the native shell is expected to call:
      //   window.__onNativeViewerClosed = (result) => {
      //     if (result?.markups) callbacks.onMarkupsChange(result.markups);
      //     if (result?.comments) callbacks.onCommentsChange(result.comments);
      //     callbacks.onRequestClose();
      //   };
      //
      //   callbacks.onStatusChange('ready');
      //
      //   return {
      //     close: () => {
      //       // [TODO-ENG] Ask the native layer to dismiss its view if FLUX
      //       // itself initiates the close (e.g. the user navigates away in
      //       // a way the native layer doesn't otherwise observe). Confirm
      //       // whether the bridge supports this or whether close is always
      //       // native-initiated only.
      //       delete window.__onNativeViewerClosed;
      //     },
      //   };
      //
      throw new Error(NOT_IMPLEMENTED);
    },
  };
}
