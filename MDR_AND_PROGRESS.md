# FusionLive — MDR/DDR, Placeholders and Progress Measurement

> **Status:** domain reference, written 2026-08-09 from a walkthrough by the product
> owner. Records how FusionLive actually works in EPC projects, so the Flux prototype
> models the right thing. Prototype coverage is called out per section — most of the
> progress side is **not built yet**.
>
> Related: **ARCHITECTURE.md** §Document Placeholders (API mapping), **DEVELOPMENT_LOG.md**
> §26 (the grid build), `src/data/mockPlaceholders.ts`, `src/types/document.ts`.

---

## 1. Two halves of a document

A FusionLive document is two things at once:

| Half | Where it lives | Notes |
|---|---|---|
| The **record** — document number, discipline, dates, revision, workflow state | Oracle, per region | Integer PKs, bridged to UUIDs in the API (ADR-009) |
| The **content** — the actual file | Content store: **NFS today, moving to per-region S3** (AWS likely) | Served via G07; content must not leave its originating region |

The two are independent. A record can exist with **no content** — that is a
**placeholder**, and it is the foundation of how FusionLive measures progress.

---

## 2. The MDR / DDR — the placeholder list

At the start of an EPC project, project controls and engineering define **every
expected deliverable before a single drawing or specification exists**. That
schedule is the:

- **MDR** — Master Document Register, or
- **DDR** — Document Deliverable Register

(the two names are used interchangeably by different customers).

**The MDR is not a separate thing from the document register.** Every document in a
FusionLive project has a record in Oracle whether or not it has content in NFS/S3
— placeholder and content-bearing objects alike. The MDR is a *view* of those
records, not a distinct resource with its own storage. (Confirmed by the product
owner 2026-08-09; the prototype's earlier open question about whether the MDR was
a separate resource is answered — it is not.)

A large project's MDR may hold **10,000+ items**. Every one of them starts life as
a placeholder: an empty container carrying the metadata that matters for planning
and tracking —

- Document number / reference
- Engineering discipline
- Planned delivery dates
- **Budgeted hours or weighting** (its share of total project engineering effort)

The MDR is therefore not a side-feature of the document grid. It *is* the project
plan for engineering, expressed as documents. Suppliers, vendors and contractors
upload against it; project managers measure against it.

**Prototype:** placeholders exist as `Document` records with
`contentState: 'placeholder'`, `dateExpected` and `responsibleParty`
(`src/data/mockPlaceholders.ts`, 7 per project). Budgeted hours / weighting are
**not modelled yet** — see §5.

---

## 3. Progress: Rules of Credit (Earned Value Management)

Progress could be measured crudely as "how many documents reached As Built". Real
EPC tracking in FusionLive adds a layer of granularity called **Rules of Credit**
(an Earned Value Management technique).

**Progress is not binary.** As content is uploaded to a placeholder and moves
through its approval workflow, the record *earns* a predefined percentage of its
budgeted progress. A standard weighting model:

| Workflow state | Earned | Meaning |
|---|---:|---|
| **Placeholder** | **0%** | The record exists on the MDR and is scheduled. No content. |
| **Issued for Review (IFR)** | **25%** | First draft submitted for internal or client review |
| **Issued for Approval (IFA)** | **50%** | Updated draft submitted for formal sign-off |
| **Issued for Construction (IFC)** | **85%** | Approved; physical build can begin |
| **As Built** | **100%** | Final redlines incorporated after construction finishes |

Aggregating earned percentage across every placeholder in the register gives project
managers a **quantifiable, granular measure of engineering progress** across the
whole lifecycle — not "412 of 10,000 documents are finished" but "engineering is
37.4% complete", broken down by discipline, area, contractor or package.

### 3.1 Statuses are customisable — never key logic off the string

**IFR / IFA / IFC / As Built are examples, not a fixed vocabulary.** Each FusionLive
customer names their own ladder and sets their own percentages. One project's "IFC"
is another's "Approved for Construction" is another's "Rev 0 Issue".

Consequences for any implementation:

- The status ladder, its labels and its earned percentages are **workspace
  configuration**, not constants in code.
- **Never gate behaviour on a status string.** Whether a record can be downloaded,
  previewed or uploaded to depends on whether content exists — use
  `isPlaceholder(doc)` / `contentState`, never `status === 'Placeholder'`.
- Reporting must read percentages from configuration, not infer them from names.

### 3.2 What the grid can and cannot show

**The document grid lists CURRENT versions only.** Two consequences that are easy
to get wrong:

