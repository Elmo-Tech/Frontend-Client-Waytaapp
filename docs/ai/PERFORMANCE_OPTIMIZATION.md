# Performance Optimization — P1

These are procedures for future authorized work. **This Phase 3 implementation permits documentation only**: none of the source, test, manifest or contract edits described below are executed here. Start with [workflow selection and common controls](WORKFLOW.md#p1-workflow-selection), [domain ownership](DOMAIN_MAP.md), [architecture](../ARCHITECTURE.md) and status-qualified [specifications](SPEC_MAP.md). Reuse the existing [risk matrix](VALIDATION.md#p0-risk-based-validation), [Test Strategy](TEST_STRATEGY.md) and evidence statuses in [VALIDATION.md](VALIDATION.md#evidence-record); do not duplicate their policies or waive baseline checks.

**Define → Measure → Attribute → Plan → Optimize → Remeasure → Report**

## 1. Entry conditions

A named user-visible cost or resource budget to investigate, such as slow interaction, request latency or initial route transfer. Define the operation and metric, expected budget and relevant device/data/locale. Do not select an optimization merely because code looks large; a readability-only change belongs to [Safe Refactor](SAFE_REFACTOR.md).

## 2. Baseline investigation

Identify owner/callers and separate runtime CPU/memory, React rendering/hydration, network/server latency, and bundle/asset transfer. Use available browser Performance/Network/profiling facilities, server/request timings or existing build artifacts appropriate to that dimension. Record revision, production/development mode, browser/device, dataset size, locale, warm/cold cache, network/CPU settings and background work. Repeat comparable samples; retain raw values, count, median and spread/tail where the sample supports it. Do not invent statistical confidence from a tiny sample.

## 3. Attribution and planning

Locate a measured bottleneck using traces or isolated comparisons. Choose one targeted change and a measurable success criterion before editing. Estimate trade-offs in complexity, bytes, memory, freshness, interaction latency and maintainability. Separate hypotheses from findings. If tooling/baseline is unavailable, finish with a measurement plan, not an optimization claim. Reuse existing infrastructure; no new profiler/service/library is implied.

## 4. Risk classification

Isolated visual/asset work may be LOW; rendering/import/data-processing changes are normally MEDIUM. Authenticated caching, tenancy, pricing, shared transports or public-contract changes are HIGH. Reclassify if an apparent speed change alters correctness or a trust boundary; use the API workflow for intentional contract changes.

## 5. Allowed modifications

Only authorized source/assets in the owning module and necessary existing coverage; use [Safe Refactor](SAFE_REFACTOR.md) preservation requirements for internal changes. Keep lazy/server/client boundaries, accessibility and backend authority. Do not remove validation, error/retry handling, no-store session semantics, authorization or translations to improve a metric. Dependencies, build/CI changes or sibling edits require explicit task scope; they are not authorized in Phase 3.

## 6. Before/after validation

Run applicable baseline correctness checks and affected user workflows. Remeasure the same operation under the same recorded conditions and comparable sample count; report raw before/after values, absolute/relative difference and variance. Document unavoidable environmental differences. A build pass, source line reduction, changed chunk name or a single fast sample is not performance evidence. Build duration is not runtime latency, and uncompressed file size is not transferred bytes.

## 7. Regression considerations

Check other relevant routes, cold and warm paths, large/empty data, Arabic/English, narrow screens, reduced motion, focus, loading/errors and memory/network trade-offs. Inspect whether a gain merely moved work to the server or another interaction. Preserve data freshness, private cache isolation and ordering/retry semantics.

## 8. Rollback

Keep the smallest reversible patch and its baseline measurements. Revert the task-specific optimization if correctness regresses or the measured gain is inconclusive relative to cost; preserve user work. Remeasure the restored baseline where practical. Deployment rollback is a separate authorized action.

## 9. Evidence requirements

Provide metric definitions, setup/revisions, raw samples/traces, bottleneck attribution, scoped diff, before/after comparison, correctness results and limitations. If either comparable measurement is missing, mark the improvement Not verifiable. Do not turn a proposed target into a measured result.

## 10. Completion criteria

An attributable improvement meets the recorded criterion with acceptable regression evidence and trade-offs. A measured no-gain or reverted optimization is a valid investigation result; report it honestly. Separate implemented code, verified performance, required checks and outstanding environments. No measurements means no performance-improvement claim.
