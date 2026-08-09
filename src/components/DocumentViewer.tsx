// DocumentViewer — the Apryse/PDFTron viewer experience framed INSIDE FLUX
// rather than launched into a new browser tab.
//
// Today FusionLive opens `OpenPdfTronViewerServlet?...&objectType=DOCUMENT` in a
// new tab, which drops the user out of the app: they lose the folder tree, the
// grid selection and the properties panel. This renders the same chrome as a
// frame over the FLUX shell, with two escapes in the header the user asked for:
// **maximise to full page** and **open in a new tab** (the legacy behaviour).
//
// [MOCK] Everything below the toolbar is mocked — the page is the document's
// raster thumbnail, and the markup/comment panels read from mockMarkups.
// [TODO-ENG] Real implementation is either the existing servlet in an <iframe>
// or the Apryse WebViewer SDK mounted directly. The SDK is what would let markup
// state talk to the rest of the SPA; the iframe is the cheap route. See
// src/types/viewer.ts.
import { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import { useViewer } from '../contexts/ViewerContext';
import { buildViewerMarkups, buildViewerComments } from '../data/mockMarkups';

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
  const [tab, setTab] = useState<ToolTab>('View');
  const [zoom, setZoom] = useState(139);
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);
  const [activePanel, setActivePanel] = useState<string>('markup');

  const markups = useMemo(() => (target ? buildViewerMarkups(target.docId) : []), [target]);
  const comments = useMemo(() => (target ? buildViewerComments(target.docId) : []), [target]);

  // Reset per document so reopening never inherits the last document's zoom.
  // Keyed on the id, not the object: `target` is a fresh literal on every open,
  // so depending on it would reset mid-session on unrelated re-renders.
  const targetDocId = target?.docId;
  useEffect(() => {
    if (!targetDocId) return;
    setTab('View');
    setZoom(139);
    setActivePanel('markup');
  }, [targetDocId]);

  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeViewer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [target, closeViewer]);

  const stepZoom = (direction: 1 | -1) => {
    const idx = ZOOM_STEPS.findIndex((z) => z >= zoom);
    const nextIdx = Math.min(Math.max((idx === -1 ? ZOOM_STEPS.length - 1 : idx) + direction, 0), ZOOM_STEPS.length - 1);
    setZoom(ZOOM_STEPS[nextIdx]);
  };

  /** The legacy behaviour, kept as an explicit escape hatch.
   *  [API] G07 content URL — the prototype has no servlet to point at. */
  const openInNewTab = () => {
    window.open(`/documents?doc=${encodeURIComponent(target?.docId ?? '')}`, '_blank', 'noopener');
  };

  return createPortal(
    <AnimatePresence>
      {target && (
        <motion.div
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
              Maximised: the whole viewport. */}
          <motion.div
            initial={{ scale: 0.99, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.99, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className={`absolute bg-white shadow-2xl flex flex-col overflow-hidden ${
              isMaximised
                ? 'inset-0'
                : 'top-[72px] right-3 bottom-3 left-[calc(var(--left-rail-width,88px)+12px)] rounded-xl border border-neutral-300'
            }`}
          >
            {/* ── Toolbar ─────────────────────────────────────────────── */}
            <header className="shrink-0 bg-white border-b border-neutral-200">
              <div className="flex items-center gap-1 px-2 h-12">
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

                {/* ── Tool tabs ── */}
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

                  {/* The two the user asked for, plus close. */}
                  <ToolbarButton
                    icon={isMaximised ? Minimize2Icon : Maximize2Icon}
                    label={isMaximised ? 'Restore to frame' : 'Maximise to full page'}
                    onClick={toggleMaximised}
                  />
                  <ToolbarButton icon={ExternalLinkIcon} label="Open in new tab" onClick={openInNewTab} />
                  <ToolbarButton icon={XIcon} label="Close viewer" onClick={closeViewer} />
                </div>
              </div>

              {/* Document identity — the framed viewer has no browser tab title
                  to fall back on, so it has to say what you are looking at. */}
              <div className="flex items-center gap-2 px-3 pb-2 -mt-1 min-w-0">
                <span className="text-sm font-semibold text-neutral-900 truncate">{target.title}</span>
                <span className="text-xs text-neutral-400 shrink-0">{target.docId}</span>
                {target.revision && (
                  <span className="text-xs text-neutral-400 shrink-0">· Rev {target.revision}</span>
                )}
                {target.project && (
                  <span className="text-xs text-neutral-400 shrink-0 truncate">· {target.project}</span>
                )}
                {tab !== 'View' && (
                  <span className="ml-auto text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 shrink-0">
                    {tab} tools not built in this prototype
                  </span>
                )}
              </div>
            </header>

            <div className="flex-1 flex min-h-0">
              {/* ── Left: panel switcher + markup list ───────────────── */}
              {showLeft && (
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
              {showRight && (
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
