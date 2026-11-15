# Change-spec template

Use this for substantial feature work or refactors. A small fix can use the same fields briefly in the task response. Replace placeholders with evidence; do not treat this template as a product requirement.

## Status and scope

- Status: draft / implementation / verified, with supporting evidence.
- User request or ticket:
- Repository and owning module:
- Existing routes and affected public entries:
- In scope:
- Out of scope:

## Evidence and decisions

- Approved spec paths and relevant decision IDs:
- Current source paths and existing tests:
- Conflicts, assumptions or unresolved business questions:
- User-authorized changes to existing behavior:

## Behavior

- Trigger and current result:
- Requested result:
- Roles, permissions, restaurant/branch context:
- Inputs, validation, locale and exact-money handling:
- Existing API method, path, encoding, body and response/error shapes:
- Loading / empty / success / failure / retry behavior:
- Concurrent actions and stale-response handling:
- Preserved copy, assets, URLs and contracts:

## Acceptance examples

| Given | When | Then | Verification |
| --- | --- | --- | --- |
| Valid input | Submit once | Expected existing contract and success UI | Relevant behavioral test |
| Request pending | Repeat action rapidly | No unintended duplicate mutation | Concurrency/browser check |
| Request fails | Retry | Inputs remain and failure is recoverable | Failure/retry check |
| Earlier read is pending | Context changes | Obsolete response cannot replace current data | Race check |
| Arabic or narrow viewport | Complete workflow | Correct direction, readable controls and keyboard focus | UI check |

Use only relevant cases; add domain-specific cases such as pricing changes, permissions or contract revisions.

## Implementation and verification

- Files and responsibilities to change:
- Server/client boundary and public-entry impact:
- Tests and commands to run:
- Actual results, environment and commit SHA:
- Known limitations and remaining verification:
