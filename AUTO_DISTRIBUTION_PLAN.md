# Automatic Distribution — Implementation Plan

> Status: **AD 1 built & verified in browser (2026-07-13)** — see DEVELOPMENT_LOG.md §23.
> AD 2 (governance), AD 3 (diagnostics), AD 4 (runtime loop) pending.
> Requirements locked with Oliver 2026-07-13.
> Source material: `Automatic_Distribution_SKILL.md` (legacy FusionLive AD module reference)
> and a customer ideas list (reviewed and bucketed 2026-07-13 — see §7).

## What this is (product framing)

FusionLive's Automatic Distribution routes uploaded documents to the right people based on
metadata, via an **Excel matrix** uploaded per workspace. In the wild these sheets exceed
**100,000 rows** because a flat grid forces the cartesian product of every field-value
combination × every named individual. FLUX replaces this with a **native, in-UI rules
engine** — zero Excel. Workgroups collapse the recipient axis, rich operators collapse the
value axis, and all-match semantics replace row enumeration: the same customer's 100k rows
should become **hundreds of rules**.

Access is permission-gated ("Manage Automatic Distribution Rules") and lives in a new
top-level **Admin** area on the left rail (Settings reads as personal; Admin is workspace
governance). Admin will grow across FLUX phases — Workgroups is its second occupant.

---

## 1. Key architectural decisions

| Concern | Decision | Rationale |
|---|---|---|
| **Source of truth** | Rule list, not a matrix. A read-only **matrix "coverage pivot"** view is derived from the rules (rows = expanded value combinations, columns = recipients, cells = action chips, click-through to owning rule) | Rules scale; the pivot preserves the DC's at-a-glance coverage view without spreadsheet parity |
| **Matching** | **All matching rules fire** (not first-match-wins), then dedupe | Row order silently changing outcomes is a legacy landmine |
| **Dedupe** | Same recipient+action → collapse to one. Different actions → **workspace-configurable action precedence** (default: Formal Review > Formal Approval > Transmittal > TQ > RFI > Message). Same action, different params → higher rule priority wins | A person due a review and an FYI message gets the review |
| **No codes** | Single-letter `n/A/Z/C` codes are dead in the UI — assignments read as chips: "Formal Review · Lead Reviewer". Reason vocabularies per action are **editable lists**, never frozen | Codes were a spreadsheet-era compression artifact |
| **Unmatched = visible** | No silent non-distribution. Unmatched documents land in a queue with alerting, **Open in tester** and **Re-run after fix** actions | Legacy AD's #1 support ticket |
| **Governance** | Implicit **draft → publish** with required change summary, version history (who/when/what), diff, **restore-as-draft**. One active rule set per workspace | Doc-control compliance is non-negotiable |
| **Validation** | Warns, never blocks saving to draft | Principle adopted from customer feedback on legacy hard errors |
| **Permission** | `ad.manage` (full) + `ad.view` (read-only, e.g. PMs). No permission → Admin section hidden. FLUX has no permission concept yet → new lightweight `PermissionContext` (see §2) | |
| **Scope** | Workspace-scoped, like Documents: Admin rail section renders only when `scope.kind === 'project'` (and permission held). Rule set keyed by `ProjectId` | One active rule set per workspace |
| **Engine (mock-server only)** | The real matching engine is **server-side in the SaaS platform** — the browser never evaluates rules in production. The prototype's mock server still needs one to answer the Tester/Log/Unmatched endpoints, so `evaluateDistribution(doc, trigger, ruleSet, settings, workgroups): AdEvaluation` lives in `src/utils/distributionEngine.ts` and is called **only from `src/mocks/handlers.ts`**. Pages talk HTTP contracts only, never import the engine | One implementation keeps Tester/Log/Unmatched consistent; the `AdEvaluation` payload becomes the documented API contract and the engine + its unit tests become the behavioural/acceptance spec for the real backend implementation `[TODO-ENG]` |
| **Route** | `/admin/distribution?tab=rules|matrix|tester|unmatched|log|history|settings` (+ `/admin/workgroups`). Tab in URL params, not state | Shareable/refresh-safe, matching the Search→Browser param convention |
| **Rule editor** | `DetailSlidePanel`-pattern slide-over from the rules list, not a separate page | List stays in context; established FLUX pattern |
| **Data layer** | React Query + MSW like Briefcase: `src/api/distribution.ts` (`/workspaces/:wsId/distribution/*`), handlers persist to `flux.ad.<wsId>` localStorage keys | `[TODO-ENG]` API group; consumers never talk HTTP directly |
| **Discipline field** | `DocumentMetadata` gains `discipline?: string`, seeded per project | AD's most important condition field doesn't exist on `Document` yet (only on search results). `Document`'s index signature permits it today |
| **Downstream fidelity** | Distribution **outcomes are mocked as log entries** ("Formal review started with 4 participants") — FLUX has no activity engine | Prototype scope; six action types modelled from day one |

