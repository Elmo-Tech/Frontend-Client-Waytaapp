# AI entry point — Wayta Guest and Restaurant Web

This is the model-neutral starting document for AI-assisted work in this repository. It reduces ambiguity; it cannot guarantee error-free output. Evidence and behavior verification remain required.

## Start here

1. Read [AGENTS.md](AGENTS.md) and [README.md](README.md).
2. Follow [the change workflow](docs/ai/WORKFLOW.md).
3. Read [current architecture](docs/ARCHITECTURE.md), [domain rules](docs/ai/DOMAIN_RULES.md) and the relevant entries in [the spec map](docs/ai/SPEC_MAP.md).
4. Use [validation](docs/ai/VALIDATION.md) before reporting completion. For substantial work, use [the change-spec template](docs/ai/CHANGE_SPEC_TEMPLATE.md).

## Phase 2 — P0 workflows

Choose through the [P0 selection guide](docs/ai/WORKFLOW.md#p0-workflow-selection-guide): [Safe Refactor](docs/ai/SAFE_REFACTOR.md) preserves observable behavior; [Feature Implementation](docs/ai/FEATURE_IMPLEMENTATION.md) delivers an intentional approved change. Both use the [shared risk matrix](docs/ai/VALIDATION.md#p0-risk-based-validation) and the existing change-spec template. See [documentation-only evaluations](docs/ai/P0_DRY_RUNS.md) and [P0 validation evidence](docs/ai/PHASE2_P0_VALIDATION.md). P1 belongs to Phase 3, separate from Phase 2.

## Phase 3 — P1 workflows

Use the [P1 selection guide](docs/ai/WORKFLOW.md#p1-workflow-selection) for [Bug Investigation & Fix](docs/ai/BUG_INVESTIGATION.md), [Performance Optimization](docs/ai/PERFORMANCE_OPTIMIZATION.md), [Dependency Management](docs/ai/DEPENDENCY_MANAGEMENT.md) or [API Contract Changes](docs/ai/API_CONTRACT_CHANGES.md). [Test Strategy](docs/ai/TEST_STRATEGY.md) supports every P0/P1 workflow. Reuse the existing risk/validation policy and change-spec template; see [source-backed P1 dry runs](docs/ai/P1_DRY_RUNS.md) and [Phase 3 compliance evidence](docs/ai/PHASE3_VALIDATION.md). Historical incomplete builds/browser checks remain unresolved until actually verified.

Read only the detailed specs relevant to the task rather than loading the entire archive.

For observed ownership and API exceptions, use the [domain knowledge map](docs/ai/DOMAIN_MAP.md). The [guidance inventory and gap analysis](docs/ai/GOVERNANCE_AUDIT.md) records instruction ownership and unresolved conflicts. [Phase 1 validation](docs/ai/PHASE1_VALIDATION.md) records this documentation pass; it is not release certification.

## Non-negotiable repository boundaries

- This is the standalone `web` frontend, not an npm workspace. Use its own package.json, lockfile, environment and Dockerfile.
- Default scope is this frontend. Do not change backend source, database/schema/data, shared infrastructure or the other frontend unless the task explicitly includes it.
- Keep the existing routes, product behavior, API contracts, UI copy/assets, authentication and locale semantics unless the request explicitly changes them.
- Backend remains authoritative for permissions, tenant/branch scope, prices and business state. Frontend validation and permission-aware UI do not replace that authority.
- Keep App Router entry points thin, domain code in modules and shared infrastructure independent of modules. Use the actual public-entry rules in `scripts/architecture-rules.mjs`.
- Preserve server/client separation and private/public environment boundaries. Never expose secrets or add auth bypasses.
- Reuse existing transports, controls and exact-money helpers. Do not invent endpoints, response fields, permissions or product states.
- Do not disable checks or weaken tests to manufacture a pass. Diagnose asynchronous UI and fixture timing separately.
- Follow the host tool's system/developer instructions and the user's authorized task. These project documents do not override them. Report material inconsistencies rather than hiding them.

## Tool entry points

| Tool surface | Entry file |
| --- | --- |
| Agents supporting AGENTS.md | [AGENTS.md](AGENTS.md) |
| Claude-oriented tooling | [CLAUDE.md](CLAUDE.md) |
| GitHub Copilot repository instructions | [.github/copilot-instructions.md](.github/copilot-instructions.md) |
| Cursor project rules | [.cursor/rules/wayta.mdc](.cursor/rules/wayta.mdc) |
| Any other AI model or chat | Supply this file and ask it to read the linked relevant source/specs |

Adapters point back here so the detailed rules have one owner per repository. Tool support and automatic loading vary by client and settings. Do not assume every AI model automatically reads these files.

Reusable task prompt:

> Read AGENTS.md and AI.md, then follow the relevant workflow, domain rules, specs and validation. Implement only this task: [describe the change]. Preserve existing behavior and contracts outside that scope. Report actual checks and remaining limitations.

## Evidence freshness

[Refactor validation](docs/REFACTOR_VALIDATION.md) and [stability validation](docs/FRONTEND_STABILITY.md) are dated reports, not permanent pass badges. Inspect the current code, task environment and exact CI revision. A merge does not prove browser tests, deployment or production behavior succeeded.
