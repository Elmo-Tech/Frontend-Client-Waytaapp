# AI self-review — Phase 4

Perform REVIEW after VERIFY and before REPORT in the [execution protocol](EXECUTION_PROTOCOL.md). It is an explicit inspection of the final diff and evidence, not a substitute for independent automated tests, rendered/browser checks or real integration.

- Compare current Git status, staged/unstaged diffs and full new file contents to the initial snapshot. Confirm authorized file/module scope and preservation of user changes; inspect generated/ignored artifacts produced by commands when relevant.
- Confirm the selected lead P0/P1 workflow fits intent, supporting guides are identified, and risk is justified by actual impact using the existing matrix.
- Compare source/document edits against the planned responsibilities and acceptance criteria. Explain any authorized deviation and reclassify expanded impact.
- Inspect callers, public entries, dependency direction and client/server reachability under this repository's actual architecture policy.
- Verify no hidden behavior, API shape, credential, permission, tenant, price, locale, error/loading/empty/retry or deployment change is being described as a harmless refactor.
- Check tests/assertions support the exact claim and current implementation. No skipped assertions, blindly updated baselines, diagnostic bundler substitution or helper-only proof of a full interaction.
- Trace every pass/performance/security/compatibility claim to a completed command, inspected source or comparable measurement. Do not infer improvement from smaller files or security from a green audit alone.
- Check all executed failures and interruptions retain their own evidence, and missing browser/external/contract evidence remains explicit. No unverified assumption becomes fact through repetition.
- Confirm no unintentional generated files, lockfile churn, adapter edits, Next-managed-block changes, unrelated formatting or unauthorized configuration/CI work remains.
- Record reviewer/method (AI self-review), reviewed patch identity/file set, findings and resolution or remaining blockers. Report the review's actual result using the four evidence labels.
- Re-evaluate all three [completion decisions](EXECUTION_PROTOCOL.md#completion-decisions). If any edit follows review, inspect that delta again and rerun affected checks; do not claim the previous evidence covers it automatically.

For a tiny change, these checks can be one concise review paragraph with references. For higher impact, preserve findings by consumer/trust boundary and criterion. Independent review requirements already established by a task or release remain mandatory; self-review adds no invented approval or permission requirement.
