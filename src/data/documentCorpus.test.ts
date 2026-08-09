import { describe, it, expect } from 'vitest';
import { mockDocuments, mockDocumentsByProject } from './mockDocuments';
import { buildVersionStack } from './mockJourneys';
import { mockPlaceholders, mockPlaceholdersByProject } from './mockPlaceholders';
import { mockFoldersByProject } from './mockFolders';
import { searchRecords } from './searchData';
import { isPlaceholder } from '../types/document';
import type { DocumentStatus, Folder } from '../types/document';
import { PROJECTS } from './projects';

// Corpus-wide invariants. Each of these encodes a domain rule that is invisible
// in any single component but breaks the demo if it drifts — the kind of thing a
// future change to the seed generators would silently violate.

/** The whole document status vocabulary. FusionLive has no 'Superseded' or
 *  'Archived': superseding is a relationship between revisions, shown by
 *  position in the version stack, and documents are never archived.
 *  See types/document.ts. */
const GRID_STATUSES: DocumentStatus[] = ['Placeholder', 'New', 'Under Review', 'Approved', 'Issued'];
const REMOVED_STATUSES = ['Superseded', 'Archived'];

function collectFolderIds(folders: Folder[], into = new Set<string>()): Set<string> {
  folders.forEach((f) => {
    into.add(f.id);
    collectFolderIds(f.children, into);
  });
  return into;
}

describe('document status vocabulary', () => {
  it('uses no status outside the FusionLive ladder', () => {
    const offenders = mockDocuments.filter((d) => !GRID_STATUSES.includes(d.status));
    expect(offenders.map((d) => `${d.id}:${d.status}`)).toEqual([]);
  });

  it('has fully retired the statuses FusionLive does not have', () => {
    // Regression guard for the 2026-08-09 correction: neither value may come
    // back through a seed generator, a version stack entry or a search record.
    const everyStatus = new Set<string>([
      ...mockDocuments.map((d) => d.status),
      ...mockDocuments.flatMap((d) => buildVersionStack(d).map((v) => v.status)),
      ...searchRecords.map((r) => r.status),
    ]);
    REMOVED_STATUSES.forEach((status) => expect(everyStatus).not.toContain(status));
  });

  it('uses every allowed status somewhere, so the demo exercises them all', () => {
    const seen = new Set(mockDocuments.map((d) => d.status));
    GRID_STATUSES.forEach((status) => expect(seen).toContain(status));
  });
});

describe('placeholder records', () => {
  it('are exactly the documents with status Placeholder', () => {
    // The two axes must not drift apart: a record is never 'Placeholder' with a
    // file, nor content-less with some other status.
    const byContentState = mockDocuments.filter(isPlaceholder).map((d) => d.id).sort();
    const byStatus = mockDocuments.filter((d) => d.status === 'Placeholder').map((d) => d.id).sort();
    expect(byContentState).toEqual(byStatus);
    expect(byContentState.length).toBe(mockPlaceholders.length);
  });

  it('never claim a file that does not exist', () => {
    mockPlaceholders.forEach((doc) => {
      expect(doc.fileType, doc.id).toBe('');
      expect(doc.fileSize, doc.id).toBe('');
      expect(doc.thumbnail, doc.id).toBe('');
    });
  });

  it('carry the schedule fields document controllers chase', () => {
    mockPlaceholders.forEach((doc) => {
      expect(doc.dateExpected, doc.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(doc.responsibleParty, doc.id).toBeTruthy();
      expect(doc.project, doc.id).toBeTruthy();
    });
  });

  it('sit in a folder that actually exists in their project', () => {
    // Without this, a placeholder vanishes the moment a folder is selected.
    PROJECTS.forEach((project) => {
      const validIds = collectFolderIds(mockFoldersByProject[project.id]);
      mockPlaceholdersByProject[project.id].forEach((doc) => {
        expect(doc.folderId, `${doc.id} in ${project.id}`).toBeTruthy();
        expect(validIds.has(doc.folderId!), `${doc.id} → ${doc.folderId}`).toBe(true);
      });
    });
  });

  it('include overdue and on-schedule examples in every project', () => {
    // The demo needs both states visible without hunting.
    const today = new Date().toISOString().slice(0, 10);
    PROJECTS.forEach((project) => {
      const dates = mockPlaceholdersByProject[project.id].map((d) => d.dateExpected!);
      expect(dates.some((d) => d < today), `${project.id} has an overdue placeholder`).toBe(true);
      expect(dates.some((d) => d >= today), `${project.id} has a future placeholder`).toBe(true);
    });
  });
});

describe('documents with content', () => {
  it('always declare a file type and size', () => {
    mockDocuments.filter((d) => !isPlaceholder(d)).forEach((doc) => {
      expect(doc.fileType, doc.id).not.toBe('');
      expect(doc.fileSize, doc.id).not.toBe('');
    });
  });

  it('never carry placeholder-only schedule fields', () => {
    mockDocuments.filter((d) => !isPlaceholder(d)).forEach((doc) => {
      expect(doc.dateExpected, doc.id).toBeUndefined();
      expect(doc.responsibleParty, doc.id).toBeUndefined();
    });
  });
});

describe('folder tree counts', () => {
  it('count documents with content and exclude placeholders', () => {
    // The badge must not overstate what is actually in the store — pending
    // deliverables are reported separately in the grid header.
    PROJECTS.forEach((project) => {
      const treeTotal = mockFoldersByProject[project.id]
        .reduce((sum, root) => sum + root.documentCount, 0);
      const contentDocs = mockDocumentsByProject[project.id]
        .filter((d) => !isPlaceholder(d) && d.folderId).length;

      expect(treeTotal, project.id).toBe(contentDocs);
    });
  });

  it('aggregate child counts into their parent', () => {
    PROJECTS.forEach((project) => {
      mockFoldersByProject[project.id].forEach((root) => {
        const childSum = root.children.reduce((sum, c) => sum + c.documentCount, 0);
        expect(root.documentCount, `${project.id}/${root.id}`).toBeGreaterThanOrEqual(childSum);
      });
    });
  });
});

describe('search corpus', () => {
  it('classifies every placeholder as a placeholder result with no content', () => {
    const placeholderRecords = searchRecords.filter((r) => r.resultType === 'placeholder');

    expect(placeholderRecords.length).toBe(mockPlaceholders.length);
    placeholderRecords.forEach((r) => expect(r.hasUploadedContent, r.id).toBe(false));
  });

  it('classifies everything else as a document with content', () => {
    searchRecords
      .filter((r) => r.resultType === 'document')
      .forEach((r) => expect(r.hasUploadedContent, r.id).toBe(true));
  });

  it('gives placeholders a project, so they are scoped like any other result', () => {
    // Regression guard: the old parallel PlaceholderRecord shape had no project,
    // which made placeholders unscopable in search.
    searchRecords
      .filter((r) => r.resultType === 'placeholder')
      .forEach((r) => {
        expect(r.project, r.id).toBeTruthy();
        expect(r.projectId, r.id).toBeTruthy();
      });
  });
});
