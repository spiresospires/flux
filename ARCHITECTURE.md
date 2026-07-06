# FusionLive — Architecture & API Integration Guide

> **Living document.** Update this file as decisions are made and APIs are confirmed.  
> **Audience:** Engineering team + AI code-gen (Claude Sonnet).  
> **Prototype:** `C:\GitHub\flux` (React 18, TypeScript, Vite, Tailwind CSS 3)  
> **Target:** Production Spring MVC application replacing the 15-year Struts/ExtJS monolith.

---

## Marker Convention

Every file in the prototype that touches data or auth must use the following inline markers. Engineers and AI code-gen **must** preserve and honour them — they are the handshake between prototype and production.

| Marker | Meaning |
|---|---|
| `// [MOCK]` | Hardcoded data or stub — replace with real API call |
| `// [API] GROUP:METHOD /path` | Where the real API call goes (group from G01–G30) |
| `// [AUTH]` | Requires a valid workspace-scoped JWT; attach via `Authorization: Bearer <token>` |
| `// [PHASE-1]` | Must ship in Phase 1 (Search, Chat, Document Browsing, Dashboard) |
| `// [PHASE-2]` | Defer to Phase 2 (flux-2 release) |
| `// [TODO-ENG]` | Engineering decision needed before this can be implemented |
| `// [TBD]` | API spec not yet finalised — spec is still draft |

**Example — before (mock):**
```ts
// [MOCK] Replace with real folder tree fetch
// [API] G05:GET /workspaces/{wsId}/folders/tree
// [AUTH]
// [PHASE-1]
const folders = MOCK_FOLDERS;
```

**Example — after (wired):**
```ts
const { data: folders } = useFolderTree(wsId);
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                        │
│                                                                 │
│  React 18 SPA (this prototype, forked by Engineering)          │
│  ├── React Query v5  — server state, caching, background sync  │
│  ├── Zustand         — client/UI state (scope, view style)     │
│  └── src/api/        — typed service layer (openapi-typescript) │
└────────────────┬────────────────────────────────────────────────┘
                 │ HTTPS (per-region subdomain)
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  Auth Service  (G01)                                            │
│  POST /auth/token          — platform token (short-lived JWT)   │
│  POST /auth/workspace-token — workspace-scoped token            │
│  POST /auth/refresh        — httpOnly refresh cookie exchange   │
│  Supports: SSO / OAuth2 / SAML / OIDC / Active Directory        │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  Spring Boot REST API                                           │
│  Base: /api/v1  (internal)   /connect/v1  (partner/external)   │
│  All document/folder resources scoped: /workspaces/{wsId}/...  │
│  Errors: RFC 7807 ProblemDetails                                │
│  Concurrency: ETag / If-Match optimistic locking                │
│  Idempotency: Idempotency-Key header on all POST requests        │
│  Async ops: G25 job polling (/workspaces/{wsId}/jobs/{jobId})   │
└────────────────┬────────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
┌───────────────┐  ┌────────────────────────────────┐
│  Oracle DB    │  │  File Storage                  │
│  Per region   │  │  NFS today → S3 per region     │
│  Multi-tenant │  │  [TODO-ENG] migration strategy │
│  Integer PKs  │  │  Content served via G07        │
│  UUID bridge  │  └────────────────────────────────┘
│  (ADR-009)    │
└───────────────┘
```

### Multi-region Deployment (AWS preferred)

| Region | Identifier | Subdomain (example) | Oracle | S3 Bucket |
|---|---|---|---|---|
| Middle East/Africa | MA | `ma.fusionlive.com` | `oracle-ma` | `fl-content-ma` |
| United States | US | `us.fusionlive.com` | `oracle-us` | `fl-content-us` |
| United Kingdom | UK | `uk.fusionlive.com` | `oracle-uk` | `fl-content-uk` |
| Europe | EU | `eu.fusionlive.com` | `oracle-eu` | `fl-content-eu` |

Document content **must not leave its originating region**. Each region runs an independent Spring Boot cluster pointing at its own Oracle instance and S3 bucket. The React SPA is region-aware via environment variable (see §Environment Variables).

---

## Key Architectural Decisions

### ADR-005 — Two-Token JWT Auth

1. **Platform token** (`Authorization: Bearer <platformToken>`) — identifies the user globally.
2. **Workspace-scoped token** — obtained by exchanging the platform token at `POST /auth/workspace-token` with `{ workspaceId }` — restricts API access to that workspace's data.
3. **Refresh** — httpOnly cookie; exchange at `POST /auth/refresh` to get a new platform token without re-login.

