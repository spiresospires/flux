import React, { useState } from 'react';
import { XIcon } from 'lucide-react';
import { useLocalization } from '../../contexts/LocalizationContext';

interface RecipientChipInputProps {
  label: string;
  values: string[];
  placeholder: string;
  suggestions: string[];
  error?: string;
  onChange: (next: string[]) => void;
}

function parseRecipientInput(value: string) {
  return value
    .split(/[;,\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function RecipientChipInput({ label, values, placeholder, suggestions, error, onChange }: RecipientChipInputProps) {
  const { t } = useLocalization();
  const [draft, setDraft] = useState('');
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  const filteredSuggestions = suggestions.filter((candidate) => {
    if (values.includes(candidate)) {
      return false;
    }

    if (draft.trim().length === 0) {
      return false;
    }

    return candidate.toLowerCase().includes(draft.toLowerCase());
  }).slice(0, 6);

  const hasSuggestions = filteredSuggestions.length > 0;

  const addRecipients = (raw: string) => {
    const entries = parseRecipientInput(raw);
    if (entries.length === 0) {
      return;
    }

    const deduped = Array.from(new Set([...values, ...entries]));
    onChange(deduped);
    setDraft('');
    setActiveSuggestionIndex(0);
  };

  const addSuggestion = (recipient: string) => {
    if (values.includes(recipient)) {
      return;
    }
    onChange([...values, recipient]);
    setDraft('');
    setActiveSuggestionIndex(0);
  };

  return (
    <label className="text-xs font-medium text-neutral-700">
      {label}
      <div className="mt-1 rounded-md border border-neutral-200 bg-white px-2 py-1.5 focus-within:border-[#0461BA] focus-within:ring-2 focus-within:ring-[#0461BA]/20">
        <div className="flex flex-wrap items-center gap-1.5">
          {values.map((recipient) => (
            <span key={recipient} className="inline-flex items-center gap-1 rounded-full bg-[#E8F1FB] px-2 py-0.5 text-xs text-[#1B4B84]">
              {recipient}
              <button
                type="button"
                onClick={() => onChange(values.filter((value) => value !== recipient))}
                className="rounded p-0.5 hover:bg-[#DCEBFA]"
                aria-label={t('communication.removeRecipient', { recipient })}
              >
                <XIcon size={11} />
              </button>
            </span>
          ))}

          <input
            type="text"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setActiveSuggestionIndex(0);
            }}
            onKeyDown={(event) => {
              if ((event.key === 'Enter' || event.key === ',' || event.key === ';') && hasSuggestions) {
                event.preventDefault();
                addSuggestion(filteredSuggestions[activeSuggestionIndex]);
                return;
              }

              if (event.key === 'Enter' || event.key === ',' || event.key === ';') {
                event.preventDefault();
                addRecipients(draft);
                return;
              }

              if (event.key === 'ArrowDown' && hasSuggestions) {
                event.preventDefault();
                setActiveSuggestionIndex((previous) => (previous + 1) % filteredSuggestions.length);
                return;
              }

              if (event.key === 'ArrowUp' && hasSuggestions) {
                event.preventDefault();
                setActiveSuggestionIndex((previous) => (previous - 1 + filteredSuggestions.length) % filteredSuggestions.length);
                return;
              }

              if (event.key === 'Escape') {
                setDraft('');
                setActiveSuggestionIndex(0);
                return;
              }

              if (event.key === 'Backspace' && draft.length === 0 && values.length > 0) {
                onChange(values.slice(0, -1));
              }
            }}
            onBlur={() => addRecipients(draft)}
            placeholder={values.length === 0 ? placeholder : ''}
            className="min-w-[180px] flex-1 border-0 bg-transparent p-0 text-sm text-neutral-800 outline-none"
            aria-label={label}
          />
        </div>

        {hasSuggestions ? (
          <div className="mt-2 rounded-md border border-neutral-200 bg-white shadow-sm" role="listbox" aria-label={t('communication.suggestionsLabel')}>
            {filteredSuggestions.map((suggestion, index) => {
              const active = index === activeSuggestionIndex;
              return (
                <button
                  key={suggestion}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`block w-full px-2.5 py-1.5 text-left text-xs transition-colors ${active ? 'bg-[#E8F1FB] text-[#0461BA]' : 'text-neutral-700 hover:bg-neutral-50'}`}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    addSuggestion(suggestion);
                  }}
                >
                  {suggestion}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
      <p className="mt-1 text-[11px] text-neutral-500">{t('communication.recipientHint')}</p>
      {error ? <p className="mt-1 text-xs text-rose-700">{error}</p> : null}
    </label>
  );
}
