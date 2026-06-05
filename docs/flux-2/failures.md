# Engineering Failures Memory

Purpose: preserve operational learning so mistakes are not repeated across human and AI sessions.

Scope:
- This file is branch-local engineering memory for flux-2.
- Entries may not apply to master/main.
- Promote only mature, stable lessons to shared governance docs.

Usage guidance:
- Record repeated implementation mistakes.
- Document architectural traps and branch-local regressions.
- Preserve context-window learnings so future sessions do not rediscover solved problems.

## Stale closure in first-message chat flow

**Problem:**  
The first user message could be written to one conversation while the assistant reply was written to another.

**Cause:**  
A delayed callback captured stale state instead of a stable resolved conversation identifier.

**Impact:**  
Conversation continuity broke and users saw replies in the wrong thread.

**Prevention:**  
Resolve critical IDs synchronously before async callbacks and capture constants in closures.

**Detection:**  
Manual smoke test first-message behavior in new conversations and verify one-thread continuity.

## Popup and dropdown stacking under shell chrome

**Problem:**  
Menus and popups rendered beneath fixed headers or rail layers.

**Cause:**  
Overlay content stayed inside local stacking contexts instead of rendering at document root.

**Impact:**  
Controls appeared clipped, unclickable, or visually inconsistent.

**Prevention:**  
Use createPortal to document.body with fixed positioning for overlay surfaces.

**Detection:**  
Open overlays near top banner and rail; verify z-order and click behavior across routes.

## Accessibility regressions in iterative UI changes

**Problem:**  
Interaction updates occasionally removed keyboard reachability, focus clarity, or proper ARIA labels.

**Cause:**  
Visual-first changes were merged without complete keyboard and semantic checks.

**Impact:**  
Critical flows became harder or impossible to use for keyboard and assistive-tech users.

**Prevention:**  
Apply WCAG checks during implementation, not only at the end.

**Detection:**  
Tab through changed screens, verify focus indicators, and run an accessibility tool pass.

## Localization drift from hardcoded UI copy

**Problem:**  
New UI text was sometimes added directly in components without locale keys.

**Cause:**  
Fast iteration skipped locale-pack updates or display-layer translation mapping.

**Impact:**  
Mixed-language UI and inconsistent behavior between English and French.

**Prevention:**  
Add EN and FR keys in the same change and translate enum-like display values at render time.

**Detection:**  
Grep changed files for hardcoded user-visible strings and validate both locales.

## Speculative abstractions before proven need

**Problem:**  
Parallel abstractions were introduced that duplicated existing behavior.

**Cause:**  
Designing for hypothetical futures instead of extending current shared patterns.

**Impact:**  
Higher maintenance cost, architectural drift, and inconsistent behavior.

**Prevention:**  
Extend existing systems first and require concrete use-cases before new abstraction layers.

**Detection:**  
Review for duplicate state flows, duplicate helper logic, and competing component patterns.

## Duplicate workspace and project data sources

**Problem:**  
Project/workspace metadata was redefined in multiple places.

**Cause:**  
Feature-level changes bypassed established shared data sources.

**Impact:**  
Name/ID mismatches, broken badges/scope behavior, and fragile route transitions.

**Prevention:**  
Use shared source files and contexts for workspace/project identity.

**Detection:**  
Trace IDs and labels from source data through navigation, scope switching, and cards.

## Mock behavior mistaken for production backend behavior

**Problem:**  
Prototype behavior was treated as if backend contracts already existed.

**Cause:**  
Insufficient separation between UX simulation and real integration assumptions.

**Impact:**  
Invalid expectations, misleading implementation decisions, and migration risk.

**Prevention:**  
Keep mocked boundaries explicit and document integration assumptions in architecture artifacts.

**Detection:**  
Audit changed code for unstated API assumptions and verify markers/docs for backend reality.

## Filename sanitization broke engineering symbols and units

**Problem:**  
Filename handling risked stripping or corrupting feet/inches symbols used in engineering files.

**Cause:**  
Overly aggressive sanitization and inconsistent encoding assumptions.

**Impact:**  
Potential data loss, misidentified files, and downstream workflow errors.

**Prevention:**  
Preserve engineering symbols, enforce UTF-8 handling, and use safe conversion for restricted OS characters.

**Detection:**  
Test filenames containing prime/double-prime and quote variants through upload/download paths.