In the prototype, `ScopeContext` holds `{ kind: 'project', id, name }` — `id` maps directly to `wsId`. When scope changes, discard the old workspace token and obtain a new one.

```ts
// [AUTH] Pseudocode for workspace token exchange
// [API] G01:POST /auth/workspace-token
// [PHASE-1]
async function exchangeWorkspaceToken(platformToken: string, wsId: string): Promise<string> {
  const res = await apiClient.post('/auth/workspace-token', { workspaceId: wsId }, {
    headers: { Authorization: `Bearer ${platformToken}` }
  });
  return res.data.workspaceToken;
}
```

### ADR-009 — UUID–Integer Bridge

The REST API exposes **UUIDs** on all external-facing IDs (documents, folders, workspaces). The Oracle DB uses **integer** primary keys internally. The Spring layer maps between them. The React SPA **always uses UUIDs** — never integer IDs. `DocumentMetadata.id` in `src/types/document.ts` is already a `string`; keep it that way.

### ADR-010 — Real-time Sync & Multi-Window Architecture

The product requirements are: multi-user SaaS, no manual refreshes (data updates itself), and multiple browser windows per user kept in sync. This ADR defines how change notifications reach the browser and how windows coordinate.

**1. Server → client transport: Server-Sent Events (SSE), dedicated stream**

```
GET /workspaces/{wsId}/events        (new group G31)
Accept: text/event-stream
Authorization: Bearer <workspaceToken>
```

- One stream per workspace, **separate from G13 messages/notifications**. G13 is user-facing content ("you have been assigned a review"); G31 is infrastructure-level cache-invalidation traffic at much higher volume. Mixing them couples notification UX to sync plumbing.
- SSE over WebSocket/STOMP because all client **writes** already go through REST — we only need one-directional push. SSE gives auto-reconnect with `Last-Event-ID` for free, is plain HTTP (works through LBs/proxies without upgrade handling), and carries the JWT like any other request.
- `[TODO-ENG]` Confirm SSE vs WebSocket against infra constraints (ALB idle timeouts, connection limits per node, fan-out approach — e.g. Redis pub/sub across the Spring Boot cluster).

**2. Event envelope — identifiers only, never payloads**

```json
{
  "id": "01J9ZK7Q2M...",            // monotonic per stream; doubles as SSE Last-Event-ID
  "ts": "2026-07-06T09:14:03Z",
  "wsId": "b3f1...",
  "type": "document.updated",       // <entity>.<verb>  verb ∈ created|updated|deleted|moved
  "entity": "document",             // document | folder | message | job | workspace
  "entityId": "9c2e...",            // UUID (ADR-009)
  "rev": 7,                         // entity revision — matches the ETag the client holds
  "actorId": "5a77..."              // originating user (clients may de-dupe their own echoes)
}
```

Events carry **what changed, not the change itself**. The client responds by invalidating its React Query cache and refetching through the normal REST endpoints. Rationale:
- No permission leakage: the refetch is ACL-checked by the REST layer; the event channel never has to filter payload fields per recipient.
- No client-side merge logic — invalidate → refetch is idempotent and self-healing.
- Events stay tiny, so the stream scales.

**3. Client model: event → query-key invalidation**

| Event type | React Query keys invalidated |
|---|---|
| `document.*` | `['documents', wsId]`, `['document', wsId, entityId]`, `['search', wsId]` |
| `folder.*` | `['folders', 'tree', wsId]`, `['documents', wsId]` |
| `message.created` | `['messages', wsId]` |
| `job.updated` | `['job', wsId, entityId]` (replaces G25 polling when stream is healthy) |

**4. Multi-window coordination — one connection per browser, not per tab**

- A **leader tab** owns the single SSE connection. Election via the Web Locks API (`navigator.locks.request('flux.sse-leader', …)` — the lock holder is leader; when it closes, the next waiter is promoted automatically). SharedWorker is the fallback if Web Locks proves awkward.
- The leader rebroadcasts every event on a `BroadcastChannel('flux.events')`; every tab (leader included) runs the same invalidation logic. React Query's experimental `broadcastQueryClient` is an alternative worth evaluating — `[TODO-ENG]`.
- **User preferences** sync across windows via `storage` events (implemented in `useUserPref` — see hook source). UI-only state (panel widths, open/closed) syncs this way; no server round-trip needed for liveness.

