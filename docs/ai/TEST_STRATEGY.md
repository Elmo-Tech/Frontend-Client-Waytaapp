# Test Strategy — P1 supporting guidance

These are procedures for future authorized work. **This Phase 3 implementation permits documentation only**: none of the source, test, manifest or contract edits described below are executed here. Start with [workflow selection and common controls](WORKFLOW.md#p1-workflow-selection), [domain ownership](DOMAIN_MAP.md), [architecture](../ARCHITECTURE.md) and status-qualified [specifications](SPEC_MAP.md). Reuse the existing [risk matrix](VALIDATION.md#p0-risk-based-validation) and evidence statuses in [VALIDATION.md](VALIDATION.md#evidence-record); do not duplicate their policies or waive baseline checks.

This is supporting guidance for **all** P0/P1 tasks, not a seventh implementation workflow. Its own documentation-only dry run evaluates selection completeness, not runtime correctness.

## 1. Entry conditions

Start with the selected lead workflow, owner, actual change/preserved contract, risk and acceptance examples. Read [VALIDATION.md](VALIDATION.md) for mandatory gates and evidence labels. Identify which layers and consumers can fail; do not select tests from line count or an arbitrary coverage percentage.

## 2. Investigation and existing tooling

Inventory real tests, package scripts, fixtures, runner configuration and available browser tooling in this repository. Web uses Node's test runner and standalone .test.mjs files; Platform uses Jest/ts-jest configured in package.json with a Node environment and .spec.ts files under tests. Both have local-fixture browser scripts; Playwright is not a declared dependency in either current manifest. A passing Node/Jest test is not automatically a DOM/component or real integration test.

## 3. Planning and test selection

Map each relevant acceptance/preservation example to an existing assertion or an identified gap, its level and intended observable result. Reuse existing runners and fixtures. Keep the test plan in the task brief/existing change-spec template, not a second specification format.

| Level | Use when / evidence sought | Limits and current fit |
| --- | --- | --- |
| Unit | Pure validation, formatting, serialization, arithmetic and transition rules | Existing Node/Jest helpers; not proof of full UI or authority |
| Integration | Connected frontend layers such as transport/error mapping/session composition | Existing mocked transport/server tests check frontend integration only; real API integration needs authorized environment evidence |
| Component | Render branches, labels, semantics, prop interactions and local state | Static React rendering can inspect markup; hydration/focus/events need a suitable rendered environment. No DOM test framework is assumed or added |
| Browser / E2E | Actual routes, keyboard/focus, RTL/layout, hydration, requests and recovery | Existing fixture harnesses cover specific frontend flows; fixture E2E is not genuine backend/database E2E |
| Regression | A reproduced bug or preserved important outcome | A purpose across the appropriate levels, not another runner; prove the old failure where feasible |
| Contract | Methods/paths/headers/body, optional/null semantics, errors and compatibility | Web function hashes are structural preservation checks; Platform mocked call expectations are request construction evidence. Neither proves a real server response |

## 4. Risk classification

Apply the single shared LOW/MEDIUM/HIGH matrix; it adds behavioral depth without waiving existing architecture/typecheck/lint/tests/default-build gates. HIGH changes need relevant denial/context/pricing/transport/compatibility evidence; choose cases by actual impact, not every conceivable scenario. Explain inapplicable states.

## 5. Allowed modifications

During a future authorized implementation, add/update meaningful tests or minimal fixtures using existing tooling when appropriate. Do not add a framework, install browser dependencies, change CI, skip assertions, add production credentials or edit baselines to manufacture a pass. Phase 3 writes no tests or application source. A trivial private type extraction does not require a test that merely repeats the type declaration.

## 6. Validation execution

Run the applicable existing commands, recording exact revision, environment and actual result. Focused checks supplement mandatory gates; they do not replace them. Synchronize asynchronous assertions with the intended request/outcome; isolate fixture failure modes and count mutations. Keep automated results, rendered/manual observations and unverified cases separate. Validate that tests inspect current implementation rather than a saved baseline or substituted source.

## 7. Regression considerations

Cover success, invalid, loading, empty, failure retention, retry and rapid actions where relevant; stale reads, auth/tenant denial, price changes, locale/RTL, keyboard, focus and reduced motion for affected behavior. Consider fixture contamination and false-positive generic alerts. Explain gaps in existing harness assertions instead of equating route visits/screenshots with acceptance.

## 8. Rollback and flaky-test handling

Record which task-specific test/fixture changes can be reverted with the implementation. Do not restore a wrong expected outcome or disable a failing check to approve a patch. For suspected flakes, preserve the first failure and isolate its cause; a rerun pass does not erase it. Revert only task changes and retain regression evidence/user work. Test-environment reset must stay within authorized disposable fixtures.

## 9. Evidence requirements

For each acceptance case, record level, existing/new assertion or manual procedure, command/environment/revision, observed result and artifact/limitation. Use Passed, Failed, Not run and Not verifiable as defined in VALIDATION. Interrupted builds and unavailable browser checks cannot be Passed. No result is inferred from file existence, historic counts, a compile pass or a proposed test.

## 10. Completion criteria

All applicable mandatory checks and required behavior assertions are executed and accounted for. If a required browser/integration/build check is unavailable or interrupted, verification is incomplete even if implementation is complete. Documentation/test-plan review may complete independently; it cannot certify the proposed application's correctness or cross-tool AI compliance.
