// Which workspace is the document browser actually looking at?
//
// ADR-010 makes the URL the source of truth for the view: /documents?ws=<wsId>.
// ScopeContext is the *chrome's* idea of the current workspace (banner dropdown,
// left rail) and it only catches up to the URL one effect later — so anything
// derived from scope alone is wrong on the first render of a cross-workspace deep
// link, and every query keyed on it fires against the previously-persisted
// workspace. For the single-document fetch that is a guaranteed 404; for the
// folder tree and the document list it is a wasted round-trip plus a flash of the
// wrong workspace's contents.
//
// Deriving from the URL synchronously removes the window entirely: there is no
// render in which the id is wrong.
//
// Lives in its own module rather than in DocumentBrowser.tsx because that file may
// only export components (`react-refresh/only-export-components`), and because a
// pure function is the cheapest thing in this codebase to test.
import type { ProjectId } from '../data/projects';

export interface WorkspaceScopeLike {
  kind: 'enterprise' | 'project';
  id?: string;
}

/**
 * Resolve the workspace the browser should query.
 *
 * @param wsParam            the raw `?ws=` value, or null
 * @param scope              ScopeContext's current scope
 * @param knownWorkspaceIds  ids we are willing to trust — the G03 workspace list
 *                           once loaded, else the statically known ids
 * @param fallback           used when neither the URL nor scope names a project
 *
 * The param is validated rather than trusted: `wsId` is interpolated into the
 * request path, so an unresolvable value must not reach the API layer, and a
 * stale link to a workspace that no longer exists should degrade to the user's
 * current workspace rather than 404 the whole page.
 *
 * An unknown-but-real workspace (production has more than the four static ids)
 * simply resolves to the fallback until the G03 list arrives and vouches for it —
 * i.e. it degrades to the old behaviour instead of breaking.
 */
export function resolveWorkspaceId(
  wsParam: string | null,
  scope: WorkspaceScopeLike,
  knownWorkspaceIds: readonly string[],
  fallback: ProjectId
): ProjectId {
  if (wsParam && knownWorkspaceIds.includes(wsParam)) {
    return wsParam as ProjectId;
  }
  if (scope.kind === 'project' && scope.id) {
    return scope.id as ProjectId;
  }
  return fallback;
}

/**
 * True when the URL makes no workspace claim, or the claim was honoured by
 * `resolveWorkspaceId`.
 *
 * Gates the single-document fetch. An unresolvable `?ws=` must NOT fall back to
 * asking the persisted workspace for that document — the document lives
 * somewhere else, so the request can only 404. Waiting is the correct behaviour:
 * if the G03 list later vouches for the id, the resolve succeeds and the fetch
 * proceeds on its own.
 */
export function urlWorkspaceHonoured(wsParam: string | null, resolvedId: string): boolean {
  return !wsParam || wsParam === resolvedId;
}
