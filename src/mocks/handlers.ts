// [MOCK] MSW request handlers — the mock backend.
// These serve the existing src/data mock sets through the REAL HTTP contract
// (ARCHITECTURE.md G03/G05/G06/G19, cursor pagination per ADR-011), so components
// make genuine fetch calls from day one. Engineering replaces this layer by
// pointing VITE_API_BASE_URL at the Spring Boot API and setting VITE_API_MODE=real —
// no component changes.
// [PHASE-1]
import { http, HttpResponse, delay } from 'msw';
import { API_BASE } from '../api/client';
import type { DocumentListResponse, SearchResponse, Workspace } from '../api/types';
import type { Document, Folder } from '../types/document';
import type { BriefcaseItem } from '../types/briefcase';
import { PROJECTS, type ProjectId } from '../data/projects';
import { mockDocumentsByProject } from '../data/mockDocuments';
import { mockFoldersByProject } from '../data/mockFolders';
import { searchRecords } from '../data/searchData';
import { briefcaseSeed } from '../data/briefcaseSeed';
import { searchEverything, countResultsByType } from '../utils/search';
import { ENTERPRISE_SEARCH_SCOPE } from '../api/search';

/** Simulated network latency so loading states are real and visible. */
const LATENCY_MS = 350;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 1000;

function problem(status: number, title: string, detail?: string) {
  // RFC 7807 ProblemDetails — same error shape the Spring API will return.
  return HttpResponse.json({ title, status, detail }, { status });
}

function isProjectId(wsId: string): wsId is ProjectId {
  return PROJECTS.some((p) => p.id === wsId);
}

/** Collect folderId plus all descendant folder ids (recursive=true semantics). */
function subtreeIds(folders: Folder[], rootId: string): Set<string> {
  const ids = new Set<string>();
  const find = (nodes: Folder[]): Folder | null => {
    for (const node of nodes) {
      if (node.id === rootId) return node;
      const hit = find(node.children);
      if (hit) return hit;
    }
    return null;
  };
  const root = find(folders);
  if (!root) return ids;
  const walk = (node: Folder) => {
    ids.add(node.id);
    node.children.forEach(walk);
  };
  walk(root);
  return ids;
}

// ── Keyset cursor (ADR-011) ────────────────────────────────────────────────────
// Opaque token encoding the id of the last item served. The mock dataset is
// static, so "position after this id in the sorted list" is exact keyset
// behaviour. The client never parses it — see decode failure → 400 below.
function encodeCursor(lastId: string): string {
  return btoa(JSON.stringify({ a: lastId }));
}

function decodeCursor(cursor: string): string | null {
  try {
    const parsed = JSON.parse(atob(cursor)) as { a?: string };
    return typeof parsed.a === 'string' ? parsed.a : null;
  } catch {
    return null;
  }
}

function paginate<T extends { id: string }>(
  sorted: T[],
  cursor: string | null,
  limit: number
): { items: T[]; nextCursor: string | null } {
  let start = 0;
  if (cursor) {
    const afterId = decodeCursor(cursor);
    const idx = afterId ? sorted.findIndex((item) => item.id === afterId) : -1;
    // Unknown cursor (e.g. the item was deleted) → restart from the top rather
    // than erroring; matches the self-healing model in ADR-010/011.
    start = idx >= 0 ? idx + 1 : 0;
  }
  const items = sorted.slice(start, start + limit);
  const nextCursor =
    start + limit < sorted.length && items.length > 0
      ? encodeCursor(items[items.length - 1].id)
      : null;
  return { items, nextCursor };
}

// ── Briefcase store (user-scoped) ──────────────────────────────────────────────
// The mock "server's" durable store. Persisted to localStorage under the same
// key the pre-API BriefcaseContext used, so existing demo briefcases carry over.
// Seeded with cross-workspace items on first run (see briefcaseSeed.ts).
const BRIEFCASE_STORAGE_KEY = 'flux.briefcase';

