// ═══════════════════════════════════════════════════════════════════════════
// [TODO-ENG] APRYSE WEBVIEWER BACKEND — NOT YET IMPLEMENTED
// ═══════════════════════════════════════════════════════════════════════════
//
// This is the PRIMARY production backend — the one desktop, tablet AND phone
// browsers all use. It is not a "desktop-only" or "fallback" implementation:
// per docs/responsive-architecture.md, backend choice depends on WHERE FLUX is
// running (browser vs. the native app shell), never on screen size. Apryse
// WebViewer is what every browser context should eventually use; only the
// FusionLive native app uses the separate Mobile SDK (apryseNativeViewerBackend.ts).
//
// Today FusionLive opens documents via:
//   OpenPdfTronViewerServlet?vid=…&docId=…&objectType=DOCUMENT&formatCode=pdf
// in a NEW BROWSER TAB (see src/types/viewer.ts). This backend is where that
// gets replaced with the Apryse WebViewer SDK mounted INSIDE the FLUX shell's
// framed viewer, so the user never leaves the app to view a document.
//
// WHAT TO DO WHEN THIS IS BUILT
// ------------------------------
// 1. `npm install @pdftron/webviewer` (confirm current package name/version
//    with Apryse — WebViewer's npm package has been renamed before).
// 2. Host the SDK's static assets (the `lib` folder WebViewer.WebComponent
//    needs) — typically copied into `public/` at build time. Confirm the
//    exact asset layout required by whichever WebViewer version is licensed.
// 3. Implement `init()` below: validate the licence key, and do any
//    one-time SDK setup that doesn't depend on a specific document.
// 4. Implement `open()`: construct a WebViewer instance against the `host`
//    element, point it at the document URL for `target.docId` (the real
//    content endpoint — see [API] G07 in src/types/viewer.ts), and wire
//    WebViewer's own events to the `ViewerSessionCallbacks` passed in.
// 5. Delete `DocumentViewer.tsx`'s mock-only chrome — see the handover map
//    at the top of viewerBackend.ts for exactly which ~17 toolbar controls
//    are scaffolding vs. the 3 that are FLUX's own frame chrome and survive.
// 6. Flip the default in selectViewerBackend.ts so this becomes what every
//    browser context gets without an explicit VITE_VIEWER_BACKEND override.
//
// WHY IT THROWS RIGHT NOW
// ------------------------
// Every method below throws rather than silently no-op-ing. If
// `selectViewerBackend()` is ever pointed at this backend (e.g. someone sets
// VITE_VIEWER_BACKEND=apryse-web before this file is implemented) the failure
// must be loud and immediate — a silently blank viewer would be far more
// confusing to debug than a clear "not implemented" error.
// ═══════════════════════════════════════════════════════════════════════════

import type { ViewerBackend, ViewerSessionHandle } from './viewerBackend';

const NOT_IMPLEMENTED =
  'apryseWebViewerBackend is not implemented yet — see the [TODO-ENG] block at ' +
  'the top of src/viewer/apryseWebViewerBackend.ts. Set VITE_VIEWER_BACKEND=mock ' +
  '(or leave it unset) until this backend is wired up.';

export function createApryseWebViewerBackend(): ViewerBackend {
  return {
    id: 'apryse-web',

    // WebViewer mounts into a DOM node FLUX owns — same presentation as the
    // mock. This is the mechanism the DocumentViewer.tsx frame is built for.
    presentation: 'surface',

    // [TODO-ENG] Confirm against the licensed WebViewer version. WebViewer
    // fires document/annotation events while mounted in-page, so this should
    // be `true` — but verify rather than assume once the SDK is integrated.
    supportsLiveMarkup: true,

    async init() {
      // [TODO-ENG] Real implementation, roughly:
      //
      //   const { default: WebViewer } = await import('@pdftron/webviewer');
      //   this._webViewerCtor = WebViewer;
      //   // Licence key: inject via env, NEVER hardcode or commit it.
      //   //   VITE_APRYSE_LICENSE_KEY, read here via import.meta.env.
      //   // Confirm with Apryse whether licence validation happens at
      //   // construction time (per-instance) or can be checked once here.
      //
      // StrictMode note: React 18 StrictMode double-invokes effects (and
      // therefore this init call) in development. Guard against double
      // dynamic-import / double licence-check side effects — e.g. memoise the
      // import behind a module-level promise — rather than assuming init()
      // is called exactly once per page load.
      throw new Error(NOT_IMPLEMENTED);
    },

    open(_target, _host, _callbacks): ViewerSessionHandle {
      // [TODO-ENG] Real implementation, roughly:
      //
      //   const instance = await this._webViewerCtor(
      //     {
      //       path: '/webviewer/lib',              // static assets, see step 2 above
      //       initialDoc: contentUrlFor(target),    // [API] G07 content URL
      //       licenseKey: …,
      //     },
      //     host
      //   );
      //
      //   instance.UI.addEventListener('documentLoaded', () =>
      //     callbacks.onStatusChange('ready'));
      //   instance.UI.addEventListener('loaderror', (err) =>
      //     callbacks.onStatusChange('error', err));
      //
      //   const annotManager = instance.Core.documentViewer.getAnnotationManager();
      //   annotManager.addEventListener('annotationChanged', () =>
      //     callbacks.onMarkupsChange(mapAnnotationsToMarkups(annotManager.getAnnotationsList())));
      //   // [TODO-ENG] Comments: confirm whether WebViewer's own comment/reply
      //   // UI is used as-is (in which case `onCommentsChange` may not be
      //   // needed at all — FLUX would not render its own comments panel next
      //   // to WebViewer's), or whether FLUX keeps a separate comments panel
      //   // fed from the annotation store independently of WebViewer's UI.
      //   // This is a product decision, not an engineering one — flagged here
      //   // rather than guessed at. See docs/responsive-architecture.md §10.
      //
      //   return {
      //     close: () => instance.UI.dispose(),
      //   };
      //
      throw new Error(NOT_IMPLEMENTED);
    },
  };
}
