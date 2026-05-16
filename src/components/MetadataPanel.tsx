import React from 'react';
import { Document } from '../types/document';
import { useLocalization } from '../contexts/LocalizationContext';
interface MetadataPanelProps {
  document: Document;
}
export function MetadataPanel({ document }: MetadataPanelProps) {
  const { t } = useLocalization();
  const metadata = [
  {
    label: t('metadata.documentId'),
    value: document.id
  },
  {
    label: t('metadata.titleLabel'),
    value: document.title
  },
  {
    label: t('metadata.revisionNumber'),
    value: document.revisionNumber
  },
  {
    label: t('metadata.status'),
    value: document.status
  },
  {
    label: t('metadata.documentType'),
    value: document.documentType
  },
  {
    label: t('metadata.author'),
    value: document.author
  },
  {
    label: t('metadata.dateCreated'),
    value: document.dateCreated
  },
  {
    label: t('metadata.dateModified'),
    value: document.dateModified
  },
  {
    label: t('metadata.project'),
    value: document.project
  },
  {
    label: t('metadata.asset'),
    value: document.asset || t('metadata.notAvailable')
  },
  {
    label: t('metadata.fileType'),
    value: document.fileType
  },
  {
    label: t('metadata.fileSize'),
    value: document.fileSize
  }];

  return (
    <div className="border border-neutral-200 bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="border-b border-neutral-200 px-4 py-2.5 bg-[#F0F4F8]">
        <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">
          {t('metadata.title')}
        </h2>
      </div>
      <div className="p-4">
        <div className="space-y-2.5">
          {metadata.map(({ label, value }) =>
          <div
            key={label}
            className="grid grid-cols-[120px_1fr] gap-4 text-sm items-baseline">
            
              <span className="text-neutral-500 font-medium">{label}</span>
              <span className="text-neutral-900 font-medium">{value}</span>
            </div>
          )}
        </div>

        <div className="mt-6 pt-5 border-t border-neutral-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
            {t('metadata.tags')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {document.tags.map((tag) =>
            <span
              key={tag}
              className="text-xs font-medium bg-neutral-100 px-2.5 py-1 rounded-full border border-neutral-200 text-neutral-600">
              
                {tag}
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-neutral-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
            {t('metadata.description')}
          </h3>
          <p className="text-sm text-neutral-700 leading-relaxed">
            {document.description}
          </p>
        </div>
      </div>
    </div>);

}
