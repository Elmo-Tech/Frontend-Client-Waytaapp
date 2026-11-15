# Phase 1 guidance inventory and gap analysis

Repository owner: **web**. Inspected 2026-11-15. Scope: frontend knowledge and governance only. [AI.md](../../AI.md) remains the canonical entry; adapters retain the existing supported file locations. The sibling frontend has its own corresponding inventory; neither depends on the other at runtime.

## Discovery and initial state

Both frontends already had AI.md, five focused guides, AGENTS integration, Claude, Cursor and Copilot entry points. Those were pre-existing uncommitted changes, not a blank system to replace. Initial git status also showed changed README/AGENTS/CLAUDE and untracked AI/adapters/guides. API was clean; operations contained its existing untracked extraction files. All were snapshotted before Phase 1 edits. No unrelated changes were reset or overwritten.

Inspected both guidance trees, all referenced specification topics, architecture/stability/refactor records, package scripts, module roots/public entries, representative internals and API/test owners, plus existing architecture enforcement. Actual module directories: 22. The parent is not a package workspace. Source/spec status takes precedence over stale location prose; source existence does not confer approval.

## Inventory

All paths below belong to **web** unless the reference explicitly points to sibling operations. Missing references and conflicts are recorded in the gap register. Runtime tool loading is not inferred from successful path checks.

| File | Role | Audience/tool | Main references | Validation requirement | Overlap/control |
| --- | --- | --- | --- | --- | --- |
| [../../AI.md](../../AI.md) | Canonical entry | All models supplied this file | AGENTS, README, workflow, architecture, domain/spec maps, validation, audit | Link/path freshness; no automatic loading guarantee | Minimal safety summary; detailed policies delegated |
| [../../AGENTS.md](../../AGENTS.md) | Established agent entry + framework block | AGENTS-aware agents, including Codex | AI, architecture, relevant operations specs; installed Next docs | Preserve existing file and Next-managed block; root discovery depends on agent | Existing extraction rules retained; no new instruction precedence |
| [../../CLAUDE.md](../../CLAUDE.md) | Adapter with explicit local imports | Claude Code; other clients vary | @AGENTS.md and @AI.md | Imports resolve inside repo; formats checked, runtime not exercised | Replaces repeated paraphrase with canonical imports |
| [../../.cursor/rules/wayta.mdc](../../.cursor/rules/wayta.mdc) | Always-applied project-rule adapter | Cursor agent project rules | @AGENTS.md, @AI.md | description and alwaysApply: true; references read when needed | Small safety summary; does not configure Cursor Tab |
| [../../.github/copilot-instructions.md](../../.github/copilot-instructions.md) | Repository instruction adapter | Supported Copilot clients/settings | AGENTS and AI links | Supported file location; linked documents not guaranteed inline | Small safety summary instead of copied domain rules |
| [../../README.md](../../README.md) | Repository setup and navigation | Developers and agents | AI and existing repository docs | Existing links/scripts; preserve pre-existing content | Setup authority, not duplicate AI policy |
| [../ARCHITECTURE.md](../ARCHITECTURE.md) | Canonical frontend architecture reference | Developers and agents | Source scanner, domain/spec maps and dated reports | Verify actual import rules and scanner limits | Historical refactor prose explicitly dated |
| [WORKFLOW.md](WORKFLOW.md) | Canonical change procedure | Developers and agents | Architecture, domain rules/map, spec map, template, validation | Keep evidence/scoping requirements consistent | Does not create a new approval gate |
| [DOMAIN_RULES.md](DOMAIN_RULES.md) | Canonical behavior-preservation guidance | Frontend implementers | Domain map and spec map | Rules must match active source; do not infer approval | Ownership enumeration delegated to domain map |
| [DOMAIN_MAP.md](DOMAIN_MAP.md) | Current source ownership knowledge | Developers and agents | Source files, existing tests, classified specs | Exact module coverage, existing source paths | Observed facts; not runtime coverage certification |
| [SPEC_MAP.md](SPEC_MAP.md) | Canonical specification classification and domain mapping | Feature implementers and reviewers | Read-only sibling operations documents, domain map | Verify status per decision; conditional sibling links | Historical paths and proposals explicitly distinguished |
| [VALIDATION.md](VALIDATION.md) | Canonical verification policy | Implementers/reviewers | npm scripts, existing stability report, Phase 1 report | Command existence and accurate evidence labels | No new documentation npm script or duplicate architecture tooling |
| [CHANGE_SPEC_TEMPLATE.md](CHANGE_SPEC_TEMPLATE.md) | Task-local change brief template | Developers and agents | Existing task-specific contracts/checks | Draft intent is not approved product authority | Template retained without unnecessary rewrite |
| [GOVERNANCE_AUDIT.md](GOVERNANCE_AUDIT.md) | This inventory, change control and gap register | Maintainers/reviewers | Canonical guides and exact evidence below | Claims traceable to source; residual gaps explicit | No wholesale copies of guidance |
| [PHASE1_VALIDATION.md](PHASE1_VALIDATION.md) | Dated documentation validation evidence | Maintainers/reviewers | Current checkout, baseline and validator commands | Passed/Failed/Not run/Not verifiable | Not a release or production badge |
| [../REFACTOR_VALIDATION.md](../REFACTOR_VALIDATION.md) | Historical refactor evidence | Maintainers/reviewers | Recorded tests and artifact paths | Read date and limitations; not rerun in this phase | No conversion into a current pass claim |
| [../FRONTEND_STABILITY.md](../FRONTEND_STABILITY.md) | Historical stability evidence | Maintainers/reviewers | Recorded local checks and browser harness | Read exact run/fixture limitations | Not proof of real backend or live CI |

