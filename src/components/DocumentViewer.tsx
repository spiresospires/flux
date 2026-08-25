// DocumentViewer — FLUX's own frame around whatever document viewer backend
// is actually rendering the document. See src/viewer/viewerBackend.ts for the
// full explanation of the backend abstraction and the handover plan; this
// file only owns:
//   1. FLUX's OWN chrome — the frame/backdrop, the maximise/restore toggle,
//      open-in-new-tab, close, and the document identity strip. This is
//      "FusionLive UI", not viewer UI, and survives regardless of which
//      backend is active.
//   2. The MOCK prototype content (toolbar, zoom, markup/comment panels) —
//      clearly isolated below and gated on `backend.id === 'mock'` so it is
//      obvious what to delete once a real backend exists. See the
//      `// ═══ MOCK-ONLY ═══` markers below.
//
// [MOCK] Today `selectViewerBackend()` always resolves to the mock (no Apryse
// backend is implemented yet), so this file's behaviour is unchanged from
// before this module existed: raster thumbnail as the "page", generated
// markups/comments. See src/viewer/selectViewerBackend.ts for the cutover
// point once that changes.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MenuIcon,
  PanelLeftIcon,
  ZoomInIcon,
  ZoomOutIcon,
  MousePointerIcon,
  HandIcon,
  SquareDashedIcon,
  EyeIcon,
  SearchIcon,
  MessageSquareIcon,
  SaveIcon,
  Maximize2Icon,
  Minimize2Icon,
  ExternalLinkIcon,
  XIcon,
  ImageIcon,
  PaperclipIcon,
  LayersIcon,
  ListIcon,
  PenLineIcon,
  ChevronDownIcon,
  PlusIcon,
  CopyIcon,
  RefreshCwIcon,
  MinusIcon,
  LoaderIcon,
  AlertTriangleIcon,
} from 'lucide-react';
import { useViewer } from '../contexts/ViewerContext';
import { useDocumentViewer } from '../viewer/useDocumentViewer';
import { useViewportClass } from '../shell/useViewportClass';

// ═══════════════════════════════════════════════════════════════════════════
// MOCK-ONLY — everything in this block exists to make the prototype
// interactive and has no equivalent once a real Apryse backend is wired up
// (WebViewer and the Mobile SDK both bring their own tool tabs, zoom, side
// panels, search and save). Delete alongside the `backend.id === 'mock'`
// branch in the component below. See viewerBackend.ts's handover map.
// ═══════════════════════════════════════════════════════════════════════════
const TOOL_TABS = ['View', 'Annotate', 'Shapes', 'Insert', 'Measure'] as const;
type ToolTab = (typeof TOOL_TABS)[number];

const ZOOM_STEPS = [50, 75, 100, 125, 139, 150, 200, 300, 400];

/** Left rail of panel switchers, mirroring the real viewer's icon strip. */
const SIDE_PANELS = [
  { key: 'thumbnails', icon: ImageIcon, label: 'Thumbnails' },
  { key: 'attachments', icon: PaperclipIcon, label: 'Attachments' },
  { key: 'markup', icon: LayersIcon, label: 'Markup' },
  { key: 'signature', icon: PenLineIcon, label: 'Signatures' },
  { key: 'outline', icon: ListIcon, label: 'Outline' },
] as const;
// ═══════════════════════════════════════════════════════════════════════════
// END MOCK-ONLY constants
// ═══════════════════════════════════════════════════════════════════════════

/** FLUX chrome, not mock-only — the frame's toolbar buttons (Close, Maximise,
 *  the mock's own tool icons) all share this shape. */
function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  active,
  disabled,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`w-8 h-8 rounded-md inline-flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        active ? 'bg-[#E8F1FB] text-[#0461BA]' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
      }`}
    >
      <Icon size={16} />
    </button>
  );
}

