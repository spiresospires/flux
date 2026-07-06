// [MOCK] Search corpus built at module load from mockDocuments + mockFolders + mockPlaceholders.
// Consumed ONLY by the MSW mock backend (src/mocks/handlers.ts, G19 handler) — pages
// go through useSearch → POST /workspaces/{wsId}/search. This file (and utils/search.ts)
// is deleted with the rest of src/mocks when the real Spring Boot G19 exists.
// [PHASE-1]
import { mockDocuments } from './mockDocuments';
import { mockFolders } from './mockFolders';
import { mockPlaceholders } from './mockPlaceholders';
import { PROJECTS } from './projects';
import type { Folder } from '../types/document';
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

const documentSearchRecords: SearchableRecord[] = mockDocuments.map((document) => {
  const location = document.folderId ? folderPaths.get(document.folderId) ?? document.project : document.project;
  const discipline = inferDiscipline(document.tags);

  return {
    id: document.id,
    resultType: 'document',
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
    hasUploadedContent: true,
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

const placeholderSearchRecords: SearchableRecord[] = mockPlaceholders.map((placeholder) => ({
  id: placeholder.id,
  resultType: 'placeholder',
  reference: placeholder.reference,
  title: placeholder.title,
  status: placeholder.status,
  objectType: placeholder.type,
  location: placeholder.location,
  project: undefined, // placeholders do not carry a project field in the current mock schema
  author: placeholder.author,
  dateCreated: placeholder.dateCreated,
  dateModified: placeholder.dateModified,
  revision: placeholder.revision,
  discipline: placeholder.discipline,
  description: placeholder.description,
  hasUploadedContent: false,
  searchableText: [
    placeholder.reference,
    placeholder.title,
    placeholder.status,
    placeholder.type,
    placeholder.author,
    placeholder.location,
    placeholder.revision,
    placeholder.discipline,
    placeholder.description
  ]
}));

export const searchRecords: SearchableRecord[] = [
  ...documentSearchRecords,
  ...placeholderSearchRecords
];
