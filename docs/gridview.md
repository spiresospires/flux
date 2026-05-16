# Grid View — Requirements

## Overview

The grid/table view displays documents in a structured, column-based layout. It currently supports Comfy Table, Compact Table, Grid, and List view modes. This document captures requirements for enhanced column sorting, filtering, and user-configurable column ordering with server-persisted preferences.

Current prototype status:
- Column sorting, filtering, reordering, visibility toggling, and single-column grouping are implemented in the table views.
- Grouping currently persists via local client storage as an interim mechanism.
- The table selection control uses a single button-based checkbox hit target for row selection and select-all, to avoid the misaligned click behavior seen with nested interactive controls.

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

These are the base columns that are always available.

When the Filters panel has exactly one selected **Category**, the grid should also expose a set of category-specific columns for that category.

---

## Category-Specific Columns

When a single category is selected in the Filters panel, additional properties should become available in the column chooser and be shown in the grid automatically.

### Behaviour
- Category-specific columns are enabled only when exactly one category is selected.
- The additional columns should be automatically selected in the column chooser and immediately rendered in the grid.
- If the user clears the category filter or selects more than one category, the category-specific columns should be removed from the chooser and disappear from the grid.
- These fields are prototype-specific mock properties intended to demonstrate how the grid can adapt to the active document category.

### Category Columns

| Category         | Additional Columns |
|------------------|--------------------|
| `Structural`     | `beamSize`, `materialGrade`, `loadRating`, `connectionType` |
| `Electrical`     | `voltage`, `circuitNumber`, `panel`, `protectionType` |
| `Mechanical`     | `equipmentTag`, `powerRating`, `manufacturer`, `serviceMedium` |
| `Civil`          | `concreteType`, `rebarSize`, `soilClass`, `foundationType` |
| `Architectural`  | `finishType`, `roomNumber`, `ceilingHeight`, `fireRating` |
| `Plumbing`       | `pipeSize`, `fixtureType`, `flowRate`, `pressureClass` |
| `HVAC`           | `ductSize`, `airflow`, `unitType`, `zone` |

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

## 4. User Preferences Persistence

Column configuration should persist between sessions. The long-term target is server-side persistence so preferences are restored on any device when the user logs in, but the current prototype uses local client storage until the backend API exists.

### What is Persisted
- **Column order** — the sequence of columns as arranged by the user.
- **Column visibility** — which columns are shown or hidden (see section 5).
- **Active sort column and direction** — the last sort state applied.

### Behaviour
- In the current prototype, preferences are loaded from local client storage before the first render of the grid.
- Changes should be saved automatically after each user interaction.
- If no saved preferences exist, defaults are applied (see above).

### API Considerations
- A `GET /user/preferences/grid` endpoint should return the persisted grid configuration.
- A `PUT /user/preferences/grid` endpoint should accept and store the updated configuration.
- Preferences are scoped per user account, not per device or browser.
- Until those endpoints exist, the prototype may store the same shape in `localStorage` behind a replaceable persistence boundary.

---

## 5. Column Visibility (Show/Hide)

Users should be able to show or hide individual columns.

### Behaviour
- A "Columns" button or menu should allow toggling the visibility of each column.
- At least one column must remain visible at all times.
- Column visibility is included in the server-persisted preferences (section 4).
- Category-specific columns follow the same visibility rules while their category is active.
- When category-specific columns are introduced because a single category is selected, they should appear as selected by default.
- When the active category context is lost, those dynamic columns should be removed rather than kept as hidden saved state.

---

## 6. Row Grouping (Comfy and Compact Table)

Users should be able to group table rows by dragging a supported column header upward into the whitespace area above the table header row.

### Behaviour
- Grouping applies only to **Comfy Table** and **Compact Table**.
- Only one grouped column can be active at a time.
- While a supported column header is dragged into the grouping area, a tooltip should appear saying `Group by {Column Name}`.
- Dropping a column in the grouping area should immediately regroup the rows by that property.
- The grouping area should show the active grouped column as a visible token with a clear/remove action.
- Group sections should be collapsible.
- Existing sort settings should continue to apply **within each group**.
- `Reference` and `Title` are not groupable.

### Persistence
- Grouping should persist across sessions.
- Until the backend preferences API exists, grouping should be stored locally on the client.
- The implementation should leave a clean interface boundary so persistence can move to the server later without changing the table interaction.

---

## 7. Row Selection

The table views should support predictable per-row selection and select-all interactions.

### Behaviour
- Each row should expose a single checkbox-style hit target aligned to the visible control.
- The select-all control in the header should use the same interaction model and support checked, unchecked, and mixed states.
- Selection controls should not be built from nested interactive elements such as a native checkbox inside a button.
- In the current prototype, unchecked row selectors may stay visually subtle until row hover, but the clickable area must remain consistent with the visible control.

---

## Open Questions
- Should column width (resize) also be persisted, or is fixed/responsive width sufficient?
- Should preferences be scoped per view mode (e.g. separate config for Comfy Table vs Compact Table), or shared?
- Should there be a "Reset to defaults" option to clear all user column preferences?
