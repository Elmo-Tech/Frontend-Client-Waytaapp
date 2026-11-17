# API Contract Changes — P1

These are procedures for future authorized work. **This Phase 3 implementation permits documentation only**: none of the source, test, manifest or contract edits described below are executed here. Start with [workflow selection and common controls](WORKFLOW.md#p1-workflow-selection), [domain ownership](DOMAIN_MAP.md), [architecture](../ARCHITECTURE.md) and status-qualified [specifications](SPEC_MAP.md). Reuse the existing [risk matrix](VALIDATION.md#p0-risk-based-validation), [Test Strategy](TEST_STRATEGY.md) and evidence statuses in [VALIDATION.md](VALIDATION.md#evidence-record); do not duplicate their policies or waive baseline checks.

**Discover → Compare → Coordinate → Plan → Adapt → Verify → Report**

## 1. Entry conditions

An approved/requested contract delta or observed backend/frontend drift with an authoritative reference. Identify owner, existing transport/API wrapper, callers, types and fixtures. If a report only suggests a defect, use [Bug Investigation](BUG_INVESTIGATION.md) to establish evidence first. Neither a module name nor a TypeScript cast defines an endpoint.

## 2. Contract discovery and breaking-change analysis

Compare current source/requests with approved operations specifications and supplied backend evidence. Record method/path/prefix/encoding, headers/credentials/origin/CSRF, request fields and optional/null/omitted distinctions, response envelope/types, status/error/detail mapping, money strings, locale and retry/idempotency behavior. Trace every affected frontend consumer, server read and client mutation. Classify additions/removals/renames, narrower types, new required fields, semantic/status changes and compatibility across old/new client/server versions. A type compiling against a mock is not contract agreement.

## 3. Coordination and planning

Record the authorized contract owner, approved delta/version, target API environment, compatibility requirement and client/server rollout order. Backend implementation/contract approval remains external unless the user's task expressly includes it. Use existing [CHANGE_SPEC_TEMPLATE.md](CHANGE_SPEC_TEMPLATE.md) fields and a concise old/new compatibility table within that change record, not a competing template. For missing facts, defer only dependent implementation; do not invent a route or contact others without explicit instruction. Do not change operations or API contracts in Phase 3.

## 4. Risk classification

Actual public-contract, authentication, authorization, tenant, pricing, checkout and shared-transport changes are HIGH under the existing matrix. Pure documentation comparison with no runtime delta is LOW, but it does not lower the future adaptation's risk. Inspect all consumers and server/client exposure before selecting verification.

## 5. Allowed modifications

Only future authorized frontend wrappers/types, owning UI/state/error handling and meaningful existing fixtures/tests necessary for the agreed delta. Reuse shared transport and approved module public entries. No browser permission/pricing authority, server-only leakage, auth bypass, fabricated backend capability or implicit sibling changes. If compatibility is required, support the approved transition without silently swallowing invalid responses; avoid speculative adapters for versions that do not exist.

## 6. Validation strategy

Test old/new supported combinations and rejected/unsupported combinations against the compatibility record. Check real request construction plus response/error mapping, successful/invalid/loading/empty/failure/retry/repeated-action states, stale reads, denial/session expiry and exact-money handling as relevant. Preserve default baseline, transport/auth/request tests and affected rendered workflows. Authorized real integration should verify actual cookies, origins/CORS, CSRF and backend responses; local fixture/mocked tests cannot certify backend permissions, tenancy or database behavior. If no authorized environment exists, keep integration Not run and genuine compatibility Not verifiable.

## 7. Regression considerations

Inspect optional/null semantics, query/path encoding, credential forwarding, multipart boundaries, redirects, cache freshness, older clients, idempotency and localized errors. Contract/request hashes protect historical source identity; intentionally changed contracts need reviewed, meaningful request/response expectations, not a blindly refreshed hash. Preserve unrelated payloads and public capabilities.

## 8. Rollback

Document compatible rollback combinations and order before adapting. Retain the previous frontend patch and contract assumptions; reverting only the frontend may be unsafe after a backend-only breaking change. Coordinate a compatible rollback plan within task authority; never run backend migrations, change production data or deploy implicitly. Report incompatibilities rather than pretending every revision is reversible.

## 9. Evidence requirements

Provide old/new contract and approval provenance, consumers/types, compatibility/rollout table, scoped diff, concrete request/response/error assertions, actual integration environment/revision/results and unresolved fields. Keep mock success, real integration and production evidence distinct, using the existing four statuses.

## 10. Completion criteria

The approved frontend adaptation and required compatibility/consumer checks pass. Full integration completion requires actual agreed-environment evidence; otherwise report implementation separately and retain that gap. A proposed contract or source-only comparison is not a deployed API change or proven backend agreement.