**5. Reconnect & missed events**

- On reconnect the client sends `Last-Event-ID`; the server replays from a short retained buffer (suggested: 5 minutes / bounded ring per workspace).
- If the client is too far behind (ID no longer in buffer), the server responds with a `stream-reset` event; the client then invalidates **all** workspace queries (full refetch of whatever is on screen). Correctness never depends on the stream being complete.
- Delivery is **at-least-once**; duplicate events are harmless because invalidation is idempotent.

### ADR-011 — Cursor Pagination (no offset paging)

All list endpoints that back infinite scrolls — G06 documents, G19 search — use **keyset/cursor pagination**, not `page`/`pageSize`:

```
GET /workspaces/{wsId}/documents?folderId=…&sort=name&order=asc&limit=50&cursor=<opaque>

200 OK
{ "items": [ … ], "nextCursor": "eyJz…" | null, "totalApprox": 1140 }
```

- **Why not offset paging:** in a live multi-user system, concurrent inserts/deletes shift row offsets between requests — an infinite list assembled from offset pages shows duplicates and gaps. Keyset pagination is stable under concurrent writes and O(1) in Oracle regardless of scroll depth (offset paging degrades linearly).
- The cursor is an **opaque server-generated token** (base64 of the sort-key tuple `(sortValue, id)`). Clients never parse it. Changing sort or filters discards the cursor and restarts from the top.
- **`X-Total-Count` is dropped.** Exact counts require `COUNT(*)` per request and are stale the moment they're computed. Where the UI needs a figure ("~1,140 documents"), the response carries `totalApprox` — `[TODO-ENG]` decide the cheap source (folder rollup table, sampled count, or cached count with TTL).
- Client side: React Query `useInfiniteQuery` with `getNextPageParam: (last) => last.nextCursor`, rendered through a windowed list (`@tanstack/react-virtual`) so the DOM stays bounded no matter how far the user scrolls.

