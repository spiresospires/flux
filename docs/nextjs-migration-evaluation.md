# Next.js Migration — Evaluation & Recommendation

| | |
|---|---|
| **Status** | Recommendation — for Engineering discussion |
| **Date** | 2026-07-07 |
| **Scope** | FLUX (the UI for FusionLive — global multi-tenant SaaS for EPCs and Owner Operators) |
| **Proposal under review** | Migrate FLUX from its current Vite + React SPA stack to Next.js. Stated driver: "a more comprehensive framework for this type of product and deployment." Verbal proposal; no written spec. |
| **Deployment context** | Cloud SaaS only (Idox-hosted). No on-prem/self-hosted UI deployments. |

---

## Recommendation (TL;DR)

**Do not migrate FLUX to Next.js at this time.** FLUX is an authenticated, highly interactive, per-tenant dashboard — the class of application that benefits least from Next.js's distinguishing features (server-side rendering, search-engine visibility, file-based routing) while paying the full cost of migration plus a new server runtime to operate. The genuinely valuable capabilities Next.js would bring (edge middleware, a backend-for-frontend layer) can each be adopted independently and more cheaply. Defined revisit triggers are listed at the end.

---

## What FLUX is, and why it matters to this decision

Everything in FLUX sits behind login: virtualised document tables with keyboard navigation and range selection, drag-resizable panels, portal-based dropdowns positioned by live DOM measurement, Framer Motion animation throughout, a Leaflet map, and localStorage-backed user preferences. All of this is **client-only interactivity** — in Next.js App Router terms, virtually every component would be marked `'use client'`. We would be operating a server rendering pipeline for an app that opts out of server rendering almost everywhere.

The recently landed data layer (React Query v5 + typed API client against the documented FusionLive contracts, MSW mock backend, URL deep links) is the portion of a "comprehensive framework" that matters most for this product — and it is already built, and is framework-portable. Migrating would not improve it; it would only put freshly merged work through another churn cycle.

## Pros — what Next.js would genuinely offer

- **Edge middleware.** Authentication checks, per-tenant routing/theming and redirects before the app loads. The strongest single argument for a global multi-tenant SaaS.
- **Faster perceived first load.** A server-rendered shell with streaming could hide API latency on first paint. Real but bounded: post-login SPA navigation is instant from cached assets, and total latency is dominated by the FusionLive API either way.
- **A BFF for free.** API routes could aggregate FusionLive/Oracle calls, trim payloads, and keep tokens out of the browser — useful for enterprise security posture.
- **Convention and hiring.** Established patterns, large talent pool, long-term backing. "One way to do things" has value across multiple teams.
- **Future public surface.** Public marketing/docs/status pages would be first-class if ever needed.

## Cons — what it would cost FLUX specifically

- **A real rewrite of the app's skeleton.** React Router v6 → App Router touches every route, every `navigate()` call, the `?ws=&folder=&doc=` deep-link handling and `location.state` navigation. The MSW bootstrap in `src/index.tsx` conflicts with Next's managed entry point (MSW-in-Next is a known friction area). Leaflet requires dynamic non-SSR imports. Estimate: **weeks of effort plus a full regression pass** over exactly the interaction-heavy features most prone to hydration bugs.
- **A new runtime to operate.** Today the UI ships as static files — CDN-distributed, trivially cacheable, near-zero ops. SSR means Node servers per region: scaling, monitoring, patching. Feasible in cloud-only hosting, but not free.
- **SEO is worth ~nothing here.** Authenticated per-tenant EDMS content must never be indexed by search engines.
- **Hydration hazards throughout the codebase.** Click-time DOM measurement, localStorage reads on mount (user preferences, density, view style) and window-dependent code each need guards. Individually small; there are dozens.
- **Vercel-shaped defaults.** Self-hosted Next.js is supported but second-class: image optimisation, ISR and edge middleware degrade or need extra infrastructure off-Vercel. Expect to reimplement or disable several "comprehensive" features.
- **Opportunity cost.** The same weeks could deliver the actual roadmap: wiring the remaining pages to the new data layer, the real API cutover (`VITE_API_MODE=real`), and outstanding accessibility work.

## On the "more comprehensive framework" argument

Next.js's comprehensiveness consists of: rendering strategies (SSR/SSG/ISR/RSC), file-based routing, image/font optimisation, API routes and middleware. For a logged-in enterprise dashboard, only middleware and API routes are relevant — and both have standalone alternatives (auth at the CDN/API gateway; a thin BFF service in front of FusionLive, which arguably belongs with the backend estate). Vite is not a legacy choice: it is the current ecosystem default for exactly this application shape, and Vite + React Query + a client router **is** the modern "comprehensive" SPA stack — which FLUX already runs.

## Recommended actions

1. **Stay on the Vite + React SPA stack.** Ask for the proposal in writing, stating the *specific* problems Next.js would solve; evaluate against named needs, not generality.
2. **Cherry-pick the real wins independently** as needs are confirmed: a thin BFF for token-hiding/aggregation; per-tenant edge logic at the gateway/CDN.
3. **Revisit triggers** — any of these genuinely reopens the question:
   - a public, unauthenticated surface becomes part of FLUX;
   - a hard requirement emerges for server-rendered first paint;
   - an organisation-wide mandate consolidates all products on Next.js.

   The React Query / API-contract layer carries over in every scenario, so nothing invested now is wasted.

---

## Glossary

| Term | Meaning |
|---|---|
| **ADR** | Architecture Decision Record — a short document capturing one architectural decision and its rationale (see ARCHITECTURE.md) |
| **API** | Application Programming Interface — the HTTP contract through which FLUX talks to FusionLive |
| **BFF** | Backend-for-Frontend — a thin server layer owned by the UI team that sits between the browser and core backend APIs, aggregating calls, trimming payloads and keeping credentials/tokens out of the browser |
| **CDN** | Content Delivery Network — globally distributed servers that cache static files close to users |
| **EDMS** | Engineering Document Management System — the product category FusionLive/FLUX serves |
| **EPC** | Engineering, Procurement and Construction (contractor) — a core FusionLive customer segment |
| **ISR** | Incremental Static Regeneration — a Next.js feature that re-builds individual static pages on a schedule or on demand |
| **MSW** | Mock Service Worker — the library that intercepts FLUX's HTTP requests in the browser and answers them with mock data during development |
| **RSC** | React Server Components — components that render only on the server, sending no JavaScript to the browser; the default in Next.js App Router |
| **SEO** | Search Engine Optimisation — making pages indexable/rankable by search engines; irrelevant for authenticated content |
| **SPA** | Single-Page Application — the browser downloads the app once and renders everything client-side; FLUX's current architecture |
| **SSG** | Static Site Generation — pre-rendering pages to static HTML at build time |
| **SSR** | Server-Side Rendering — rendering HTML on a server per-request before sending it to the browser |
| **TTFB** | Time To First Byte — how quickly the server starts responding; a first-load performance metric |
