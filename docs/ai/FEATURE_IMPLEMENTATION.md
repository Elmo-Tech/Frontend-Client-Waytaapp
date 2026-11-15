# Feature Implementation Workflow — P0

**Discover → Specify → Plan → Implement → Verify → Report**

Use for an intentional new or changed user-visible/business outcome. Start with the [selection guide and common workflow](WORKFLOW.md), then classify impact using the [shared risk matrix](VALIDATION.md#p0-risk-based-validation). This procedure reuses the existing specification system; it is not another product template.

## 1. Discover

State the actual business objective and affected user, rather than starting with a component or preferred abstraction. Locate the owning module, current implementation, routes/callers, API owner and tests through [DOMAIN_MAP.md](DOMAIN_MAP.md). Read [architecture](../ARCHITECTURE.md), [domain rules](DOMAIN_RULES.md) and the relevant [SPEC_MAP.md](SPEC_MAP.md) entries.

Verify the exact requirement/decision's approval status: accepted decisions, self-described authoritative baselines, proposals, historical builds and current source are different evidence. A shipped-looking UI or historical draft PR is not approval. Record source/decision references and conflicts. For a material unresolved requirement or unavailable backend capability, stop only the dependent implementation, state the gap and request the missing decision; continue independent authorized work. Hypothetical evaluation examples are not implementation authorization.

**Exit evidence:** business objective, owner, current behavior and approval/contract status.

## 2. Specify

Fill [CHANGE_SPEC_TEMPLATE.md](CHANGE_SPEC_TEMPLATE.md), briefly for a small feature and in detail for a complex one. Use its existing headings and acceptance table; do not create a competing template. Record:

- Requested result and explicitly authorized change from current behavior; in/out of scope.
- Actors/roles, permissions, restaurant/branch or platform context, data visibility and backend authority.
- Inputs/validation, actual existing API contracts and errors, localization/copy, exact-money semantics if relevant.
- Success, invalid, loading, empty, failure, retry, repeated-action and stale-response behavior; explain inapplicable states.
- Accessibility, focus/keyboard behavior, responsive/RTL/LTR expectations and preserved routes/assets/contracts.
- Given/When/Then acceptance criteria with a concrete verification method and expected outcome.

Do not infer an endpoint or permission from a feature name. If the feature needs a new backend capability, document the missing contract and defer that part until authorized evidence exists; never silently mock it as implemented. Record status as draft until actual implementation/verification evidence supports a later status.

**Exit evidence:** one bounded change specification, acceptance criteria, assumptions and unresolved decisions.

## 3. Plan

Map each acceptance criterion to the smallest file/responsibility change and verification. Put feature implementation in its owning domain; keep App Router limited to framework responsibilities. Reuse shared UI/infrastructure, existing transport/auth/validation/i18n patterns and repository-specific public entries. Keep private origins/server-only implementations outside client bundles; do not import the domain's own composition barrel from internals.

Identify contract/caller impact, regression cases and highest applicable risk. Choose checks from the shared matrix without removing existing gates. If a dependency is truly necessary, justify it within authorized scope; do not install one as incidental cleanup. Record recovery/revert scope for this task only. No sibling repository change is implied by a frontend feature.

**Exit evidence:** criterion-to-file/check plan, boundaries, risk and dependency/contract gaps.

## 4. Implement

Implement only the authorized specification and maintain reviewable increments. Preserve unrelated behavior, public contracts, supplied copy/assets and existing API/error/retry semantics. Reuse infrastructure; avoid speculative abstractions and unnecessary dependencies. No new architecture pattern, backend capability or cross-repository source import is implied.

Revisit Specify/Plan if implementation reveals an unapproved behavior change or wider risk. Do not weaken validation, permissions or tests to fit the implementation. Update task/domain knowledge only where actual source changes warrant it; do not rewrite historical evidence.

**Exit evidence:** focused diff linked to acceptance criteria and remaining gaps.

## 5. Verify

Execute the applicable existing gates in [VALIDATION.md](VALIDATION.md) and evaluate each acceptance row. Exercise successful, invalid, loading, empty, failure, retry and rapid repeated actions where relevant; include context changes/stale responses for asynchronous reads. Explicitly mark inapplicable states with reasons, not silent omissions.

For affected UI, verify Arabic/English and RTL/LTR, narrow layout, keyboard navigation, labels, validation focus, dialogs and reduced motion as applicable. Distinguish automated, rendered/manual and unverified evidence. Existing source/hash tests and a green build do not prove acceptance. Existing fixture tests do not prove real backend sessions, tenancy or payments.

Failures remain failures. Missing tools/environments are Not run or Not verifiable with the reason; do not claim the criterion passed or the feature fully verified. Use safe local fixtures/test environments within authorized scope, never production credentials to manufacture evidence.

**Exit evidence:** criterion-by-criterion outcomes, actual commands/observations and remaining verification.

## 6. Report

Report the business result and owner, changed files, implemented acceptance criteria versus pending ones, preserved unrelated behavior, risk, exact automated results, manual observations, failures/unverified cases and remaining risks. State whether implementation and verification are each complete. Distinguish local checks from CI/release/production; do not commit, push or deploy without explicit authorization.

[Documentation-only evaluation](P0_DRY_RUNS.md#evaluation-b-feature-implementation) · [P0 validation report](PHASE2_P0_VALIDATION.md)
