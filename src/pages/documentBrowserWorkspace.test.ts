import { describe, expect, it } from 'vitest';
import { resolveWorkspaceId, urlWorkspaceHonoured } from './documentBrowserWorkspace';

// The four statically known ids (src/data/projects.ts). Hard-coded rather than
// imported so a change to the project list is a deliberate, visible edit here.
const KNOWN = ['marra-ridge', 'hedland', 'kwinana', 'goldfields'] as const;
const PROJECT_SCOPE = { kind: 'project' as const, id: 'marra-ridge' };
const ENTERPRISE_SCOPE = { kind: 'enterprise' as const };

describe('resolveWorkspaceId', () => {
  // The bug this function exists to prevent: on the first render of a
  // cross-workspace deep link, ScopeContext still holds the *previously persisted*
  // workspace, so anything derived from scope asks the wrong one — a guaranteed
  // 404 on the single-document fetch. The URL has to win immediately.
  it('takes the URL workspace over a disagreeing scope', () => {
    expect(resolveWorkspaceId('hedland', PROJECT_SCOPE, KNOWN, 'marra-ridge')).toBe('hedland');
  });

  it('falls back to scope when the URL makes no claim', () => {
    expect(resolveWorkspaceId(null, { kind: 'project', id: 'kwinana' }, KNOWN, 'marra-ridge')).toBe(
      'kwinana'
    );
  });

  it('falls back to the default in enterprise scope with no URL claim', () => {
    expect(resolveWorkspaceId(null, ENTERPRISE_SCOPE, KNOWN, 'marra-ridge')).toBe('marra-ridge');
  });

  it('honours the URL even in enterprise scope', () => {
    // A cross-workspace deep link can land while scope is still enterprise (the
    // scope-sync effect has not run yet); the fallback must not win.
    expect(resolveWorkspaceId('goldfields', ENTERPRISE_SCOPE, KNOWN, 'marra-ridge')).toBe(
      'goldfields'
    );
  });

  // Validation, not trust: wsId is interpolated into the request path.
  it('ignores an unknown workspace id', () => {
    expect(resolveWorkspaceId('does-not-exist', PROJECT_SCOPE, KNOWN, 'marra-ridge')).toBe(
      'marra-ridge'
    );
  });

  it('ignores a path-traversal attempt', () => {
    expect(resolveWorkspaceId('../../admin', PROJECT_SCOPE, KNOWN, 'marra-ridge')).toBe(
      'marra-ridge'
    );
  });

  it('ignores an empty param', () => {
    expect(resolveWorkspaceId('', PROJECT_SCOPE, KNOWN, 'marra-ridge')).toBe('marra-ridge');
  });

  // Production has more workspaces than the four static ids. Before G03 loads we
  // can only vouch for the static set, so an unrecognised-but-real id degrades to
  // the old behaviour rather than breaking — then resolves once the list arrives.
  it('accepts an id the G03 list vouches for even when it is not statically known', () => {
    const fromG03 = ['marra-ridge', 'new-site-2027'];
    expect(resolveWorkspaceId('new-site-2027', PROJECT_SCOPE, fromG03, 'marra-ridge')).toBe(
      'new-site-2027'
    );
  });

  it('defers to scope for that same id while the G03 list is still loading', () => {
    expect(resolveWorkspaceId('new-site-2027', PROJECT_SCOPE, KNOWN, 'marra-ridge')).toBe(
      'marra-ridge'
    );
  });
});

describe('urlWorkspaceHonoured', () => {
  it('is true when the URL makes no workspace claim', () => {
    expect(urlWorkspaceHonoured(null, 'marra-ridge')).toBe(true);
  });

  it('is true once the claim is reflected in the resolved id', () => {
    expect(urlWorkspaceHonoured('hedland', 'hedland')).toBe(true);
  });

  // The whole point of the gate: never ask the persisted workspace for a document
  // the URL says lives in a different one.
  it('is false while an unresolvable claim is outstanding', () => {
    expect(urlWorkspaceHonoured('new-site-2027', 'marra-ridge')).toBe(false);
  });

  it('composes with resolveWorkspaceId: a rejected id blocks the fetch', () => {
    const resolved = resolveWorkspaceId('does-not-exist', PROJECT_SCOPE, KNOWN, 'marra-ridge');
    expect(urlWorkspaceHonoured('does-not-exist', resolved)).toBe(false);
  });

  it('composes with resolveWorkspaceId: a valid deep link fetches immediately', () => {
    // Regression guard for the race itself — scope still says marra-ridge, and the
    // fetch must already be allowed against hedland on this very first render.
    const resolved = resolveWorkspaceId('hedland', PROJECT_SCOPE, KNOWN, 'marra-ridge');
    expect(resolved).toBe('hedland');
    expect(urlWorkspaceHonoured('hedland', resolved)).toBe(true);
  });
});