function readBriefcase(): BriefcaseItem[] {
  try {
    const saved = localStorage.getItem(BRIEFCASE_STORAGE_KEY);
    if (saved) return JSON.parse(saved) as BriefcaseItem[];
  } catch {
    /* fall through to seed */
  }
  return [...briefcaseSeed];
}

function writeBriefcase(items: BriefcaseItem[]): void {
  try {
    localStorage.setItem(BRIEFCASE_STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable — non-fatal in the prototype */
  }
}

const DATE_FIELDS = new Set(['dateModified', 'dateCreated']);

function compareDocuments(a: Document, b: Document, field: string): number {
  const aVal = a[field];
  const bVal = b[field];
  if (typeof aVal !== 'string' || typeof bVal !== 'string') return 0;
  if (DATE_FIELDS.has(field)) {
    return new Date(aVal).getTime() - new Date(bVal).getTime();
  }
  return aVal.localeCompare(bVal);
}

export const handlers = [
  // ── G03: workspaces ─────────────────────────────────────────────────────────
  http.get(`${API_BASE}/workspaces`, async () => {
    await delay(LATENCY_MS);
    const workspaces: Workspace[] = PROJECTS.map((p) => ({
      id: p.id,
      name: p.name,
      client: p.client,
      assetType: p.assetType,
      phase: p.phase,
      location: p.location,
      ...(p.isFluxRefactor ? { isFluxRefactor: true } : {}),
    }));
    return HttpResponse.json(workspaces);
  }),

  // ── G05: folder tree ────────────────────────────────────────────────────────
  http.get(`${API_BASE}/workspaces/:wsId/folders/tree`, async ({ params }) => {
    await delay(LATENCY_MS);
    const wsId = params.wsId as string;
    if (!isProjectId(wsId)) return problem(404, 'Workspace not found', `No workspace '${wsId}'`);
    return HttpResponse.json(mockFoldersByProject[wsId]);
  }),

  // ── G06: documents (cursor-paginated, server-side filter + sort) ────────────
  http.get(`${API_BASE}/workspaces/:wsId/documents`, async ({ params, request }) => {
    await delay(LATENCY_MS);
    const wsId = params.wsId as string;
    if (!isProjectId(wsId)) return problem(404, 'Workspace not found', `No workspace '${wsId}'`);

    const url = new URL(request.url);
    const folderId = url.searchParams.get('folderId');
    const recursive = url.searchParams.get('recursive') === 'true';
    const status = url.searchParams.getAll('status');
    const documentType = url.searchParams.getAll('documentType');
    const sort = url.searchParams.get('sort') ?? 'dateModified';
    const order = url.searchParams.get('order') ?? (sort === 'dateModified' ? 'desc' : 'asc');
    const limit = Math.min(
      Number(url.searchParams.get('limit')) || DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    );
    const cursor = url.searchParams.get('cursor');

    let docs = mockDocumentsByProject[wsId];
    if (folderId) {
      const ids = recursive ? subtreeIds(mockFoldersByProject[wsId], folderId) : new Set([folderId]);
      docs = docs.filter((d) => !!d.folderId && ids.has(d.folderId));
    }
    if (status.length > 0) docs = docs.filter((d) => status.includes(d.status));
    if (documentType.length > 0) docs = docs.filter((d) => documentType.includes(d.documentType));

    const sorted = [...docs].sort((a, b) => {
      const cmp = compareDocuments(a, b, sort);
      return order === 'desc' ? -cmp : cmp;
    });

    const { items, nextCursor } = paginate(sorted, cursor, limit);
    const body: DocumentListResponse = {
      items,
      nextCursor,
      totalApprox: sorted.length,
    };
    return HttpResponse.json(body);
  }),

  // ── G06: single document ────────────────────────────────────────────────────
  http.get(`${API_BASE}/workspaces/:wsId/documents/:docId`, async ({ params }) => {
    await delay(LATENCY_MS);
    const wsId = params.wsId as string;
    if (!isProjectId(wsId)) return problem(404, 'Workspace not found', `No workspace '${wsId}'`);
    const doc = mockDocumentsByProject[wsId].find((d) => d.id === params.docId);
    if (!doc) return problem(404, 'Document not found', `No document '${String(params.docId)}'`);
    return HttpResponse.json(doc);
  }),

  // ── G19: search ─────────────────────────────────────────────────────────────
  http.post(`${API_BASE}/workspaces/:wsId/search`, async ({ params, request }) => {
    await delay(LATENCY_MS);
    const wsId = params.wsId as string;
    if (wsId !== ENTERPRISE_SEARCH_SCOPE && !isProjectId(wsId)) {
      return problem(404, 'Workspace not found', `No workspace '${wsId}'`);
    }

    const body = (await request.json()) as {
      query?: string;
      types?: string[];
      limit?: number;
      cursor?: string;
    };
    const query = body.query ?? '';
    const limit = Math.min(body.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    const scoped =
      wsId === ENTERPRISE_SEARCH_SCOPE
        ? searchRecords
        : searchRecords.filter((r) => r.projectId === wsId);
    const results = searchEverything(scoped, query);

    // Facets are computed over the FULL result set — before the type filter and
    // before pagination — so the tab counts stay stable while a tab is active.
    // This is what the real G19 `aggregations` field must do too.
    const aggregations = countResultsByType(results);

    const typed =
      body.types && body.types.length > 0
        ? results.filter((r) => body.types!.includes(r.resultType))
        : results;
    const { items, nextCursor } = paginate(typed, body.cursor ?? null, limit);

    const response: SearchResponse = { items, nextCursor, aggregations, totalApprox: typed.length };
    return HttpResponse.json(response);
  }),

  // ── Briefcase (user-scoped — no {wsId}; see src/api/briefcase.ts) ───────────
  http.get(`${API_BASE}/user/briefcase`, async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json(readBriefcase());
  }),

  http.post(`${API_BASE}/user/briefcase`, async ({ request }) => {
    await delay(LATENCY_MS);
    const item = (await request.json()) as BriefcaseItem;
    if (!item?.docId) return problem(400, 'Invalid briefcase item', 'docId is required');
    const items = readBriefcase();
    // Idempotent on docId — re-adding returns the existing item unchanged.
    const existing = items.find((i) => i.docId === item.docId);
    if (existing) return HttpResponse.json(existing);
    const updated = [item, ...items];
    writeBriefcase(updated);
    return HttpResponse.json(item, { status: 201 });
  }),

  http.patch(`${API_BASE}/user/briefcase/:docId`, async ({ params, request }) => {
    await delay(LATENCY_MS);
    const docId = decodeURIComponent(params.docId as string);
    const body = (await request.json()) as { isDynamic?: boolean };
    const items = readBriefcase();
    const target = items.find((i) => i.docId === docId);
    if (!target) return problem(404, 'Briefcase item not found', `No item '${docId}'`);
    const updated = items.map((i) =>
      i.docId === docId ? { ...i, isDynamic: body.isDynamic ?? i.isDynamic } : i
    );
    writeBriefcase(updated);
    return HttpResponse.json(updated.find((i) => i.docId === docId));
  }),

  // DELETE /user/briefcase          → clear all
  // DELETE /user/briefcase?docId=a&docId=b → remove listed items
  http.delete(`${API_BASE}/user/briefcase`, async ({ request }) => {
    await delay(LATENCY_MS);
    const ids = new URL(request.url).searchParams.getAll('docId');
    if (ids.length === 0) {
      writeBriefcase([]);
    } else {
      const idSet = new Set(ids);
      writeBriefcase(readBriefcase().filter((i) => !idSet.has(i.docId)));
    }
    return new HttpResponse(null, { status: 204 });
  }),
];
