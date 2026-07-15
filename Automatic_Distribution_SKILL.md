---
name: fusionlive-automatic-distribution
description: "Use this skill when answering questions about, documenting, configuring, or troubleshooting FusionLive's Automatic Distribution (AD) module — including the Distribution Matrix spreadsheet, distribution codes (n/A/Z/C), print shop / reprographics distribution, the Automatic Distribution Manager, distribution-triggered activities (Formal Review, Approval, Message, Transmittal), or the AD_* database tables. Triggers: 'Automatic Distribution', 'AD', 'distribution matrix', 'distribution codes', 'auto distribution', 'AD_MATRIX', or bulk document routing on upload in FusionLive."
sources: "FusionLive User Guide (June 2026), pp. 26–31, 116–119, 308+; FusionLive Technical Reference (DB schema)"
---

# FusionLive Automatic Distribution (AD)

## What it is

Automatic Distribution is a FusionLive module that routes uploaded documents to the right people — digitally, physically via print shops, or both — based on the document's **metadata**, without anyone manually choosing recipients. It can also **initiate activities** (Formal Reviews, Approvals, Messages, Transmittals) as part of the distribution.

The routing rules live in a **Distribution Matrix**: an Excel (.XLS) spreadsheet mapping combinations of document category field values → recipients → coded actions. When documents are uploaded (or manually pushed through the Automatic activity), FusionLive matches their metadata against the matrix and executes the matching row. **If metadata matches no row, the documents are not distributed.** Matching uses the **first match found**, and text fields must match the entire string.

There is also a sibling **Manual Distribution** flow, where a user picks documents and fills out the same matrix-style grid (copies, colour, action, reason for issue) per recipient by hand. Both flows feed the same job pipeline.

## Key concepts

