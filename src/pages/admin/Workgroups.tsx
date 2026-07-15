// Admin → Workgroups — READ-ONLY in this phase (AUTO_DISTRIBUTION_PLAN.md §4:
// seed + read-only list so rule authors can see membership; full management is
// a later Admin phase). Workspace-scoped, same guards as Automatic Distribution.
// [PHASE-1]
import { LockIcon, UserIcon, UsersIcon } from 'lucide-react';
import { LeftRail } from '../../components/LeftRail';
import { useScope } from '../../contexts/ScopeContext';
import { usePermissions } from '../../contexts/PermissionContext';
import { useAdUsers, useWorkgroups } from '../../hooks/useDistribution';

export function Workgroups() {
  const { scope } = useScope();
  const { hasPermission } = usePermissions();

  const wsId = scope.kind === 'project' ? scope.id : null;
  const canView = hasPermission('ad.view');

  const workgroupsQuery = useWorkgroups(canView ? wsId : null);
  const { data: workgroups = [], isLoading } = workgroupsQuery;
  const { data: users = [] } = useAdUsers();

  const userById = new Map(users.map((u) => [u.id, u]));

  return (
    <div data-component="page-shell" className="h-[calc(100vh-60px)] mt-[60px] bg-[var(--main-bg-color)] overflow-hidden p-4">
      <LeftRail activeItem="workgroups" onItemClick={() => {}} />

      <main className="ml-[var(--left-rail-width,88px)] h-full overflow-hidden">
        <div data-component="page-layout" className="flex h-full w-full flex-col gap-4 overflow-hidden">
          <header data-component="header-panel" className="shrink-0 rounded-xl bg-white shadow-md px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F1FB] text-[#0461BA]">
                <UsersIcon size={18} />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-neutral-900">Workgroups</h1>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {scope.kind === 'project' ? scope.name : 'No workspace selected'} · read-only — membership
                  management arrives in a later Admin phase
                </p>
              </div>
            </div>
          </header>

          {!canView ? (
            <GuardCard
              title="No access to Workgroups"
              body="You need the Automatic Distribution permission (or its read-only view) for this workspace."
            />
          ) : !wsId ? (
            <GuardCard
              title="Select a workspace"
              body="Workgroups are workspace-scoped. Pick a workspace from the selector in the top banner."
            />
          ) : (
            <section className="flex-1 overflow-y-auto rounded-xl bg-white shadow-md" aria-label="Workgroups">
              {workgroupsQuery.isError && !workgroupsQuery.data && (
                <div className="px-5 py-10 text-center">
                  <p className="text-xs text-neutral-500">
                    Couldn't load workgroups. If this persists on a dev build, hard-refresh the page (Ctrl+F5).
                  </p>
                  <button
                    onClick={() => workgroupsQuery.refetch()}
                    className="mt-3 rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-[#F0F4F8]"
                  >
                    Retry
                  </button>
                </div>
              )}
              {isLoading && <p className="px-5 py-8 text-center text-xs text-neutral-400">Loading workgroups…</p>}
              {!isLoading && !(workgroupsQuery.isError && !workgroupsQuery.data) && workgroups.length === 0 && (
                <p className="px-5 py-10 text-center text-xs text-neutral-400">No workgroups in this workspace yet.</p>
              )}
              <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                {workgroups.map((group) => (
                  <div key={group.id} className="rounded-xl border border-neutral-100 p-4">
                    <div className="flex items-center gap-2">
                      <UsersIcon size={15} className="shrink-0 text-[#0461BA]" />
                      <h2 className="text-sm font-semibold text-neutral-900">{group.name}</h2>
                      <span className="ml-auto text-[11px] text-neutral-400">
                        {group.memberIds.length} member{group.memberIds.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">{group.description}</p>
                    <ul className="mt-3 space-y-1.5">
                      {group.memberIds.map((memberId) => {
                        const user = userById.get(memberId);
                        return (
                          <li key={memberId} className="flex items-center gap-2 text-xs">
                            <UserIcon size={12} className="shrink-0 text-neutral-300" />
                            <span className={user?.active === false ? 'text-neutral-400 line-through' : 'text-neutral-700'}>
                              {user?.name ?? memberId}
                            </span>
                            {user && <span className="text-[11px] text-neutral-400">· {user.role}</span>}
                            {user?.active === false && (
                              <span className="rounded-full border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                                Inactive
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function GuardCard({ title, body }: { title: string; body: string }) {
  return (
    <section className="flex min-h-[420px] flex-1 items-center justify-center rounded-xl bg-white p-8 text-center shadow-md">
      <div className="max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F1FB] text-[#0461BA]">
          <LockIcon size={22} />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-neutral-900">{title}</h2>
        <p className="mt-2 text-sm text-neutral-600">{body}</p>
      </div>
    </section>
  );
}
