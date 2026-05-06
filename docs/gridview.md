# Grid View — Requirements

## Overview

The grid/table view displays documents in a structured, column-based layout. It currently supports Comfy Table, Compact Table, Grid, and List view modes. This document captures requirements for enhanced column sorting, filtering, and user-configurable column ordering with server-persisted preferences.

---

## Existing Columns

The following columns are currently defined and should all support the enhancements below:

| Column Key      | Display Label     |
|-----------------|-------------------|
| `id`            | Document ID       |
| `title`         | Title             |
| `revisionNumber`| Revision          |
| `status`        | Status            |
| `documentType`  | Type              |
| `author`        | Author            |
| `dateModified`  | Date Modified     |

---

## 1. Column Sorting

Each column header should be clickable to sort the document list by that column.

### Behaviour
- Clicking a column header cycles through: ascending → descending → unsorted.
- A sort indicator (chevron/arrow icon) should appear in the column header showing the current sort direction.
- Only one column can be the active sort at a time.
- Default sort should be `dateModified` descending (most recent first).

---

## 2. Column Filtering

Each column should support individual filtering, allowing users to narrow results within a specific column independently of the global search.

### Behaviour
- A filter control should be accessible per column — either inline below the header or via a popover triggered from a filter icon in the header.
- Filters should combine with the global search and folder selection (i.e. all active filters are AND'd together).
- Active column filters should be visually indicated on the column header.
- Filters should be clearable individually or all at once.

### Filter Types by Column
| Column          | Filter Type                          |
|-----------------|--------------------------------------|
| `id`            | Text (contains)                      |
| `title`         | Text (contains)                      |
| `revisionNumber`| Text (contains)                      |
| `status`        | Multi-select (from known status values) |
| `documentType`  | Multi-select (from known type values) |
| `author`        | Text (contains) or multi-select      |
| `dateModified`  | Date range picker                    |

---

## 3. Column Reordering (Drag and Drop)

Users should be able to drag columns into any position to customise the order of columns displayed in the table.

### Behaviour
- Column headers should be draggable horizontally.
- A visual indicator (e.g. a drop target line) should show where the column will land during drag.
- Reordering should apply immediately upon drop.
- The new column order should be saved to the user's server-side preferences (see section 4).

---

## 4. Server-Persisted User Preferences

Column configuration (order, visibility, and sort state) must be saved server-side so that preferences are restored on any device when the user logs in.

### What is Persisted
- **Column order** — the sequence of columns as arranged by the user.
- **Column visibility** — which columns are shown or hidden (see section 5).
- **Active sort column and direction** — the last sort state applied.

### Behaviour
- Preferences are loaded on login/session start and applied before the first render of the grid.
- Changes are saved automatically after each user interaction (debounced, e.g. 500ms after last change).
- If no saved preferences exist, defaults are applied (see above).

### API Considerations
- A `GET /user/preferences/grid` endpoint should return the persisted grid configuration.
- A `PUT /user/preferences/grid` endpoint should accept and store the updated configuration.
- Preferences are scoped per user account, not per device or browser.

---

## 5. Column Visibility (Show/Hide)

Users should be able to show or hide individual columns.

### Behaviour
- A "Columns" button or menu should allow toggling the visibility of each column.
- At least one column must remain visible at all times.
- Column visibility is included in the server-persisted preferences (section 4).

---

## Open Questions
- Should column width (resize) also be persisted, or is fixed/responsive width sufficient?
- Should preferences be scoped per view mode (e.g. separate config for Comfy Table vs Compact Table), or shared?
- Is server-side preferences API in scope now, or should localStorage be used as an interim solution?
- Should there be a "Reset to defaults" option to clear all user column preferences?
