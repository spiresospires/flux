# Folders View — Requirements

## Overview

The folders view (left rail) displays a hierarchical tree of folders for navigating documents. Two enhancements are required:

---

## 1. Folder Document Count

Display a count of documents within each folder alongside the folder name.

### Behaviour
- The count should reflect the **total number of documents** in the folder, including all descendant sub-folders (i.e. a rolled-up count).
- Alternatively, show only the **direct document count** for the folder — to be confirmed.
- The count should be displayed as a small badge or inline number to the right of the folder name.
- The count should update reactively when filters are applied (if applicable).

### Data
- `documentCount` already exists on the `Folder` type and is populated in `mockFolders.ts`.

---

## 2. Favourite Folders

Allow users to mark any folder as a favourite for quick access.

### Behaviour
- A star (or heart) icon should appear on hover next to each folder row, allowing the user to toggle favourite status.
- Favourited folders should appear in a **Favourites** section at the top of the folder tree, above the main hierarchy.
- The favourites section should be collapsible.
- Favourite state should persist across sessions (e.g. `localStorage`).
- A folder can be un-favourited from either the main tree or the Favourites section.

### Open Questions
- Should favourites be user-scoped (i.e. per-user if auth is added later)? Currently localStorage is sufficient.
- Should there be a maximum number of favourites?
- Should the favourite icon always be visible, or only on hover?

---

## 3. Folder Actions

A context menu or action set should be accessible per folder row, providing operations on that folder.

### Available Actions
- **Rename** — rename the folder inline or via a dialog.
- **New subfolder** — create a new child folder under the selected folder.
- **Move** — move the folder (and its contents) to another location in the tree.
- **Delete** — delete the folder and **all of its sub-folders and their documents** in a single action.

### Delete Behaviour
- Deleting a folder must recursively remove all descendant sub-folders and all documents within them.
- A confirmation dialog must be shown before deletion proceeds, clearly stating that all sub-folders and documents will be permanently removed.
- The confirmation dialog should display the folder name and a count of affected sub-folders and documents so the user understands the impact.
- Once confirmed, the folder is removed from the tree and the document list updates accordingly.

### Access Pattern
- Actions should be accessible via a `...` (ellipsis) menu button that appears on hover at the right side of the folder row.
- Destructive actions (Delete) should be visually distinct (e.g. red text) within the menu.

### Open Questions
- Should delete be a soft delete (recoverable/trash) or hard delete? To be confirmed.
- Should Move use a drag-and-drop interaction, a dialog picker, or both?
- Are any folder actions permission-gated (e.g. only admins can delete)?
