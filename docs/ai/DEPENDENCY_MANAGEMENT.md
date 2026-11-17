# Dependency Management — P1

These are procedures for future authorized work. **This Phase 3 implementation permits documentation only**: none of the source, test, manifest or contract edits described below are executed here. Start with [workflow selection and common controls](WORKFLOW.md#p1-workflow-selection), [domain ownership](DOMAIN_MAP.md), [architecture](../ARCHITECTURE.md) and status-qualified [specifications](SPEC_MAP.md). Reuse the existing [risk matrix](VALIDATION.md#p0-risk-based-validation), [Test Strategy](TEST_STRATEGY.md) and evidence statuses in [VALIDATION.md](VALIDATION.md#evidence-record); do not duplicate their policies or waive baseline checks.

**Inventory → Assess → Group → Plan → Update → Verify → Report**

## 1. Entry conditions

A maintenance request, reproducible compatibility problem or specific advisory affecting this repository. Inspect its own manifest, lockfile, Node/npm requirements and installed tree; the parent is not a workspace. Record exact direct/locked/transitive versions and actual imports/usage. A version range or old-looking number does not prove vulnerability or that an upgrade exists.

## 2. Impact and compatibility investigation

When registry access/task scope permits, use read-only `npm outdated`, `npm audit`, `npm ls` and `npm explain` to establish candidates and dependency chains. These are npm commands, not new package scripts. A nonzero outdated/audit result requires inspecting output: network failure is not an empty advisory result. Verify advisories, affected/fixed ranges and breaking changes against upstream release notes, official migration/security notices and package/runtime peer requirements. Assess reachability/runtime versus development/build exposure; advisory severity alone is not exploitability proof. Do not paste credentials or private registry tokens into evidence.

## 3. Grouping and planning

Choose the smallest compatible update groups. Group genuinely coupled packages such as framework/runtime/lint peers with evidence; separate unrelated majors, lockfile churn and cosmetic cleanup. Record chosen exact versions, supported runtime, peer compatibility, affected domains/tooling and migration requirements. Reuse the change-spec template for substantial migrations. Unknown registry/advisory/peer facts remain unresolved, not guessed. Never run an unreviewed force/audit-fix command as the plan.

## 4. Risk classification

A scoped development-only patch may be LOW if its effect is isolated; build/test tooling and behavioral library changes are commonly MEDIUM. Framework/auth/security/transport/pricing/public-contract exposure may be HIGH based on affected consumers. A patch-version label does not guarantee LOW risk. Preserve the shared matrix and raise risk on newly found runtime or trust-boundary impact.

## 5. Allowed modifications

Only in a future task explicitly authorizing maintenance: this repository's manifest/lockfile and minimal required migration/test files. No package installation, version bump or lockfile change is executed in this documentation phase. Do not edit sibling manifests, introduce workspace tooling or hand-edit transitive resolution/integrity entries. Investigate why a dependency is present before declaring it unused.

## 6. Validation strategy

For an authorized update, use the supported Node/npm and the existing dependency/lockfile clean-install validation requirement in an isolated directory; do not destroy a working install to test an unavailable registry. Inspect the lockfile diff and package identity/resolution/lifecycle scripts, peers and engine warnings. Run the existing baseline plus affected functionality, request/auth/render/browser checks selected by Test Strategy. Recheck the specific advisory/compatibility condition where possible. No successful install/audit/build alone proves functional safety.

## 7. Regression considerations

Cover runtime APIs, module format/exports, types, bundling/SSR, client/server boundaries, CSS/render output and deterministic fixtures affected by the group. Keep original test intent; do not regenerate snapshots or request hashes blindly. Unavailable browser/build/registry evidence remains explicit. No newly discovered service or framework is an incidental upgrade dependency.

## 8. Rollback

Record the previous manifest and matching lockfile plus task-specific migration patch. Revert the pair together and only related changes; validate the restored tree in the isolated environment when possible. Do not delete user work, force incompatible resolutions, remove controls or claim a security issue resolved by returning to an affected version. Deployment rollback is separate.

## 9. Evidence requirements

Report direct/transitive chains, actual versions, advisory/release-note provenance and dates, chosen groups, compatibility matrix, reviewed lockfile changes, install/runtime/check results and rollback limits. Distinguish Not run registry checks from Passed zero relevant findings and Not verifiable reachability. Report all four evidence statuses accurately.

## 10. Completion criteria

The authorized minimal group is compatible and necessary migrations/checks are verified; the targeted advisory/maintenance objective is supported by evidence. Otherwise distinguish selection/implementation completion from validation. A documentation dry run or proposed target version is not a completed upgrade, vulnerability fix or current audit.
