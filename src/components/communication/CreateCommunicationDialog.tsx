import React, { useEffect, useMemo, useRef, useState } from 'react';
import { XIcon } from 'lucide-react';
import { useLocalization } from '../../contexts/LocalizationContext';
import { CommunicationCommonFields } from './CommunicationCommonFields';
import { CommunicationTypeSelector } from './CommunicationTypeSelector';
import { CommunicationTypeSpecificFields } from './CommunicationTypeSpecificFields';
import { LinkedDocumentsList } from './LinkedDocumentsList';
import type { CommunicationFormState, CommunicationValidationErrors, LinkedDocumentItem } from './types';
import { mockRecipients } from '../../data/mockRecipients';

interface CreateCommunicationDialogProps {
  isOpen: boolean;
  initialDocuments: LinkedDocumentItem[];
  onClose: () => void;
  onSend: (payload: CommunicationFormState) => void;
  onSaveDraft: (payload: CommunicationFormState) => void;
}

function getDefaultForm(
  initialDocuments: LinkedDocumentItem[],
  t: (key: string, variables?: Record<string, string | number>) => string
): CommunicationFormState {
  const firstRef = initialDocuments[0]?.reference || initialDocuments[0]?.id || '';
  return {
    messageType: 'general',
    to: [],
    cc: [],
    subject: firstRef ? t('communication.defaultSubject', { reference: firstRef }) : '',
    body: '',
    linkedDocuments: initialDocuments,
    attachments: [],
    priority: 'Normal',
    requiredResponseDate: '',
    informationRequested: '',
    responseRequired: true,
    rfiCategory: '',
    technicalQueryDetails: '',
    discipline: '',
    relatedDocumentReference: firstRef,
    technicalCategory: '',
  };
}

function validateForm(form: CommunicationFormState, t: (key: string, variables?: Record<string, string | number>) => string): CommunicationValidationErrors {
  const errors: CommunicationValidationErrors = {};

  if (!form.messageType) {
    errors.messageType = t('communication.validation.messageTypeRequired');
  }

  const recipients = [...form.to, ...form.cc].filter(Boolean);
  if (recipients.length === 0) {
    errors.to = t('communication.validation.recipientRequired');
  }

  if (!form.subject.trim()) {
    errors.subject = t('communication.validation.subjectRequired');
  }

  if (!form.body.trim()) {
    errors.body = t('communication.validation.bodyRequired');
  }

  if (form.messageType === 'rfi') {
    if (!form.requiredResponseDate) {
      errors.requiredResponseDate = t('communication.validation.rfiDateRequired');
    }
    if (!form.informationRequested.trim()) {
      errors.informationRequested = t('communication.validation.rfiInfoRequired');
    }
  }

  if (form.messageType === 'tq') {
    if (!form.requiredResponseDate) {
      errors.requiredResponseDate = t('communication.validation.tqDateRequired');
    }
    if (!form.technicalQueryDetails.trim()) {
      errors.technicalQueryDetails = t('communication.validation.tqDetailsRequired');
    }
    if (!form.discipline.trim()) {
      errors.discipline = t('communication.validation.tqDisciplineRequired');
    }
  }

  return errors;
}

