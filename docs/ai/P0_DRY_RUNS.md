# P0 documentation-only evaluations — Web

Evaluated 2026-11-15 against current source at `92b9aafa4748df7138b46a398f2b4b14786ef98f`. These are completed planning walkthroughs, not application implementations. No application source or tests were changed; no runtime verification of the proposed examples was executed. They test procedure completeness; they do not prove runtime correctness or compliance across AI tools.

## Evaluation A: Safe Refactor

Procedure: [SAFE_REFACTOR.md](SAFE_REFACTOR.md). Candidate: separate the private prop type from empty-state markup in one existing presentation component.

### Discover

Owner: [guest-menu](DOMAIN_MAP.md#guest-menu). Inspected [GuestEmptyState.tsx](../../src/modules/guest-menu/components/GuestEmptyState.tsx), actual callers [MenuSections.tsx](../../src/modules/guest-menu/components/MenuSections.tsx) and [CartPanel.tsx](../../src/modules/guest-menu/components/CartPanel.tsx), plus [the module entry](../../src/modules/guest-menu/index.ts). MenuSections uses the component for an empty menu and no search results; CartPanel uses it for an empty cart. The function has a local inline props type and imports only ReactNode as a type; there is no client directive or request/effect of its own.

Read the [domain rules](DOMAIN_RULES.md#guest-menu-and-ordering), [architecture](../ARCHITECTURE.md#dependencies-and-public-contracts) and [specification status](SPEC_MAP.md). Relevant [i18n baseline](../../../operations/docs/01-domain/I18N_SPEC.md) concerns caller-owned locale/copy; no new business decision is proposed. [source-paths.json](../../tests/contracts/source-paths.json) maps the historical component path to the current owner; that mapping is not a rendered behavior test.

### Analyze

Preserve the exported GuestEmptyState function and its structural props contract: required icon/title, optional message/action/className, default className empty string. Preserve class tokens, element order, h2 title, truthiness-based message/action rendering, caller-provided icon/action nodes and theme/direction inheritance. No new wrapper, role, focus target, client directive, endpoint, route or dependency.

| Before/after observation to preserve | Future behavior-oriented verification |
| --- | --- |
| Empty menu has title plus message | Compare rendered heading/text and message visibility in both locales |
| Search with zero matches has the existing clear-search button | Activate it by keyboard; query clears using the existing callback; normal results return |
| Empty cart supplies border-0 and no message/action | Compare classes/visible content; do not change cart or checkout state |
| Optional message/action absent or empty | Preserve current omission; compare DOM with representative props |

The component makes no request, so invalid input, network loading/failure/retry and duplicate mutations are not component scenarios. Existing caller request/error behavior remains out of scope; no implication that these workflows were runtime-tested here.

### Plan

Risk: **LOW**, specifically one private, presentation-only TypeScript type extraction, not a module refactor, checkout change or public contract change. Raise to MEDIUM if moving implementations/imports; to HIGH if changing cart/checkout, pricing or public contract behavior.

Smallest candidate: introduce a non-exported GuestEmptyStateProps type in the same file and use it on the existing destructured parameters. Benefit: separates the prop contract from rendering for a future focused presentation edit; no shared generic abstraction is warranted. No caller, index or path-adapter changes. If no such readability need exists in a real task, leave the already small component alone; this evaluation does not recommend gratuitous cleanup.

Potential regression: accidental optionality/default changes, unintended runtime import/directive, changed truthiness/markup or class ordering. Revert only the one task-specific type edit if needed; never reset callers/user changes.

### Refactor — simulated only

Planned diff is confined to the type annotation and private type declaration in the existing file. No implementation was performed. Web's public capability policy is unchanged; the server composition index must not be imported internally or pulled into a client tree.

### Verify — plan, not runtime result

For a future implementation, run the application baseline from [VALIDATION.md](VALIDATION.md), including architecture/typecheck/lint/tests/default build, and the rendering comparisons above. Existing [architecture tests](../../tests/architecture.test.mjs) and source-path mappings protect structure; they do not prove empty-state behavior. No direct component behavior test was established by the source search. Use a focused rendered/manual exercise for this type-only change rather than adding a test that mirrors the type declaration. Use the existing browser harness only if it covers the needed state; otherwise record the manual check or missing coverage honestly.

### Report

**Planning evaluation: Passed.** Owner, callers, preserved observations, minimal plan, risk and verification are specified. **Implementation: Not run. Runtime equivalence: Not verifiable.** Remaining risk is future accidental scope expansion; all proposed changes remain unimplemented.

## Evaluation B: Feature Implementation

Procedure: [FEATURE_IMPLEMENTATION.md](FEATURE_IMPLEMENTATION.md). Discovery found that the no-search-results branch in MenuSections supplies title/action but no message, while GuestEmptyState already supports a message. The hypothetical objective is to surface the existing localized search prompt as an empty-state hint without changing search or ordering. Inspected the controller’s handleClearSearch callback, which clears the existing query state.

The following is a concise instance of [CHANGE_SPEC_TEMPLATE.md](CHANGE_SPEC_TEMPLATE.md), retaining its headings. It is not a second template.

### Status and scope

- **Status:** hypothetical draft for evaluation only; not an approved feature or instruction to implement.
- **User request/ticket:** no product request; Phase 2 permits a labeled hypothetical evaluation.
- **Repository/owner:** web / guest-menu.
- **Existing routes/public entries:** existing guest menu composition through the module entry; no route or public-export change.
- **In scope if later authorized:** one localized hint in the existing no-search-results empty state.
- **Out of scope:** search matching, result filtering, network calls, cart/checkout, prices, permissions, tenant resolution, other empty states and template redesign.

### Evidence and decisions

- Current [MenuSections](../../src/modules/guest-menu/components/MenuSections.tsx), [GuestEmptyState](../../src/modules/guest-menu/components/GuestEmptyState.tsx), [query controller](../../src/modules/guest-menu/hooks/use-public-menu-controller.ts) and [typed interface copy](../../src/modules/guest-menu/constants/copy.ts) support a local UI-only plan. The existing searchPlaceholder field already has both locales; no public copy contract needs extending.
- Read [SPEC_MAP.md](SPEC_MAP.md) and the i18n baseline; they do not approve this hypothetical extension. No accepted decision was invented. The proposed display behavior requires authorization before implementation.
- [brew-contract.test.mjs](../../src/modules/guest-menu/tests/brew-contract.test.mjs) checks real MenuSections source/layout/search-related structure but does not test this proposed empty-state hint. The source-path adapter is historical identity mapping, not UI acceptance evidence.

### Behavior

- Trigger/current result: nonblank search query with zero filtered categories, after the existing empty-menu branch; title plus clear-search action.
- Requested result: same state includes existing copy.searchPlaceholder as its message: EN “Search dishes or drinks”; AR “ابحث عن طبق أو مشروب”. The new placement is hypothetical; existing dictionary text remains unchanged.
- Actors/context: existing public guest and resolved restaurant/branch/menu/locale; no new role, permission, lookup or restaurant identity disclosure.
- Inputs/validation: preserve query trimming, category filtering and clear action; no new input. Existing public API method/body/response/errors remain unchanged; no API call is added.
- State contract: show hint only for the existing no-match branch; preserve loading, empty-menu, failure and recovery paths. No new retry or mutation. Repeated clear action must remain harmless and add no request.
- Accessibility/locale: caller supplies translated text through existing PublicMenuCopy; retain h2, native button, keyboard focus and inherited RTL/LTR/theme. Wrap naturally at narrow width; do not add an auto-announcing live region.
- Preserve all unrelated copy/assets, URLs, backend pricing/tenancy authority and public entries.

### Acceptance examples

| Given | When | Then | Future verification |
| --- | --- | --- | --- |
| English/Arabic menu, nonblank query, no matches | No-match branch renders | Existing title/button plus existing localized search prompt as a hint | Rendered assertions in both locales; narrow/RTL manual check |
| Matching results or no menu categories | Menu renders | Hint absent; normal/empty-menu branch unchanged | Branch rendering comparison |
| No-match state | Keyboard activates clear-search, including a repeated activation if still mounted | Existing query-clearing callback; no duplicate mutation/new request | Browser/manual action and request observation |
| Existing loading/API failure or retry | Caller follows its current path | Hint does not replace error/loading UI or alter recovery | Compare affected caller states; no new endpoint assumption |

### Implementation and verification

Discover → Specify is documented above. **Plan:** pass the existing copy.searchPlaceholder through the existing message prop at the single MenuSections no-match call site. Keep the copy contract/dictionaries, GuestEmptyState, App Router, root exports and server reads unchanged. No dependency or sibling edit.

Risk: **LOW**, isolated localized display copy. Changing search/API/cart/checkout or public contracts would require reclassification. **Implement:** not performed. **Verify:** future application baseline plus criterion-specific rendered/manual checks; existing source tests alone are insufficient. Loading/failure are preservation checks, not proof of a new asynchronous capability. **Report:** planning evaluation Passed; implementation Not run; acceptance/runtime behavior Not verifiable until authorization and execution. No product approval or release readiness is claimed.
