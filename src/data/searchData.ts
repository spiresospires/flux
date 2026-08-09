// [MOCK] Search corpus built at module load from mockDocuments + mockFolders.
// mockDocuments carries placeholders too (see mockPlaceholders.ts) — they map to
// resultType 'placeholder' / hasUploadedContent false through the same mapping.
// Consumed ONLY by the MSW mock backend (src/mocks/handlers.ts, G19 handler) — pages
// go through useSearch → POST /workspaces/{wsId}/search. This file (and utils/search.ts)
// is deleted with the rest of src/mocks when the real Spring Boot G19 exists.
// [PHASE-1]
import { mockDocuments } from './mockDocuments';
import { mockFolders } from './mockFolders';
import { PROJECTS } from './projects';
import { isPlaceholder, type Folder } from '../types/document';
import type { SearchableRecord } from '../types/search';

const disciplineLabels = [
  'Structural',
  'Electrical',
  'Mechanical',
  'Civil',
  'Architectural',
  'Plumbing',
  'HVAC',
  'Instrumentation',
  'Process'
];

function buildFolderPaths(folders: Folder[], parentPath = '') {
  const paths = new Map<string, string>();

  folders.forEach((folder) => {
    const path = `${parentPath}/${folder.name}`;
    paths.set(folder.id, path);

    buildFolderPaths(folder.children, path).forEach((value, key) => {
      paths.set(key, value);
    });
  });

  return paths;
}

const folderPaths = buildFolderPaths(mockFolders);

function inferDiscipline(tags: string[]) {
  const lowerTags = tags.map((tag) => tag.toLowerCase());
  return disciplineLabels.find((label) => lowerTags.includes(label.toLowerCase()));
}

// mockDocuments now contains both kinds of record; the only differences in the
// search corpus are resultType and hasUploadedContent, so one mapping covers both.
const documentSearchRecords: SearchableRecord[] = mockDocuments.map((document) => {
  const location = document.folderId ? folderPaths.get(document.folderId) ?? document.project : document.project;
  const discipline = document.discipline ?? inferDiscipline(document.tags);
  const placeholder = isPlaceholder(document);

  return {
    id: document.id,
    resultType: placeholder ? 'placeholder' : 'document',
    reference: document.id,
    title: document.title,
    status: document.status,
    objectType: document.documentType,
    location,
    folderId: document.folderId ?? undefined,
    project: document.project,
    projectId: PROJECTS.find((p) => p.name === document.project)?.id,
    author: document.author,
    dateCreated: document.dateCreated,
    dateModified: document.dateModified,
    revision: document.revisionNumber,
    discipline,
    description: document.description,
    hasUploadedContent: !placeholder,
    searchableText: [
      document.id,
      document.title,
      document.status,
      document.documentType,
      document.author,
      location,
      document.revisionNumber,
      discipline,
      document.description,
      document.project,
      document.asset,
      ...document.tags
    ].filter(Boolean) as string[]
  };
});

export const searchRecords: SearchableRecord[] = documentSearchRecords;
