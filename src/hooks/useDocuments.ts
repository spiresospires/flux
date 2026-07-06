// [API] G06:GET /workspaces/{wsId}/documents — infinite scroll via cursor
// pagination (ADR-011). Changing filters or sort discards the cursor chain and
// restarts from the first page automatically (they are part of the query key).
// [AUTH]
// [PHASE-1]
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getDocuments } from '../api/documents';
import { queryKeys } from '../api/queryKeys';
import type { DocumentListParams } from '../api/types';

export function useDocuments(wsId: string, params: Omit<DocumentListParams, 'cursor'>) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.documents(wsId, params),
    queryFn: ({ pageParam }) => getDocuments(wsId, { ...params, cursor: pageParam ?? undefined }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  // Flattened convenience view — most consumers want "the documents loaded so far"
  // and the server's approximate total, not the raw page structure.
  const documents = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data]
  );
  const totalApprox = query.data?.pages[0]?.totalApprox;

  return { ...query, documents, totalApprox };
}
