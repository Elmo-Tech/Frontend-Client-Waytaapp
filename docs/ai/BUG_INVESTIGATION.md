# Bug Investigation & Fix — P1

These are procedures for future authorized work. **This Phase 3 implementation permits documentation only**: none of the source, test, manifest or contract edits described below are executed here. Start with [workflow selection and common controls](WORKFLOW.md#p1-workflow-selection), [domain ownership](DOMAIN_MAP.md), [architecture](../ARCHITECTURE.md) and status-qualified [specifications](SPEC_MAP.md). Reuse the existing [risk matrix](VALIDATION.md#p0-risk-based-validation), [Test Strategy](TEST_STRATEGY.md) and evidence statuses in [VALIDATION.md](VALIDATION.md#evidence-record); do not duplicate their policies or waive baseline checks.

**Reproduce → Trace → Explain → Plan → Fix → Verify → Report**

## 1. Entry conditions

A reported deviation from an existing expected outcome. Identify the expected behavior and its source/approval; if the requested outcome is new, select [Feature Implementation](FEATURE_IMPLEMENTATION.md). A report is not proof of a current defect. Record revision, environment, actor/context, input, actual/expected result and reproducible steps without secrets or customer data.

## 2. Investigation

Reproduce safely using existing fixtures or an authorized test environment. Preserve logs, exact request/response/error and observable state. Locate owner, callers, public entry, state/effect lifecycle, validation/serialization, transport and error mapping. Form falsifiable hypotheses and vary one factor at a time; distinguish application faults, fixture races, environment failures and unapproved expectations. A missing reproduction is an unresolved investigation, not permission for a speculative patch.

## 3. Root cause and planning

Explain the causal path from trigger to incorrect result and cite evidence that distinguishes it from alternatives. Plan the smallest owner-local correction and meaningful regression checks; reuse [CHANGE_SPEC_TEMPLATE.md](CHANGE_SPEC_TEMPLATE.md) when substantial. Separate unrelated cleanup. If cause is unproven, report hypotheses and the next discriminating observation, without claiming a fix. Do independent authorized work while waiting for a material missing decision/environment.

## 4. Risk classification

Use actual impact: isolated visual correction may be LOW; form/state/API-client correction is normally MEDIUM; auth, permission, tenancy, money, checkout, transport or public-contract handling is HIGH. Raise risk if tracing reveals broader consumers; a small diff is not a lower-risk justification.

## 5. Allowed modifications

Only the authorized owning implementation and necessary existing test/fixture coverage. Preserve unrelated behavior, public entries and client/server separation. Do not change expected contracts, backend rules, user data or sibling repositories to make a reproduction pass. An intentional approved API change uses [API Contract Changes](API_CONTRACT_CHANGES.md); an internal cleanup can use [Safe Refactor](SAFE_REFACTOR.md) as supporting guidance.

## 6. Validation strategy

For an authorized fix, demonstrate the old failure and corrected result with a regression test where meaningful/feasible. Cover adjacent success, invalid, loading/empty, failure retention, retry, repeated action and stale responses where relevant. Run the applicable existing baseline and affected rendered/manual flow checks from Test Strategy. Never weaken assertions, blindly update a fixture/hash, or synchronize asynchronous saves against an unrelated alert.

## 7. Regression considerations

Check callers and negative paths, locale/RTL, focus/accessibility and cancellation/cleanup. A test that proves one helper works does not prove the reported user flow. Record any case not exercised, especially genuine auth/tenant/backend behavior behind mocked responses.

## 8. Rollback

Record the task-specific patch/file set and previous observable behavior. If the correction regresses another case, revert only those changes and re-run affected checks; do not reset user work, disable a test, clear production data or silently reintroduce a security/contract problem. Report any rollback trade-off.

## 9. Evidence requirements

Provide reproduction steps/result, expected-behavior authority, trace/root-cause evidence, patch scope, before/after regression result, actual command/revision/environment and remaining uncertainty. Keep hypotheses distinct from demonstrated causes and fixes. Use the existing four evidence statuses.

## 10. Completion criteria

The supported defect is reproduced, cause established, minimal fix applied and required regression/baseline/user-flow verification completed. Otherwise state whether investigation, implementation or verification remains incomplete. A non-reproduced report may close as an investigation outcome, never as a verified code fix. Report failures and unverified outcomes explicitly.