**Live updates × infinite lists (UX rule):** items are never auto-inserted into a list the user is reading — a G31 `document.created` event increments a **"N new documents" pill**; clicking it refetches from the top and scrolls there. Updates and deletes to **already-visible** rows apply in place (invalidate → refetch keeps the row's position). `[PHASE-1]` — this pill is part of the DocumentBrowser design work.

### Dual-System Coexistence (until Jul 2027)

The legacy Struts application and the new REST API will write to the same Oracle schema concurrently during Phases 1–4. Engineering must coordinate schema changes carefully. The React SPA writes **only through the new REST API**. Struts reads/writes continue alongside until full cutover.

---

## Prototype → Production: Component Map

### Scope / Workspace Selector (`BrandBanner.tsx`, `ScopeContext.tsx`)

| Prototype | API | Notes |
|---|---|---|
| `PROJECTS` array in `src/data/projects.ts` | `GET /workspaces` (G03) | Returns workspaces the authenticated user can access |
| `scope.id` (string) | `wsId` path parameter | Every downstream API call uses this |
| `setScope()` | `POST /auth/workspace-token` (G01) | Triggers workspace token exchange on scope change |

```ts
// [MOCK] src/data/projects.ts — static project list
// [API] G03:GET /workspaces
// [AUTH]
// [PHASE-1]
// Replace PROJECTS with useWorkspaces() hook (see src/api/workspaces.ts)
```

### Folder Tree (`FolderTree.tsx`)

| Prototype | API | Notes |
|---|---|---|
| `MOCK_FOLDERS` in `src/data/mockFolders.ts` | `GET /workspaces/{wsId}/folders/tree` (G05) | Full recursive tree |
| `Folder.id` | `folderId` path param | UUID |
| Expand/collapse (client state) | Client only | No API call needed |
| Create folder | `POST /workspaces/{wsId}/folders` (G05) | `Idempotency-Key` required |
| Rename folder | `PATCH /workspaces/{wsId}/folders/{folderId}` (G05) | ETag/If-Match |
| Move folder | `POST /workspaces/{wsId}/folders/{folderId}/move` (G05) | |
| Delete folder | `DELETE /workspaces/{wsId}/folders/{folderId}` (G05) | |

```ts
// [MOCK] src/data/mockFolders.ts
// [API] G05:GET /workspaces/{wsId}/folders/tree
// [AUTH]
// [PHASE-1]
```

### Document Browser / Grid (`DocumentBrowser.tsx`)

| Prototype | API | Notes |
|---|---|---|
| `MOCK_DOCUMENTS` in `src/data/mockDocuments.ts` | `GET /workspaces/{wsId}/documents` (G06) | Cursor-paginated; filter by `folderId`, status, type |
| `DocumentMetadata` type | `DocumentResponse` schema (G06) | `id` → UUID |
| Column sort | `?sort=field&order=asc\|desc` | Server-side; sort change resets the cursor |
| Filter panel (`FilterPanel.tsx`) | Query params on G06 | Status, type, date range, author |
| Infinite scroll | `?limit=&cursor=` → `{ items, nextCursor, totalApprox }` | ADR-011 — no offset paging, no `X-Total-Count` |
| Live updates | G31 events → invalidate `['documents', wsId]` | "N new documents" pill; never auto-insert mid-scroll (ADR-010/011) |
| Document thumbnail | `GET /workspaces/{wsId}/documents/{docId}/content/thumbnail` (G07) | |

```ts
// [MOCK] src/data/mockDocuments.ts
// [API] G06:GET /workspaces/{wsId}/documents
// [AUTH]
// [PHASE-1]
// Query params: folderId, status, documentType, limit, cursor, sort, order (ADR-011)
```

### Document Detail / Metadata Panel (`DocumentDetail.tsx`, `MetadataPanel.tsx`)

| Prototype | API | Notes |
|---|---|---|
| Single document object from mock | `GET /workspaces/{wsId}/documents/{docId}` (G06) | |
| Metadata edit | `PATCH /workspaces/{wsId}/documents/{docId}` (G06) | ETag/If-Match |
| Revision history | `GET /workspaces/{wsId}/documents/{docId}/revisions` (G06) | |
| Relationships | `GET /workspaces/{wsId}/documents/{docId}/relationships` (G06) | |
| File download | `GET /workspaces/{wsId}/documents/{docId}/content` (G07) | Streams binary; pre-signed S3 URL likely |
| File upload (new revision) | `POST /workspaces/{wsId}/documents/{docId}/content` (G07) | Multipart; returns async job (G25) |

### Search (`SearchResults.tsx`, `SearchContext.tsx`)

| Prototype | API | Notes |
|---|---|---|
| `searchData.ts` / `utils/search.ts` client-side filter | `POST /workspaces/{wsId}/search` (G19) | Full-text + facets |
| `SearchContext` query state | Keep as Zustand store slice | URL-sync via search params |
| Facet counts | `aggregations` in G19 response | Drive `FilterPanel` chips |
| Infinite scroll | `limit`/`cursor` in request body → `{ items, nextCursor }` | ADR-011 — same contract as G06 |
| Saved searches | `GET/POST /workspaces/{wsId}/search/saved` (G19) | [PHASE-2] |

```ts
// [MOCK] src/utils/search.ts — client-side filtering
// [API] G19:POST /workspaces/{wsId}/search
// [AUTH]
// [PHASE-1]
// Body: { query, filters: { folderId, status, documentType, dateRange }, limit, cursor } (ADR-011)
```

### Chat / AI Assistant — Flint (`src/pages/Chat.tsx`)

LLM responses must **stream token-by-token** — a request/response chat UI cannot be retrofitted to streaming later without rewriting the page, so the streaming states are Phase 1 design work.

| Prototype | API | Notes |
|---|---|---|
| Conversation list (component state) | `GET /workspaces/{wsId}/assistant/conversations` (G29) | Cursor-paginated (ADR-011) |
| `handleSend` + 1.2 s `setTimeout` mock | `POST /workspaces/{wsId}/assistant/conversations/{convId}/messages` (G29) | Response is an SSE token stream |
| Context chip (`?ask=&askKind=`) | Request body `{ scope: { wsId }, context: { type, id } }` | Pass object **IDs**, not labels — markers already in `Chat.tsx` |
| Stop button | Client-side `AbortController` on the stream | Server treats disconnect as stop |

```ts
// [MOCK] Chat.tsx setTimeout reply — replace with SSE token stream
// [API] G29:POST /workspaces/{wsId}/assistant/conversations/{convId}/messages
// [AUTH]
// [PHASE-1]
// Response: text/event-stream — events: message.delta (token chunk),
// message.complete (final id + usage), message.error (mid-stream failure)
// [TODO-ENG] Confirm G29 endpoint shape and event names against the LLM gateway
```

**UI states to design in Phase 1:** streaming-in-progress (progressive markdown render), stopped-with-partial-answer, error-mid-stream (keep partial text + retry affordance), and citation/source chips when Flint references documents.

### Dashboard (`Dashboard.tsx`)

| Prototype | API | Notes |
|---|---|---|
| `mockDashboard.ts` stats | `GET /workspaces/{wsId}/dashboard` (G03 or dedicated) | [TBD] confirm endpoint |
| Notification feed | `GET /workspaces/{wsId}/messages` (G13) | |
| Mark read | `PATCH /workspaces/{wsId}/messages/{msgId}` (G13) | |

### Async Operations

Large uploads, bulk operations, and any G05/G06 write that may take >2 s return `202 Accepted` with a job reference. Poll using G25:

```ts
// [API] G25:GET /workspaces/{wsId}/jobs/{jobId}
// Poll until status === 'COMPLETE' | 'FAILED'
// React Query: useQuery with refetchInterval until terminal state
```

---

## Proposed `src/api/` Service Layer

```
src/
  api/
    client.ts          ← Axios instance; injects workspace token from Zustand store
    auth.ts            ← G01: token exchange, refresh
    workspaces.ts      ← G03: list, get
    folders.ts         ← G05: tree, CRUD, move
    documents.ts       ← G06: list, get, patch, delete, revisions, relationships
    content.ts         ← G07: download, upload, thumbnail
    search.ts          ← G19: full-text search, facets
    messages.ts        ← G13: notifications, mark-read
    jobs.ts            ← G25: job polling helper
    errors.ts          ← RFC 7807 ProblemDetails error type + handler
  hooks/
    useWorkspaces.ts   ← React Query wrapper → workspaces.ts
    useFolderTree.ts   ← React Query wrapper → folders.ts
    useDocuments.ts    ← React Query wrapper → documents.ts
    useDocument.ts     ← React Query wrapper → documents.ts (single)
    useSearch.ts       ← React Query wrapper → search.ts
    useMessages.ts     ← React Query wrapper → messages.ts
    useJob.ts          ← React Query polling wrapper → jobs.ts
  types/
    generated/         ← DO NOT EDIT — output of openapi-typescript
      fusionlive.d.ts  ← auto-generated from Swagger spec
    index.ts           ← re-exports + hand-written overrides if needed
```

### `src/api/client.ts` skeleton

```ts
// [TODO-ENG] Set VITE_API_BASE_URL per region in .env files
// [AUTH]
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // e.g. https://uk.fusionlive.com/api/v1
  withCredentials: true, // sends httpOnly refresh cookie
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().workspaceToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// [TODO-ENG] Add 401 interceptor: refresh platform token → re-exchange workspace token → retry
```

### Type generation

```bash
# Run after each API spec update
npx openapi-typescript http://localhost:8080/v3/api-docs -o src/api/types/generated/fusionlive.d.ts
```

---

## State Management

### React Query v5 — Server State

All data fetched from the API lives in React Query's cache. **Remove all `useState` / `useEffect` data-fetching patterns** from prototype components; replace with `useQuery` / `useMutation`.

```ts
// Example: replace MOCK_FOLDERS in FolderTree.tsx
// [API] G05:GET /workspaces/{wsId}/folders/tree  [PHASE-1]
export function useFolderTree(wsId: string) {
  return useQuery({
    queryKey: ['folders', 'tree', wsId],
    queryFn: () => apiClient.get(`/workspaces/${wsId}/folders/tree`).then(r => r.data),
    staleTime: 30_000,
  });
}
```

**Cache invalidation:** Mutating a folder (create/rename/move/delete) must invalidate `['folders', 'tree', wsId]`. Mutating a document must invalidate `['documents', wsId]` and the specific `['document', wsId, docId]`.

### Zustand — Client / UI State

Replace prototype React Contexts that hold **non-server** state. Server-fetched data belongs in React Query, not Zustand.

```
src/stores/
  authStore.ts         ← platformToken, workspaceToken, user identity
  scopeStore.ts        ← replaces ScopeContext (current workspace/scope)
  viewStyleStore.ts    ← replaces ViewStyleContext (appearance, layout)
  uiStore.ts           ← panel expand/collapse, selected rows, clipboard
```

**Keep ViewStyleContext and ScopeContext** as-is in the prototype for now. When Engineering forks, migrate to Zustand stores matching the above shape. The `localStorage` keys are already defined in the prototype — preserve them:

| Key | Store | Purpose |
|---|---|---|
| `flux.currentScope` | `scopeStore` | Active workspace/scope |
| `flux-view-style` | `viewStyleStore` | Appearance + layout preference |
| `flux.currentProject` | `scopeStore` | Legacy — consolidate with `flux.currentScope` |

---

## Phase 1 Delivery Checklist

Phase 1 ships: **Search, Chat, Document Browsing, Dashboard**

| Feature | Component(s) | API Groups | Status |
|---|---|---|---|
| Auth / Login | `App.tsx`, `authStore` | G01 | [TODO-ENG] |
| Workspace list | `BrandBanner.tsx` | G03 | [MOCK] |
| Folder tree | `FolderTree.tsx` | G05 | [MOCK] |
| Document grid | `DocumentBrowser.tsx` | G06, G07 | [MOCK] |
| Document detail | `DocumentDetail.tsx` | G06, G07 | [MOCK] |
| Search | `SearchResults.tsx` | G19 | [MOCK] |
| Chat/AI (streaming) | `Chat.tsx` | G29 | [MOCK] |
| Dashboard | `Dashboard.tsx` | G03, G13 | [MOCK] |
| Notifications | `BrandBanner.tsx` | G13 | [MOCK] |
| Async job feedback | (global) | G25 | not started |
| Real-time events / live updates | (global — ADR-010) | G31 | not started |
| Multi-window sync (leader election, BroadcastChannel) | (global — ADR-010) | G31 | prefs sync done (`useUserPref`) |

---

## Environment Variables

```bash
# .env.ma
VITE_API_BASE_URL=https://ma.fusionlive.com/api/v1
VITE_REGION=MA

# .env.us
VITE_API_BASE_URL=https://us.fusionlive.com/api/v1
VITE_REGION=US

# .env.uk
VITE_API_BASE_URL=https://uk.fusionlive.com/api/v1
VITE_REGION=UK

# .env.eu
VITE_API_BASE_URL=https://eu.fusionlive.com/api/v1
VITE_REGION=EU

# .env.development (local — proxied to dev Spring Boot instance)
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_REGION=DEV
```

---

## Mock → Real Migration: File-by-File

| File | Mock data | Replace with |
|---|---|---|
| `src/data/projects.ts` | Static `PROJECTS` array | `useWorkspaces()` → G03 |
| `src/data/mockFolders.ts` | Static folder tree | `useFolderTree(wsId)` → G05 |
| `src/data/mockDocuments.ts` | Static document list | `useDocuments(wsId, params)` → G06 |
| `src/data/mockDashboard.ts` | Static dashboard stats | `useDashboard(wsId)` → G03/[TBD] |
| `src/data/mockPlaceholders.ts` | UI placeholders | Keep or remove after real data lands |
| `src/data/searchData.ts` | Static search corpus | `useSearch(wsId, query)` → G19 |
| `src/utils/search.ts` | Client-side filter | Delete once G19 wired |
| `src/contexts/WorkspaceContext.tsx` | Static workspace names | Merge into `scopeStore` → G03 |

---

## "Try New" Feature Flag (Phase 1 Rollout)

Users see the legacy Struts UI by default. A **Try New** banner offers opt-in to the React SPA. Per-user flag stored server-side (suggested: G02 user preferences or a feature-flag service — [TODO-ENG]).

```
Legacy Struts UI  ←──── most users (until cutover Jul 2027)
       │
       │  "Try New" banner click
       ▼
React SPA (this prototype)  ←── early adopters / beta
```

The React SPA writes via the new REST API only. Both systems share the same Oracle schema during coexistence. Struts writes must remain valid for REST API reads — Engineering must enforce this at the schema/service layer.

---

## API Groups Reference (Phase 1 Priority)

| Group | Description | Base path | Phase 1 |
|---|---|---|---|
| G01 | Authentication & tokens | `/auth` | ✅ Critical |
| G02 | Users & profiles | `/users`, `/workspaces/{wsId}/members` | ✅ |
| G03 | Workspaces | `/workspaces` | ✅ |
| G05 | Folder management | `/workspaces/{wsId}/folders` | ✅ |
| G06 | Documents | `/workspaces/{wsId}/documents` | ✅ |
| G07 | Document content | `/workspaces/{wsId}/documents/{docId}/content` | ✅ |
| G13 | Messages & notifications | `/workspaces/{wsId}/messages` | ✅ |
| G19 | Search | `/workspaces/{wsId}/search` | ✅ |
| G25 | Async jobs | `/workspaces/{wsId}/jobs` | ✅ |
| G29 | AI/Assist (Flint chat, SSE streaming) | `/workspaces/{wsId}/assistant` | ✅ Critical |
| G31 | Real-time events (SSE, ADR-010) | `/workspaces/{wsId}/events` | ✅ Critical |
| G04 | Permissions & ACL | `/workspaces/{wsId}/permissions` | Phase 2 |
| G08 | Document packages | `/workspaces/{wsId}/packages` | Phase 2 |
| G09 | Transmittals | `/workspaces/{wsId}/transmittals` | Phase 2 |
| G10 | Reviews & approvals | `/workspaces/{wsId}/reviews` | Phase 2 |
| G11 | Tasks | `/workspaces/{wsId}/tasks` | Phase 2 |
| G12 | RFIs | `/workspaces/{wsId}/rfis` | Phase 2 |
| G14 | Audit log | `/workspaces/{wsId}/audit` | Phase 2 |
| G15 | Reports | `/workspaces/{wsId}/reports` | Phase 2 |
| G16 | Metadata schemas | `/workspaces/{wsId}/schemas` | Phase 2 |
| G17 | Attributes | `/workspaces/{wsId}/attributes` | Phase 2 |
| G20 | Contacts | `/workspaces/{wsId}/contacts` | Phase 2 |
| G21 | Companies | `/companies` | Phase 2 |
| G23 | Notifications config | `/workspaces/{wsId}/notification-config` | Phase 2 |
| G24 | Integrations | `/integrations` | Phase 2 |
| G26 | Dashboards config | `/workspaces/{wsId}/dashboards` | Phase 2 |
| G27 | Exports | `/workspaces/{wsId}/exports` | Phase 2 |
| G28 | Templates | `/workspaces/{wsId}/templates` | Phase 2 |
| G30 | Calendar | `/workspaces/{wsId}/calendar` | Phase 2 |
| G18 | BPM | — | **Deprecated (410)** |
| G22 | Programme Mgmt | — | **Deprecated (410)** |

---

## Open Questions for Engineering

1. **`[TODO-ENG]` Chat/AI endpoint shape** — G29 SSE streaming contract is proposed above (delta/complete/error events); confirm against the LLM gateway design.  
2. **`[TODO-ENG]` Dashboard stats endpoint** — G03 workspace summary, or a dedicated G26 dashboard config group?  
3. **`[TODO-ENG]` Feature flag service** — how is the "Try New" per-user opt-in persisted? G02 user preferences or external service?  
4. **`[TODO-ENG]` NFS → S3 migration** — file content serving strategy during migration; G07 must abstract the storage backend.  
5. **`[TODO-ENG]` Subdomain routing** — confirm final region subdomain scheme; affects `VITE_API_BASE_URL` per deployment.  
6. **`[TODO-ENG]` `WorkspaceContext` vs `ScopeContext`** — prototype has both; consolidate to single `scopeStore` (Zustand) before wiring auth.  
7. **`[TODO-ENG]` CORS policy** — Spring Boot must allow requests from the React SPA origin per region.  
8. **`[TODO-ENG]` Error boundary** — add a top-level React error boundary that handles RFC 7807 ProblemDetails for user-facing error display.
9. **`[TODO-ENG]` G31 transport & fan-out (ADR-010)** — confirm SSE vs WebSocket against infra (ALB idle timeouts, per-node connection limits); pick the cluster fan-out mechanism (e.g. Redis pub/sub) and the replay-buffer retention window.
10. **`[TODO-ENG]` `totalApprox` source (ADR-011)** — exact `COUNT(*)` per list request is off the table; decide between folder rollup counters, cached counts with TTL, or sampled estimates.
11. **`[TODO-ENG]` Event → permission edge case (ADR-010)** — when a user *loses* access to a document, the invalidate→refetch model handles it (refetch 403s / omits the row), but confirm the event stream itself is filtered to entities the subscriber can see, or accept that entity IDs alone may leak existence.

---

*Last updated: 2026-07-06 — added ADR-010 (real-time sync & multi-window), ADR-011 (cursor pagination), G29 streaming spec, G31 events group*