## 2. Data model (`src/types/distribution.ts`, `src/types/workgroup.ts`)

```ts
// -- Workgroups (first use of the FusionLive concept in distribution) --
interface Workgroup {
  id: string;
  name: string;
  description: string;
  memberIds: string[];        // user ids from a small seeded user directory
}

// -- Rules --
type AdActionType =
  'formal-review' | 'formal-approval' | 'message' |
  'transmittal' | 'technical-query' | 'rfi';       // all six in first cut

type AdOperator = 'is' | 'is-not' | 'in' | 'contains' | 'starts-with' | 'between';

interface AdCondition {
  field: string;              // key from AD_CONDITION_FIELDS registry
  operator: AdOperator;
  values: string[];           // 1..n; 'between' uses [from, to]
}

type AdTrigger =
  | { kind: 'upload' }
  | { kind: 'status-change'; toStatus: DocumentStatus }
  | { kind: 'manual' };

type AdRecipientRef =
  | { kind: 'user'; userId: string }
  | { kind: 'workgroup'; workgroupId: string }
  | { kind: 'external'; email: string };  // MODEL ONLY this phase — no UI

interface AdAssignment {
  recipient: AdRecipientRef;
  action: AdActionType;
  reasonId: string;           // from workspace vocabulary (AdSettings.reasons)
  copies?: number;            // MODEL ONLY — physical distribution deferred
  colour?: 'colour' | 'bw';   // MODEL ONLY
}

interface AdRule {
  id: string;
  name: string;
  description?: string;
  triggers: AdTrigger[];      // per rule, any of the three kinds
  conditions: AdCondition[];  // AND-joined
  assignments: AdAssignment[];
  priority: number;           // conflict tiebreaker only — surfaced contextually
  enabled: boolean;
  effectiveFrom?: string;     // ISO date; dates only, no phase concept
  effectiveUntil?: string;
  updatedAt: string;
  updatedBy: string;
}

// -- Rule set: one per workspace, draft + published + history --
interface AdRuleSetVersion {
  version: number;
  rules: AdRule[];
  publishedAt: string;
  publishedBy: string;
  summary: string;            // required at publish; becomes the History entry
}

interface AdRuleSet {
  workspaceId: ProjectId;
  draft: { rules: AdRule[]; baseVersion: number };   // implicit working copy
  published: AdRuleSetVersion | null;
  history: AdRuleSetVersion[];                       // newest first
}

// -- Workspace settings --
interface AdReason { id: string; label: string }     // e.g. Lead Reviewer, Consolidator
interface AdSettings {
  actionPrecedence: AdActionType[];                  // drag-to-reorder in Settings tab
  reasons: Record<AdActionType, AdReason[]>;         // editable vocabularies
  notifyUserIds: string[];                           // unmatched + skipped-recipient alerts
}

// -- Engine output (drives Tester, Log, Unmatched) --
interface AdResolvedAssignment {
  userId: string;                       // workgroups expanded to individuals
  via: AdRecipientRef;                  // how they were matched
  action: AdActionType;
  reasonId: string;
  ruleId: string;
  dropped?: 'dedupe-same' | 'precedence' | 'priority' | 'recipient-inactive';
}

interface AdEvaluation {
  documentId: string;
  trigger: AdTrigger;
  firedRuleIds: string[];
  nearMisses: { ruleId: string; failedCondition: AdCondition }[]; // "nearest miss" UX
  resolved: AdResolvedAssignment[];     // full trace incl. dropped rows
  outcome: 'distributed' | 'unmatched';
}

interface AdLogEntry {
  id: string; at: string; documentId: string; trigger: AdTrigger;
  kind: 'distributed' | 'unmatched' | 'recipient-skipped' | 'rerun';
  evaluation: AdEvaluation;
}
```

