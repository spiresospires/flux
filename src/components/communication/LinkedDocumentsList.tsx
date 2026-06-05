import React from 'react';
import { XIcon } from 'lucide-react';
import { useLocalization } from '../../contexts/LocalizationContext';
import type { LinkedDocumentItem } from './types';

interface LinkedDocumentsListProps {
  documents: LinkedDocumentItem[];
  onRemove: (id: string) => void;
}

function fallback(value?: string) {
  return value && value.trim().length > 0 ? value : '';
}

export function LinkedDocumentsList({ documents, onRemove }: LinkedDocumentsListProps) {
  const { t } = useLocalization();

  const fallbackValue = (value?: string) => {
    const resolved = fallback(value);
    return resolved.length > 0 ? resolved : t('communication.notAvailable');
  };

  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900">{t('communication.linkedDocumentsTitle')}</h3>
        <span className="text-xs text-neutral-500">{t('communication.linkedCount', { count: documents.length })}</span>
      </div>

      {documents.length === 0 ? (
        <div className="mt-2 rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-3 text-sm text-neutral-600">
          {t('communication.noLinkedDocuments')}
        </div>
      ) : (
        <div className="mt-2 overflow-hidden rounded-lg border border-neutral-200">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-neutral-600">{t('communication.reference')}</th>
                <th className="px-3 py-2 text-left font-medium text-neutral-600">{t('communication.title')}</th>
                <th className="px-3 py-2 text-left font-medium text-neutral-600">{t('communication.revision')}</th>
                <th className="px-3 py-2 text-left font-medium text-neutral-600">{t('communication.status')}</th>
                <th className="px-3 py-2 text-left font-medium text-neutral-600">{t('communication.typeLabel')}</th>
                <th className="px-3 py-2 text-right font-medium text-neutral-600">{t('communication.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-3 py-2 text-neutral-800">{fallbackValue(doc.reference)}</td>
                  <td className="px-3 py-2 text-neutral-800">{fallbackValue(doc.title)}</td>
                  <td className="px-3 py-2 text-neutral-700">{fallbackValue(doc.revision)}</td>
                  <td className="px-3 py-2 text-neutral-700">{fallbackValue(doc.status)}</td>
                  <td className="px-3 py-2 text-neutral-700">{fallbackValue(doc.type)}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => onRemove(doc.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                      aria-label={t('communication.removeLinkedDocumentAria', { reference: doc.reference || doc.id })}
                    >
                      <XIcon size={12} />
                      {t('communication.remove')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
