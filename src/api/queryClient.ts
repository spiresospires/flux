// Shared React Query client. Server state lives here — never copy API data into
// useState/useContext (ARCHITECTURE.md §State Management).
// [PHASE-1]
// [TODO-ENG] When G31 real-time events are wired (ADR-010), the event listener
// calls queryClient.invalidateQueries with the keys from src/api/queryKeys.ts,
// and staleTime can rise sharply because invalidation becomes push-driven.
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
