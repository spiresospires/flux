---
name: wcag-accessibility
description: "WCAG 2.2 Level AA accessibility compliance for the Flux project. Use when: reviewing components for accessibility; adding new UI components; fixing accessibility issues; auditing contrast ratios, keyboard navigation, screen reader support, focus management, or ARIA usage. Covers React/TypeScript/Tailwind implementation patterns."
argument-hint: "Component or area to audit (e.g. 'DocumentCard', 'FilterPanel', 'all')"
---

# WCAG 2.2 Level AA Accessibility — Flux Project

This project must meet [WCAG 2.2](https://www.w3.org/TR/WCAG22/) conformance at **Level AA** across all pages and components.

## Scope

Applies to all files in:
- `src/components/`
- `src/pages/`
- `src/components/design-system/`

---

## Level AA Success Criteria Checklist

### 1. Perceivable

#### 1.1 Text Alternatives
- All `<img>` elements must have a meaningful `alt` attribute. Use `alt=""` for decorative images.
- Icon-only buttons must have an `aria-label` or visually hidden text.

#### 1.2 Time-based Media
- Not currently applicable (no video/audio content).

#### 1.3 Adaptable
- **1.3.1 Info and Relationships**: Use semantic HTML (`<nav>`, `<main>`, `<header>`, `<section>`, `<aside>`, `<ul>`, `<table>`) to convey structure. Do not rely solely on visual formatting to communicate meaning.
- **1.3.2 Meaningful Sequence**: DOM order must match visual reading order.
- **1.3.3 Sensory Characteristics**: Instructions must not rely solely on shape, size, visual location, or colour (e.g. "click the red button").
- **1.3.4 Orientation**: Content must not be locked to a single orientation.
- **1.3.5 Identify Input Purpose**: `<input>` and `<select>` elements must use appropriate `autocomplete` attributes where relevant.

#### 1.4 Distinguishable
- **1.4.1 Use of Color**: Never use colour as the only means of conveying information. Always pair with text, icon, or pattern.
- **1.4.3 Contrast (Minimum)**: Normal text ≥ 4.5:1. Large text (18pt / 14pt bold) ≥ 3:1. Use `ContrastChecker` component in design-system to validate. Tailwind classes like `text-gray-400` on `bg-white` **fail** — check every combination.
- **1.4.4 Resize Text**: Text must remain readable and functional at 200% browser zoom without loss of content or functionality.
- **1.4.5 Images of Text**: Do not use images containing text.
- **1.4.10 Reflow**: Content must reflow to a single column at 320px width without horizontal scrolling (except for content requiring two-dimensional layout).
- **1.4.11 Non-text Contrast**: UI components (inputs, buttons, focus indicators) and informational icons ≥ 3:1 contrast ratio against adjacent colours.
- **1.4.12 Text Spacing**: No loss of content when user overrides: line-height ≥ 1.5×, letter-spacing ≥ 0.12em, word-spacing ≥ 0.16em.
- **1.4.13 Content on Hover or Focus**: Tooltips/popovers triggered by hover/focus must be dismissible (Esc), hoverable, and persistent.

---

### 2. Operable

#### 2.1 Keyboard Accessible
- **2.1.1 Keyboard**: Every interactive element must be reachable and operable via keyboard alone.
- **2.1.2 No Keyboard Trap**: Focus must never be trapped in a component unless it is an intentional modal dialog (which must support Esc to close).
- **2.1.4 Character Key Shortcuts**: If single-character shortcuts are implemented, they must be remappable or disabled.

#### 2.2 Enough Time
- No time limits are currently implemented. If added, must meet 2.2.1 (adjustable) and 2.2.2 (pause/stop for auto-updating content).

#### 2.3 Seizures and Physical Reactions
- **2.3.1**: No content may flash more than 3 times per second.

#### 2.4 Navigable
- **2.4.1 Bypass Blocks**: Provide a "Skip to main content" link as the first focusable element on each page.
- **2.4.2 Page Titled**: Each page must have a descriptive `<title>` tag (update in `index.html` or per-page via a title management pattern).
- **2.4.3 Focus Order**: Tab order must follow a logical sequence matching visual layout.
- **2.4.4 Link Purpose**: Link and button text must be descriptive in context. Avoid "click here" or "read more" without additional context via `aria-label`.
- **2.4.6 Headings and Labels**: Use proper heading hierarchy (`h1` → `h2` → `h3`). Each page must have exactly one `<h1>`.
- **2.4.7 Focus Visible**: All focusable elements must have a clearly visible focus indicator. Do not remove `outline` without replacing with an equally visible alternative. Use Tailwind `focus:ring-2 focus:ring-offset-2` patterns.
- **2.4.11 Focus Not Obscured (Minimum)**: The focused element must not be entirely hidden behind sticky headers, overlays, or other content.

#### 2.5 Input Modalities
- **2.5.3 Label in Name**: For elements with visible text labels, the accessible name must contain that visible text.
- **2.5.4 Motion Actuation**: Any functionality triggered by motion must also be operable via standard controls.

---

### 3. Understandable

#### 3.1 Readable
- **3.1.1 Language of Page**: `<html lang="en">` must be set (already done in `index.html`).

#### 3.2 Predictable
- **3.2.1 On Focus**: Receiving focus must not trigger a context change.
- **3.2.2 On Input**: Changing a form control must not automatically submit or cause unexpected navigation.
- **3.2.3 Consistent Navigation**: Navigation components (e.g. `LeftRail`) must appear in the same location across pages.
- **3.2.4 Consistent Identification**: Components with the same function must be labelled consistently.

#### 3.3 Input Assistance
- **3.3.1 Error Identification**: Form errors must be identified in text and describe the issue.
- **3.3.2 Labels or Instructions**: All form inputs must have associated `<label>` elements or `aria-label`/`aria-labelledby`.
- **3.3.3 Error Suggestion**: Where possible, suggest corrections.
- **3.3.4 Error Prevention**: For significant actions (delete, submit), provide confirmation or undo capability.

---

### 4. Robust

#### 4.1 Compatible
- **4.1.2 Name, Role, Value**: All custom interactive components must expose correct ARIA roles, states, and properties.
  - Custom dropdowns → `role="listbox"` / `role="option"`
  - Disclosure widgets → `aria-expanded`, `aria-controls`
  - Modal dialogs → `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
  - Tabs → `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`
- **4.1.3 Status Messages**: Status/success/error messages not receiving focus must use `aria-live="polite"` (or `assertive` for critical alerts).

---

## Implementation Patterns for This Project

### Tailwind Focus Styles
Replace removed outlines with visible rings:
```tsx
// Good
<button className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">

// Bad — removes focus with no replacement
<button className="focus:outline-none">
```

### Icon-Only Buttons
```tsx
<button aria-label="Close panel">
  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
</button>
```

### Skip Link (add to App.tsx or layout root)
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2 focus:bg-white focus:text-black"
>
  Skip to main content
</a>
```

### Visually Hidden (screen-reader only) Utility
Use Tailwind's `sr-only` class for supplementary text that aids screen reader users without appearing visually.

### Live Regions for Dynamic Content
```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage}
</div>
```

### Collapsible Panels (CollapsibleFilterPanel)
```tsx
<button
  aria-expanded={isOpen}
  aria-controls="filter-panel"
>
  Filters
</button>
<div id="filter-panel" hidden={!isOpen}>
  {/* content */}
</div>
```

---

## Audit Procedure

When reviewing a component:
1. Check semantic HTML structure — is meaning conveyed without CSS?
2. Tab through all interactive elements — is every action reachable by keyboard?
3. Check all text and UI component contrast using `ContrastChecker` (`src/components/design-system/ContrastChecker.tsx`).
4. Verify all interactive elements have accessible names (`aria-label`, `aria-labelledby`, or visible label).
5. Check heading hierarchy — one `h1` per page, logical nesting.
6. Verify focus is visible and not obscured.
7. Run [axe DevTools](https://www.deque.com/axe/) browser extension against each page.
8. Test with a screen reader (NVDA + Chrome or VoiceOver + Safari).

---

## Web Design Standards

When generating frontend code, adhere to these 2026 standards:
1. Mobile-first development using min-width media queries.
2. Breakpoints: 480px (Mobile-L), 768px (Tablet), 1024px (Laptop), 1280px (Desktop), 1536px (XL).
3. Use `clamp()` for fluid typography and `max-width: 1440px` for main containers.
4. Enforce minimum tap targets of 44px and minimum font size of 16px.
5. Prioritize CSS Grid and Flexbox over float-based layouts.

---

## Reference

- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?versions=2.2&levels=aa)
- [Deque University ARIA Authoring Practices](https://www.deque.com/blog/aria-in-html/)
- [ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/)
- [Tailwind CSS Accessibility](https://tailwindcss.com/docs/screen-readers)
