---
type: API Group
title: G29 - AI Assistant - Flint
description: Flint assistant conversations, context-aware prompts, and token streaming responses.
tags: [api, assistant, flint, llm, phase-1]
timestamp: 2026-07-13T00:00:00Z
api_group: G29
base_path: /workspaces/{wsId}/assistant
contract_status: Draft
frontend_status: Mock
backend_status: Not started
team: LLM
source: ../../api-status.md
---

# Purpose

G29 powers the Flint AI assistant experience for workspace-scoped conversations.

# SPA Consumers

* `Chat.tsx`
* Chat conversation sidebar
* Document/context chip flow

# Key Endpoints

| Endpoint | Use |
|---|---|
| `GET /workspaces/{wsId}/assistant/conversations` | List conversations, cursor-paginated. |
| `POST /workspaces/{wsId}/assistant/conversations/{convId}/messages` | Send a user message and receive an SSE token stream. |

# Streaming Contract

LLM responses must stream token by token.

Proposed response type:

```http
Content-Type: text/event-stream
```

Proposed events:

* `message.delta` - token chunk.
* `message.complete` - final message ID and usage.
* `message.error` - mid-stream failure.

# Request Context

The request body passes object IDs, not labels:

```json
{
  "scope": { "wsId": "" },
  "context": { "type": "", "id": "" }
}
```

# Required UI States

* Streaming in progress.
* Stopped with partial answer.
* Error mid-stream, keeping partial text and offering retry.
* Citation/source chips when Flint references documents.

# Current Status

The frontend is mocked with a delayed response. The contract is draft and needs LLM gateway confirmation.

# Open Items

* Confirm final endpoint shape.
* Confirm event names and stream payloads.
* Confirm conversation pagination.
* Confirm citation/source payload model.

# Related Concepts

* [ADR-011 - Cursor Pagination](../architecture/adr-011-cursor-pagination.md)

# Source

Status is tracked in [api-status.md](../../api-status.md). Contract detail remains in [ARCHITECTURE.md](../../../ARCHITECTURE.md).

