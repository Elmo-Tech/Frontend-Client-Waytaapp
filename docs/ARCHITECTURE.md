# Web architecture

The standalone web repository uses Next.js App Router and lightweight business modules. Runtime and builds do not import sibling repositories.

## Ownership

- `src/app`: the original routes, layouts, metadata and framework entry files. Page implementations are composed through module entry points; the current checkout has page files of at most 13 newline-split lines (observed, not a separate policy; the existing scanner limit is 20).
- `src/modules`: announcements, auth, branches, dashboard, delivery, demos, guest-menu, kitchen, marketing, menu, menu-import, offers, orders, qr, restaurant-setup, settings, staff, subscription, suggestions, table-sessions, tables and whatsapp-tracking. Only folders containing real implementation are present.
- `src/components/common` and `src/components/ui`: reusable controls, localization fields, notifications and icons.
- `src/lib/api`: shared browser/server transports and controlled errors. Endpoint functions belong to domains.
- `src/lib/auth`: session bootstrap, authentication contracts and shared entitlement infrastructure. Authentication screens and account endpoints belong to `modules/auth`.
- `src/lib/env`, `i18n`, `infrastructure`, `utils`: technical configuration, translation infrastructure, tenant host routing, asset URLs and reusable helpers.
- `src/config/menu-templates.ts` and `src/types/restaurant-contact.ts`: shared vocabulary/contracts used by unrelated domains and infrastructure.

## Dependencies and public contracts

App routes depend on module APIs. Modules depend on shared infrastructure/UI. Shared code must never import modules. Cross-module imports use public files at a module root, never its implementation directories.

Each module's `index.ts` exposes its route composition. Focused public capability files such as `menu/api.ts`, `staff/capabilities.ts` and `guest-menu/money.ts` expose only capabilities needed by other modules. These entry points deliberately separate server composition from browser-safe APIs. Importing all client capabilities from the server composition barrel would pull Next server imports into client trees. Internal module code does not import its own composition barrel.

ESLint enforces layer and module boundaries. `npm run check:architecture` additionally checks imports, thin pages, runtime cycles and client reachability into server-only code. It builds the runtime graph from TypeScript-emitted JavaScript so erased type imports are not mistaken for runtime cycles. Existing lazy menu renderers remain lazy.

## Server, client and styles

Routes and server composition remain Server Components by default. Existing interactive client/data-fetching boundaries are preserved. Guest menu and product-editor controllers are separate from presentation; no global client store or new fetching framework was introduced. The staff shell owns business navigation in its domain.

Guest, marketing and exclusive-renderer CSS stays with its owner. Fonts remain shared binary assets with unchanged files; relative stylesheet font paths resolve to those same assets. Global CSS stays in App Router. No route groups were added because the existing layout boundaries already express the product's routing.

## API and security invariants

The HTTP transports retain existing URL construction, credential handling, CSRF/origin assumptions, locale forwarding and error responses. Domain endpoint implementations are covered by 234 canonical request-function regression checks captured before the refactor. Backend remains authoritative for scope, permissions, pricing and state. No API migration or production connection change is part of this refactor.

## Tests

`npm test` runs standalone Node tests. `tests/contracts/source-files.mjs` maps historical source identities to their current owners for existing source-contract assertions. Split implementations are concatenated for those assertions; the adapter reads current code, never a saved baseline. Original behavioral assertions remain in place. The request hash fixture normalizes comments/formatting only.

Four suites requiring backend source belong in the sibling operations repository, alongside the existing cross-repository contracts. Its tests are validation tooling, not web runtime/build dependencies. Run `npm test` there when all sibling repositories are checked out.


## Phase 1 architecture knowledge map — 2026-11-15

The [domain ownership map](ai/DOMAIN_MAP.md) records all 22 existing domains, their public files, representative internals, API owners, boundaries and test references. Use [the classified specification map](ai/SPEC_MAP.md) for product authority. Source presence and historical implementation reports do not establish approval or deployment.

### Layer and request flow

`src/app` composes routes/layouts and domain implementations; domain views/hooks/helpers own business UI. Modules consume shared `src/components`, `src/lib`, configuration and types. Shared code must not import modules; code outside app must not import app. Browser mutations use existing credentialed transport; server reads use existing server transport and session boundaries. Backend permissions, tenancy, pricing and state transitions remain authoritative.

Web allows cross-module imports through a module index or a direct module-root file. Do not reduce this to an index-only rule: focused root capability files are used by table-sessions and whatsapp-tracking. Module internals must not import their own composition index. Empty indexes in these two domains are intentional; use their focused capability entries.

### Existing enforcement and its limits

The executable source of boundary policy is [architecture-rules.mjs](../scripts/architecture-rules.mjs); [check-architecture.mjs](../scripts/check-architecture.mjs) walks source imports. Existing `npm run check:architecture`, `npm run lint` and architecture tests are the enforcement mechanisms. No parallel checker is introduced here.

The scanner checks literal import edges, internal resolution, runtime cycles, client-to-server reachability, non-routing app source and route page size (at most 20 newline-split lines, including blanks). Web removes erased type-only imports when building its runtime graph. This is static evidence: computed import targets, runtime payload semantics, provider behavior and real authorization are outside its proof. Keep server-only implementations/private origins unreachable from client entry graphs; a browser-safe root contract does not make every file in a module client-safe.

### Ownership exceptions and repository independence

Request ownership is evidenced by source, not a rule that every module must have an api directory. See domain entries for direct shared-auth calls, inline requests and server-read composition. Reuse existing transports; do not add wrappers merely to make the documentation uniform.

This frontend owns its package manifest, lockfile, environment and runtime configuration. The parent is not an npm workspace. Operations specifications are read-only sibling knowledge references; there are no cross-repository source imports or shared runtime library. Historical `apps/*` paths in operations describe the former monorepo and do not override the standalone repository decision.

[Governance inventory and gaps](ai/GOVERNANCE_AUDIT.md) and [Phase 1 validation](ai/PHASE1_VALIDATION.md) distinguish observed facts from unresolved evidence. Refactor/stability reports remain dated records; current CI, browser behavior and production were not certified in Phase 1.
