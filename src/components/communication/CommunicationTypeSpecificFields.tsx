import React from 'react';
import { useLocalization } from '../../contexts/LocalizationContext';
import type { CommunicationFormState, CommunicationType, CommunicationValidationErrors } from './types';

interface CommunicationTypeSpecificFieldsProps {
  messageType: CommunicationType;
  form: CommunicationFormState;
  errors: CommunicationValidationErrors;
  onChange: <K extends keyof CommunicationFormState>(key: K, value: CommunicationFormState[K]) => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-rose-700">{message}</p>;
}

export function CommunicationTypeSpecificFields({ messageType, form, errors, onChange }: CommunicationTypeSpecificFieldsProps) {
  const { t } = useLocalization();

  if (messageType === 'general') {
    return null;
  }

  if (messageType === 'rfi') {
    return (
      <section className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        <h3 className="text-sm font-semibold text-neutral-900">{t('communication.rfi.detailsTitle')}</h3>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-xs font-medium text-neutral-700">
            {t('communication.requiredResponseDateLabel')}
            <input
              type="date"
              value={form.requiredResponseDate}
              onChange={(e) => onChange('requiredResponseDate', e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-800"
            />
            <FieldError message={errors.requiredResponseDate} />
          </label>

          <label className="text-xs font-medium text-neutral-700">
            {t('communication.optionalCategoryLabel')}
            <input
              type="text"
              value={form.rfiCategory}
              onChange={(e) => onChange('rfiCategory', e.target.value)}
              placeholder={t('communication.optionalPlaceholder')}
              className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-800"
            />
          </label>
        </div>

        <label className="text-xs font-medium text-neutral-700">
          {t('communication.rfi.informationRequestedLabel')}
          <textarea
            value={form.informationRequested}
            onChange={(e) => onChange('informationRequested', e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-800"
          />
          <FieldError message={errors.informationRequested} />
        </label>

        <label className="inline-flex items-center gap-2 text-xs font-medium text-neutral-700">
          <input
            type="checkbox"
            checked={form.responseRequired}
            onChange={(e) => onChange('responseRequired', e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-[#0461BA] focus:ring-[#0461BA]"
          />
          {t('communication.rfi.responseRequiredLabel')}
        </label>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
      <h3 className="text-sm font-semibold text-neutral-900">{t('communication.tq.detailsTitle')}</h3>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="text-xs font-medium text-neutral-700">
          {t('communication.requiredResponseDateLabel')}
          <input
            type="date"
            value={form.requiredResponseDate}
            onChange={(e) => onChange('requiredResponseDate', e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-800"
          />
          <FieldError message={errors.requiredResponseDate} />
        </label>

        <label className="text-xs font-medium text-neutral-700">
          {t('communication.tq.disciplineLabel')}
          <select
            value={form.discipline}
            onChange={(e) => onChange('discipline', e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-800"
          >
            <option value="">{t('communication.tq.selectDiscipline')}</option>
            <option value="Civil">{t('communication.tq.disciplines.civil')}</option>
            <option value="Structural">{t('communication.tq.disciplines.structural')}</option>
            <option value="Mechanical">{t('communication.tq.disciplines.mechanical')}</option>
            <option value="Electrical">{t('communication.tq.disciplines.electrical')}</option>
            <option value="Process">{t('communication.tq.disciplines.process')}</option>
          </select>
          <FieldError message={errors.discipline} />
        </label>
      </div>

      <label className="text-xs font-medium text-neutral-700">
        {t('communication.tq.technicalQueryDetailsLabel')}
        <textarea
          value={form.technicalQueryDetails}
          onChange={(e) => onChange('technicalQueryDetails', e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-800"
        />
        <FieldError message={errors.technicalQueryDetails} />
      </label>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="text-xs font-medium text-neutral-700">
          {t('communication.tq.relatedDocumentReferenceLabel')}
          <input
            type="text"
            value={form.relatedDocumentReference}
            onChange={(e) => onChange('relatedDocumentReference', e.target.value)}
            placeholder={t('communication.optionalPlaceholder')}
            className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-800"
          />
        </label>

        <label className="text-xs font-medium text-neutral-700">
          {t('communication.tq.optionalTechnicalCategoryLabel')}
          <input
            type="text"
            value={form.technicalCategory}
            onChange={(e) => onChange('technicalCategory', e.target.value)}
            placeholder={t('communication.optionalPlaceholder')}
            className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-800"
          />
        </label>
      </div>
    </section>
  );
}