| Concept | Meaning |
|---|---|
| **Distribution Matrix** | The .XLS rulebook, uploaded per workspace (or per AD Administrator if Workspace Level Upload is off). Cannot be deleted once uploaded — only replaced. |
| **Distribution Codes** | Single letters defined in *Admin → Manage Distribution Codes* identifying distribution **actions** (activity to start) and **reasons for issue** (recipient's role). Frozen for editing once a matrix is uploaded. |
| **Code sequence `n/A/Z/C`** | The cell value at each (field-value-row × recipient-column) intersection: **n** = number of physical copies (optional), **A** = action code, **Z** = reason-for-issue code, **C** = colour/B&W (optional). Digital-only distributions use just `A/Z`. |
| **AD Administrator / Manager** | Roles that manage the matrix (via *My Profile → Manage Distribution Matrix*) and oversee jobs. |
| **Automatic Distribution Manager** | Page (Activities → Distribution → Automatic Distribution Manager) listing all Draft / Submitted / Completed distribution jobs from both auto and manual flows. Drafts can be edited or deleted; submitted jobs can be marked complete; transmittal sheets can be opened/downloaded. |
| **Print shops / reprographics** | Workspace companies that receive physical-copy requests, with per-shop defaults (paper size, scale, media, punch/fold, due date, cost centre, PO number, etc.). Multi Repro allows more than one print shop per matrix. |

## Matrix spreadsheet anatomy (Distribution Chart tab)

Four quadrants split by blue dividers:

- **Upper-left** — document category **fields** used for triggering (Document_Field row + Category row). Only list fields distribution depends on. Multi-value fields only usable if they contain a single value; if a metadata field and numbering field share a name, prefer metadata (numbering shown in brackets).
- **Upper-right** — **recipients** (users), with the print shop serving each user in the row beneath.
- **Lower-left** — **field value combinations** that trigger rows. E.g. Discipline=Engineering + Document Type=Report + PM Status=New → formal review; same but PM Status=Reviewed → distribute by message.
- **Lower-right** — the **n/A/Z/C codes** per value-row per recipient. Plus a Transmittal Numbering column (for Digital Copy - Standard/Issue Transmittal rows) and a Message_Template column (for Digital Copy - Message rows).

Other tabs: **Default Set up** (field separator `/`, wildcard `,,,`, approval delay, print shop settings, sender details, transmittal method/quantity/default reason), **Message** (subject/header/footer templates per action; Short Description is mandatory for transmittal distribution, comments limited to 300 chars), **Transmittal** (physical coversheet layout — configure only with an Idox consultant), **Values** (hidden; options for Default Set up dropdowns).

## Suggested standard code set (Idox convention)

| Action | Code | Reason-for-issue codes |
|---|---|---|
| Digital Copy - Formal Review | **R** | T lead review · S consolidation · C comment · I information |
| Approval | **A** | T assigned to · C comment · I information |
| Digital Copy - Message | **M** | T to · I cc |
| Digital Copy - Standard Transmittal | **D** | T to |

Example: reports for review → Neil `R/T` (lead), Frank `R/S` (consolidator), Geraldine `R/C` (commenter). If review types are enabled there is a Digital Copy - Formal Review action per type, but only one formal-review action may apply to a given document.

## Lifecycle & workflows

1. **Prerequisites**: document categories + fields active with required values; distribution codes defined; print shops set up as workspace companies.
2. **Configure**: start from Idox's template .XLS, fill the four quadrants and tabs, save as **.XLS** (not .xlsx).
3. **Upload**: My Profile → Manage Distribution Matrix → Choose File → Upload. FusionLive validates against the workspace; fix errors and re-upload. Replaces any existing matrix. Download button available once a valid matrix exists.
4. **Trigger paths**:
   - **On upload** — if AD-from-Upload is enabled, documents distribute automatically per the matrix immediately after upload metadata is set.
   - **PM status change** — a status (e.g. Issued) can be configured to trigger automatic distribution; used to build formal-review chains (each review type in a chain needs a unique AD code).
   - **Manually invoked auto** — Documents page → Activities → Distribution → Automatic; standard recipients come from the matrix, extra users can be added, then Save/Submit.
   - **Manual Distribution** — fully hand-specified via the Manual Distribution Matrix grid.
5. **Manage jobs**: Automatic Distribution Manager — Draft → Submitted → Completed. Only drafts can be deleted.

## Attachment behaviour

- With *Show parent-attachment relation in Transmittals* enabled: attachments ride along on transmittals with their parent.
- With the *AD attachment module* enabled: attachments can distribute without a parent.
- With **both** enabled: attachments cannot go on a transmittal without their parent.

## Data model (AD_* schema, 20 tables)

Prefix `AD_` = Auto Distribution module. Key tables:

- **AD_MATRIX** — one row per uploaded matrix: `MATRIX_ID, OWNER_PARTY_ID, WORKSPACE_ID, FIELD_SEPARATOR, WILD_CHAR, CONTENT_ID` (the stored .XLS), `IS_ACTIVE`. Confirms per-owner-per-workspace matrix ownership and the configurable separator/wildcard.
- **AD_MATRIX_DIST_DOC_GROUP / AD_MATRIX_DDG_PART / AD_MATRIX_DDG_PART_VALUE / AD_MATRIX_DDG_USER** — the parsed matrix: each "distribution doc group" is a value-combination row, its parts are (field, value) pairs (`PROPERTY_ID`, `VALUE`), and DDG_USER maps rows to recipients/codes.
- **AD_MATRIX_DEFAULTS / AD_MATRIX_REPRO_DEFAULTS / AD_MATRIX_TRANS_DEFAULTS** — the Default Set up tab (general / print shop / transmittal defaults).
- **AD_DISTRIBUTION** — a distribution job: `STATUS`, `NAME`, `CREATED/SENT/UPDATED_DATE`, `RPR_JOB_ID` (repro job link), `IS_AUTOMATIC` (auto vs manual flag), `IS_MARK_DISTRIBUTED`.
- **AD_DISTRIBUTION_DEFAULTS** — 37-column per-job print/repro settings (colour, drawing size, sheet size, scale, media, fold, punch, notes…).
- **AD_DISTRBUTED_DOC** *(sic — misspelled in schema)* + **AD_DIST_DOC_USER** — documents in a job and per-document-per-user code assignments.
- **AD_DIST_SUB_DRAFT / AD_DIST_SUB_DOC_DRAFT / AD_DIST_SUB_RECIPIENTS_DRAFT** — draft-state job persistence (the Save / Save and Quit path).
- **AD_LEGEND** — the code legend; **AD_MESSAGE_TEMPLATES** — AD message templates (Manage AD Message Templates admin page).

## Gotchas & constraints checklist

- Matrix file must be **.XLS**; upload **replaces** existing matrix; matrix **cannot be deleted**, only replaced.
- After first matrix upload, existing distribution codes become **non-editable**.
- **First-match wins**; order rows accordingly. Text values must match **exactly and entirely**. Wildcard default is `,,,`.
- No match → **silent non-distribution** (documents simply aren't distributed) — a common "why didn't my document distribute" root cause.
- Multi-value fields: only usable with a single value.
- Omitted `C` code → black & white by default (or Default Setup colour value when no physical copies at all).
- Transmittal Quantity is mandatory (≥1); transmittal Short Description mandatory; transmittal comments ≤300 chars.
- Only **draft** jobs are deletable in the AD Manager.
- One formal-review action per document even with multiple review types enabled.
- Interaction rules with Forced Alerting: if neither Forced Alerting nor AD-from-Upload is enabled, the uploader picks a notification activity manually.