## Change control and consolidation

| Files requiring edits | Reason / expected benefit | Instruction-loading risk |
| --- | --- | --- |
| AI.md, WORKFLOW.md | Route readers to complete domain knowledge and audit evidence | Low: canonical entry and workflow retained |
| DOMAIN_RULES.md | Replace incomplete ownership enumeration with the single complete map | Low: preservation rules retained |
| SPEC_MAP.md | Classify approval evidence and cover every domain | Low loading risk; prevents proposal-to-requirement promotion |
| docs/ARCHITECTURE.md | Record actual repository-specific public entries and static-check limits | Low: established architecture retained and qualified |
| CLAUDE.md | Explicit repository-local imports instead of relying on link traversal | Moderate: import semantics are supported, but installed client execution is unverified |
| Cursor/Copilot adapters | Remove copied workflow/domain paragraphs; reference canonical entry | Low: supported location/metadata retained; references still require reading |
| VALIDATION.md | Standard evidence labels and documentation-check requirements | Low: existing application checks retained |
| DOMAIN_MAP.md, GOVERNANCE_AUDIT.md, PHASE1_VALIDATION.md (new) | Supply ownership, inventory/gaps and dated proof in existing docs/ai | No automatic loading added; reachable from AI.md |

AGENTS.md, README.md, the existing change template and framework-managed blocks were deliberately preserved from the initial working-tree state. No new framework, configuration mechanism, source rule or architecture checker was added.

## Gap register

Severity reflects the risk of acting on incorrect guidance, not a claim of an application vulnerability. No Critical finding was established. Findings are shared where evidence genuinely affects both frontends; Web-only evidence is marked.

| ID / severity | Evidence and affected files | Impact | Correction and disposition |
| --- | --- | --- | --- |
| G1 **High** | Pre-phase Web SPEC_MAP placed setup-checklist UX in the approved topic list; operations UX spec version 0.1 explicitly says proposed/not approved, implementation record says draft PR; current Web panel/API exist | An AI could treat a proposal as approved behavior | **Applied:** Web map separates SETUP-P/SETUP-I/current source. **Unresolved external evidence:** current approval must be established before a behavior change; operations left untouched |
| G2 **Medium** | DOMAIN_RULES had a partial ownership list and both old SPEC_MAP tables grouped topics without all 34 domain owners, public boundaries, API exceptions and test provenance | Owner selection and approval scope were ambiguous | **Applied:** complete concise DOMAIN_MAP and per-domain SPEC_MAP rows: Web 22, Platform 12. Unknown coverage/approval explicitly marked |
| G3 **Medium** | Architecture rule files differ: Web accepts direct module-root capabilities, Platform index/server. Scanner sees literal import edges; error text in Web still says index/server although predicate is broader | Overly uniform guidance can reject valid imports or overstate enforcement | **Applied:** architecture docs name exact policy and limits. Existing checker/error message unchanged; source edits are out of scope |
| G4 **Medium** | CLAUDE.md previously used Markdown read links; Claude Code supports explicit @path imports. Cursor/Copilot also linked guides without guaranteed recursive loading | Format correctness alone did not establish full instruction context | **Applied:** Claude local imports; adapters explicitly direct reading canonical guidance and disclose loading limits. **Not verifiable:** actual installed client/session loading |
| G5 **Low** | Repeated workflow/scope/behavior paragraphs across AI.md, Cursor and Copilot risked divergent future updates | Duplicated policy maintenance | **Applied:** short adapters, canonical AI entry and focused guides; minimal scope/verification reminders retained |
| G6 **Low** | Web restaurant-setup utils header describes a future authorized endpoint/local demos, while current RestaurantSetupPanel and api/restaurant-setup.ts use the live request wrapper | Stale comment can mislead domain understanding | **Documented, not changed:** map records actual API ownership and unresolved approval; application source comment is outside Phase 1 |

No missing domain directory was inferred from an intentionally empty index. No new endpoint or inter-module dependency was inferred from a domain name. Link/script findings and any failures are recorded in [Phase 1 validation](PHASE1_VALIDATION.md), not fabricated to fill severity categories.

## Source and specification reconciliation

The [specification map](SPEC_MAP.md) distinguishes explicitly accepted decisions, self-described authoritative baselines, historical implementation records, proposals and current code. DEC-062 remains proposed; built/draft records do not prove release. Standalone extraction supersedes historical apps/* locations, not business decisions. Broader lifecycle/promotion documents must be read with accepted DEC-035/036 scope. The setup proposal/current implementation conflict remains visible rather than being silently resolved by editing operations.

Related accepted decision topics exist for every mapped domain, but this is not proof that every implementation detail has an individually approved specification. No separate approval evidence was invented for self-described source-of-truth baselines. Backend contracts and enforcement remain authoritative.

## Adapter format evidence and limits

- [Claude Code memory/imports](https://code.claude.com/docs/en/memory): repository-local @path imports are supported; plain links are not equivalent imports. Imported guidance may link deeper task-relevant files that still require reading.
- [Cursor rules](https://cursor.com/docs/rules): project .mdc metadata with alwaysApply is supported; referenced files are read when needed, not inlined; Cursor Tab is separate.
- [Copilot custom instructions](https://docs.github.com/en/copilot/concepts/prompting-and-context/custom-instructions): repository instruction path is supported; client/settings affect availability.
- [Codex AGENTS discovery](https://github.com/openai/codex/blob/main/codex-rs/core/src/agents_md.rs): established AGENTS entry retained. AI.md is a project convention reached through adapters, not a universal tool filename.

Official format references were checked during Phase 1; no tool session was launched to prove compliance. Project instructions cannot override host instructions or the user's authorized scope.
