// [MOCK] Full-text matching, snippets and facet counts for the MSW mock backend
// (src/mocks/handlers.ts, G19 handler) — no page imports this directly any more.
// Delete alongside src/mocks when the real Spring Boot G19 exists.
// [PHASE-1]
import type { SearchResult, SearchResultType, SearchableRecord } from '../types/search';

const fieldLabels: Array<{ key: keyof SearchableRecord; label: string }> = [
  { key: 'reference', label: 'Reference' },
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'objectType', label: 'Type' },
  { key: 'author', label: 'Author' },
  { key: 'location', label: 'Location' },
  { key: 'revision', label: 'Revision' },
  { key: 'discipline', label: 'Discipline' },
  { key: 'description', label: 'Summary' }
];

const normalize = (value: string) => value.trim().toLowerCase();

function getMatchedFields(record: SearchableRecord, normalizedQuery: string) {
  return fieldLabels
    .filter(({ key }) => {
      const value = record[key];
      return typeof value === 'string' && normalize(value).includes(normalizedQuery);
    })
    .map(({ label }) => label);
}

function buildSnippet(record: SearchableRecord, matchedFields: string[]) {
  if (matchedFields.length > 0) {
    return `Matched ${matchedFields.slice(0, 3).join(', ')}`;
  }

  return record.description ?? `${record.objectType} metadata matched this search.`;
}

export function searchEverything(records: SearchableRecord[], query: string): SearchResult[] {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return [];
  }

  return records
    .filter((record) => record.searchableText.some((value) => normalize(value).includes(normalizedQuery)))
    .map((record) => {
      const matchedFields = getMatchedFields(record, normalizedQuery);

      return {
        ...record,
        matchedFields,
        snippet: buildSnippet(record, matchedFields)
      };
    });
}

export function countResultsByType(results: SearchResult[]) {
  return results.reduce<Record<SearchResultType, number>>((counts, result) => {
    counts[result.resultType] = (counts[result.resultType] ?? 0) + 1;
    return counts;
  }, {} as Record<SearchResultType, number>);
}