- **`Superseded` never appears in the grid.** A superseded revision is by
  definition not the current one. It is a concept, not a grid status — the only
  place a user sees it is a document's **Version Stack**, which is exactly where
  they go to look at earlier revisions. It stays in `DocumentStatus` (the version
  stack renders it, and Automatic Distribution genuinely fires a "superseded
  notice" when a new revision replaces an old one) but nothing that generates or
  filters grid rows may offer it.
- **There is no `Archived` status.** FusionLive does not archive documents.
  Removed from the type, the seeds, the filters and both locale packs.

**Prototype:** the underlying `DocumentStatus` vocabulary is still a fixed
ladder because the demo needs something concrete, but the **journey view is fully
data-driven** — `DocumentJourney` renders whatever steps it is
handed and never switches on a label. To make the point visible, the four demo
projects each use a *different* stage vocabulary over identical mechanics
(`LADDERS` in `src/data/mockJourneys.ts`):

| Workspace | Stage names |
|---|---|
| Marra Ridge (mine) | Placeholder → Uploaded (New) → Issued for Review → Issued for Approval → Issued for Construction → As-Built |
| Port Hedland (port) | Scheduled → Received → Squad Check → Client Approval → Approved for Construction → As-Built |
| Kwinana (process) | Placeholder → Uploaded → IDC Review → Issued for Approval (IFA) → Issued for Construction (IFC) → As-Built |
| Goldfields (rail) | Registered → Submitted → Discipline Check → Design Approval → Construction Issue → Final Handover |

The percentages attached to those stages differ per workspace too. They are
**illustrative mock values** — there is no admin UI, no storage, and no
aggregation. The intent is to show *how* earned progress reads on screen, not to
implement EVM.

---

## 4. Placeholders in the version stack

Placeholders are **not only** an at-project-start, MDR-population thing. FusionLive
also creates them mid-lifecycle, on top of an existing document's version stack.

The canonical flow:

1. A supplier uploads revision A of a deliverable.
2. It goes out for **Review** (a FusionLive *activity* — Flux hasn't tackled
   activities yet).
3. Reviewers return comments: revise these engineering elements.
4. The review closes. Comments go back to the supplier/vendor.
5. **As part of closing the review, FusionLive automatically pushes a placeholder
   onto the top of the version stack**, waiting for the next revision.
6. The supplier logs in, sees a placeholder carrying the right document reference,
   and uploads the revised content into it.

So a document's version stack can look like:

```
  ▸ Rev B   Placeholder     ← current version, 0%, awaiting the revised deliverable
    Rev A   Under Review    ← has content, review closed with comments
    Rev A   New             ← superseded by the reviewed copy
```

### What this means for the UI

- Opening a document's **properties may show a placeholder at the top with a full
  version stack underneath it.** "This document has no content" and "this document
  has history" are both true simultaneously.
- The empty state must not read as "nothing here" — earlier revisions are viewable
  and downloadable even when the current version is not.
- It also explains why `contentState` exists as a field alongside the status value:
  **having content is a property of a version, not of the document.**

**Prototype:** visualised. Most Flux placeholders are first-issue MDR placeholders
with nothing beneath them, but four are seeded as **revision-cycle placeholders**
so the loop can be experienced — one per project, listed in
`REVISION_CYCLE_PLACEHOLDER_IDS` in `src/data/mockJourneys.ts`:

| Project | Document | What it shows |
|---|---|---|
| Marra Ridge | `MR-PRO-DWG-203-R1` | Conveyor profile, rejected with 6 comments, R2 placeholder on top |
| Port Hedland | `PH-MAR-CALC-343-R1` | Berthing energy calculation awaiting revision |
| Kwinana | `KW-PRC-DWG-514-R1` | Exchanger datasheet returned to the vendor |
| Goldfields | `GF-SIG-SPEC-714-R1` | Train control interface spec awaiting revision |

Open one and the Properties tab shows the journey looping back to 0% for the new
revision, while the **Version Stack** tab shows the placeholder sitting on top of
the reviewed revision that still has its file. The review *activity* that would
create that placeholder is not built — the outcome is seeded directly.

Still to come: a real revisions endpoint
(`GET /workspaces/{wsId}/documents/{docId}/revisions`, G06) behind the version
stack, and the activities/review work that drives the transition.

---

## 5. Status of this in Flux — what's built and what isn't

| Concept | Prototype state |
|---|---|
| Placeholder records with metadata, no content | ✅ Built — `contentState`, `dateExpected`, `responsibleParty` |
| Placeholders in the document grid, filterable | ✅ Built — table / list / card, `?contentState=` filter, separate header count |
| `Placeholder` as the 0% status rung | ✅ Built — `DocumentStatus` value, one chip, never combined with `New` |
| Overdue against planned delivery date | ✅ Built — `dateExpected` column + rose treatment |
| Journey timeline in the properties panel | ✅ Built — `DocumentJourney`, bottom of the Properties tab |
| Rules of Credit shown per stage + document total | ✅ Built as **visualisation only** — percentages are hardcoded mock values |
| Rejection branch off the main timeline | ✅ Built — red branch, review-closed-with-comments |
| Version Stack tab | ✅ Built — `VersionStack`, per-revision grid in the panel |
| Placeholder on top of a version stack | ✅ Visualised — four seeded documents demo the loop (see §4) |
| Per-workspace stage vocabularies | ✅ Demonstrated — four different ladders across the four projects |
| Framed in-app document viewer, from every eye icon | ✅ Built — `DocumentViewer`, with maximise and open-in-new-tab |
| MDR / DDR as a first-class register view | ❌ Not built — and **placeholder creation is a future Flux phase**: both the Excel template export/import route and UI creation land with document creation ("upload new") |
| Budgeted hours / weighting per deliverable | ❌ Not modelled — no field on the document |
| Rules of Credit as real workspace configuration | ❌ **Deferred to a later Administration phase** — admins will configure stages and percentages there |
| Aggregate % complete (project / discipline / contractor) | ❌ Not built — the natural Dashboard feature |
| Reviews / activities that push a placeholder onto the stack | ❌ Not built — "activities" is a later Flux workstream; the placeholder is seeded, the review that creates it is not |

### The `Placeholder` → `New` transition

**A record cannot be both `Placeholder` and `New`.** `Placeholder` means no content.
`New` is what the record becomes the instant content lands on it. This is the
transition that:

- moves the record off 0% onto the first earning rung,
- turns Upload into View/Download/Rendition,
- and is what **Automatic Distribution** actually fires on — which is why
  `PM_STATUSES` in `distributionEngine.ts` deliberately excludes `Placeholder`
  (a record with no content has nothing to distribute).

---

## 5a. UI: where progress is shown

### Opening the document — the framed viewer

Clicking the **eye icon anywhere in the app** (grid row action menu, properties
panel action bar, or a revision in the Version Stack) opens `DocumentViewer`: the
Apryse/PDFTron viewer experience **framed inside FLUX** rather than launched into
a new browser tab, which is what FusionLive does today via
`OpenPdfTronViewerServlet`.

Why it matters: the new tab drops the user out of the app — folder tree, grid
selection and properties panel all gone. Framed, the viewer sits below the banner
and right of the left rail so the user can still see where they are.

Two escapes live in the viewer's white menu header, alongside the usual toolbar:

- **Maximise to full page** — expands to the whole viewport, and back.
- **Open in new tab** — the legacy behaviour, kept deliberately.

Everything below the toolbar is mocked: the page raster is the document's
thumbnail, and the Markup / Comments panels read from `mockMarkups.ts`.
[TODO-ENG] the real build is either the existing servlet in an `<iframe>` or the
Apryse WebViewer SDK mounted in the SPA — the SDK is what would let markup state
talk to the rest of the UI.

### The properties panel

The properties side panel (`DetailSlidePanel`, 360px default, user-resizable) has
two tabs:

**Properties** — metadata as before, with `DocumentJourney` injected at the
bottom. The journey is a **vertical** timeline: horizontal was rejected because a
five-node ladder plus a descending rejection branch cannot stay legible at 360px.
Vertical is also fluid — no hardcoded widths, so it survives the panel resize.

- Node states use distinct tones: **complete** solid dark, **current** brand blue
  with a ring and a `CURRENT STATUS` badge directly above the label, **upcoming**
  hollow with a dashed outline and dashed connector.
- **Red is used exclusively on the rejection path** — node, connector elbow,
  label and reason line. Nothing else in the component is red.
- Each node carries its earned percentage; the section header carries the
  document's current total and a progress bar.
- Rejections are drawn as a **branch off the spine**, indented with an elbow,
  because a rejection is not a rung — the document does not advance, it goes back.
- **Anything that is not a rung earns nothing.** Rejection branches carry no
  percentage, so the document's total walks back to the last real rung rather
  than reporting zero. (Superseded/Archived end-states were handled here too
  until §3.2 removed them from the grid — no grid document can reach one.)

**Version Stack** — a compact per-revision grid (Rev / Status / Date, with author
and file on a second line). The current revision is highlighted; view and download
are disabled on a placeholder revision, matching the rule applied everywhere else.
The tab only appears for documents, and only when there is a stack.

Deliberately **not** shown in the journey: the aggregate project percentage. That
belongs on the Dashboard, over the whole register — not on a single document.

---

## 5b. Verification — what is automated, what needs eyes

Run everything with **`npm run check`** (typecheck → lint → test).

### Automated

The domain rules in this document are pinned by tests, so a future change to the
seed generators or the ladder can't silently break them:

| Rule (this doc) | Test |
|---|---|
| Placeholder-ness drives affordances, not the status string (§3.1) | `src/types/document.test.ts` |
| Overdue = placeholder **and** past `dateExpected`; never on the due date itself | `src/types/document.test.ts` |
| Current node = **last** status match, so a post-rejection revisit wins (§4) | `src/utils/journey.test.ts` |
| Non-rungs earn nothing; earned walks back to the last real rung | `src/utils/journey.test.ts` |
| Rejection is a branch, not a rung; the loop returns to a 0% placeholder (§4) | `src/data/mockJourneys.test.ts` |
| Revisions progress R1→R2→R3 across the timeline, matching the stack | `src/data/mockJourneys.test.ts` |
| Version stack is newest-first with exactly one current entry | `src/data/mockJourneys.test.ts` |
| A placeholder version never claims a file type or size | `src/data/mockJourneys.test.ts` |
| Grid never contains `Superseded` or `Archived` (§3.2) | `src/data/documentCorpus.test.ts` |
| Every placeholder has a real `folderId`, `dateExpected`, `responsibleParty` | `src/data/documentCorpus.test.ts` |
| Folder counts exclude placeholders | `src/data/documentCorpus.test.ts` |
| Search classifies placeholders as `placeholder` / `hasUploadedContent: false` | `src/data/documentCorpus.test.ts` |
| Every project seeds both an overdue and an on-schedule placeholder | `src/data/documentCorpus.test.ts` |

### Manual — not covered

The suite runs in a **node** environment with no jsdom or Testing Library
installed, so nothing renders. Everything visual needs a human:

1. **Grid cues** — dashed icon in the filetype slot, `Placeholder` status chip,
   `--` in file-derived columns, `Date Expected` in rose with a clock icon once
   overdue. Check at both densities (Comfy / Compact) and in all three view modes.
2. **Selection still wins** — select and hover a placeholder row; the placeholder
   styling must not override the selected / active-row / panel-open states.
3. **Panel resize** — drag the panel wider and narrower; the journey must not clip
   or overflow at any width. (The *absence* of a hard-coded width is tested; how it
   actually reflows is not.)
4. **The framed viewer** — open it from all three eye icons (grid row menu,
   properties action bar, a Version Stack revision) and confirm the same
   experience each time; maximise and restore; open-in-new-tab; Escape closes.
5. **Localisation** — switch to `fr-FR` and confirm no raw keys appear in the
   journey, version stack, tabs, viewer or placeholder banner.
6. **Density and view modes** — placeholder cues at Comfy vs Compact, and across
   table / list / card.

Items 1 and 2 above (journey rendering, version stack) are **now automated** —
`jsdom` and `@testing-library/react` were added 2026-08-09. Component tests opt in
per-file with `// @vitest-environment jsdom`; because the suite runs
`globals: false`, each such file must call `afterEach(cleanup)` itself.

---

## 6. Open questions for engineering

Raised by the product owner 2026-08-09 for Engineering to pick up against the
Oracle/Swagger spec. **These are open — do not treat the prototype's answers as
decisions.**

1. **Field names.** Flux invents `contentState`, `dateExpected` and
   `responsibleParty` on the document, plus a `?contentState=` query param and
   `placeholderApprox` on the G06 list envelope. What are the real ones?
2. **Journey source.** Is there a document history/audit endpoint the timeline can
   read? And does the stage ladder definition come back with the document, or is it
   fetched once per workspace as configuration and joined client-side?
3. **Rules of Credit storage.** Where do the percentages live — workspace config,
   per document category, per register? Are they versioned and audited when an
   admin changes them mid-project (a change silently restates reported progress)?
4. **Budgeted weighting units.** Hours, a percentage, or an arbitrary unit summed
   across the register?
5. **Earned value across a revision cycle.** When a review closes and a placeholder
   is pushed onto the stack, does the placeholder inherit the previous revision's
   metadata and weighting — and does the document *lose* earned percentage when it
   drops back to a 0% placeholder revision, or is earned value retained at its
   high-water mark? **This one changes progress reporting on every revision cycle
   and is the most consequential of the five.**

### Answered — no longer open

- ~~Is the MDR a distinct resource?~~ **No.** Every document in a FusionLive
  project has an Oracle record whether or not it has content in NFS/S3. The MDR is
  a view over those records, not separate storage. (§2)
- ~~Should `Superseded` / `Archived` be document statuses?~~ **No, neither exists.**
  Superseding is a relationship between revisions, expressed by position in the
  version stack; documents are never archived. (§3.2)