**Condition field registry** (`AD_CONDITION_FIELDS` in `distributionEngine.ts`): `discipline`,
`documentType`, `status`, `tags` (multi-value — a rule matches if **any** value matches),
`asset`. Registry entries declare label, value source, and which operators apply. Adding a
field later is a registry entry, not a schema change.

**Unmatched queue** is derived: `AdLogEntry` rows with `kind: 'unmatched'` not yet resolved
by a later `rerun` entry for the same document. No separate store to drift out of sync.

## 3. UX (agreed 2026-07-13)

Left rail gains an **Admin** section (bottom, above Settings; project scope + permission
only): **Distribution** and **Workgroups** (read-only this phase). Distribution page tabs:

| Tab | Content |
|---|---|
| **Rules** | Virtualised list, switchable group-by (discipline / category / trigger / flat), search + stackable filter chips (discipline, recipient, action, trigger, status). Rows collapse to one-line summary (name, trigger badge, recipient count), expand to condition expression + assignment chips. Rules edited since last publish carry an "Edited" badge. New rule / edit opens the slide-over editor |
| **Matrix** | Read-only coverage pivot derived from published+draft rules; same filter bar as Rules; cells click through to the owning rule |
| **Tester** | Pick an existing document **or** hand-enter metadata → fired rules, workgroup expansion, dedupe/precedence trace, final outcome. Toggle: run against draft vs published. Shows **nearest miss** when nothing fires ("rule X failed on `status is New`") |
| **Unmatched** | Queue with tab count badge. Row: document, metadata snapshot, trigger, date. Actions: Open in tester, Re-run (deduped against already-sent), dismiss |
| **Log** | Flat distribution log incl. skipped-deactivated-recipient events |
| **History** | Published versions timeline (who/when/summary), diff view, Restore as draft |
| **Settings** | Action precedence (drag-to-reorder), reason vocabularies per action, alert recipients |

**Draft → publish:** amber banner "Draft · N changes since vX" + Publish button (manage
permission only). Publish dialog lists changed rules and requires a summary note. Read-only
users see the published set, no banner, no edit affordances.