export function DocumentViewer() {
  const { target, isMaximised, closeViewer, toggleMaximised } = useViewer();

  // Everything below the FLUX frame — loading, error, and the actual document
  // surface — is owned by whichever backend `selectViewerBackend()` resolved
  // to. See src/viewer/useDocumentViewer.ts and src/viewer/viewerBackend.ts.
  const { backend, hostRef, status, error, markups, comments, retry } = useDocumentViewer(target, {
    onRequestClose: closeViewer,
  });

  // The ~20-button mock toolbar (plus the mock's own side panels) is roughly
  // 900px wide and clips the frame's own Close/Maximise controls off-screen
  // below tablet width — on a phone, Close was previously unreachable
  // entirely (no visible button, no tappable backdrop when maximised,
  // keyboard-only Escape). Rather than build a bespoke phone viewer for a
  // surface that Apryse WebViewer will replace wholesale (see
  // viewerBackend.ts's handover map), the fix here is the smallest one that
  // makes the viewer safe on a real phone today: drop the mock's own toolbar
  // and asides and force full-bleed, so FLUX's own frame controls — the
  // three that survive the eventual Apryse cutover — are the only things
  // competing for the header row and always fit.
  const viewport = useViewportClass();
  const isPhone = viewport === 'phone';

  // ═══ MOCK-ONLY: prototype toolbar/canvas state — irrelevant to a real backend ═══
  const [tab, setTab] = useState<ToolTab>('View');
  const [zoom, setZoom] = useState(139);
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);
  const [activePanel, setActivePanel] = useState<string>('markup');

  // Reset per document so reopening never inherits the last document's zoom.
  // Keyed on the id, not the object: `target` is a fresh literal on every
  // open, so depending on it would reset mid-session on unrelated re-renders.
  const targetDocId = target?.docId;
  useEffect(() => {
    if (!targetDocId) return;
    setTab('View');
    setZoom(139);
    setActivePanel('markup');
  }, [targetDocId]);

  const stepZoom = (direction: 1 | -1) => {
    const idx = ZOOM_STEPS.findIndex((z) => z >= zoom);
    const nextIdx = Math.min(Math.max((idx === -1 ? ZOOM_STEPS.length - 1 : idx) + direction, 0), ZOOM_STEPS.length - 1);
    setZoom(ZOOM_STEPS[nextIdx]);
  };
  // ═══ END MOCK-ONLY state ═══

  // FLUX chrome — real regardless of backend.
  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeViewer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [target, closeViewer]);

  /** The legacy behaviour, kept as an explicit escape hatch.
   *  [API] G07 content URL — the prototype has no servlet to point at.
   *  [TODO-ENG] Point this at the real Apryse content URL for `target.docId`
   *  once G07 exists — see src/types/viewer.ts. */
  const openInNewTab = () => {
    window.open(`/documents?doc=${encodeURIComponent(target?.docId ?? '')}`, '_blank', 'noopener');
  };

  // An 'external' backend (the native Apryse handoff — see
  // apryseNativeViewerBackend.ts) renders its own full-screen UI OUTSIDE this
  // component's DOM entirely. FLUX has no frame, no host div and no toolbar
  // to show around it — only a minimal state indicator while the native
  // layer is bringing its viewer up, or an error if it couldn't.
  const isExternalPresentation = target && backend.presentation === 'external';

  return createPortal(
    // A single conditional child slot (ternary, not two `{cond && (...)}`
    // siblings) mirrors the shape this component had before the
    // external/surface branch existed, and gives AnimatePresence one clear
    // exit target instead of two possibly-null positions.
    <AnimatePresence>
      {target ? (
        isExternalPresentation ? (
          <motion.div
            key="external-viewer-status"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-neutral-900/60 grid place-items-center text-white"
          role="status"
          aria-live="polite"
        >
          {(status === 'initializing' || status === 'loading') && (
            <div className="flex flex-col items-center gap-3">
              <LoaderIcon size={28} className="animate-spin" />
              <p className="text-sm">Opening {target.title}…</p>
            </div>
          )}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-3 max-w-sm text-center px-6">
              <AlertTriangleIcon size={28} className="text-amber-400" />
              <p className="text-sm">{error?.message ?? 'Could not open the document viewer.'}</p>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={retry}
                  className="px-3 py-1.5 rounded-md bg-white text-neutral-900 text-sm font-medium hover:bg-neutral-100"
                >
                  Try again
                </button>
                <button
                  type="button"
                  onClick={closeViewer}
                  className="px-3 py-1.5 rounded-md border border-white/40 text-sm hover:bg-white/10"
                >
                  Close
                </button>
              </div>
            </div>
          )}
          {/* status === 'ready': the native layer is presenting its own UI —
              FLUX renders nothing further and waits for onRequestClose. */}
        </motion.div>
      ) : (
        <motion.div
          key="framed-viewer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9999] bg-neutral-900/40"
          onClick={closeViewer}
          role="dialog"
          aria-modal="true"
          aria-label={`Viewing ${target.title}`}
        >
          {/* Framed: inset inside the FLUX shell (below the 60px banner, right of
              the 88px rail) so the user can still see where they are.
              Maximised: the whole viewport. Both are FLUX chrome and apply
              regardless of which 'surface' backend is rendering the content. */}
          <motion.div
            initial={{ scale: 0.99, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.99, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className={`absolute bg-white shadow-2xl flex flex-col overflow-hidden ${
              isMaximised || isPhone
                ? 'inset-0'
                : 'top-[72px] right-3 bottom-3 left-[calc(var(--left-rail-width,88px)+12px)] rounded-xl border border-neutral-300'
            }`}
          >
            {/* ── Toolbar ─────────────────────────────────────────────── */}
            <header className="shrink-0 bg-white border-b border-neutral-200">
              <div className="flex items-center gap-1 px-2 h-12">
                {/* ═══ MOCK-ONLY toolbar — delete this whole block once a real
                    'surface' backend (Apryse WebViewer) is wired in; it brings
                    its own toolbar into the host div below. Also dropped on
                    phone regardless of backend — see the isPhone comment
                    above the component body. ═══ */}
                {backend.id === 'mock' && !isPhone && (
                  <>
                    <ToolbarButton icon={MenuIcon} label="Menu" />
                    <ToolbarButton
                      icon={PanelLeftIcon}
                      label={showLeft ? 'Hide side panel' : 'Show side panel'}
                      active={showLeft}
                      onClick={() => setShowLeft((v) => !v)}
                    />

                    <div className="w-px h-5 bg-neutral-200 mx-1.5" />

                    <div className="flex items-center gap-1">
                      <span className="inline-flex items-center gap-1 h-8 px-2 rounded-md border border-neutral-200 text-xs font-medium text-neutral-700 tabular-nums">
                        {zoom}%
                        <ChevronDownIcon size={12} className="text-neutral-400" />
                      </span>
                      <ToolbarButton icon={ZoomOutIcon} label="Zoom out" onClick={() => stepZoom(-1)} disabled={zoom <= ZOOM_STEPS[0]} />
                      <ToolbarButton icon={ZoomInIcon} label="Zoom in" onClick={() => stepZoom(1)} disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]} />
                    </div>

                    <div className="w-px h-5 bg-neutral-200 mx-1.5" />

                    <ToolbarButton icon={MousePointerIcon} label="Select" active />
                    <ToolbarButton icon={HandIcon} label="Pan" />
                    <ToolbarButton icon={SquareDashedIcon} label="Marquee zoom" />

                    <nav className="flex items-center gap-1 mx-auto" role="tablist" aria-label="Viewer tools">
                      {TOOL_TABS.map((entry) => (
                        <button
                          key={entry}
                          type="button"
                          role="tab"
                          aria-selected={tab === entry}
                          onClick={() => setTab(entry)}
                          className={`relative px-3 h-12 text-sm transition-colors ${
                            tab === entry ? 'text-[#0461BA] font-medium' : 'text-neutral-600 hover:text-neutral-900'
                          }`}
                        >
                          {entry}
                          {tab === entry && <span className="absolute left-2 right-2 bottom-0 h-0.5 rounded-t bg-[#0461BA]" />}
                        </button>
                      ))}
                    </nav>

                    <div className="flex items-center gap-1">
                      <ToolbarButton icon={EyeIcon} label="View mode" active />
                      <ToolbarButton icon={SearchIcon} label="Search document" />
                      <ToolbarButton
                        icon={MessageSquareIcon}
                        label={showRight ? 'Hide comments' : 'Show comments'}
                        active={showRight}
                        onClick={() => setShowRight((v) => !v)}
                      />
                      <ToolbarButton icon={SaveIcon} label="Save" />

                      <div className="w-px h-5 bg-neutral-200 mx-1.5" />
                    </div>
                  </>
                )}
                {/* If a non-mock backend brings its own toolbar into the host
                    surface below, everything above this comment goes — but a
                    spacer div keeping the frame controls right-aligned stays. */}
                {(backend.id !== 'mock' || isPhone) && <div className="flex-1" />}
                {/* ═══ END MOCK-ONLY toolbar ═══ */}

                {/* FLUX frame chrome — real for every backend. Maximise/restore
                    is hidden on phone rather than disabled: the frame is
                    already forced full-bleed there (see isPhone above), so a
                    control with exactly one reachable state is noise. */}
                <div className="flex items-center gap-1">
                  {!isPhone && (
                    <ToolbarButton
                      icon={isMaximised ? Minimize2Icon : Maximize2Icon}
                      label={isMaximised ? 'Restore to frame' : 'Maximise to full page'}
                      onClick={toggleMaximised}
                    />
                  )}
                  <ToolbarButton icon={ExternalLinkIcon} label="Open in new tab" onClick={openInNewTab} />
                  <ToolbarButton icon={XIcon} label="Close viewer" onClick={closeViewer} />
                </div>
              </div>

              {/* Document identity — the framed viewer has no browser tab title
                  to fall back on, so it has to say what you are looking at.
                  FLUX chrome, real for every backend. */}
              <div className="flex items-center gap-2 px-3 pb-2 -mt-1 min-w-0">
                <span className="text-sm font-semibold text-neutral-900 truncate">{target.title}</span>
                <span className="text-xs text-neutral-400 shrink-0">{target.docId}</span>
                {target.revision && (
                  <span className="text-xs text-neutral-400 shrink-0">· Rev {target.revision}</span>
                )}
                {target.project && (
                  <span className="text-xs text-neutral-400 shrink-0 truncate">· {target.project}</span>
                )}
                {backend.id === 'mock' && tab !== 'View' && (
                  <span className="ml-auto text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 shrink-0">
                    {tab} tools not built in this prototype
                  </span>
                )}
              </div>
            </header>

            {/* ── Body ────────────────────────────────────────────────── */}
            {(status === 'initializing' || status === 'loading') && (
              <div className="flex-1 grid place-items-center text-neutral-400">
                <div className="flex flex-col items-center gap-2">
                  <LoaderIcon size={22} className="animate-spin" />
                  <p className="text-xs">{status === 'initializing' ? 'Starting viewer…' : 'Loading document…'}</p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="flex-1 grid place-items-center text-neutral-500">
                <div className="flex flex-col items-center gap-3 max-w-sm text-center px-6">
                  <AlertTriangleIcon size={22} className="text-amber-500" />
                  <p className="text-sm">{error?.message ?? 'Could not load this document.'}</p>
                  <button
                    type="button"
                    onClick={retry}
                    className="px-3 py-1.5 rounded-md bg-[#0461BA] text-white text-sm font-medium hover:bg-[#034a8e]"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {/* ═══ MOCK-ONLY body — the three-pane prototype layout. Delete
                this branch (keep only the `backend.id !== 'mock'` one below)
                once a real 'surface' backend is wired up. ═══ */}
            {status === 'ready' && backend.id === 'mock' && (
              <div className="flex-1 flex min-h-0">
                {/* ── Left: panel switcher + markup list ─────────────────
                    Forced closed on phone regardless of showLeft — with the
                    frame full-bleed there is no room for a 256px aside plus
                    a document. */}
                {showLeft && !isPhone && (
                  <aside className="w-64 shrink-0 border-r border-neutral-200 flex flex-col bg-white">
                    <div className="flex items-center gap-1 px-2 py-2 border-b border-neutral-200">
                      {SIDE_PANELS.map((panel) => (
                        <ToolbarButton
                          key={panel.key}
                          icon={panel.icon}
                          label={panel.label}
                          active={activePanel === panel.key}
                          onClick={() => setActivePanel(panel.key)}
                        />
                      ))}
                    </div>

                    {activePanel === 'markup' ? (
                      <div className="flex-1 overflow-y-auto p-3">
                        <h3 className="text-sm font-semibold text-neutral-900 mb-2">Markup</h3>
                        <div className="flex items-center gap-1 mb-3">
                          <ToolbarButton icon={PlusIcon} label="Add markup layer" />
                          <ToolbarButton icon={CopyIcon} label="Duplicate layer" />
                          <ToolbarButton icon={RefreshCwIcon} label="Refresh" />
                        </div>
                        <p className="text-xs font-medium text-neutral-500 mb-2">Markups ({markups.length})</p>
                        <label className="flex items-center gap-2 text-xs text-neutral-700 mb-2 cursor-pointer">
                          <input type="checkbox" defaultChecked className="accent-[#0461BA]" />
                          Select All
                        </label>
                        <ul className="space-y-2">
                          {markups.map((markup) => (
                            <li
                              key={markup.id}
                              className="rounded-lg border border-[#0461BA]/30 bg-[#F0F6FF] p-2.5 flex gap-2"
                            >
                              <input type="checkbox" defaultChecked className="mt-0.5 accent-[#0461BA]" aria-label={markup.label} />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-neutral-900 leading-snug">{markup.label}</p>
                                <p className="text-[11px] text-neutral-500 mt-0.5">{markup.author}</p>
                                <p className="text-[11px] text-neutral-400 mt-0.5">{markup.createdAt}</p>
                              </div>
                              {markup.isNew && (
                                <span className="text-[10px] font-semibold text-amber-600 shrink-0">New</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="flex-1 grid place-items-center p-6 text-center">
                        <p className="text-xs text-neutral-400">
                          {SIDE_PANELS.find((p) => p.key === activePanel)?.label} panel not built in this prototype
                        </p>
                      </div>
                    )}
                  </aside>
                )}

                {/* ── Centre: the page ─────────────────────────────────── */}
                <div className="flex-1 min-w-0 overflow-auto bg-neutral-200/70 p-6">
                  <div className="mx-auto bg-white shadow-lg" style={{ width: `${zoom}%`, maxWidth: 'none' }}>
                    {target.pageImage ? (
                      <img src={target.pageImage} alt={`${target.docId} page 1`} className="w-full h-auto block" />
                    ) : (
                      <div className="aspect-[1.414/1] grid place-items-center text-neutral-400 text-sm">
                        No preview available
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Right: comments ──────────────────────────────────── */}
                {showRight && !isPhone && (
                  <aside className="w-72 shrink-0 border-l border-neutral-200 flex flex-col bg-white">
                    <div className="p-3 border-b border-neutral-100">
                      <div className="relative">
                        <SearchIcon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                          type="text"
                          aria-label="Search comments"
                          className="w-full h-7 pl-8 pr-2 rounded-md border border-neutral-200 bg-[#F0F4F8] text-xs focus:outline-none focus:ring-2 focus:ring-[#0461BA] focus:bg-white"
                        />
                      </div>
                    </div>
                    <div className="px-3 py-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-neutral-900">Comments ({comments.length})</h3>
                    </div>
                    <div className="px-3 pb-2 flex items-center gap-2 text-xs text-neutral-500">
                      Sort:
                      <span className="inline-flex items-center gap-1 h-7 px-2 rounded-md border border-neutral-200 text-neutral-700">
                        Position
                        <ChevronDownIcon size={12} className="text-neutral-400" />
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto px-3 pb-3">
                      <p className="text-xs text-neutral-500 mb-2">Page 1</p>
                      <ul className="space-y-2">
                        {comments.map((comment) => (
                          <li key={comment.id} className="rounded-lg border border-[#0461BA]/30 bg-[#F0F6FF] p-2.5">
                            <div className="flex items-start gap-2">
                              <span className="w-3.5 h-3.5 mt-0.5 rounded-sm border-2 border-emerald-500 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-neutral-900">{comment.author}</p>
                                <p className="text-[11px] text-neutral-500">{comment.createdAt}</p>
                              </div>
                              <button
                                type="button"
                                aria-label="Collapse comment"
                                className="w-5 h-5 rounded inline-flex items-center justify-center text-neutral-400 hover:bg-neutral-200"
                              >
                                <MinusIcon size={12} />
                              </button>
                            </div>
                            <p className="text-xs text-neutral-700 mt-1.5 leading-snug">{comment.body}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </aside>
                )}
              </div>
            )}
            {/* ═══ END MOCK-ONLY body ═══ */}

            {/* The real integration point: a real 'surface' backend (Apryse
                WebViewer) mounts itself into this element — see
                apryseWebViewerBackend.ts's `open()`. FLUX renders nothing
                else inside the frame; the SDK provides its own toolbar,
                zoom, panels and canvas within this div. */}
            {status === 'ready' && backend.id !== 'mock' && (
              <div ref={hostRef} className="flex-1 min-h-0" />
            )}
          </motion.div>
        </motion.div>
      )
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
