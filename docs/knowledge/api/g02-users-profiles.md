---
type: API Group
title: G02 - Users and Profiles
description: User, member, preference, favorite, feature-flag, and potential briefcase ownership area.
tags: [api, users, preferences, phase-1]
timestamp: 2026-07-13T00:00:00Z
api_group: G02
base_path: /users
contract_status: Draft
frontend_status: Not started
backend_status: Not started
team: API
source: ../../api-status.md
---

# Purpose

G02 covers user and profile APIs, including likely homes for user-scoped data that does not belong to a workspace token.

# Candidate Scope

* Users and profiles.
* Workspace members at `/workspaces/{wsId}/members`.
* User preferences.
* Favorites.
* The "Try New" feature flag.
* Possible home for `/user/briefcase`.

# Current Status

The contract is draft. No frontend or backend implementation is started.

# Open Items

* Decide whether user preferences belong in G02 or a separate service.
* Decide how the "Try New" per-user opt-in is persisted.
* Confirm whether the user briefcase belongs in G02.
* Define favorites and row/action endpoint ownership.

# Related Concepts

* [User Briefcase](user-briefcase.md)
* [G01 - Authentication and Tokens](g01-auth.md)

# Source

Status is tracked in [api-status.md](../../api-status.md). Contract detail remains in [ARCHITECTURE.md](../../../ARCHITECTURE.md).

