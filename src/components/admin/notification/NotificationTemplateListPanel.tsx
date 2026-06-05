import React from 'react';
import { CopyIcon, EllipsisIcon, FilePlusIcon, FolderArchiveIcon, Trash2Icon } from 'lucide-react';
import type { NotificationTemplate } from './types';
import { useLocalization } from '../../../contexts/LocalizationContext';

interface NotificationTemplateListPanelProps {
  templates: NotificationTemplate[];
  selectedTemplateId: string;
  onSelectTemplate: (id: string) => void;
  onNewTemplate: () => void;
  onDuplicateTemplate: () => void;
  onArchiveTemplate: () => void;
  onDeleteTemplate: () => void;
}

function StatusBadge({ status }: { status: NotificationTemplate['status'] }) {
  const { t } = useLocalization();
  const className =
    status === 'Active'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'Draft'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-neutral-100 text-neutral-600';

  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${className}`}>
      {t(`admin.notifications.status.${status === 'Active' ? 'active' : status === 'Draft' ? 'draft' : 'archived'}`)}
    </span>
  );
}

export function NotificationTemplateListPanel({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onNewTemplate,
  onDuplicateTemplate,
  onArchiveTemplate,
  onDeleteTemplate,
}: NotificationTemplateListPanelProps) {
  const { t } = useLocalization();

  return (
    <aside className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-neutral-900">{t('admin.notifications.list.title')}</h2>
        <p className="mt-1 text-xs text-neutral-600">{t('admin.notifications.list.description')}</p>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <button type="button" onClick={onNewTemplate} className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
          <FilePlusIcon size={12} />
          {t('admin.notifications.actions.newTemplate')}
        </button>
        <button type="button" onClick={onDuplicateTemplate} className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
          <CopyIcon size={12} />
          {t('admin.notifications.actions.duplicate')}
        </button>
        <button type="button" onClick={onArchiveTemplate} className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
          <FolderArchiveIcon size={12} />
          {t('admin.notifications.actions.archive')}
        </button>
        <button type="button" onClick={onDeleteTemplate} className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50">
          <Trash2Icon size={12} />
          {t('admin.notifications.actions.delete')}
        </button>
      </div>

      <div className="mb-2 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-xs text-neutral-500">
        {t('admin.notifications.list.futureSearchGrouping')}
      </div>

      <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
        {templates.map((template) => {
          const active = template.id === selectedTemplateId;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelectTemplate(template.id)}
              className={`w-full rounded-lg border p-2.5 text-left transition-colors ${
                active
                  ? 'border-[#8FBCEB] bg-[#F2F8FF]'
                  : 'border-neutral-200 bg-white hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-900">{template.name}</p>
                  <p className="mt-1 text-[11px] text-neutral-500">{template.lastModified}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <StatusBadge status={template.status} />
                  <span className="rounded p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600" aria-hidden="true">
                    <EllipsisIcon size={14} />
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
