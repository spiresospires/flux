import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { AdminTile } from './AdminTile';

export interface AdminSectionItem {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  status?: string;
  comingSoon?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

interface AdminSectionProps {
  title: string;
  description: string;
  items: AdminSectionItem[];
}

export function AdminSection({ title, description, items }: AdminSectionProps) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <header className="mb-4">
        <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
        <p className="mt-1 text-xs text-neutral-600">{description}</p>
      </header>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <AdminTile
            key={item.id}
            icon={item.icon}
            title={item.title}
            description={item.description}
            status={item.status}
            comingSoon={item.comingSoon}
            disabled={item.disabled}
            onClick={item.onClick}
          />
        ))}
      </div>
    </section>
  );
}
