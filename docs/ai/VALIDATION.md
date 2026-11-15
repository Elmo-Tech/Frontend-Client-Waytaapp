# Validation and evidence

## Match checks to the change

| Change | Required verification |
| --- | --- |
| Instructions/docs only | Validate referenced paths, Markdown links, command names and adapter frontmatter; inspect diff |
| Pure logic, validation or serialization | Relevant behavioral tests and typecheck |
| UI, hook or asynchronous workflow | Relevant tests, lint, typecheck; browser check for affected interactions when available |
| Routes, imports, module boundaries or server/client composition | Architecture check and production build in addition to relevant checks |
| Transport, auth or API-contract handling | Request/transport/auth tests; error statuses, credentials and payload compatibility |
| Dependency or lockfile | Clean install in an isolated directory, relevant tests and production build |

For application changes, the repository baseline commands are:

```sh
npm run check:architecture
npm run lint
npm run typecheck
npm test
npm run build
```

Use Node `>=24 <25` and the npm version declared in `packageManager`. Prefer `npm ci` for a lockfile-based installation when installation is needed. Do not delete a working installation merely to attempt a clean install with an unavailable registry/cache; use an isolated directory.

The default build is the normal gate. A `--webpack` build can provide additional evidence when diagnosing a bundler-specific issue; report that distinction rather than silently presenting it as the default build result.

## Browser checks

The `test:browser` script uses a local fixture API, not a live backend or database. Read [the stability report](../FRONTEND_STABILITY.md) and `scripts/browser-qa.mjs` for the tooling setup and fixture build configuration. Never substitute production credentials to make a fixture test pass.

- Install the pinned Playwright tooling and Chromium as described by the active workflow or report.
- Build with this repository's fixture origin before running `npm run test:browser`.
- Public API settings are baked into the build; rebuild with real deployment settings before releasing.
- Review `test-results/browser/` screenshots, results and server logs. A partial report or screenshot is not a passing suite.
- Preserve the harness's external-request block and local-fixture isolation.
- For Arabic/mobile UI, check direction, horizontal overflow, labels, controls, validation focus, dialog keyboard behavior and reduced motion where relevant.

## Asynchronous tests must wait for the actual outcome

Wait for the intended request/response and a specific success/failure state. Do not treat any `[role="alert"]` as proof that an asynchronous save failed: an earlier validation alert may still be visible. Do not switch mutable fixture failure flags until the intended response has completed. Verify the request count, retained form values and retry result.

Do not replace state-based waits with arbitrary sleeps or fix a timeout by merely increasing it. Diagnose the application and harness separately. Increase a timeout only with evidence that the behavior is correct and legitimately needs longer.

## Preserve contract checks

- Existing endpoint expectations protect method, URL, encoding, payload, null/optional fields and money strings.
- Do not update a baseline just because a test failed. First determine whether behavior was intentionally changed and authorized.
- Add meaningful behavioral coverage for changed rules. Do not add tests that only mirror a trivial implementation.

## Evidence record

Report each relevant check as **Passed**, **Failed**, **Not run** or **Not verifiable**, with its command, evidence and reason. A blocked execution is Not run; a claim that cannot be established from available evidence is Not verifiable. Include the exact CI commit/run when applicable.

Historical validation reports and past test counts are not current release truth. A merged PR, a neutral bot review or a running workflow is not a passing check. A frontend fixture suite does not verify real backend sessions, CORS, tenant isolation, database writes or production deployment.

Never clear, bypass or describe a failing check as successful merely to finish the task. Investigate within the authorized scope and report any remaining issue.


## Documentation governance checks

For documentation-only work, check local Markdown links and heading anchors, referenced source paths and npm scripts, module coverage against `src/modules`, adapter metadata/import paths, and preservation of Next-managed instruction blocks. Compare against the initial working-tree state, not only HEAD, to protect pre-existing changes. Record results in [PHASE1_VALIDATION.md](PHASE1_VALIDATION.md); unresolved evidence belongs in [GOVERNANCE_AUDIT.md](GOVERNANCE_AUDIT.md).

There is no repository documentation-validation npm script in this checkout. Do not invent a script name or add dependencies merely to validate links. Sibling operations references are conditional on the independent checkout being present. Formatting and link checks cannot prove that an AI client followed the instructions.
