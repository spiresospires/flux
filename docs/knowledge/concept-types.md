---
type: Reference
title: OKF Concept Types
description: Local vocabulary for concept types used in the Flux knowledge bundle.
tags: [okf, taxonomy, reference]
timestamp: 2026-07-13T00:00:00Z
---

# Purpose

OKF requires every concept document to include a non-empty `type` field. This project uses a small local vocabulary so agents and humans can route concepts consistently.

# Concept Types

| Type | Use |
|---|---|
| `ADR` | Architecture decision records and durable technical decisions. |
| `API Group` | API group contracts, ownership, status, endpoints, and consumers. |
| `Feature` | Product or implementation concepts for feature areas. |
| `Runtime Architecture` | Current runtime structure, data flow, and integration boundaries. |
| `Open Question` | Engineering questions that need ownership, resolution, or sign-off. |
| `Agent Guide` | Guidance intended primarily for AI-assisted engineering workflows. |
| `Project Plan` | Step-by-step plans, progress records, and migration plans. |
| `Reference` | Supporting reference material, vocabularies, or conventions. |

# Frontmatter Convention

Concept files should use this baseline frontmatter:

```yaml
---
type: <Concept Type>
title: <Human-readable title>
description: <One-sentence summary>
tags: [tag-one, tag-two]
timestamp: <ISO 8601 datetime>
---
```

Additional fields are allowed when they help, such as `status`, `owner`, `api_group`, `phase`, or `source`.

