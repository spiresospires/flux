import React from 'react';

interface ContextNavItem {
  id: string;
  label: string;
}

interface AdminContextLayoutProps {
  title: string;
  description: string;
  navTitle: string;
  navItems: ContextNavItem[];
  activeNavId: string;
  onNavSelect: (id: string) => void;
  children: React.ReactNode;
}

export function AdminContextLayout({
  title,
  description,
  navTitle,
  navItems,
  activeNavId,
  onNavSelect,
  children,
}: AdminContextLayoutProps) {
  return (
    <main className="ml-[var(--left-rail-width,88px)]">
      <div className="grid min-h-[calc(100vh-92px)] grid-cols-[220px_minmax(0,1fr)] gap-4 items-start">
        <aside className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm sticky top-0">
          <h2 className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">{navTitle}</h2>
          <div className="space-y-1">
            {navItems.map((item) => {
              const active = item.id === activeNavId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavSelect(item.id)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? 'bg-[#E8F1FB] text-[#0461BA] font-semibold'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </aside>

        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-md min-h-[480px]">
          <header className="mb-4 border-b border-neutral-100 pb-4">
            <h1 className="text-lg font-semibold text-neutral-900">{title}</h1>
            <p className="mt-1 text-sm text-neutral-600">{description}</p>
          </header>
          {children}
        </section>
      </div>
    </main>
  );
}
