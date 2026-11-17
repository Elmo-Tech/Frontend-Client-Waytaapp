# Execution protocol — Phase 4

**DISCOVER → CLASSIFY → PLAN → EXECUTE → VERIFY → REVIEW → REPORT**

This is the common execution envelope for the existing [P0/P1 selection](WORKFLOW.md). Workflow-specific investigation and acceptance still belong to their existing guides. [VALIDATION.md](VALIDATION.md#p0-risk-based-validation) owns the only risk matrix and mandatory checks. This protocol adds evidence and completion controls, not an agent runtime, new approval system or CI configuration.

## Lifecycle and required exit evidence

| Stage | Action and exit evidence | Transition control |
| --- | --- | --- |
| DISCOVER | Inspect branch, HEAD, staged/unstaged/untracked state and applicable instructions. Record owner, current source/callers, public entries, contracts, dependencies and available tools through [CHANGE_IMPACT.md](CHANGE_IMPACT.md) | Preserve initial user changes. Resolve material unknowns before dependent edits; continue independent authorized work |
| CLASSIFY | Select one lead P0/P1 workflow, supporting guides and justified LOW/MEDIUM/HIGH from the existing matrix | Reclassify if impact expands; unknown material impact cannot justify LOW |
| PLAN | Record intended files, expected/preserved behavior, acceptance-to-check mapping, risks and task-only rollback. Use the existing [change spec](CHANGE_SPEC_TEMPLATE.md) for substantial work; a brief suffices for small work | Identify required checks before editing; no extra blanket permission step |
| EXECUTE | Apply the smallest authorized diff and record actual changed files | Return to CLASSIFY/PLAN if consumers, behavior or scope differ; unresolved contract authority stops only dependent work |
| VERIFY | Run applicable existing checks and record actual outputs, observations and assumptions separately | Apply [quality gates](QUALITY_GATES.md); use [failure recovery](FAILURE_RECOVERY.md) for failed or unavailable evidence |
| REVIEW | Inspect the final tracked diff and new file contents with [SELF_REVIEW.md](SELF_REVIEW.md); compare against initial state and acceptance criteria | A later edit invalidates affected prior checks; rerun those checks and review the final delta |
| REPORT | Provide the evidence record and three completion decisions below | Missing required evidence prevents full verification and delivery readiness; report rather than conceal blockers |

## Map existing workflow stages

Do not rename or duplicate the underlying guides. Their specialized stages fit inside this lifecycle:

| Existing lead | DISCOVER / CLASSIFY / PLAN | EXECUTE / VERIFY / REVIEW / REPORT |
| --- | --- | --- |
| [Safe Refactor](SAFE_REFACTOR.md) | Discover/Analyze establish preservation and impact; Plan includes risk | Refactor; Verify; final diff review; Report |
| [Feature Implementation](FEATURE_IMPLEMENTATION.md) | Discover/Specify establish authorized acceptance; Plan includes risk | Implement; Verify; final diff review; Report |
| [Bug Investigation](BUG_INVESTIGATION.md) | Reproduce/Trace/Explain establish cause, then classify and plan | Fix; Verify regression; final diff review; Report |
| [Performance Optimization](PERFORMANCE_OPTIMIZATION.md) | Define/Measure/Attribute precede classification and Plan | Optimize; Remeasure plus correctness; final diff review; Report |
| [Dependency Management](DEPENDENCY_MANAGEMENT.md) | Inventory/Assess/Group inform classification and Plan | Update; Verify compatibility; final diff review; Report |
| [API Contract Changes](API_CONTRACT_CHANGES.md) | Discover/Compare/Coordinate establish authority, then classify and plan | Adapt; Verify combinations; final diff review; Report |

[Test Strategy](TEST_STRATEGY.md) supports all stages. Documentation maintenance uses the existing common workflow and docs validation; it does not need a fabricated product feature or a seventh lead workflow. For this Phase 4 task, the user's documentation brief is the authority.

## Evidence record

Keep one record in the task response or the existing change spec's Implementation and verification section; a repository report is appropriate when requested. No database, additional template file, tool installation or service is required. Keep enough sanitized output in the durable report to audit the conclusion; absolute temporary log paths alone are not durable evidence.

- Identity: repository, date, branch, base/checked HEAD, working-tree state, actual changed/new/deleted files. For uncommitted work, include the reviewed patch/file hashes or exact scope and initial-state comparison; HEAD alone does not identify the checked patch. Match remote CI to its exact revision/run if used.
- Intent: request/authority, owner, lead/support workflows, risk and reason, intended modifications, acceptance/preservation cases and rollback notes.
- Environment: working directory, OS/runtime, actual Node/npm and relevant runner/browser versions, relevant non-secret configuration, fixture/service availability and deviations from declared tooling. Do not publish secrets, tokens, session data or complete environment dumps.
- Automated executions: one row per command/attempt with ID, exact command and cwd, revision/patch identity, start/end or elapsed time, exit code/signal/timeout (unknown if unavailable), result, output/artifact and the specific claim supported. Preserve the first failure and any recovery run separately.
- Manual observations: separate rows with ID, source inspection or rendered/manual method, files/routes/inputs/locale/context, expected versus observed behavior, result and limitation. Static inspection cannot establish hydrated interaction or real backend enforcement.
- Assumptions: explicitly unverified statements, missing authority/environment, remaining risks and next discriminating check. Unsupported claims are Not verifiable, never Passed because plausible.

Use only these check-result labels:

| Result | Meaning |
| --- | --- |
| Passed | Executed check finished successfully and supports its stated limited claim; manual/source observation was actually made and meets its criterion |
| Failed | Executed command/check did not meet the criterion, including interruption, timeout, termination or nonzero exit. Record cause as application, environment or unknown; this label alone does not diagnose a code defect |
| Not run | Check was not attempted. State whether blocked or inapplicable and why; an inapplicable check is not an omitted required gate |
| Not verifiable | A claim/behavior cannot be established from available evidence. Name the missing measurement, observation, contract or integration |

Example only: an attempted `npm run build` terminated at a time budget is Failed, with signal/elapsed time and last output; build success is Not verifiable. A browser command unavailable before launch is Not run; interaction acceptance is Not verifiable. These are hypothetical examples, not executions in this phase. Never introduce “Skipped”, “Partial pass” or “Interrupted” as additional result labels; use details to explain one of the four results.

## Completion decisions

Every implementation report states all three, with scope and evidence references:

- **Implementation Complete: Yes/No** — the entire authorized modification is finished and reviewed. Pending authorized source work means No; completed code may be Yes while checks are incomplete.
- **Verification Complete: Yes/No** — all required applicable checks and acceptance/preservation evidence Passed for the final patch. Any required Failed, Not run or Not verifiable means No. Explain inapplicable checks separately; do not redefine a required check as irrelevant after it fails.
- **Delivery Ready: Yes/No** — implementation and verification are complete and evidence meets the actual release or handoff requirements, with no unresolved blocker. State the target: a documentation handoff is distinct from an application release. If requirements for the target cannot be established, use No and identify the gap.

These are completion decisions, not new check-result statuses. Readiness does not authorize staging, commit, push, merge or deployment. Local validation, CI, release and production remain distinct. A prior interrupted production build/unavailable browser check and pending P1 application experiments remain unresolved until their own actual evidence exists.
