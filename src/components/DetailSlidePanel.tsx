import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, FileIcon, SendIcon, GitBranchIcon, PackageIcon, SearchIcon, FolderIcon, BarChart3Icon, ClockIcon, UserIcon, CalendarIcon, TagIcon, AlertCircleIcon, CheckCircleIcon, InfoIcon } from 'lucide-react';
import { useLocalization } from '../contexts/LocalizationContext';

export type DetailPanelObjectType = 'document' | 'transmittal' | 'review' | 'workflow' | 'package' | 'folder' | 'search' | 'report';

export interface DetailPanelData {
  objectType: DetailPanelObjectType;
  objectId: string;
  // common fields
  title: string;
  project?: string;
  status?: string;
  description?: string;
  // document-specific
  docId?: string;
  revision?: string;
  author?: string;
  dateModified?: string;
  dateCreated?: string;
  fileType?: string;
  fileSize?: string;
  // transmittal-specific
  recipient?: string;
  issueDate?: string;
  returnDate?: string;
  docCount?: number;
  // review-specific
  assignedTo?: string;
  dueDate?: string;
  commentCount?: number;
  assignedBy?: string;
  // workflow-specific
  currentStep?: string;
  totalSteps?: number;
  completedSteps?: number;
  // shared / fav
  sharedBy?: string;
  sharedAt?: string;
  // extra tags
  tags?: string[];
}

interface DetailSlidePanelProps {
  data: DetailPanelData | null;
  onClose: () => void;
}

const typeConfig: Record<DetailPanelObjectType, { icon: React.ElementType; label: string; color: string }> = {
  document: { icon: FileIcon, label: 'Document', color: 'text-[#0461BA] bg-[#E8F1FB]' },
  transmittal: { icon: SendIcon, label: 'Transmittal', color: 'text-violet-700 bg-violet-50' },
  review: { icon: CheckCircleIcon, label: 'Review', color: 'text-emerald-700 bg-emerald-50' },
  workflow: { icon: GitBranchIcon, label: 'Workflow', color: 'text-amber-700 bg-amber-50' },
  package: { icon: PackageIcon, label: 'Package', color: 'text-rose-700 bg-rose-50' },
  folder: { icon: FolderIcon, label: 'Folder', color: 'text-neutral-700 bg-neutral-100' },
  search: { icon: SearchIcon, label: 'Saved Search', color: 'text-cyan-700 bg-cyan-50' },
  report: { icon: BarChart3Icon, label: 'Report', color: 'text-indigo-700 bg-indigo-50' },
};

const statusColors: Record<string, string> = {
  Draft: 'bg-secondary-50 text-secondary-700 border-secondary-200',
  'In Review': 'bg-warning-50 text-warning-700 border-warning-200',
  Approved: 'bg-success-50 text-success-700 border-success-200',
  Superseded: 'bg-plum-50 text-plum-700 border-plum-200',
  Archived: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  Overdue: 'bg-red-50 text-red-700 border-red-200',
  'Due Today': 'bg-amber-50 text-amber-700 border-amber-200',
  'Due Soon': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Pending: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  Issued: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Returned: 'bg-rose-50 text-rose-700 border-rose-200',
};

function translateStatusLabel(t: (key: string, variables?: Record<string, string | number>) => string, status: string) {
  const key = ({
    Draft: 'statuses.draft',
    'In Review': 'statuses.inReview',
    Approved: 'statuses.approved',
    Superseded: 'statuses.superseded',
    Archived: 'statuses.archived',
    Overdue: 'statuses.overdue',
    'Due Today': 'statuses.dueToday',
    'Due Soon': 'statuses.dueSoon',
    Pending: 'statuses.pending',
    Issued: 'statuses.issued',
    Returned: 'statuses.returned',
  } as Record<string, string>)[status];

  return key ? t(key) : status;
}

function Field({ label, value, icon: Icon }: { label: string; value?: string | number | null; icon?: React.ElementType }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-neutral-500 font-medium uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-1.5 text-sm text-neutral-800">
        {Icon && <Icon size={13} className="text-neutral-400 flex-shrink-0" />}
        <span>{value}</span>
      </div>
    </div>
  );
}

