// [API] G19:POST /workspaces/{wsId}/search — cursor-paginated (ADR-011).
// [AUTH]
// [PHASE-1]
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { search } from '../api/search';
import { queryKeys } from '../api/queryKeys';
import type { SearchRequest } from '../api/types';

export function useSearch(wsId: string, request: Omit<SearchRequest, 'cursor'>, enabled = true) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.search(wsId, request),
    queryFn: ({ pageParam }) => search(wsId, { ...request, cursor: pageParam ?? undefined }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: enabled && request.query.trim().length > 0,
    // Switching type tabs (a new query key) keeps the previous list on screen
    // instead of flashing a skeleton; isPlaceholderData is true meanwhile.
    placeholderData: keepPreviousData,
  });

  const results = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data]
  );
  // Facets come from the first page — the server computes them over the full
  // result set (see mock handler), so every page carries the same aggregations.
  const aggregations = query.data?.pages[0]?.aggregations ?? {};
  const totalApprox = query.data?.pages[0]?.totalApprox;

  return { ...query, results, aggregations, totalApprox };
}
