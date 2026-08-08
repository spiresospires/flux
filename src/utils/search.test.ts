import { describe, it, expect } from 'vitest';
import type { SearchResult, SearchableRecord } from '../types/search';
import { countResultsByType, searchEverything } from './search';

// Matching, snippet and facet behaviour for the search backend. Several of these
// rules are invisible from the UI — most importantly that filtering is driven
// ONLY by `searchableText`, while the "Matched …" snippet is derived from a
// separate list of labelled fields. The two can disagree, and that is deliberate.

let seq = 0;
function makeRecord(overrides: Partial<SearchableRecord> = {}): SearchableRecord {
  seq += 1;
  const base: SearchableRecord = {
    id: `d${seq}`,
    resultType: 'document',
    reference: `PH-DWG-${seq}`,
    title: 'Berth 6 General Arrangement',
    status: 'Issued',
    objectType: 'Drawing',
    location: '03 Engineering',
    author: 'A. Nguyen',
    searchableText: [],
  };
  const record = { ...base, ...overrides };
  // Default searchableText to the record's own values, which is how the real
  // datasets are built — unless a test is deliberately desyncing them.
  if (!overrides.searchableText) {
    record.searchableText = [
      record.reference,
      record.title,
      record.status,
      record.objectType,
      record.author,
      record.location,
      ...(record.discipline ? [record.discipline] : []),
      ...(record.description ? [record.description] : []),
    ];
  }
  return record;
}

describe('searchEverything — query handling', () => {
  it('returns nothing for an empty query rather than everything', () => {
    expect(searchEverything([makeRecord()], '')).toEqual([]);
  });

  it('treats a whitespace-only query as empty', () => {
    expect(searchEverything([makeRecord()], '   ')).toEqual([]);
  });

  it('trims surrounding whitespace from the query', () => {
    const records = [makeRecord({ title: 'Berth 6 General Arrangement' })];
    expect(searchEverything(records, '   berth   ')).toHaveLength(1);
  });

  it('matches case-insensitively in both directions', () => {
    const records = [makeRecord({ title: 'BERTH 6 GENERAL ARRANGEMENT' })];
    expect(searchEverything(records, 'berth')).toHaveLength(1);
    expect(searchEverything(records, 'BERTH')).toHaveLength(1);
  });

  it('matches on substrings, not whole words', () => {
    const records = [makeRecord({ discipline: 'Civil' })];
    expect(searchEverything(records, 'ivi')).toHaveLength(1);
  });

  it('returns an empty list when nothing matches', () => {
    expect(searchEverything([makeRecord()], 'zzzznomatch')).toEqual([]);
  });

  it('handles an empty record set', () => {
    expect(searchEverything([], 'anything')).toEqual([]);
  });
});

describe('searchEverything — what drives a match', () => {
  it('filters on searchableText only, NOT on the labelled fields', () => {
    // A record whose title contains the term but whose searchableText does not
    // is not a hit. Filtering and snippet-building read different sources.
    const record = makeRecord({
      title: 'Cathodic Protection Survey',
      searchableText: ['nothing relevant here'],
    });
    expect(searchEverything([record], 'cathodic')).toEqual([]);
  });

  it('matches via searchableText even when no labelled field contains the term', () => {
    const record = makeRecord({
      description: undefined,
      searchableText: ['hidden-keyword'],
    });
    const [hit] = searchEverything([record], 'hidden-keyword');
    expect(hit).toBeDefined();
    expect(hit.matchedFields).toEqual([]);
  });

  it('matches when ANY searchableText entry contains the term', () => {
    const record = makeRecord({ searchableText: ['irrelevant', 'buried-term', 'also irrelevant'] });
    expect(searchEverything([record], 'buried-term')).toHaveLength(1);
  });

  it('preserves the whole original record on each result', () => {
    const record = makeRecord({ folderId: 'f-12', projectId: 'hedland', revision: 'C' });
    const [hit] = searchEverything([record], 'berth');
    expect(hit).toMatchObject({
      id: record.id,
      folderId: 'f-12',
      projectId: 'hedland',
      revision: 'C',
    });
  });

  it('returns results in input order', () => {
    const a = makeRecord({ title: 'Berth alpha' });
    const b = makeRecord({ title: 'Berth beta' });
    expect(searchEverything([a, b], 'berth').map(r => r.id)).toEqual([a.id, b.id]);
  });
});

