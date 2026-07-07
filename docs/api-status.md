# Flux — API Status Tracker

Single source of truth for the state of every API group the Flux SPA depends on. This file drives the shared **API Status Dashboard** webpage — update this file first, then regenerate the page, so the two never disagree.

**Dashboard:** [api-status.html](api-status.html) — self-contained, no server or build step; double-click it (or open it from your file manager) and it runs in the browser. Regenerated from this file on every update.

Full contract detail, ADRs and endpoint shapes live in [ARCHITECTURE.md](../ARCHITECTURE.md). This file tracks **status**, not specification.

**How to update:** when an endpoint is wired in the SPA, a contract is agreed with engineering, or a backend milestone lands, edit the relevant row + add a Change Log entry in the same commit as the code change.

---

## Status legend

| Column | Values |
|---|---|
| **Contract** | `Draft` (sketched, shape not settled) · `Proposed` (documented in ARCHITECTURE.md, awaiting engineering sign-off) · `Agreed` (signed off by both teams) · `Live` (real backend serving it) |
| **Front end** | `Wired (MSW)` (SPA calls the real contract over HTTP; MSW answers from mock data — swap-ready) · `Mock` (in-memory mock data, no HTTP) · `Stubbed` (UI action exists, handler is a `[TODO-ENG]` marker) · `Not started` |
| **Backend** | `Not started` · `In progress` · `Dev` (available on dev environment) · `Live` |
| **Team** | Primary engineering owner: `API` (Spring Boot services) · `DB` (Oracle) · `MSG` (messaging/eventing) · `LLM` (AI gateway) · `INFRA` · `FE` (us) |

---

## Phase 1 groups

| Group | Description | Base path | SPA consumer | Contract | Front end | Backend | Team | Notes / open items |
|---|---|---|---|---|---|---|---|---|
| G01 | Authentication & tokens (ADR-005 two-token JWT) | `/auth` | `App.tsx`, planned `authStore` | Proposed | Not started | Not started | API | Token exchange on scope switch; 401 refresh interceptor `[TODO-ENG]` in `src/api/client.ts` |
| G02 | Users & profiles | `/users`, `/workspaces/{wsId}/members` | — | Draft | Not started | Not started | API | Candidate home for user prefs, favourites, "Try New" flag and briefcase (Q3, Q12) |
| G03 | Workspaces | `/workspaces` | `useWorkspaces` → BrandBanner, Dashboard, map | Proposed | **Wired (MSW)** | Not started | API | Dashboard stats endpoint unconfirmed (Q2); project geo metadata home unconfirmed (Q17) |
| G05 | Folder management | `/workspaces/{wsId}/folders` | `useFolderTree` → FolderTree | Proposed | **Wired (MSW)** — read; CRUD not exercised | Not started | API | Writes need `Idempotency-Key` + ETag/`If-Match` (client marks in place, backend must honour — Q13) |
| G06 | Documents | `/workspaces/{wsId}/documents` | `useDocuments` (infinite query) → DocumentBrowser | Proposed | **Wired (MSW)** | Not started | API / DB | Cursor pagination per ADR-011. Category chips + column text filters still client-side → need G06 params (Q14); grouping subtotals need server aggregation (Q15); `totalApprox` source (Q10) |
| G07 | Document content | `…/documents/{docId}/content` | Download/upload/thumbnail actions, MyBriefcase bulk download | Draft | Stubbed | Not started | API / INFRA | NFS → S3 migration strategy (Q4); renditions = content variants? (Q16) |
| G13 | Messages & notifications | `/workspaces/{wsId}/messages` | Dashboard feed, BrandBanner bell, "Message" doc action | Draft | Mock | Not started | API / MSG | Distinct from G31 by design — user-facing content only (ADR-010) |
| G19 | Search | `/workspaces/{wsId}/search` (POST) | `useSearch` → SearchResults | Proposed | **Wired (MSW)** | Not started | API / DB | Facets drive FilterPanel chips. Enterprise all-workspaces search uses a sentinel `wsId` — needs a real answer (Q18). Saved searches = Phase 2 |
| G25 | Async jobs | `/workspaces/{wsId}/jobs` | (global — uploads, bulk ops) | Proposed | Not started | Not started | API | Any write >2 s returns `202` + job ref; G31 `job.updated` replaces polling when stream healthy |
| G29 | AI assistant — Flint | `/workspaces/{wsId}/assistant` | Chat.tsx (mock `setTimeout` today) | Draft | Mock | Not started | **LLM** | SSE token-stream contract proposed (delta/complete/error) — confirm against LLM gateway (Q1); context payload schema `{ scope, context: { type, id } }` (Q1) |
| G31 | Real-time events (ADR-010) | `/workspaces/{wsId}/events` | (global — React Query invalidation targets = `queryKeys.ts`) | Proposed | Not started | Not started | **MSG** | SSE vs WebSocket vs infra constraints; cluster fan-out; replay buffer (Q9); permission-filtered stream (Q11) |
| — | User briefcase | `/user/briefcase` | `BriefcaseContext` → MyBriefcase, doc actions | Proposed | **Wired (MSW)** — optimistic mutations | Not started | API | Not in G01–G30; suggested home G02 (Q12). Freshness states need server-side revision comparison (Q12) |

