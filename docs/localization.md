# Localization

Flux uses runtime-loaded language packs from `public/locales` so translations can be maintained independently from the React source.

## Supported languages

- `en-US`
- `fr-FR`

## Locale selection

- The app reads `navigator.languages` and `navigator.language` from the browser.
- Any browser locale that starts with `fr` resolves to `fr-FR`.
- All other browser locales fall back to `en-US`.
- If a translation pack is missing or incomplete, the app falls back to `en-US` per key.

## Core files

- `src/contexts/LocalizationContext.tsx`: locale detection, pack loading, fallback handling, interpolation, and the `t()` helper.
- `public/locales/en-US.json`: source English pack.
- `public/locales/fr-FR.json`: French pack.
- `src/App.tsx`: provider wiring.

## Current coverage

The current localization pass covers the main application chrome and page-level UI for:

- Navigation and banner chrome
- Dashboard
- Document browser and filter surfaces
- Document detail and side panels
- Package library, package wizard, and package detail workflow chrome
- Chat shell, sidebar, prompts, and generic assistant response scaffolding
- Design system route copy

Coverage is expected to stay page-complete for all user-facing UI text, including:

- headings
- buttons
- menus
- placeholders
- empty states
- helper text
- ARIA labels and titles
- status and workflow labels derived from internal enum-like values

## Adding new UI copy

1. Add a stable key to `public/locales/en-US.json`.
2. Add the matching key to `public/locales/fr-FR.json` in the same structure.
3. Use `useLocalization()` in the component and render `t('your.key')` instead of hardcoded text.
4. If the UI currently renders enum-like English values from code or mock data, translate them at the display layer before rendering.
5. If sample or seeded content is intentionally user-visible in the prototype, treat it as localized content instead of leaving it embedded as English demo text.

## Translation structure guidance

- Group keys by surface, for example `dashboard.*`, `packages.*`, `chat.*`, `designSystem.*`.
- Prefer descriptive keys over generic reuse.
- Keep key names stable once they are in use.
- Prefer adding new keys over overloading unrelated existing keys.
- Keep interpolation variables semantic, for example `{{count}}`, `{{name}}`, `{{revision}}`.

## What should be localized

- Navigation labels
- Menus and action labels
- Button text
- Form labels and placeholders
- Section headings and empty states
- Accessibility labels for controls
- Helper and instructional copy
- Workflow states and package/chat UI labels
- User-visible seeded demo text when it appears directly in the prototype UI

## What can stay data-driven

- Project names when they represent real business entities
- User names
- Document IDs
- API-provided titles or business records, unless the product explicitly requires translated content values

## Validation workflow

For each localization change:

1. Update both language packs.
2. Validate the touched files with diagnostics.
3. Run a build with `npm.cmd run build` on this machine.
4. Check the affected route in both English and French browser locales when practical.

## Production maintenance

- Locale files live in `public/locales`, so they can be reviewed, replaced, or patched without changing the TypeScript implementation.
- Treat `en-US.json` as the source pack and keep `fr-FR.json` structurally aligned with it.
- During reviews, compare new keys across both packs before accepting UI changes.
- When adding a new page or panel, localization should be part of the same change, not a follow-up cleanup.