describe('searchEverything — matchedFields', () => {
  it('names the fields that matched, using display labels', () => {
    const record = makeRecord({ title: 'Civil works', discipline: 'Civil' });
    const [hit] = searchEverything([record], 'civil');
    expect(hit.matchedFields).toContain('Title');
    expect(hit.matchedFields).toContain('Discipline');
  });

  it('labels description as "Summary" and objectType as "Type"', () => {
    const record = makeRecord({ objectType: 'Widget', description: 'A widget summary' });
    expect(searchEverything([record], 'widget')[0].matchedFields).toEqual(
      expect.arrayContaining(['Type', 'Summary']),
    );
  });

  it('reports fields in registry order, not record order', () => {
    // Registry order is Reference, Title, Status, Type, Author, Location,
    // Revision, Discipline, Summary.
    const record = makeRecord({
      reference: 'MATCH-1',
      title: 'match title',
      status: 'match status',
    });
    expect(searchEverything([record], 'match')[0].matchedFields.slice(0, 3))
      .toEqual(['Reference', 'Title', 'Status']);
  });

  it('skips absent optional fields without throwing', () => {
    const record = makeRecord({ revision: undefined, discipline: undefined, description: undefined });
    expect(() => searchEverything([record], 'berth')).not.toThrow();
    expect(searchEverything([record], 'berth')[0].matchedFields).not.toContain('Revision');
  });
});

describe('searchEverything — snippet', () => {
  it('summarises the matched fields', () => {
    const record = makeRecord({ reference: 'FIND-ME', title: 'unrelated', searchableText: ['FIND-ME'] });
    expect(searchEverything([record], 'find-me')[0].snippet).toBe('Matched Reference');
  });

  it('caps the snippet at three fields even when more matched', () => {
    const record = makeRecord({
      reference: 'match',
      title: 'match',
      status: 'match',
      objectType: 'match',
      author: 'match',
    });
    const [hit] = searchEverything([record], 'match');
    expect(hit.matchedFields.length).toBeGreaterThan(3);
    expect(hit.snippet).toBe('Matched Reference, Title, Status');
  });

  it('falls back to the description when no labelled field matched', () => {
    const record = makeRecord({
      description: 'Explains the thing',
      searchableText: ['hidden-keyword'],
    });
    expect(searchEverything([record], 'hidden-keyword')[0].snippet).toBe('Explains the thing');
  });

  it('falls back to an objectType sentence when there is no description either', () => {
    const record = makeRecord({
      objectType: 'Transmittal',
      description: undefined,
      searchableText: ['hidden-keyword'],
    });
    expect(searchEverything([record], 'hidden-keyword')[0].snippet)
      .toBe('Transmittal metadata matched this search.');
  });
});

describe('countResultsByType', () => {
  const result = (resultType: SearchableRecord['resultType']): SearchResult => ({
    ...makeRecord({ resultType }),
    snippet: '',
    matchedFields: [],
  });

  it('returns an empty object for no results', () => {
    expect(countResultsByType([])).toEqual({});
  });

  it('counts each result type', () => {
    const counts = countResultsByType([
      result('document'),
      result('document'),
      result('rfi'),
      result('package'),
    ]);
    expect(counts).toEqual({ document: 2, rfi: 1, package: 1 });
  });

  it('omits types with no results rather than reporting zero', () => {
    expect(countResultsByType([result('review')])).toEqual({ review: 1 });
  });
});
