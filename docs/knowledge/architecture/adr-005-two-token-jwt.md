---
type: ADR
title: ADR-005 - Two-Token JWT Auth
description: Authentication model using a global platform token and per-workspace scoped tokens.
tags: [adr, auth, jwt, api, phase-1]
timestamp: 2026-07-13T00:00:00Z
status: proposed
source: ../../../ARCHITECTURE.md
---

# Decision

Flux uses a two-token authentication model:

* A platform token identifies the user globally.
* A workspace-scoped token authorizes access to one workspace.
* A refresh flow uses an httpOnly cookie to obtain a new platform token without re-login.

# Rationale

The production system is multi-tenant and workspace-scoped. The React SPA needs to change authorization context when the user changes project/workspace scope. A workspace token makes that boundary explicit and reduces the chance of accidentally using a broader platform credential for workspace data.

# Token Flow

1. The user authenticates and receives a short-lived platform JWT.
2. When a workspace is selected, the SPA exchanges the platform token at `POST /auth/workspace-token` with `{ workspaceId }`.
3. API calls for workspace resources use `Authorization: Bearer <workspaceToken>`.
4. When the workspace changes, the old workspace token is discarded and a new one is requested.
5. When the platform token expires, the SPA calls `POST /auth/refresh` using the httpOnly refresh cookie, then re-exchanges for the active workspace token.

# Prototype Mapping

`ScopeContext` holds `{ kind: 'project', id, name }`. The `id` maps directly to the production `wsId` path parameter.

# API Surface

```ts
// [AUTH]
// [API] G01:POST /auth/workspace-token
// [PHASE-1]
async function exchangeWorkspaceToken(platformToken: string, wsId: string): Promise<string> {
  const res = await apiClient.post('/auth/workspace-token', { workspaceId: wsId }, {
    headers: { Authorization: `Bearer ${platformToken}` }
  });
  return res.data.workspaceToken;
}
```

# Implications

* Every workspace-scoped API call depends on a valid workspace token.
* Scope switching must invalidate the previous workspace token.
* A 401 retry path needs to refresh the platform token, exchange for a workspace token, and retry the original request.
* The backend must distinguish platform-token endpoints from workspace-token endpoints.

# Open Items

* Confirm the final G01 response shapes for token exchange and refresh.
* Add the API client 401 interceptor.
* Decide where server-side user preferences and feature flags live if they use platform-token scope.

# Source

Canonical long-form detail remains in [ARCHITECTURE.md](../../../ARCHITECTURE.md).