export function CreateCommunicationDialog({ isOpen, initialDocuments, onClose, onSend, onSaveDraft }: CreateCommunicationDialogProps) {
  const { t } = useLocalization();
  const [form, setForm] = useState<CommunicationFormState>(getDefaultForm(initialDocuments, t));
  const [errors, setErrors] = useState<CommunicationValidationErrors>({});
  const [dirtyFields, setDirtyFields] = useState<Set<keyof CommunicationFormState>>(new Set());
  const firstFocusableRef = useRef<HTMLButtonElement | null>(null);
  const initialFormRef = useRef<CommunicationFormState>(getDefaultForm(initialDocuments, t));

  useEffect(() => {
    if (isOpen) {
      const defaults = getDefaultForm(initialDocuments, t);
      setForm(defaults);
      initialFormRef.current = defaults;
      setErrors({});
      setDirtyFields(new Set());
      requestAnimationFrame(() => {
        firstFocusableRef.current?.focus();
      });
    }
  }, [isOpen, initialDocuments, t]);

  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);
  const isDirty = useMemo(() => dirtyFields.size > 0, [dirtyFields]);

  const valuesAreEqual = <K extends keyof CommunicationFormState>(a: CommunicationFormState[K], b: CommunicationFormState[K]) => {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false;
      }
      return a.every((item, index) => {
        const other = b[index];
        if (item instanceof File && other instanceof File) {
          return item.name === other.name && item.size === other.size && item.lastModified === other.lastModified;
        }
        return JSON.stringify(item) === JSON.stringify(other);
      });
    }
    return a === b;
  };

  const updateField = <K extends keyof CommunicationFormState>(key: K, value: CommunicationFormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setDirtyFields((previous) => {
      const next = new Set(previous);
      if (valuesAreEqual(value, initialFormRef.current[key])) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    setErrors((previous) => {
      if (!previous[key]) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };

  const handleCloseWithGuard = () => {
    if (isDirty && !window.confirm(t('communication.confirmDiscardChanges'))) {
      return;
    }
    onClose();
  };

  const handleSend = () => {
    const validationErrors = validateForm(form, t);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    onSend(form);
    initialFormRef.current = form;
    setDirtyFields(new Set());
    setErrors({});
    onClose();
  };

  const handleDraft = () => {
    onSaveDraft(form);
    initialFormRef.current = form;
    setDirtyFields(new Set());
    setErrors({});
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70]" onKeyDown={(event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        handleCloseWithGuard();
      }
    }}>
      <button
        type="button"
        aria-label={t('communication.closeDialogAria')}
        className="absolute inset-0 bg-black/45"
        onClick={handleCloseWithGuard}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label={t('communication.dialogTitle')}
        className="absolute left-1/2 top-1/2 w-[min(1100px,96vw)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-neutral-200 bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">{t('communication.dialogTitle')}</h2>
            <p className="mt-1 text-sm text-neutral-600">{t('communication.dialogDescription')}</p>
          </div>
          <button
            type="button"
            onClick={handleCloseWithGuard}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
            aria-label={t('communication.closeDialogAria')}
          >
            <XIcon size={16} />
          </button>
        </header>

        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">
          <div className="space-y-4">
            <div>
              <CommunicationTypeSelector
                value={form.messageType}
                onChange={(value) => updateField('messageType', value)}
              />
              {errors.messageType ? <p className="mt-1 text-xs text-rose-700">{errors.messageType}</p> : null}
            </div>

            <CommunicationCommonFields
              form={form}
              errors={errors}
              recipientSuggestions={mockRecipients}
              onChange={updateField}
            />

            <CommunicationTypeSpecificFields
              messageType={form.messageType}
              form={form}
              errors={errors}
              onChange={updateField}
            />

            <LinkedDocumentsList
              documents={form.linkedDocuments}
              onRemove={(id) => {
                const next = form.linkedDocuments.filter((doc) => doc.id !== id);
                updateField('linkedDocuments', next);
              }}
            />

            <footer className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
              {t('communication.footerGuidance')}
            </footer>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-3">
          <p className="text-xs text-neutral-500" aria-live="polite">
            {hasErrors ? t('communication.resolveValidationHint') : t('communication.readyHint')}
          </p>
          <div className="flex items-center gap-2">
            <button
              ref={firstFocusableRef}
              type="button"
              onClick={handleDraft}
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            >
              {t('communication.saveDraft')}
            </button>
            <button
              type="button"
              onClick={handleCloseWithGuard}
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            >
              {t('communication.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSend}
              className="rounded-md bg-[#0461BA] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0353A0]"
            >
              {t('communication.send')}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
