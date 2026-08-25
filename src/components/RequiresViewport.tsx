// RequiresViewport — gates a route behind a minimum viewport class, per
// product decision D4 (2026-08-17): only /design-system is gated this way.
// Automatic Distribution and the Packages wizard are explicitly NOT gated —
// they must be made to work at tablet portrait and phone (out of scope for
// this build; see docs/responsive-architecture.md §6).
//
// A component inside the route element, not a redirect: the URL still
// resolves, so a link shared from a laptop lands somewhere coherent instead
// of a dead end.
import { MonitorIcon } from 'lucide-react';
import { atLeastViewport, useShellLayout } from '../contexts/ShellLayoutContext';
import type { ViewportClass } from '../shell/viewport';

export function RequiresViewport({
  min,
  feature,
  children,
}: {
  min: ViewportClass;
  feature: string;
  children: React.ReactNode;
}) {
  const { viewport } = useShellLayout();
  if (atLeastViewport(viewport, min)) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-[#E8F1FB] text-[#0461BA] flex items-center justify-center">
          <MonitorIcon size={22} />
        </div>
        <h1 className="text-base font-semibold text-neutral-900 mb-1">{feature} needs a wider screen</h1>
        <p className="text-sm text-neutral-500">
          This area is built around a wide, multi-column layout. Open FLUX on a laptop or desktop to use it.
        </p>
      </div>
    </div>
  );
}
