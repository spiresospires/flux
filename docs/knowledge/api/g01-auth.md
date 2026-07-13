---
type: API Group
title: G01 - Authentication and Tokens
description: Authentication, platform-token refresh, and workspace-token exchange for scoped API access.
tags: [api, auth, jwt, phase-1]
timestamp: 2026-07-13T00:00:00Z
api_group: G01
base_path: /auth
contract_status: Proposed
frontend_status: Not started
backend_status: Not started
team: API
source: ../../api-status.md
---

# Purpose

G01 owns authentication and token lifecycle for the Flux SPA.

It implements the two-token model from [ADR-005](../architecture/adr-005-two-token-jwt.md): a platform token identifies the user globally, and a workspace token scopes access to a selected workspace.

# SPA Consumers

* `App.tsx`
* planned `authStore`
* API client request/refresh interceptor
* Scope switching flow

# Key Endpoints

| Endpoint | Use |
|---|---|
| `POST /auth/token` | Obtain platform token after login. |
| `POST /auth/workspace-token` | Exchange platform token for a workspace-scoped token. |
| `POST /auth/refresh` | Refresh platform token using the httpOnly refresh cookie. |

# Implementation Notes

* `setScope()` triggers workspace token exchange when the selected workspace changes.
* Workspace-scoped API calls use `Authorization: Bearer <workspaceToken>`.
* Platform-scoped APIs, such as user briefcase, use the platform token.
* The 401 retry path should refresh the platform token, re-exchange the workspace token, and retry the original request.

# Open Items

* Confirm final response shapes for token, refresh, and workspace-token exchange.
* Add the 401 refresh interceptor in `src/api/client.ts`.
* Confirm how SSO, OAuth2, SAML, OIDC, and Active Directory flows surface into G01.

# Source

Status is tracked in [api-status.md](../../api-status.md). Contract detail remains in [ARCHITECTURE.md](../../../ARCHITECTURE.md).

