import React from 'react';
import { useLocalization } from '../../contexts/LocalizationContext';
import type { CommunicationFormState, CommunicationValidationErrors } from './types';
import { RecipientChipInput } from './RecipientChipInput';

interface CommunicationCommonFieldsProps {
  form: CommunicationFormState;
  errors: CommunicationValidationErrors;
  recipientSuggestions: string[];
  onChange: <K extends keyof CommunicationFormState>(key: K, value: CommunicationFormState[K]) => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-rose-700">{message}</p>;
}

export function CommunicationCommonFields({ form, errors, recipientSuggestions, onChange }: CommunicationCommonFieldsProps) {
  const { t } = useLocalization();

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <RecipientChipInput
          label={t('communication.toLabel')}
          values={form.to}
          placeholder={t('communication.toPlaceholder')}
          error={errors.to}
          suggestions={recipientSuggestions}
          onChange={(next) => onChange('to', next)}
        />

        <RecipientChipInput
          label={t('communication.ccLabel')}
          values={form.cc}
          placeholder={t('communication.ccPlaceholder')}
          suggestions={recipientSuggestions}
          onChange={(next) => onChange('cc', next)}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="text-xs font-medium text-neutral-700">
          {t('communication.subjectLabel')}
          <input
            type="text"
            value={form.subject}
            onChange={(e) => onChange('subject', e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-800 focus:border-[#0461BA] focus:outline-none focus:ring-2 focus:ring-[#0461BA]/20"
          />
          <FieldError message={errors.subject} />
        </label>

        <label className="text-xs font-medium text-neutral-700">
          {t('communication.priorityLabel')}
          <select
            value={form.priority}
            onChange={(e) => onChange('priority', e.target.value as CommunicationFormState['priority'])}
            className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-800 focus:border-[#0461BA] focus:outline-none focus:ring-2 focus:ring-[#0461BA]/20"
          >
            <option>{t('communication.priority.low')}</option>
            <option>{t('communication.priority.normal')}</option>
            <option>{t('communication.priority.high')}</option>
            <option>{t('communication.priority.urgent')}</option>
          </select>
        </label>
      </div>

      <label className="text-xs font-medium text-neutral-700">
        {t('communication.bodyLabel')}
        <textarea
          value={form.body}
          onChange={(e) => onChange('body', e.target.value)}
          rows={6}
          className="mt-1 w-full resize-y rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-800 focus:border-[#0461BA] focus:outline-none focus:ring-2 focus:ring-[#0461BA]/20"
        />
        <FieldError message={errors.body} />
      </label>

      <div>
        <label className="text-xs font-medium text-neutral-700">{t('communication.attachmentsLabel')}</label>
        <div className="mt-1 rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-3 py-2">
          <input
            type="file"
            multiple
            onChange={(e) => {
              const files = e.target.files ? Array.from(e.target.files) : [];
              onChange('attachments', [...form.attachments, ...files]);
              e.currentTarget.value = '';
            }}
            className="text-xs text-neutral-700"
            aria-label={t('communication.addAttachmentsAria')}
          />
        </div>
        {form.attachments.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-neutral-700">
            {form.attachments.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center justify-between rounded border border-neutral-200 px-2 py-1">
                <span className="truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = form.attachments.filter((_, i) => i !== index);
                    onChange('attachments', next);
                  }}
                  className="ml-2 text-rose-700 hover:underline"
                >
                  {t('communication.remove')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
