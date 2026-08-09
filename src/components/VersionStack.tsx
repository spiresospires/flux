// VersionStack — the "Version Stack" tab of the properties side panel. A compact
// document grid of every revision of the document, newest first.
//
// The top of the stack can be a PLACEHOLDER with real revisions underneath it:
// when a review closes with comments, FusionLive pushes a fresh placeholder on
// top so the supplier has somewhere to upload the revised deliverable
// (MDR_AND_PROGRESS.md §4). So "this document has no content" and "this document
// has history" are both true at once — the empty top row must not read as an
// empty stack.
//
// Laid out for a 360px panel: a three-column grid header with a secondary detail
// line per row, rather than a wide table that would need horizontal scrolling.
import { DownloadIcon, EyeIcon } from 'lucide-react';
import { statusColors } from './documentStatusColors';
import { PlaceholderFileIcon, getFileTypeIcon } from './DocumentCard';
import { useLocalization } from '../contexts/LocalizationContext';
import { useViewer } from '../contexts/ViewerContext';
import type { VersionStackEntry } from '../types/journey';

function formatDate(iso: string, locale: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

interface VersionStackProps {
  versions: VersionStackEntry[];
  /** Document identity + page raster, so a revision can be opened in the framed
   *  viewer. Absent when the caller has no page to show. */
  viewerBase?: { docId: string; title: string; project?: string; pageImage?: string };
}

export function VersionStack({ versions, viewerBase }: VersionStackProps) {
  const { t, locale } = useLocalization();
  const { openViewer } = useViewer();

  if (versions.length === 0) {
    return <p className="text-sm text-neutral-500">{t('versionStack.empty')}</p>;
  }

  return (
    <section className="w-full min-w-0" aria-label={t('versionStack.ariaLabel')}>
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t('versionStack.title')}</h3>
        <span className="text-xs text-neutral-400">
          {versions.length === 1 ? t('versionStack.countOne') : t('versionStack.count', { count: versions.length })}
        </span>
      </div>

      <div className="rounded-lg border border-neutral-200 overflow-hidden">
        <div className="grid grid-cols-[2.75rem_1fr_auto] gap-2 px-3 py-1.5 bg-[#F0F4F8] border-b border-neutral-200 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
          <span>{t('versionStack.rev')}</span>
          <span>{t('versionStack.status')}</span>
          <span>{t('versionStack.date')}</span>
        </div>

        <ol>
          {versions.map((version) => {
            const isPlaceholderVersion = version.contentState === 'placeholder';
            return (
              <li
                key={version.id}
                className={`group border-b border-neutral-100 last:border-b-0 px-3 py-2 transition-colors ${
                  version.isCurrent ? 'bg-[#F0F6FF]' : 'hover:bg-neutral-50'
                }`}
              >
                <div className="grid grid-cols-[2.75rem_1fr_auto] gap-2 items-center min-w-0">
                  <span className={`text-xs font-semibold tabular-nums ${version.isCurrent ? 'text-[#0461BA]' : 'text-neutral-600'}`}>
                    {version.revision}
                  </span>
                  <span className="min-w-0">
                    <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-md border whitespace-nowrap ${statusColors[version.status]}`}>
                      {version.status}
                    </span>
                  </span>
                  <span className="text-[11px] text-neutral-500 whitespace-nowrap">{formatDate(version.date, locale)}</span>
                </div>

                <div className="mt-1 flex items-center gap-1.5 min-w-0 text-[11px] text-neutral-500">
                  {isPlaceholderVersion
                    ? <PlaceholderFileIcon size={12} className="shrink-0 text-neutral-400" />
                    : getFileTypeIcon(version.fileType)({ size: 12, className: 'shrink-0' })}
                  <span className="truncate">
                    {[
                      version.author,
                      // No file behind a placeholder version — say so rather than
                      // showing an invented type and size.
                      isPlaceholderVersion ? t('versionStack.noContent') : `${version.fileType} · ${version.fileSize}`
                    ].filter(Boolean).join(' · ')}
                  </span>

                  <span className="ml-auto flex items-center gap-0.5 shrink-0">
                    {version.isCurrent && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#0461BA] mr-1">{t('versionStack.current')}</span>
                    )}
                    {/* Content actions are meaningless on a placeholder version —
                        same rule the grid and the action menu apply. */}
                    <button
                      type="button"
                      disabled={isPlaceholderVersion || !viewerBase}
                      title={t('versionStack.viewRevision', { revision: version.revision })}
                      aria-label={t('versionStack.viewRevision', { revision: version.revision })}
                      onClick={(e) => {
                        e.preventDefault();
                        // Opens the same framed viewer, scoped to this revision.
                        if (viewerBase) openViewer({ ...viewerBase, revision: version.revision, fileType: version.fileType });
                      }}
                      className="w-6 h-6 rounded-md inline-flex items-center justify-center text-neutral-500 hover:text-[#0461BA] hover:bg-[#E8F1FB] transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-neutral-500 disabled:cursor-not-allowed"
                    >
                      <EyeIcon size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={isPlaceholderVersion}
                      title={t('versionStack.downloadRevision', { revision: version.revision })}
                      aria-label={t('versionStack.downloadRevision', { revision: version.revision })}
                      onClick={(e) => { e.preventDefault(); /* [API] G07:GET .../content (download) [AUTH] [PHASE-1] */ }}
                      className="w-6 h-6 rounded-md inline-flex items-center justify-center text-neutral-500 hover:text-[#0461BA] hover:bg-[#E8F1FB] transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-neutral-500 disabled:cursor-not-allowed"
                    >
                      <DownloadIcon size={13} />
                    </button>
                  </span>
                </div>

                {version.note && (
                  <p className={`mt-1 text-[11px] leading-snug ${isPlaceholderVersion ? 'text-neutral-500' : 'text-rose-600'}`}>
                    {version.note}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
