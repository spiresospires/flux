# Testing and Quality Expectations

This repository is a frontend prototype. Quality checks must reflect real behavior and current tooling, not a fictional mature test harness.

Scope:
- This testing guide is branch-specific to flux-2.
- Some covered functionality may not exist in master/main.
- Flux-2-only features require Flux-2 validation rules.

Promotion rule:
- Do not add Flux-2-only testing assumptions to shared governance docs.
- Promote standards to shared docs only after behavior stabilizes and becomes repo-wide.

## Required Before Handoff
- Run npm run build.
- Run npm run lint.
- Resolve introduced TypeScript and lint errors.
- If a known pre-existing issue remains, call it out explicitly in handoff notes.

## Build-First Rule
- Build must pass before completion.
- Build catches integration, typing, and route wiring issues that local spot checks can miss.

## Core Validation Surfaces
Validate affected flows, especially when changing shared components:
- Documents
- Packages
- Search
- Chat
- Design System
- Admin surfaces when touched

## Functional Smoke Checks
- Navigation and route transitions behave as expected.
- State transitions do not create stale or orphaned UI state.
- No duplicated controls or conflicting interaction patterns.

## Grid and Table Checks
- Sort, filter, selection, and grouping behavior remains coherent.
- Column interactions and persistence behavior do not regress.
- Grouping and selection controls remain keyboard-usable.

## Popup and Overlay Checks
- Dropdowns, menus, and popovers render above shell chrome as expected.
- Portal-based overlays position correctly and close predictably.
- Modal focus behavior is correct: focus enters modal, escapes safely, and returns.

## Accessibility Checks
- Keyboard navigation works for all interactive controls in changed areas.
- Visible focus indicators remain present.
- ARIA labels/roles remain valid for custom controls.
- Run an accessibility pass with browser tooling when interaction logic changes.

Reference: .github/skills/wcag-accessibility/SKILL.md

## Localization Checks
- User-facing strings in changed UI are localized through locale packs.
- EN and FR keys stay structurally aligned.
- No newly introduced hardcoded user-visible copy in changed areas.
- Locale-sensitive UI formatting (for example dates/times) remains consistent.

Reference: docs/localization.md

## Responsive Checks
- Validate changed screens at mobile, tablet, and desktop breakpoints.
- Ensure no critical overflow, clipped controls, or inaccessible actions.

## Regression Discipline
When a real bug is found, do one of the following:
- Add or update an automated test, or
- Add/update a documented manual check in this file, or
- Add an entry in failures.md with prevention and detection guidance.

## Manual Check Template
Use this when automated coverage is not yet present:
- Area:
- Scenario:
- Expected result:
- Validation steps:
- Last verified:
