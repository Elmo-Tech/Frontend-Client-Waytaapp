# Web architecture

The standalone web repository uses Next.js App Router and lightweight business modules. Runtime and builds do not import sibling repositories.

## Ownership

- `src/app`: the original routes, layouts, metadata and framework entry files. Page implementations are composed through module entry points; page files have at most 13 lines.
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
