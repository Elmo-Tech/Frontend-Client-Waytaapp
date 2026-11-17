# Quality gates — Phase 4

Apply these controls during [execution](EXECUTION_PROTOCOL.md), using the existing [risk matrix and baseline](VALIDATION.md#p0-risk-based-validation) and [Test Strategy](TEST_STRATEGY.md). Gates organize existing requirements; they do not create a second risk matrix, waive checks or add approval bureaucracy. Choose applicability in PLAN and record a result/evidence ID for every gate in REPORT. A gate without relevant runtime impact may be Passed by documented source/scope inspection; its irrelevant command remains Not run with a reason.

| Gate | Required evidence / decision rule | If unmet |
| --- | --- | --- |
| Scope Gate | Initial-state versus final file/content comparison includes staged, unstaged and untracked files. Every task delta maps to authorized scope; pre-existing user edits are preserved | Stop unauthorized edits, isolate task changes and restore only demonstrably task-owned accidental changes; never reset user work |
| Architecture Gate | Inspect ownership, imports/public entries and client/server reachability. Run existing architecture/lint/build checks where required by VALIDATION; no replacement scanner | Correct the owning dependency edge within scope; no checker relaxation or client-safe re-export of server composition |
| Contract Gate | Trace consumers and exact acceptance/preservation examples. Public/API/observable changes require actual task authority; follow API Contract Changes for agreed deltas | Missing material contract authority blocks adaptation. Fixtures/type casts cannot supply it |
| Test Gate | All required relevant tests and behavior cases Passed on the final patch. Existing application baseline remains mandatory for application edits; helper/source tests support only their actual assertions | Preserve first failure, investigate code versus fixture/environment and use FAILURE_RECOVERY; a rerun does not erase prior evidence |
| Build Gate | Required default production build finishes successfully with terminal output and exit 0 for the checked configuration/patch | A hang, interruption, timeout or partial artifact is Failed for the attempt; success is Not verifiable. A diagnostic alternative bundler is separate evidence |
| Evidence Gate | Every claim maps to an actual command, inspected source or measurement with identity/environment/limits; manual and automated results are distinct | Remove unsupported positive claims; record Not run/Not verifiable and the next needed evidence |
| Review Gate | Inspect final diff and new contents against initial state using SELF_REVIEW; validate scope, regressions, generated files, acceptance and evidence completeness | Resolve unintended changes within scope; rerun affected validation after any later edit |

## Risk-aware depth and applicability

Use LOW/MEDIUM/HIGH only as defined in VALIDATION. LOW docs work requires links/anchors/paths/scripts, adapter and scope preservation, plus final review. MEDIUM/HIGH add the behavioral/consumer/trust-boundary evidence already prescribed there; they never subtract the application baseline. HIGH needs deeper caller/context/denial/contract evidence appropriate to its real impact. A single private type extraction is not exempt from application checks; a short transport edit is not LOW because it is short.

At PLAN, map each acceptance criterion and preservation claim to a gate and actual command/observation. At REVIEW, confirm results cover the final patch, not an earlier revision. If a gate relies on a missing required build/browser/service result, mark the gate Failed, Not run or Not verifiable according to what was attempted; set Verification Complete and Delivery Ready to No. Independent safe work can continue while dependent verification is blocked.

For docs-only tasks, application tests/lint/typecheck/build/browser can be Not run as inapplicable under the existing policy; explain why no application behavior changed. This does not resolve historical application failures or relax the next application task. Existence of a script is source evidence, not proof it passed. Enforcement uses existing checks and explicit completion decisions; documentation cannot guarantee automatic AI compliance.

## Repository-specific architecture evidence

Web has 22 domains. Cross-module consumers may use indexes or focused direct module-root capability files; module internals must not import their own composition index. The architecture scanner builds the runtime graph from emitted JavaScript to remove erased type imports. Existing tests use Node strip-types/test with .test.mjs files; request implementation hashes establish structural preservation, not real API or browser behavior.

Use [the current architecture](../ARCHITECTURE.md), [domain rules](DOMAIN_RULES.md), [domain map](DOMAIN_MAP.md) and actual [boundary predicates](../../scripts/architecture-rules.mjs). The scanner proves static literal-import properties within its documented limits; it does not certify authorization, API availability or production readiness.