function DocumentDetail({ data }: { data: DetailPanelData }) {
  const { t, locale } = useLocalization();
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label={t('detailPanel.documentId')} value={data.docId || data.objectId} icon={FileIcon} />
        <Field label={t('detailPanel.revision')} value={data.revision} />
        <Field label={t('detailPanel.author')} value={data.author} icon={UserIcon} />
        <Field label={t('detailPanel.fileType')} value={data.fileType} />
        <Field label={t('detailPanel.fileSize')} value={data.fileSize} />
        <Field label={t('detailPanel.dateCreated')} value={data.dateCreated ? new Date(data.dateCreated).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' }) : undefined} icon={CalendarIcon} />
        <Field label={t('detailPanel.lastModified')} value={data.dateModified ? new Date(data.dateModified).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' }) : undefined} icon={ClockIcon} />
      </div>
      {data.description && (
        <div>
          <span className="text-xs text-neutral-500 font-medium uppercase tracking-wide">{t('detailPanel.description')}</span>
          <p className="text-sm text-neutral-700 mt-1 leading-relaxed">{data.description}</p>
        </div>
      )}
      {data.tags && data.tags.length > 0 && (
        <div>
          <span className="text-xs text-neutral-500 font-medium uppercase tracking-wide flex items-center gap-1"><TagIcon size={11} /> {t('detailPanel.tags')}</span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {data.tags.map(t => (
              <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">{t}</span>
            ))}
          </div>
        </div>
      )}
      <div className="border-t border-neutral-100 pt-4 flex gap-2">
        <button className="flex-1 text-sm font-medium py-2 px-3 rounded-md bg-[#0461BA] text-white hover:bg-[#035299] transition-colors">{t('detailPanel.openDocument')}</button>
        <button className="text-sm font-medium py-2 px-3 rounded-md border border-neutral-200 text-neutral-700 hover:bg-[#F0F4F8] transition-colors">{t('detailPanel.download')}</button>
      </div>
    </div>
  );
}

function TransmittalDetail({ data }: { data: DetailPanelData }) {
  const { t, locale } = useLocalization();
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label={t('detailPanel.transmittalRef')} value={data.objectId.toUpperCase()} icon={SendIcon} />
        <Field label={t('detailPanel.recipient')} value={data.recipient} icon={UserIcon} />
        <Field label={t('detailPanel.issueDate')} value={data.issueDate ? new Date(data.issueDate).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' }) : undefined} icon={CalendarIcon} />
        <Field label={t('detailPanel.returnDate')} value={data.returnDate ? new Date(data.returnDate).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' }) : undefined} icon={ClockIcon} />
        <Field label={t('detailPanel.documents')} value={data.docCount} />
        <Field label={t('detailPanel.project')} value={data.project} />
      </div>
      {data.description && (
        <div>
          <span className="text-xs text-neutral-500 font-medium uppercase tracking-wide">{t('detailPanel.notes')}</span>
          <p className="text-sm text-neutral-700 mt-1 leading-relaxed">{data.description}</p>
        </div>
      )}
      <div className="border-t border-neutral-100 pt-4 flex gap-2">
        <button className="flex-1 text-sm font-medium py-2 px-3 rounded-md bg-[#0461BA] text-white hover:bg-[#035299] transition-colors">{t('detailPanel.openTransmittal')}</button>
        <button className="text-sm font-medium py-2 px-3 rounded-md border border-neutral-200 text-neutral-700 hover:bg-[#F0F4F8] transition-colors">{t('detailPanel.downloadPdf')}</button>
      </div>
    </div>
  );
}

function ReviewDetail({ data }: { data: DetailPanelData }) {
  const { t, locale } = useLocalization();
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label={t('detailPanel.reviewRef')} value={data.objectId.toUpperCase()} icon={CheckCircleIcon} />
        <Field label={t('detailPanel.assignedTo')} value={data.assignedTo} icon={UserIcon} />
        <Field label={t('detailPanel.assignedBy')} value={data.assignedBy} icon={UserIcon} />
        <Field label={t('detailPanel.dueDate')} value={data.dueDate ? new Date(data.dueDate).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' }) : undefined} icon={CalendarIcon} />
        <Field label={t('detailPanel.comments')} value={data.commentCount} />
        <Field label={t('detailPanel.project')} value={data.project} />
      </div>
      {data.description && (
        <div>
          <span className="text-xs text-neutral-500 font-medium uppercase tracking-wide">{t('detailPanel.details')}</span>
          <p className="text-sm text-neutral-700 mt-1 leading-relaxed">{data.description}</p>
        </div>
      )}
      <div className="border-t border-neutral-100 pt-4 flex gap-2">
        <button className="flex-1 text-sm font-medium py-2 px-3 rounded-md bg-[#0461BA] text-white hover:bg-[#035299] transition-colors">{t('detailPanel.openReview')}</button>
        <button className="text-sm font-medium py-2 px-3 rounded-md border border-neutral-200 text-neutral-700 hover:bg-[#F0F4F8] transition-colors">{t('detailPanel.addComment')}</button>
      </div>
    </div>
  );
}

function WorkflowDetail({ data }: { data: DetailPanelData }) {
  const { t } = useLocalization();
  const progress = data.totalSteps && data.completedSteps != null
    ? Math.round((data.completedSteps / data.totalSteps) * 100)
    : null;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label={t('detailPanel.workflowRef')} value={data.objectId.toUpperCase()} icon={GitBranchIcon} />
        <Field label={t('detailPanel.currentStep')} value={data.currentStep} />
        <Field label={t('detailPanel.progress')} value={progress != null ? t('detailPanel.stepsProgress', { completed: data.completedSteps ?? 0, total: data.totalSteps ?? 0 }) : undefined} />
        <Field label={t('detailPanel.project')} value={data.project} />
      </div>
      {progress != null && (
        <div>
          <div className="flex justify-between text-xs text-neutral-500 mb-1">
            <span>{t('detailPanel.progress')}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
              className="h-full bg-[#0461BA] rounded-full"
            />
          </div>
        </div>
      )}
      {data.description && (
        <div>
          <span className="text-xs text-neutral-500 font-medium uppercase tracking-wide">{t('detailPanel.description')}</span>
          <p className="text-sm text-neutral-700 mt-1 leading-relaxed">{data.description}</p>
        </div>
      )}
      <div className="border-t border-neutral-100 pt-4 flex gap-2">
        <button className="flex-1 text-sm font-medium py-2 px-3 rounded-md bg-[#0461BA] text-white hover:bg-[#035299] transition-colors">{t('detailPanel.openWorkflow')}</button>
      </div>
    </div>
  );
}

function GenericDetail({ data }: { data: DetailPanelData }) {
  const { t, locale } = useLocalization();
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label={t('detailPanel.id')} value={data.objectId} />
        <Field label={t('detailPanel.project')} value={data.project} />
        {data.sharedBy && <Field label={t('detailPanel.sharedBy')} value={data.sharedBy} icon={UserIcon} />}
        {data.sharedAt && <Field label={t('detailPanel.shared')} value={new Date(data.sharedAt).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })} icon={ClockIcon} />}
      </div>
      {data.description && (
        <div>
          <span className="text-xs text-neutral-500 font-medium uppercase tracking-wide">{t('detailPanel.description')}</span>
          <p className="text-sm text-neutral-700 mt-1 leading-relaxed">{data.description}</p>
        </div>
      )}
      <div className="border-t border-neutral-100 pt-4">
        <button className="w-full text-sm font-medium py-2 px-3 rounded-md bg-[#0461BA] text-white hover:bg-[#035299] transition-colors">{t('detailPanel.open')}</button>
      </div>
    </div>
  );
}

