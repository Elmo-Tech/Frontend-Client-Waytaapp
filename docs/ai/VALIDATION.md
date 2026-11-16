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

For documentation-only work, check local Markdown links and heading anchors, referenced source paths and npm scripts, module coverage against `src/modules`, adapter metadata/import paths, and preservation of Next-managed instruction blocks. Compare against the initial working-tree state, not only HEAD, to protect pre-existing changes. Keep dated evidence in the relevant phase report: [Phase 1](PHASE1_VALIDATION.md), [Phase 2 P0](PHASE2_P0_VALIDATION.md) or [Phase 3 P1](PHASE3_VALIDATION.md). Preserve historical reports; unresolved Phase 1 evidence remains in [GOVERNANCE_AUDIT.md](GOVERNANCE_AUDIT.md).

There is no repository documentation-validation npm script in this checkout. Do not invent a script name or add dependencies merely to validate links. Sibling operations references are conditional on the independent checkout being present. Formatting and link checks cannot prove that an AI client followed the instructions.


## P0 risk-based validation

This is the single shared classification for [Safe Refactor](SAFE_REFACTOR.md), [Feature Implementation](FEATURE_IMPLEMENTATION.md) and the [P1 procedures](WORKFLOW.md#p1-workflow-selection). The existing heading/anchor is retained for P0 compatibility; no second risk matrix is introduced. Select the highest risk of the actual impacted behavior, consumers and trust boundary, explain why, and reassess when scope expands. Module membership alone does not turn a text-only edit into a pricing change; a one-line transport change can be HIGH. Unknown material impact must be investigated before assigning a lower risk.

| Risk | Examples / classification | Required verification |
| --- | --- | --- |
| **LOW** | Isolated documentation; visual copy/styling; presentation-only type cleanup with unchanged runtime/public contract | Docs: links, anchors, paths, scripts, navigation/adapter preservation and scope diff. Application UI/types: existing application baseline plus direct before/after or acceptance checks for affected rendering, locale, layout and accessibility. Mark irrelevant request/async scenarios with reasons |
| **MEDIUM** | Module refactors, forms, domain API clients without HIGH trust-boundary impact | Application baseline plus affected behavior/request/serialization checks; success, validation, loading/empty, failure retention, retry, duplicate actions and stale reads as applicable. Exercise affected rendered flows; helper tests alone are insufficient |
| **HIGH** | Authentication, permissions, tenant isolation, pricing, checkout, payments, shared transports or public contracts | MEDIUM evidence plus relevant auth/session/transport/request/contract tests and explicit role/context/denial cases, authoritative-price/refusal cases, retry identity and concurrent actions where applicable. Inspect consumers and client/server reachability. Verify affected user workflows; real-backend claims require authorized integration evidence and remain unverified without it |

For application source changes, preserve the existing application baseline commands above. Existing task/CI/domain requirements remain mandatory; risk classification cannot waive them. Run focused tests for meaningful behavior, reuse existing coverage, and avoid tests that merely mirror a trivial type extraction. A changed import/route/server boundary still requires architecture/build checks even for a small diff.

Behavior-oriented verification is required for an affected user workflow. Use relevant existing automated tests and rendered/manual exercises; use `npm run test:browser` when the existing fixture harness/tooling and scenario are applicable. Record the setup and any coverage gap rather than claiming the harness covers a new criterion. Browser tooling/installations are not authorized by this documentation phase. For future implementation tasks, follow the task's scope and existing browser setup requirements; no production credentials or implicit environment changes.

Keep the existing evidence states: **Passed**, **Failed**, **Not run**, **Not verifiable**. Record automated commands separately from manual observations and assumptions, with environment/revision and specific acceptance/preservation outcomes. A build does not establish behavior equivalence, and local fixtures do not establish backend enforcement or production success. Missing required evidence prevents a full-verification claim; record implementation status separately.

Risk classification adds no new CI, tool configuration, test framework, specification template or blanket approval step. Material unresolved business decisions/contract gaps block only dependent behavior changes; routine authorized work proceeds.


## P1 verification support

Use [Test Strategy](TEST_STRATEGY.md) to map risk and acceptance cases to existing unit, integration, component, browser/E2E, regression and contract evidence. The baseline and risk matrix above remain mandatory as applicable; P1 adds task-specific evidence, not another runner/CI implementation. Performance claims require comparable measured before/after data; dependency conclusions need actual version/advisory/compatibility evidence; API compatibility claims need the stated client/server combinations. Follow each lead guide for those task-specific completion criteria.

A command that started but was interrupted has an attempted execution with a non-success result and incomplete verification; it is never Passed or simply described as an unattempted check. An unavailable browser environment is Not run; the behavior that cannot be established is Not verifiable. Keep these distinctions in the existing four-state evidence record, with exit code/reason when known. Do not overwrite historic reports or carry earlier experiment passes into a new task as fresh results.
