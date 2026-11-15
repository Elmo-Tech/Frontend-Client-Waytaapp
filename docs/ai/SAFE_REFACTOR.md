# Safe Refactor Workflow — P0

**Discover → Analyze → Plan → Refactor → Verify → Report**

Use when internal structure changes while externally observable behavior stays the same. Start with the [selection guide and common workflow](WORKFLOW.md); choose impact using the [shared risk matrix](VALIDATION.md#p0-risk-based-validation). This procedure owns refactor-specific decisions, not a second architecture or specification system. Record evidence in the task/change brief; extra process files are not mandatory. For substantial refactors, reuse [CHANGE_SPEC_TEMPLATE.md](CHANGE_SPEC_TEMPLATE.md).

## 1. Discover

Identify the business owner through [DOMAIN_MAP.md](DOMAIN_MAP.md), then inspect the current implementation, route composition, public entries, imports and callers. Trace internal dependencies and affected consumers, including focused capabilities and server composition. Read the applicable [architecture](../ARCHITECTURE.md), [domain rules](DOMAIN_RULES.md), and status-qualified [specifications](SPEC_MAP.md). Locate actual behavioral, request, architecture and browser checks; distinguish coverage from file existence or source-hash fixtures.

**Exit evidence:** owning module; concrete source/caller/public-entry paths; relevant decision status; existing checks and uncovered behavior. Missing specifications do not authorize a behavior change. Resolve only material uncertainty; continue independent work that does not depend on it.

## 2. Analyze

Write the observable before/after contract before modifying files. Record relevant inputs, actions, outputs, side effects and state transitions, with examples for normal, invalid, loading, empty, failure, retry and repeated-action behavior. Mark inapplicable scenarios with a reason. Include:

- HTTP method/path/encoding, credentials, bodies, response/error shapes and public TypeScript contracts.
- Routes and navigation; roles, permissions and restaurant/branch context; backend tenancy, pricing and business-state authority.
- Locale selection, Arabic/English copy, RTL/LTR and exact-money display semantics.
- Rendered UI, assets, layout, accessibility, keyboard/focus behavior and reduced motion.
- Failure retention, retry/request identity, concurrency guards, stale-response cancellation and listener/timer cleanup where present.

Use observations/tests as evidence, not invented behavior. A known defect is recorded separately; changing it is not a behavior-preserving refactor. If the request intentionally changes an outcome, separate that approved feature delta and use [Feature Implementation](FEATURE_IMPLEMENTATION.md).

**Exit evidence:** preserved outcomes and their verification method. A passing build alone cannot demonstrate equivalence.

## 3. Plan

Name the precise responsibilities to separate and the evidence-based reason (for example, a type contract mixed into rendering). Select the smallest viable file/export change; explain the benefit and why a smaller edit or no refactor is insufficient. Avoid speculative abstractions or splits based only on line count. List affected callers, potential regressions, highest applicable risk and checks from the shared matrix. Record how to revert only this task's changes without resetting user work.

If the benefit is marginal, report that conclusion instead of performing a gratuitous refactor. If a move affects source-contract path adapters, plan a legitimate mapping update that still reads current source; never fabricate a baseline to satisfy a check.

**Exit evidence:** focused file/responsibility plan, preservation examples, risks and validation selection. Planning does not create a new approval gate for work already authorized.

## 4. Refactor

Apply only the planned internal change. Preserve public APIs and observable outcomes; keep App Router focused on framework composition, implementation in its domain, shared UI/infrastructure independent of domain implementations, and server-only code unreachable from client bundles. Follow the actual repository public-entry rules in architecture and the existing scanner; do not import a module's own composition barrel internally.

Reuse existing transports, controls, validators and helpers. Do not introduce architecture patterns, incidental dependencies, sibling imports, API changes or unrelated cleanup. Keep increments reviewable and inspect their callers. If evidence invalidates the plan or increases impact, return to Analyze/Plan and raise risk before continuing.

**Exit evidence:** a focused diff traceable to the plan and unchanged public contract.

## 5. Verify

Run applicable existing architecture, TypeScript, ESLint, tests and default build gates as required by [VALIDATION.md](VALIDATION.md). Compare the Analyze examples before and after using behavior-oriented tests and rendered/manual checks for affected user workflows. For asynchronous changes, verify the exact request/result, retained inputs, retry and repeated-action outcomes; do not use a generic alert or arbitrary delay as proof.

Separate automated results, manual observations and unverified behavior. Record command/environment/revision and artifacts where available. Report failures without weakening checks. If required behavior cannot be exercised, mark it unverified and do not claim equivalence or full completion. A fixture browser test cannot prove real backend isolation, pricing or production behavior.

**Exit evidence:** preservation-example results, gate outcomes and explicit limits.

## 6. Report

Explain what changed and why, what observable behavior/public contracts remained unchanged with supporting evidence, files and owner, risk classification, automated commands/results, manual checks, failures/unverified cases and remaining risks. Distinguish implementation completion from verification completion. Keep local checks, CI, merge, deployment and production separate; publish/commit only when explicitly authorized.

[Documentation-only evaluation](P0_DRY_RUNS.md#evaluation-a-safe-refactor) · [P0 validation report](PHASE2_P0_VALIDATION.md)
