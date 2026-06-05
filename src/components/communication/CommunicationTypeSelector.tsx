import React from 'react';
import { useLocalization } from '../../contexts/LocalizationContext';
import type { CommunicationType } from './types';

interface CommunicationTypeSelectorProps {
  value: CommunicationType;
  onChange: (value: CommunicationType) => void;
}

const OPTIONS: Array<{ value: CommunicationType; label: string; description: string }> = [
  {
    value: 'general',
    label: 'General Message',
    description: 'Simple communication to share information with project users.',
  },
  {
    value: 'rfi',
    label: 'Request For Information (RFI)',
    description: 'Formal question requiring a tracked response.',
  },
  {
    value: 'tq',
    label: 'Technical Query (TQ)',
    description: 'Technical or engineering clarification request.',
  },
];

export function CommunicationTypeSelector({ value, onChange }: CommunicationTypeSelectorProps) {
  const { t } = useLocalization();

  const localizedOptions = OPTIONS.map((option) => ({
    ...option,
    label: t(`communication.type.${option.value}.label`),
    description: t(`communication.type.${option.value}.description`),
  }));

  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t('communication.messageTypeLabel')}</label>
      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
        {localizedOptions.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                active
                  ? 'border-[#8FBCEB] bg-[#F2F8FF]'
                  : 'border-neutral-200 bg-white hover:bg-neutral-50'
              }`}
              aria-pressed={active}
            >
              <p className={`text-sm font-semibold ${active ? 'text-[#0461BA]' : 'text-neutral-900'}`}>{option.label}</p>
              <p className="mt-1 text-xs text-neutral-600">{option.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