**Rule editor (slide-over):** name/description → triggers → conditions builder (field +
operator + values rows, AND-joined) → effective dates → assignments table (recipient picker
user/workgroup, action, reason) → enabled toggle. Inline validation warnings (never blocks
draft save). **Priority is hidden by default** — surfaced contextually when the tester or a
publish-time check detects a genuine conflict ("these 2 rules conflict for J. Smith — order
them"), rather than a raw number on every rule.

The **silent-failure loop** is the flagship flow: Unmatched badge → Open in tester →
nearest-miss explanation → edit rule → re-test → publish → Re-run from queue.

## 4. Roadmap

> Stage names AD 1–4 are local to this plan (all four = the agreed "first cut"),
> not FLUX `[PHASE-N]` markers.

### AD 1 — Foundation & rules authoring ✅ DONE (2026-07-13)
- `discipline` added to `DocumentMetadata` + seeded per project
- Types (§2), seeded user directory, ~6 workgroups, ~25 seed rules across disciplines,
  default `AdSettings`; MSW handlers + `src/api/distribution.ts` + query keys
  (persist: `flux.ad.<wsId>`, `flux.workgroups`)
- `PermissionContext` (`hasPermission('ad.manage' | 'ad.view')`), backed by
  `useUserPref('dev.permissions', ['ad.manage'])` with a switcher in the BrandBanner
  profile menu (demo manage / read-only / none)
- LeftRail Admin section + routes; `AutomaticDistribution` page shell with tab bar;
  `Workgroups` read-only page
- Rules tab: virtualised grouped list, filters, expand/collapse; slide-over editor
  creating/editing **draft** rules; localization keys

### AD 2 — Governance
- Draft banner + change tracking ("Edited" badges, changes-since-vX count)
- Publish dialog (changed-rules list + required summary) → version bump
- History tab: timeline, rule-level diff, Restore as draft
- Settings tab: action precedence reorder, reason vocabulary editing, alert recipients
- Publish-time validation warnings incl. contextual priority-conflict resolution

### AD 3 — Diagnostics
- `distributionEngine.ts` complete: matching (all operators, multi-value any-match,
  effective dates, enabled), workgroup expansion, deactivated-recipient skip, full
  dedupe trace, near-miss detection
- Tester tab (document picker + manual metadata entry, draft/published toggle, trace UI)
- Matrix coverage pivot tab

### AD 4 — Runtime loop
- Trigger simulation: mock upload + status-change events run the engine; manual invoke
  from DocumentBrowser row action ("Distribute…", any user with document access)
- Log tab; Unmatched tab with count badge, Open-in-tester, deduped Re-run, dismiss
- Skipped-recipient alerting to `notifyUserIds` (mock notification entries)

### Later (post first cut)
- Job management (AD Manager equivalent: draft/submitted/completed jobs)
- Workspace-to-workspace rule sharing — whole set **or** cherry-picked rules; arrives as
  draft requiring recipient/workgroup remapping
- External email recipients UI (model exists from AD 1)
- Transmittal grouping per recipient; transmittal/message template management;
  distribution dashboard (coverage analytics)
- Workgroups management UI (create/edit/membership) — separate Admin phase

### Out of scope (deliberate)
- XLS import/export — legacy migration is a server-side concern, not this prototype
- Physical distribution UI (print shops, copies, paper size) — `copies`/`colour` stay
  model-only
- Transmittal coversheet designer
- Activity-engine features AD merely initiates: approval delays, reminders/escalation,
  prompt-based workflow continuation (noted as activity-module requirements)

## 5. Files touched (AD 1)
- **New:** `src/types/distribution.ts`, `src/types/workgroup.ts`,
  `src/data/distributionSeed.ts`, `src/data/workgroupsSeed.ts`,
  `src/utils/distributionEngine.ts`, `src/api/distribution.ts`,
  `src/contexts/PermissionContext.tsx`,
  `src/pages/admin/AutomaticDistribution.tsx`, `src/pages/admin/Workgroups.tsx`,
  `src/components/distribution/*` (tab panels, rule list, rule editor slide-over)
- **Edit:** `App.tsx` (provider + routes), `LeftRail.tsx` (Admin section),
  `src/types/document.ts` (`discipline?`), `src/data/mockDocuments.ts` (seed disciplines),
  `src/mocks/handlers.ts`, `src/api/queryKeys.ts`, `BrandBanner.tsx` (permission switcher),
  `public/locales/*` (`navigation.admin`, `admin.distribution.*`, `admin.workgroups.*`)

## 6. Decision log (locked 2026-07-13)

All-match + dedupe · unmatched queue with re-run · no codes in UI · editable vocabularies ·
users + workgroups (external = model only) · deactivated recipients auto-skip + alert ·
six actions, downstream mocked · physical distribution deferred · triggers per rule
(upload / status-change / manual) · draft→publish + history + restore in first cut ·
one active rule set per workspace · permissions: `ad.manage` + `ad.view` read-only ·
top-level Admin rail area · sharing = stage 2 · dates-only effective dating · tester in
first cut · virtualised list, target hundreds–2k rules (no 10k+ proof) · workspace-
configurable action precedence · matrix view = coverage pivot, clarity over spreadsheet
parity. Defaults taken without explicit sign-off (revisit if needed): switchable group-by
on the rules list; priority surfaced contextually instead of a raw per-rule number.

## 7. Customer ideas — bucketed (reviewed 2026-07-13)

- **In first cut:** multi-match; multi-value field evaluation; duplicate combinations
  (trivially true in a rule model); richer operators; effective-dated rules; dry-run
  simulator; unmatched alerting/report; role/group-based distribution; rule change
  history/audit; re-run/retroactive distribution (from unmatched queue, deduped)
- **Later:** group docs per recipient onto one transmittal; attachments on transmittals;
  transmittal templates; inline message editing at distribution time; message field on
  AD-initiated reviews; distribution dashboard; external/Email-out recipients (UI);
  separate trigger vs manage roles (manual invoke = ordinary document permission);
  API-triggered AD (backend concern)
- **Moot in FLUX (legacy bugs that dissolve):** notification formatting fixes;
  "New PM Status + Issue Transmittal" hard error → kept as the *warn, never block* principle
- **Activity-module concerns, not AD:** business-day approval delays; configurable
  reminders/escalation; prompt-based workflow continuation; RFI/TQ *activity behaviour*
  (AD only starts them — covered by the six action types)
