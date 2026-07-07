// Typed fetch client — the single place every API call goes through.
// [API] Base URL per region via VITE_API_BASE_URL (ARCHITECTURE.md §Environment Variables).
// [AUTH] [TODO-ENG] Attach the workspace-scoped JWT here once G01 auth is wired:
//        headers.Authorization = `Bearer ${workspaceToken}` + a 401 interceptor that
//        refreshes the platform token, re-exchanges the workspace token, and retries.
// [PHASE-1]
// In the prototype these requests are answered by MSW (src/mocks/) — the HTTP
// contract is real, only the origin of the response changes in production.

export const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

/** RFC 7807 ProblemDetails — the error body shape the Spring API returns. */
export interface ProblemDetails {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetails | null;

  constructor(status: number, problem: ProblemDetails | null) {
    super(problem?.title ?? `API request failed (${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!res.ok) {
    let problem: ProblemDetails | null = null;
    try {
      problem = (await res.json()) as ProblemDetails;
    } catch {
      // Non-JSON error body — surface the status alone.
    }
    throw new ApiError(res.status, problem);
  }

  // 204 No Content (e.g. DELETE) has no body to parse.
  if (res.status === 204) return undefined as T;

  return (await res.json()) as T;
}

export const apiClient = {
  get<T>(path: string): Promise<T> {
    return request<T>(path);
  },
  post<T>(path: string, body: unknown): Promise<T> {
    // [TODO-ENG] Add the Idempotency-Key header to POSTs once the backend honours it.
    return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  },
  patch<T>(path: string, body: unknown): Promise<T> {
    // [TODO-ENG] Concurrency: send If-Match with the entity's ETag once exposed (ADR — optimistic locking).
    return request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
  },
  delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'DELETE' });
  },
};
