# Web domain rules and source map

These are frontend preservation rules derived from existing source and approved specification topics. They do not replace the full approved specs in [Spec map](SPEC_MAP.md). Read the actual implementation and relevant specs for a behavior change.

## Ownership

Use [DOMAIN_MAP.md](DOMAIN_MAP.md) for the complete source, public entries, API owners, tests and constraints of every existing domain. The map records implementation; this document owns behavior-preservation rules. Read [SPEC_MAP.md](SPEC_MAP.md) for approval status before treating a rule as a product requirement.

## Guest menu and ordering

Read the view, `use-public-menu-controller`, `use-menu-design-preview`, `use-guest-cart`, `use-guest-checkout`, `use-guest-order-submission` and `utils/cart-lines.ts` for the affected workflow. Do not merge these responsibilities back into one component.

- Cart storage contains identities, quantities and choices, not authoritative product names, prices, permissions or session state.
- Cart-line identity includes the relevant product, size/modifier selections or offer choices. Do not collapse distinct customized lines into one product ID.
- Display money uses existing exact helpers. Do not use floating-point arithmetic for totals or rewrite money strings casually.
- Order lines send identities/quantities/choices. Preserve the existing expected-total comparison hint; it does not make the browser the pricing authority.
- Preserve pending request identity for an unchanged order retry, including after a lost response. Changed payloads must not reuse another attempt's identity.
- Keep cart and typed fields after a failed request. Clear them only at the existing success or explicit user-clear boundary.
- Preserve TABLE versus GENERIC QR handling, pickup/delivery eligibility and branch/zone selection. The API remains authoritative for opening hours, availability and allowed order state.
- Price or offer changes must follow the existing refusal/refresh/review behavior, not silently charge a new amount.
- Acquire duplicate-action protection before asynchronous validation. Keep normal-order and WhatsApp flows under their existing submission guard.
- Do not convert the WhatsApp handoff into a dashboard order or alter tracking eligibility without a corresponding approved behavior change.

## Preview, UI and localization

- Preview messages require the existing origin/source/type checks and normalization. Preview data is not authorization.
- Keep exclusive renderers lazy. Preserve stylesheet order, original assets, font files, restaurant copy and product data.
- Preserve Arabic/English validation and logical-direction layout. Shared root document language is not always the guest subtree language; inspect the guest locale/theme owners.
- Fix overflow at its actual owner; do not hide application-wide content to conceal a layout bug. Preserve sticky navigation and reduced-motion behavior.
- Retain accessible labels, input limits, focus feedback, dialog Escape/focus behavior and file/image validation.

## API, tenant and auth boundaries

- Reuse `src/lib/api/client.ts` and `server-fetch.ts`; keep domain endpoint functions in their modules.
- Preserve credentialed browser requests, tenant-host origin handling, query encoding, error envelopes and multipart boundary behavior.
- Preserve the existing browser mutation model. Do not proxy unsafe mutations through a new Next route/server action and thereby change Origin/CSRF semantics.
- `API_INTERNAL_URL` is server-only; `NEXT_PUBLIC_*` values are browser-visible. Do not expose secrets or replace public-origin configuration with an internal container origin.
- Do not create frontend auth bypasses or store trusted permissions/session identity in browser storage.

## Tests and shared contracts

`tests/contracts/source-files.mjs` and `source-paths.json` adapt historical source identities to current implementation owners. A legitimate move may require updating the adapter to the real files; do not point it to a saved baseline or fabricate text to satisfy assertions.

Cross-repository source assertions live in operations. They are optional validation context when sibling checkouts exist, never a build/runtime dependency for this standalone app.