export function DetailSlidePanel({ data, onClose }: DetailSlidePanelProps) {
  const { t } = useLocalization();
  const isOpen = data !== null;
  const typeLabel = data ? t(`detailPanel.types.${data.objectType}`) : '';

  return (
    <AnimatePresence>
      {isOpen && data && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.32, 0, 0.16, 1] }}
            className="fixed top-[45px] right-0 bottom-0 w-1/2 min-w-[380px] max-w-[640px] bg-white border-l border-neutral-200 shadow-2xl z-50 flex flex-col overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label={t('detailPanel.detailsAria', { title: data.title })}
          >
            {/* Header */}
            <div className="flex items-start gap-3 px-6 py-4 border-b border-neutral-100 bg-[#F0F4F8]">
              {(() => {
                const cfg = typeConfig[data.objectType];
                const Icon = cfg.icon;
                return (
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                    <Icon size={17} />
                  </div>
                );
              })()}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    {typeLabel}
                  </span>
                  {data.status && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${statusColors[data.status] ?? 'bg-neutral-100 text-neutral-600 border-neutral-200'}`}>
                      {translateStatusLabel(t, data.status)}
                    </span>
                  )}
                </div>
                <h2 className="text-base font-semibold text-neutral-900 leading-snug line-clamp-2">
                  {data.title}
                </h2>
                {data.project && (
                  <p className="text-xs text-neutral-500 mt-0.5">{data.project}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition-colors"
                aria-label={t('detailPanel.closePanel')}
              >
                <XIcon size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {data.objectType === 'document' && <DocumentDetail data={data} />}
              {data.objectType === 'transmittal' && <TransmittalDetail data={data} />}
              {data.objectType === 'review' && <ReviewDetail data={data} />}
              {data.objectType === 'workflow' && <WorkflowDetail data={data} />}
              {(data.objectType === 'package' || data.objectType === 'folder' || data.objectType === 'search' || data.objectType === 'report') && <GenericDetail data={data} />}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

