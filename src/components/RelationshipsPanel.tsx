import React from 'react';
import { Link } from 'react-router-dom';
import { DocumentRelationship } from '../types/document';
import { useLocalization } from '../contexts/LocalizationContext';
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  LinkIcon,
  FolderIcon } from
'lucide-react';
interface RelationshipsPanelProps {
  relationships: DocumentRelationship[];
}
export function RelationshipsPanel({ relationships }: RelationshipsPanelProps) {
  const { t } = useLocalization();
  const getIcon = (type: string) => {
    switch (type) {
      case 'parent':
        return <ArrowLeftIcon size={14} className="text-neutral-400" />;
      case 'child':
        return <ArrowRightIcon size={14} className="text-neutral-400" />;
      case 'reference':
        return <LinkIcon size={14} className="text-neutral-400" />;
      case 'referenced-by':
        return <LinkIcon size={14} className="text-neutral-400" />;
      case 'grouped-with':
        return <FolderIcon size={14} className="text-neutral-400" />;
      default:
        return <LinkIcon size={14} className="text-neutral-400" />;
    }
  };
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'parent':
        return t('relationships.previousRevision');
      case 'child':
        return t('relationships.nextRevision');
      case 'reference':
        return t('relationships.references');
      case 'referenced-by':
        return t('relationships.referencedBy');
      case 'grouped-with':
        return t('relationships.relatedDocuments');
      default:
        return type;
    }
  };
  const groupedRelationships = relationships.reduce(
    (acc, rel) => {
      if (!acc[rel.type]) acc[rel.type] = [];
      acc[rel.type].push(rel);
      return acc;
    },
    {} as Record<string, DocumentRelationship[]>
  );
  return (
    <div className="border border-neutral-200 bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="border-b border-neutral-200 px-4 py-2.5 bg-[#F0F4F8]">
        <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">
          {t('relationships.title')}
        </h2>
      </div>
      <div className="p-4">
        {relationships.length === 0 ?
        <p className="text-sm text-neutral-500 italic">
            {t('relationships.none')}
          </p> :

        <div className="space-y-4">
            {Object.entries(groupedRelationships).map(([type, rels]) =>
          <div key={type}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-2">
                  {getIcon(type)}
                  {getTypeLabel(type)}
                </h3>
                <div className="space-y-2">
                  {rels.map((rel, idx) =>
              <Link
                key={idx}
                to={`/document/${rel.documentId}`}
                className="block p-3 border border-neutral-100 bg-neutral-25 hover:bg-[#F0F4F8] hover:border-neutral-200 rounded-lg transition-all group">
                
                      <div className="font-medium text-sm text-secondary-600 group-hover:text-secondary-700 mb-0.5">
                        {rel.documentId}
                      </div>
                      <div className="text-xs text-neutral-500 line-clamp-1">
                        {rel.label}
                      </div>
                    </Link>
              )}
                </div>
              </div>
          )}
          </div>
        }
      </div>
    </div>);

}
