# AGENTS

## Read This First
- Read CLAUDE.md before planning or coding.
- Follow existing repository patterns and shared abstractions.
- Do not invent architecture when an established pattern already exists.

## Source of Truth
1. CLAUDE.md (authoritative implementation guide)
2. Existing implementation in src/
3. Shared governance docs: ARCHITECTURE.md, README.md, DEVELOPMENT_LOG.md
4. Feature docs in docs/
5. Branch-specific artifacts under docs/flux-2/

Rules:
- Do not create competing guidance.
- Reference existing docs instead of copying them.
- If guidance conflicts, prefer the higher item in this list.

## Shared vs Branch Scope
Shared docs define repo-wide engineering behavior, guardrails, architecture philosophy, accessibility expectations, and localization expectations.

Branch-specific docs define experimental work, branch-only architecture notes, temporary migrations, prototype behavior, in-progress lessons, and branch-local testing expectations.

Do not mix scopes unless a branch-local lesson has stabilized and is truly repo-wide.

## Branch-Specific Artifacts
- Branch-local implementation notes belong in docs/flux-2/.
- Branch-local learnings should not be added to shared governance docs unless universally applicable.
- Experimental architecture belongs in branch-local docs.
- Temporary migration guidance belongs in branch-local docs.
- Flux-2 implementation lessons discovered during delivery belong in docs/flux-2/failures.md and docs/flux-2/FLUX2_WORKLOG.md.

## Branch AI Workflow
When working in a branch:
1. Read shared repo artifacts first.
2. Then read branch-specific artifacts.
3. Prefer existing branch patterns before introducing new ones.
4. Avoid polluting shared docs with branch-local implementation details.

## Working Rules
- Extend existing components, hooks, contexts, and data flows before adding new ones.
- Avoid duplicated business logic and parallel state stores.
- Keep mocked-backend boundaries explicit; do not imply production API behavior unless implemented.
- Preserve localization patterns (LocalizationContext and locale packs).
- Preserve accessibility requirements (WCAG skill and current focus/ARIA patterns).
- Preserve portal-based popup behavior for overlays and dropdowns.
- Keep React 18 + TypeScript + Vite + Tailwind conventions consistent with the repo.
- Respect shared data sources (for example project/workspace sources) instead of redefining them locally.
- Run build before handoff.

## Artifact Philosophy
- Code without artifacts loses intent across context windows.
- Record branch-local failures and preventions in docs/flux-2/failures.md.
- Record branch-local implementation chronology in docs/flux-2/FLUX2_WORKLOG.md.
- Keep DEVELOPMENT_LOG.md branch-agnostic unless a milestone is repo-wide and stable.
- Keep docs/folders.md, docs/gridview.md, and docs/localization.md aligned with behavior changes.
- If ADRs are present, link to them rather than restating architecture.

## Before Making Changes
- Read CLAUDE.md and the relevant feature docs.
- Inspect existing component and state patterns in affected routes.
- Trace user flow impacts (Documents, Search, Packages, Chat, Admin).
- Confirm you are extending an existing system, not creating a parallel one.

## Definition of Done
- Build passes.
- No duplicated patterns or conflicting abstractions introduced.
- Accessibility behavior preserved.
- Localization behavior preserved.
- Documentation updated when user-visible behavior changes.
