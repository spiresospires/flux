---
name: flux
description: 'Introduce the Flux application in a new session. Use when a user asks what Flux is, wants a project overview, needs onboarding to the prototype, or asks about FusionLive redesign goals, modern UI capabilities, document browsing, packages, or chat features.'
argument-hint: 'Audience or topic to introduce, e.g. "new session", "chat", "packages", or "full overview"'
---

# Flux Application Introduction

Use this skill to give a concise introduction to the Flux prototype at the start of a new conversation or whenever the user asks for an overview of the application.

## What Flux Is

Flux is a UX wireframe and prototype for the next generation of the Idox FusionLive product.

It is intended to show:
- A more modern, streamlined user interface
- Improved navigation and workspace organization
- New package management concepts
- Integrated chat capabilities for enterprise and project-scoped assistance

This repository is a prototype, not production code. It does not include a real backend, authentication, or persistent server-side data.

## Default Introduction

When introducing Flux in a new session, start with a short summary like this and adapt it to the user's question:

```text
Flux is a prototype for a next-generation FusionLive experience. It explores a more modern document-management UI, a redesigned navigation model, flexible package workflows, and integrated chat features for project and enterprise contexts. The current codebase is a clickable frontend prototype rather than a production application, so it is mainly intended to validate product direction, interaction patterns, and information architecture.
```

## Key Product Themes

Highlight the most relevant themes for the conversation:

1. Modern UI refresh
   - Updated layout and navigation patterns
   - Left rail navigation and cleaner workspace structure
   - Improved document browsing and detail flows

2. Document and workspace experience
   - Folder-based browsing for engineering documents
   - Filters, metadata, and detail views
   - Multi-project workspace behavior in the prototype

3. Packages as a new concept
   - Packages are modeled as standalone deliverable objects
   - They are no longer tightly coupled to a single folder
   - The prototype includes a package library, creation flow, and detail views

4. Chat capabilities
   - Integrated chat experience designed into the main product flow
   - Support for enterprise-wide and project-scoped conversations
   - Contextual chat entry points from folders and documents

## Current Prototype Areas

Use these route-level areas when a user asks what exists in the application today:

- Documents: folder tree, filters, and document grid
- Packages: library, wizard, and detail experience
- Chat: Ask Flint conversation experience with scope switching and history
- Document detail: focused view for a single document
- Design system: reference area for reusable UI decisions

## Response Style

When this skill is used:
- Start with a 2-4 sentence overview unless the user asks for detail
- Mention that Flux is a prototype for the future FusionLive experience
- Mention both modern UI capabilities and chat features
- Keep the tone product-oriented first, technical second
- If the user asks follow-up questions, then go deeper into routes, components, or implementation details

## If The User Wants A Technical Follow-up

After the product introduction, you can connect the overview to the codebase:

- `src/pages/DocumentBrowser.tsx` for the main document browsing experience
- `src/pages/Packages.tsx` for package workflows
- `src/components/ChatInterface.tsx` for the chat interface
- `src/pages/DesignSystem.tsx` for design-system exploration

## Session-Start Pattern

If a new session begins and the user asks for an introduction, prefer this structure:

1. State what Flux is
2. Explain that it is a next-generation FusionLive prototype
3. Mention the two major themes: modern UI and integrated chat
4. Name the main prototype areas if useful
5. Offer to walk through a specific area such as documents, packages, or chat