## Phase 2 groups

| Group | Description | Base path | Contract | Notes |
|---|---|---|---|---|
| G04 | Permissions & ACL | `/workspaces/{wsId}/permissions` | Draft | Interacts with Q11 (event stream filtering) |
| G08 | Document packages | `/workspaces/{wsId}/packages` | Draft | Packages page prototype exists in SPA |
| G09 | Transmittals | `/workspaces/{wsId}/transmittals` | Draft | |
| G10 | Reviews & approvals | `/workspaces/{wsId}/reviews` | Draft | |
| G11 | Tasks | `/workspaces/{wsId}/tasks` | Draft | |
| G12 | RFIs | `/workspaces/{wsId}/rfis` | Draft | |
| G14 | Audit log | `/workspaces/{wsId}/audit` | Draft | |
| G15 | Reports | `/workspaces/{wsId}/reports` | Draft | |
| G16 | Metadata schemas | `/workspaces/{wsId}/schemas` | Draft | Possible home for project geo metadata (Q17) |
| G17 | Attributes | `/workspaces/{wsId}/attributes` | Draft | |
| G20 | Contacts | `/workspaces/{wsId}/contacts` | Draft | |
| G21 | Companies | `/companies` | Draft | |
| G23 | Notifications config | `/workspaces/{wsId}/notification-config` | Draft | Likely home for Subscribe actions (Q16) |
| G24 | Integrations | `/integrations` | Draft | |
| G26 | Dashboards config | `/workspaces/{wsId}/dashboards` | Draft | Alternative home for dashboard stats (Q2) |
| G27 | Exports | `/workspaces/{wsId}/exports` | Draft | DocumentBrowser full export belongs here |
| G28 | Templates | `/workspaces/{wsId}/templates` | Draft | |
| G30 | Calendar | `/workspaces/{wsId}/calendar` | Draft | |

**Deprecated:** G18 (BPM), G22 (Programme Mgmt) — return `410 Gone`.

---

## Open questions for engineering

Numbering 1–12 matches ARCHITECTURE.md §Open Questions; 13+ are harvested from `[TODO-ENG]`/`[TBD]` code markers.

