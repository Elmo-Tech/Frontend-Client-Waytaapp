# Frontend stability — 2026-11-15

Scope: `web` frontend only. No API, database, operations infrastructure, credentials, API contract, deployment, commit or push changes. Real backend integration is explicitly excluded by the user's instruction.

## Implemented

- Guest design-preview subscriptions, checkout state/validation, cart persistence/customization, request submission and pure cart display calculations have focused owners. Original domain rules and server-authoritative pricing remain intact.
- Offer draft validation/serialization, loading/mutations, item picker, item row and editor are separated from the list screen. Category fields and preset forms are extracted without changing their existing copy or routes.
- A synchronous exclusive-task guard covers guest order and WhatsApp submission before asynchronous validation, and offer mutations through their refresh. Failures release the guard for retry; cart/input retention and pending request identity are preserved.
- Preset and offer reads discard superseded responses. Queued cart hydration is cancelled on cleanup. Availability checks are serialized; obsolete results and status timers are invalidated on cleanup.
- Failed offer loads expose an explicit retry action.
- Earlier browser evidence recorded horizontal overflow for Ember. The oversized rotated marquee is now contained with `overflow-x: clip` on the Ember root, preserving sticky navigation and the existing design. The new browser suite asserts viewport bounds; visual verification remains pending locally.
- Route and root error boundaries provide an English/Arabic retry UI independent of application providers. Client exceptions and unhandled rejections publish `wayta:client-error` with metadata only (source, error name, optional digest) and log that metadata to the browser console. No external monitoring destination is configured or contacted.
- CI explicitly checks architecture and runs a production-build Chromium suite with pinned, isolated Playwright tooling. Browser artifacts upload even after a failure.

## Validation

| Check | Status |
| --- | --- |
| Tests | PASS: 410 tests |
| Lint | PASS, no warnings |
| TypeScript | PASS |
| Architecture | PASS, including existing public-entry, cycle and server/client checks |
| Production build | PASS with `npm run build -- --webpack` and local fixture API configuration |
| Browser scripts and fixture modules | JavaScript syntax checks passed |
| Browser execution | BLOCKED locally: opening fixture HTTP ports is denied with `listen EPERM` |
| Fresh install | BLOCKED locally: offline cache is missing `zod-validation-error-4.0.2.tgz`; registry DNS is unavailable. Existing working installations were retained. |

The default Turbopack build is not claimed as verified. CI retains the default build so it is exercised on a normal runner. CI itself has not been triggered or observed in this task. Existing source-preservation checks remain; checkout assertions now check validation before the network call rather than before the loading indicator, and formatting-only assertions tolerate whitespace. New tests assert runtime behavior, not source hashes.

New behavioral tests cover overlapping actions, lock recovery after rejection, stale reads, safe error metadata, exact cart arithmetic, unavailable products/sizes, current menu prices, identity-only payloads, offer translations/money and duplicate offer items.

The browser suite covers menu designs/exclusive renderers, Arabic/mobile and English/desktop, missing/unavailable menus, auth screens, rapid repeated checkout clicks, failed orders with preserved carts and retry identity, price-change refusal/refreshed totals, invalid-field focus and retained pickup inputs. Browser traffic is allowlisted to the frontend and local fixture API only.

## Reproduce browser verification

On a machine with network and permission to bind localhost ports, run from this repository:

```sh
npm ci
npm install --prefix /tmp/wayta-browser-tools --no-audit --no-fund --ignore-scripts playwright@1.62.1
node /tmp/wayta-browser-tools/node_modules/playwright/cli.js install chromium
NEXT_PUBLIC_API_URL=http://127.0.0.1:14480 NEXT_PUBLIC_API_BASE_PATH=/api/v1 npm run build
PLAYWRIGHT_MODULE=/tmp/wayta-browser-tools/node_modules/playwright/index.mjs npm run test:browser
```

The harness starts its own fixture API and production Next server, uses no account/database, blocks external browser requests, writes `test-results/browser/` and exits nonzero on failure. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` can point to an existing Chromium executable. Production builds bake in public API configuration; rebuild with the real deployment configuration before releasing.

## Remaining verification

Run the browser suite and clean install in CI or an unrestricted development environment. Inspect mobile/RTL screenshots and confirm keyboard behavior before release. Connecting an external monitoring collector requires an actual service configuration; the capture hook alone is not operational monitoring. No claim of 100% stability, live backend verification, deployed behavior or successful CI is made.
