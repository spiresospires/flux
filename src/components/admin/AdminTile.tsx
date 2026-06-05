import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRightIcon } from 'lucide-react';
import { useLocalization } from '../../contexts/LocalizationContext';

interface AdminTileProps {
  icon: LucideIcon;
  title: string;
  description: string;
  status?: string;
  comingSoon?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function AdminTile({
  icon: Icon,
  title,
  description,
  status,
  comingSoon = false,
  disabled = false,
  onClick,
}: AdminTileProps) {
  const { t } = useLocalization();
  const isDisabled = comingSoon || disabled;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition hover:border-[#BFD7F2] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
      disabled={isDisabled}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F1FB] text-[#0461BA]">
          <Icon size={18} />
        </div>
        <div className="flex items-center gap-1">
          {status ? (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
              {status}
            </span>
          ) : null}
          {comingSoon ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
              {t('admin.common.comingSoon')}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-3">
        <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-neutral-600">{description}</p>
      </div>

      <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#0461BA]">
        {isDisabled ? t('admin.common.unavailable') : t('admin.common.open')}
        <ArrowRightIcon size={14} />
      </div>
    </button>
  );
}