| # | Question | Groups | Owner | Status |
|---|---|---|---|---|
| 1 | G29 SSE streaming contract (delta/complete/error events) + context payload schema — confirm against LLM gateway design | G29 | LLM | Open |
| 2 | Dashboard stats: G03 workspace summary or dedicated G26 endpoint? | G03/G26 | API | Open |
| 3 | "Try New" feature flag persistence — G02 user prefs or feature-flag service? | G02 | API | Open |
| 4 | NFS → S3 migration: G07 must abstract the storage backend during migration | G07 | INFRA | Open |
| 5 | Final region subdomain scheme (affects `VITE_API_BASE_URL` per deployment) | — | INFRA | Open |
| 6 | ~~WorkspaceContext vs ScopeContext~~ | — | FE | **Resolved 2026-07-06** — ScopeContext is the single source |
| 7 | CORS policy: Spring Boot must allow the SPA origin per region | — | API/INFRA | Open |
| 8 | Top-level React error boundary rendering RFC 7807 ProblemDetails | — | FE | Open |
| 9 | G31 transport (SSE vs WebSocket vs ALB idle timeouts / per-node connection limits), cluster fan-out (e.g. Redis pub/sub), replay-buffer retention | G31 | MSG/INFRA | Open |
| 10 | `totalApprox` source — folder rollup counters vs cached counts w/ TTL vs sampled estimates (exact `COUNT(*)` ruled out, ADR-011) | G06/G19 | DB/API | Open |
| 11 | Event stream permission filtering — is `/events` filtered to entities the subscriber can see, or do entity IDs leak existence? | G31/G04 | MSG/Security | Open |
| 12 | Briefcase API group home (suggested G02) + server-side computation of freshness states (`newer-available`/`checked-out`/`unavailable`) | G02 | API | Open |
| 13 | Idempotency-Key on POSTs and ETag/`If-Match` optimistic locking — confirm backend honours both (client call-sites already marked) | G05/G06 | API | Open |
| 14 | Category (tag) chips + column text filters as G06 query params (currently client-side over loaded pages) | G06 | API | Open |
| 15 | Grouping subtotals over large collections — SPA currently fetches everything (limit 1000); needs a server-side aggregation answer | G06 | API/DB | Open |
| 16 | Endpoint homes for row/panel actions: Subscribe (G23?), Favourite (G02?), Share link (dynamic/static), Renditions (G07 content variants?) | G02/G07/G23 | API | Open |
| 17 | Project geo metadata (lat/lng/locality for map view) — G03 workspace attributes or G16 metadata schema? Not in current G03 draft | G03/G16 | API/DB | Open |
| 18 | Enterprise (all-workspaces) search — SPA passes a sentinel `wsId`; needs a real cross-workspace search contract | G19 | API/DB | Open |
| 19 | Placeholders — a G06 document state or a separate resource? | G06 | API | Open |
| 20 | Feedback widget endpoint (`POST /api/v1/feedback`) — confirm service home | — | API | Open |
| 21 | OpenAPI specs published per group so the SPA can generate types (`openapi-typescript` → `src/api/types/generated/`) | all | API | Open |

---

## Cross-cutting contracts (apply to every group)

| Concern | Rule | Reference |
|---|---|---|
| Errors | RFC 7807 `application/problem+json` on every non-2xx | `src/api/client.ts` `ApiError` |
| Pagination | Keyset/cursor only — `{ items, nextCursor, totalApprox }`; no offset paging, no `X-Total-Count` | ADR-011 |
| Auth | Two-token JWT: platform token + per-workspace token exchange | ADR-005 |
| IDs | UUIDs on the wire; UUID–integer bridge inside Oracle | ADR-009 |
| Real-time | One SSE stream per workspace (G31), separate from G13; invalidation targets = `src/api/queryKeys.ts` | ADR-010 |
| Coexistence | Struts + SPA share the Oracle schema until Jul 2027; Struts writes must stay valid for REST reads | ARCHITECTURE.md |
| Filenames | UTF-8 everywhere; preserve `′ ″` engineering unit symbols; Windows-safe `"` → `″` conversion on download | CLAUDE.md §Filename rules |

---

## Change log

| Date | Change |
|---|---|
| 2026-07-07 | Tracker created. Briefcase wired to `/user/briefcase` over HTTP (React Query + MSW, optimistic mutations). |
| 2026-07-07 | SearchResults wired to G19 over HTTP (`useSearch` + MSW). |
| 2026-07-06 | ADR-010 (real-time sync & multi-window) and ADR-011 (cursor pagination) adopted; G31 events group and G29 SSE streaming spec proposed. |
| 2026-07-06 | DocumentBrowser wired to G06 (server-side folder/status/type filters, sort, cursor pagination); folder tree to G05; workspaces to G03 — all via MSW against the real contracts. |

*Last updated: 2026-07-07*
