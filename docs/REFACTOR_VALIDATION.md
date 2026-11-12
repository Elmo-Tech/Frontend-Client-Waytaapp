# Refactor validation — 2026-11-12

Scope: standalone `wayta_app/web`, plus relocation of backend-source contract tests to `wayta_app/operations`. Original monorepo, API and platform implementations are unchanged. No commit, push or deployment was performed.

## Architecture and cleanup

Previously, the same business domain had implementations in `app`, `components` and `lib`. Business pages and API functions now live in 22 modules documented in [ARCHITECTURE.md](ARCHITECTURE.md). The 50 original page/layout/route entry paths are retained. Pages have at most 13 lines. No extra route groups were needed.

- Shared infrastructure has six actual directories: api, auth, env, i18n, infrastructure and utils. Shared components cannot depend on business modules.
- The 1,063-line menu endpoint file was divided into menus, categories, products, variants, modifiers and modifier presets with shared typed DTOs.
- PublicMenuView (~2,028 lines) separates presentation (~748 lines) from its controller. ProductEditor (~1,451 lines) separates its controller, models and fields from the view (~575 lines). ModifiersSection (~1,395 lines) delegates to existing form/editor components (~211 lines in the main section).
- Common API error handling, locale-name fields, international phone input and icons have shared ownership. Domain CSS and fonts retain their original declarations and binaries.
- Four baseline ESLint errors and two warnings were fixed without disabling rules: derived image-source resets, editor loading state initialization, connection refresh scheduling, phone-menu dependencies and an unoptimized image component preserving eager loading and CSS dimensions.
- Removed the confirmed unused direct `dotenv` dependency. Next's existing environment loading remains in place. No other dependency was removed on import counting alone. No new runtime dependency or test framework was added.
- Existing DTOs and typed controller/field contracts were retained/extracted. No `any`, TypeScript suppression or global ESLint disabling was added.
- Server routing stays server-side; browser interaction remains client-side. Existing lazy renderer imports and data fetching semantics remain intact. No speculative caching or performance rewrite was introduced.

## Automated validation

All commands below run from web unless indicated otherwise. Node 24; package manager pinned by `packageManager` to npm 11.12.1.

| Check | Command | Final result |
| --- | --- | --- |
| Lint | `npm run lint` | PASS, no warnings |
| Typecheck | `npm run typecheck` | PASS (Next route generation + `tsc --noEmit`) |
| Web tests | `npm test` | PASS, 401 tests |
| Cross-repository tests | `npm test` in `../operations` | PASS, 25 tests |
| Production build | `npm run build` | PASS, default Turbopack, standalone output |
| Architecture/cycles | `npm run check:architecture` | PASS, 604 sources, 22 domains, zero runtime cycles/reversed boundaries/client-to-server imports |
| Clean install | `npm ci --prefer-offline --no-audit --no-fund` | PASS |
| Installed dependency tree | `npm ls --all` | PASS |
| Full dependency audit | `npm audit --json` | WARNINGS, seven moderate affected development packages |
| Production audit | `npm audit --omit=dev --json` | PASS, zero vulnerabilities |

Build environment used non-secret local fixture configuration: `NEXT_PUBLIC_API_URL=http://localhost:14480`, `NEXT_PUBLIC_API_BASE_PATH=/api/v1`, `WEB_URL=http://localhost:14482`, `NEXT_OUTPUT=standalone`, `NEXT_TELEMETRY_DISABLED=1`. No API URL or secret was written to the application's environment files.

A stylesheet import-order regression check preserves the original cascade. Screenshot inspection caught and corrected a reordered Makkboz CSS import before final validation.

234 request/response implementation checks compare canonical TypeScript function bodies with pre-refactor hashes. Existing source-contract assertions read relocated implementation through a path-identity adapter. Four suites (18 tests) which require backend source now run in operations. The standalone suite no longer accidentally requires a sibling backend checkout.

## Runtime regression evidence

A local fixture API, the original production build and the refactored production build run side by side in headless Chromium with the same viewport, locale, theme and reduced motion preferences. The harness compares body text, form controls, disabled/checked state, route outcomes, RTL direction, horizontal overflow and browser exceptions.

28 comparisons cover 11 standard Guest designs, four exclusive renderers, Arabic/mobile and English/desktop menus, missing/unavailable menus, login/forgot/reset screens, two marketing screens, unauthenticated protected routes, backend-session outage behavior, and a Table QR → add product → cart → submit order → acknowledgement flow. Both order submissions must send identical request bodies. Screenshots and decoded pixel comparison results are recorded separately: 27/28 full-page comparisons have identical decoded pixels. The landing-clay image differs by eight pixels within the same dimensions (1440 × 6227); its text, controls and geometry match. No claim of universal pixel-perfect equivalence is made. Browser fixtures validate frontend behavior; they do not prove production session/cookie/CORS configuration, backend tenant isolation or real database writes.

Evidence summaries are under `docs/validation/`. The reproducible browser harness requires externally installed Playwright/Chromium; those are not added as application dependencies. Raw screenshots and detailed command logs remain in `/private/tmp/wayta-web-refactor` for this local run.

## Security audit

Counts refer to affected packages reported by npm, not seven independent root vulnerabilities:

- Critical: 0.
- High: 0 (the baseline high finding in transitive Zod was fixed with compatible updates).
- Moderate: 7, all development-only: minimatch and six TypeScript ESLint packages which depend on it.
- Low: 0.
- Production dependencies: 0 findings.

Remaining root advisory: [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), glob amplification denial of service in minimatch. Installed TypeScript ESLint uses `minimatch ^10.2.2`; the advisory requires 11.0.1 or later. `npm audit fix --ignore-scripts` applied compatible fixes but could not clear this chain. An unverified major transitive override was deliberately not applied. JSON reports retain dependency paths, advisory details and severities.

## Meaningful remaining debt and limitations

- Guest menu controller and large exclusive/marketing renderers still deserve incremental decomposition under behavior-specific coverage. This refactor establishes ownership and separates major responsibilities without rewriting product logic.
- Existing tests include source-shape contracts; the path adapter keeps them useful through this move. Future tests should increasingly assert behavior at public boundaries.
- No live authenticated backend/database or production deployment was exercised. Real end-to-end tenant, cookie, CORS and order-state verification remains a release activity against a configured test environment.
- The development-only minimatch advisory requires an upstream compatible dependency update or separately validated major toolchain change.
