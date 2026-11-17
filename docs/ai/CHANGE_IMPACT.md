# Change impact analysis — Phase 4

Record impact inside the existing task brief/[change spec](CHANGE_SPEC_TEMPLATE.md), before EXECUTE in the [protocol](EXECUTION_PROTOCOL.md). Use [DOMAIN_MAP.md](DOMAIN_MAP.md) to find owners and active source to verify facts. The [existing matrix](VALIDATION.md#p0-risk-based-validation) alone decides risk. Expand analysis when investigation reveals broader effects; do not turn unknown material impact into an assumed absence of impact.

## Proportional record

For a small same-file private type change, a paragraph can identify owner/callers, unchanged runtime/public contract, checks and one-file rollback; no new checklist document is required per task. For MEDIUM, trace affected consumers/state/transports and map relevant success/failure/retry/stale-response examples to checks. For HIGH, explicitly trace public entries and trust boundaries, role/tenant/session/price authority, denial cases and supported client/server combinations as applicable. These are depth instructions referencing the existing matrix, not new classification rules.

| Area to inspect | Evidence to record; explain irrelevance rather than silently omit |
| --- | --- |
| Changed modules and callers | Owning files, direct import/call consumers, routes and shared consumers; use searches plus source inspection, not import count alone |
| Public entries and dependencies | Export/type shape, module boundaries, transitive shared imports and client-to-server reachability; unrelated caller behavior remains preserved |
| State and side effects | State owner, request identity, effects/cleanup, storage, mutation guards, cancellation, stale reads and concurrent actions |
| API integrations and contracts | Actual method/path/payload/optional-null/error/credential behavior, response consumers and compatibility/rollout authority; no invented endpoint |
| Authentication and authorization | Session/CSRF/origin, roles, tenant/branch and data visibility. Backend authority remains unchanged; UI hiding is not enforcement |
| Localization | Arabic/English, RTL/LTR, formatting/exact money, caller-owned copy and preserved assets |
| States and recovery | Success, invalid input, loading, empty, error, retained values, retry and duplicate actions relevant to the affected flow |
| Rendering and accessibility | Server/client and lazy boundaries, hydration, CSS/layout, keyboard/focus, semantic labels, responsive/print and reduced motion where affected |
| Build and deployment | Default build, public values baked into bundles, private-origin isolation, package/lock/runtime compatibility and environment assumptions; a local pass is not deployment proof |

## Plan output and scope changes

Summarize intended files/responsibilities, observed current versus authorized target behavior, preserved interfaces, relevant risks/unknowns, criterion-to-check mapping and task-specific rollback. Link supporting source and distinguish observed facts from assumptions. Missing decisions block only dependent work; routine reversible work already authorized needs no additional approval ritual.

When a new caller, public delta, trust boundary or dependency emerges, return to CLASSIFY/PLAN, apply the highest actual-impact risk and update required checks before continuing. Do not quietly expand to backend, operations, CI or the sibling frontend. Rollback is a plan for task-only changes; deployment rollback is a separately authorized action.

Web examples: guest-menu cart/submission hooks have retry identity and exact-money implications; even a small checkout change may be HIGH. Shared phone normalization affects multiple forms. Private GuestEmptyState type cleanup remains LOW only while markup/defaults/callers/contracts stay unchanged.
