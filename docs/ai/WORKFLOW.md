# AI change workflow

## P0 workflow selection guide

This file owns common scope/change controls; the linked procedures own their task-specific lifecycles. [AI.md](../../AI.md) remains the repository navigation entry. Use the [risk matrix](VALIDATION.md#p0-risk-based-validation) for both procedures; it supplements existing mandatory checks.

| Intended outcome | Procedure | Required starting record |
| --- | --- | --- |
| Internal structure changes; observable behavior/public contracts preserved | [Safe Refactor — P0](SAFE_REFACTOR.md) | Current implementation/callers, preservation examples and focused plan |
| New or deliberately changed behavior | [Feature Implementation — P0](FEATURE_IMPLEMENTATION.md) | Business objective and an approved requirement, followed by the existing change spec |
| Mixed feature plus structural change | Feature procedure with an explicit preservation plan for the structural part | One scope/spec separating authorized behavior changes from preserved outcomes; no silent refactor scope expansion |

Choose by intent and impact, not changed-line count. The [matrix](VALIDATION.md#p0-risk-based-validation) owns LOW/MEDIUM/HIGH classification, escalation and verification details.

Only the two P0 procedures are introduced here. P1 workflows, including Bug Investigation, are not implemented. Tasks outside these procedures retain the common Phase 1 workflow below; this is not a new specialized procedure for them.

Use [P0_DRY_RUNS.md](P0_DRY_RUNS.md) for documentation-only examples and [PHASE2_P0_VALIDATION.md](PHASE2_P0_VALIDATION.md) for dated evidence. Neither is a product approval or proof that all AI clients follow the instructions.

## 1. Establish scope

- Read the user's current request, root `AGENTS.md`, root `AI.md` and instructions in the affected directory ancestry.
- Run `git status --short` and inspect the affected diff. Keep user changes intact. Do not reset, stash or overwrite them to get a clean tree.
- This is one independent frontend repository. Do not edit the API, operations repository or the other frontend without a task that explicitly includes it.
- Use `package.json`, the lockfile, active source and current CI as evidence. Historical reports describe their recorded run, not today's status.

## 2. Locate the owner and contract

- Read the relevant section of [Architecture](../ARCHITECTURE.md), [Domain knowledge map](DOMAIN_MAP.md), [Domain rules](DOMAIN_RULES.md) and [Spec map](SPEC_MAP.md).
- Search for the actual route, module entry, view/hook, domain API function and relevant tests. Inspect their callers before changing exports or behavior.
- Trace user input through validation, serialization, transport, response handling and UI feedback. Record which layer owns each decision.
- Before using an unfamiliar Next API, inspect the relevant installed guide under `node_modules/next/dist/docs/`. Do not substitute remembered framework conventions for this installed version.
- A missing spec or conflicting source is not permission to invent a business rule. Continue independent work; ask one focused question only when the uncertainty changes the requested behavior or safety of the change.

## 3. Make the change concrete

For a small fix, a short change brief in the task is sufficient. For a new workflow, changed API behavior or a substantial refactor, use [the change-spec template](CHANGE_SPEC_TEMPLATE.md).

Write down:
1. Trigger and current behavior.
2. Requested behavior and affected module.
3. Preserved routes, request/response fields, auth, locale and money rules.
4. Loading, empty, success, validation and failure states.
5. Relevant acceptance examples and checks.

Do not create a new requirement merely to justify a preferred implementation. A draft spec is not an approved product decision.

## 4. Implement within the existing architecture

- Keep `app` focused on framework entry points. Put domain implementation in the owning module.
- Reuse existing controls, transport, auth and validators. Avoid a second abstraction for the same concern.
- Preserve current copy, supplied assets, routes and API contracts unless the request changes them.
- Split by responsibility when useful; do not split solely to meet an arbitrary line count or build empty scaffolding.
- Do not add dependencies or change package versions as incidental cleanup. If required by the task, explain the reason, update the npm lockfile and validate the supported upgrade. Never force incompatible audit fixes.
- Do not add blanket lint disables, `@ts-ignore`, `@ts-nocheck`, or broad `any` casts to hide an error.
- Keep changes focused. Do not reformat unrelated source or remove a dependency based only on import counts.

## 5. Verify the behavior

Use [Validation](VALIDATION.md). Tests should assert the observable rule or public boundary being changed.

- Exercise rapid repeated actions, failed requests and recovery for mutations.
- Invalidate obsolete reads and clean up listeners, timers and subscriptions.
- Do not weaken assertions, skip tests or change fixtures to conceal a real failure.
- Source-preservation fixtures may need a path update after a legitimate move. Read the assertion and preserve its behavioral intent. A text/hash check alone does not prove the UI works.
- Keep test accounts and fixtures separate from live systems. Do not use production data or credentials for validation.

## 6. Report and hand over

Report: what changed, what behavior was preserved, what ran, exact outcomes and remaining limits. Distinguish local checks, CI, merge, deployment and production behavior.

Do not say “passed”, “fixed everywhere” or “100% stable” for checks you did not run. An environmental blocker is not a test pass and is not automatically a code failure. Match CI evidence to the actual commit SHA.

Do not commit, push, publish, merge or deploy unless the user's task authorizes that action. When authorized, use focused commits and include relevant verification. Routine reversible implementation within scope does not need another permission request.
