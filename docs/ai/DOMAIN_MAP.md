# Web domain ownership map

Phase 1 source inventory, 2026-11-15. Coverage: **22/22** existing module directories. This is a knowledge map, not a proposed architecture, endpoint catalog or runtime verification result.

## Reading the entries

Each entry records responsibility, actual source, public files, representative internals, request ownership, rules, related specification status, client/server boundaries, tests and risk. Public files list actual root TypeScript files; whether a consumer may import them is governed by [architecture](../ARCHITECTURE.md). An empty composition index is not evidence of a missing feature.

API ownership describes source files, not inferred URLs. Shared authentication and inline server/public requests are explicitly identified. Request-preservation checks are structural evidence, not user-flow coverage. Global checks for every domain are the existing architecture scanner and lint/typecheck scripts. Phase 1 ran the existing architecture scanner to verify this map’s enforcement references; application lint/typecheck/tests/build were not run. See [Phase 1 results](PHASE1_VALIDATION.md) and [Validation](VALIDATION.md).

Specification IDs resolve to the classified registry in [SPEC_MAP.md](SPEC_MAP.md). Self-described authoritative baselines, explicitly accepted decisions, implementation history and unapproved proposals are different evidence classes. Preserve current behavior pending resolution of a real conflict.

## announcements

Restaurant announcement CRUD, localized text and scheduled presentation.

- **Source:** [src/modules/announcements](../../src/modules/announcements). **Public files:** [src/modules/announcements/index.ts](../../src/modules/announcements/index.ts).
- **Important internals:** [src/modules/announcements/components/settings/announcements/AnnouncementsWorkspace.tsx](../../src/modules/announcements/components/settings/announcements/AnnouncementsWorkspace.tsx).
- **API ownership:** [src/modules/announcements/api/announcements.ts](../../src/modules/announcements/api/announcements.ts)
- **Rules:** Preserve status/date/localized-text fields and canManage UI.
- **Specifications:** [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md), [API](../../../operations/docs/02-technical/API_CONVENTIONS.md), [I18N](../../../operations/docs/01-domain/I18N_SPEC.md). Decision context: DEC-042.
- **Client/server boundary:** Server-default route composition where present; interactive controls/hooks use client boundaries. Presence of a page does not authorize moving mutations to the server.
- **Tests/checks:** No colocated test file found. 5 recorded function-preservation cases reference this module in [tests/contracts/request-implementations.json](../../tests/contracts/request-implementations.json) via [tests/request-contracts.test.mjs](../../tests/request-contracts.test.mjs). Global checks above apply; runtime/browser coverage is not certified here.
- **Constraints/risks:** Announcement scheduling is API-owned; rendering an announcement is not an order-state transition.

## auth

Staff login, password reset and own-account password UI.

- **Source:** [src/modules/auth](../../src/modules/auth). **Public files:** [src/modules/auth/auth-shell.ts](../../src/modules/auth/auth-shell.ts), [src/modules/auth/index.ts](../../src/modules/auth/index.ts).
- **Important internals:** [src/modules/auth/components/login/LoginForm.tsx](../../src/modules/auth/components/login/LoginForm.tsx), [src/modules/auth/components/account/AccountWorkspace.tsx](../../src/modules/auth/components/account/AccountWorkspace.tsx).
- **API ownership:** [src/modules/auth/api/account.ts](../../src/modules/auth/api/account.ts) Account/reset functions are in api/account.ts; login calls shared apiFetch directly in LoginForm.
- **Rules:** Keep credentialed requests and distinguish invalid credentials from unavailable service.
- **Specifications:** [AUTH](../../../operations/docs/02-technical/AUTH_TENANCY_SPEC.md), [API](../../../operations/docs/02-technical/API_CONVENTIONS.md). Decision context: DEC-003.
- **Client/server boundary:** Server-default route composition where present; interactive controls/hooks use client boundaries. Presence of a page does not authorize moving mutations to the server.
- **Tests/checks:** No colocated test file found. 3 recorded function-preservation cases reference this module in [tests/contracts/request-implementations.json](../../tests/contracts/request-implementations.json) via [tests/request-contracts.test.mjs](../../tests/request-contracts.test.mjs). Global checks above apply; runtime/browser coverage is not certified here.
- **Constraints/risks:** Guest and staff identities must not be conflated; no browser-storage session authority.

## branches

Branch administration and opening-hour editing.

- **Source:** [src/modules/branches](../../src/modules/branches). **Public files:** [src/modules/branches/api.ts](../../src/modules/branches/api.ts), [src/modules/branches/capabilities.ts](../../src/modules/branches/capabilities.ts), [src/modules/branches/index.ts](../../src/modules/branches/index.ts), [src/modules/branches/types.ts](../../src/modules/branches/types.ts).
- **Important internals:** [src/modules/branches/components/settings/branches/BranchesWorkspace.tsx](../../src/modules/branches/components/settings/branches/BranchesWorkspace.tsx), [src/modules/branches/components/settings/hours/HoursWorkspace.tsx](../../src/modules/branches/components/settings/hours/HoursWorkspace.tsx).
- **API ownership:** [src/modules/branches/api/branches.ts](../../src/modules/branches/api/branches.ts)
- **Rules:** Preserve branch scope/capabilities and existing hours representation.
- **Specifications:** [AUTH](../../../operations/docs/02-technical/AUTH_TENANCY_SPEC.md), [STAFF](../../../operations/docs/03-ui-ux/STAFF_DASHBOARD_UX_SPEC.md), [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md). Decision context: DEC-003, DEC-042.
- **Client/server boundary:** Server-default route composition where present; interactive controls/hooks use client boundaries. Presence of a page does not authorize moving mutations to the server.
- **Tests/checks:** No colocated test file found. 5 recorded function-preservation cases reference this module in [tests/contracts/request-implementations.json](../../tests/contracts/request-implementations.json) via [tests/request-contracts.test.mjs](../../tests/request-contracts.test.mjs). Global checks above apply; runtime/browser coverage is not certified here.
- **Constraints/risks:** Active branch eligibility and local opening hours are API facts, not browser guesses.

## dashboard

Restaurant operational overview, attention indicators, metrics and recent activity.

- **Source:** [src/modules/dashboard](../../src/modules/dashboard). **Public files:** [src/modules/dashboard/index.ts](../../src/modules/dashboard/index.ts).
- **Important internals:** [src/modules/dashboard/components/OperationsDashboard.tsx](../../src/modules/dashboard/components/OperationsDashboard.tsx), [src/modules/dashboard/components/AttentionPanel.tsx](../../src/modules/dashboard/components/AttentionPanel.tsx), [src/modules/dashboard/components/LiveTables.tsx](../../src/modules/dashboard/components/LiveTables.tsx).
- **API ownership:** [src/modules/dashboard/api/dashboard.ts](../../src/modules/dashboard/api/dashboard.ts)
- **Rules:** Preserve permission-dependent operational views and existing metric ranges.
- **Specifications:** [STAFF](../../../operations/docs/03-ui-ux/STAFF_DASHBOARD_UX_SPEC.md), [ORDER](../../../operations/docs/01-domain/ORDER_LIFECYCLE_SPEC.md), [TABLE](../../../operations/docs/01-domain/TABLE_SESSION_SPEC.md). Decision context: DEC-035.
- **Client/server boundary:** Server-default route composition where present; interactive controls/hooks use client boundaries. Presence of a page does not authorize moving mutations to the server.
- **Tests/checks:** No colocated test file found. 1 recorded function-preservation case references this module in [tests/contracts/request-implementations.json](../../tests/contracts/request-implementations.json) via [tests/request-contracts.test.mjs](../../tests/request-contracts.test.mjs). Global checks above apply; runtime/browser coverage is not certified here.
- **Constraints/risks:** Displayed aggregates do not establish revenue/payment authority; avoid mixing setup completion with live operations.

## delivery

Branch delivery zones and their configuration.

- **Source:** [src/modules/delivery](../../src/modules/delivery). **Public files:** [src/modules/delivery/api.ts](../../src/modules/delivery/api.ts), [src/modules/delivery/index.ts](../../src/modules/delivery/index.ts).
- **Important internals:** [src/modules/delivery/components/settings/delivery/DeliveryWorkspace.tsx](../../src/modules/delivery/components/settings/delivery/DeliveryWorkspace.tsx).
- **API ownership:** [src/modules/delivery/api/delivery.ts](../../src/modules/delivery/api/delivery.ts)
- **Rules:** Preserve zone identity and exact fee/minimum string contracts.
- **Specifications:** [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md), [API](../../../operations/docs/02-technical/API_CONVENTIONS.md). Decision context: DEC-042.
- **Client/server boundary:** Server-default route composition where present; interactive controls/hooks use client boundaries. Presence of a page does not authorize moving mutations to the server.
- **Tests/checks:** No colocated test file found. 5 recorded function-preservation cases reference this module in [tests/contracts/request-implementations.json](../../tests/contracts/request-implementations.json) via [tests/request-contracts.test.mjs](../../tests/request-contracts.test.mjs). Global checks above apply; runtime/browser coverage is not certified here.
- **Constraints/risks:** Eligibility, branch hours and payable delivery fee remain backend decisions.

## demos

Secret demo-link session entry and demo-credit presentation.

- **Source:** [src/modules/demos](../../src/modules/demos). **Public files:** [src/modules/demos/index.ts](../../src/modules/demos/index.ts).
- **Important internals:** [src/modules/demos/components/demo/[token]/DemoEnter.tsx](../../src/modules/demos/components/demo/[token]/DemoEnter.tsx), [src/modules/demos/components/demo-credits/credits-data.ts](../../src/modules/demos/components/demo-credits/credits-data.ts).
- **API ownership:** No module `api/` implementation found. No api/ directory: DemoEnter calls shared apiFetch directly; read that component for the actual request.
- **Rules:** DemoEnter guards its token exchange against duplicate effect execution.
- **Specifications:** [DEMO](../../../operations/docs/01-domain/DEMO_RESTAURANTS_SPEC.md), [AUTH](../../../operations/docs/02-technical/AUTH_TENANCY_SPEC.md). Decision context: DEC-060, DEC-061.
- **Client/server boundary:** Server-default route composition where present; interactive controls/hooks use client boundaries. Presence of a page does not authorize moving mutations to the server.
- **Tests/checks:** No colocated test file found. No domain-specific automated coverage established by this inventory. Global checks above apply; runtime/browser coverage is not certified here.
- **Constraints/risks:** Treat the demo link as sensitive; frontend entry is not proof of isolation or automatic purge.

## guest-menu

Guest menu rendering, design previews, customizations, cart, checkout and order confirmation/tracking UI.

- **Source:** [src/modules/guest-menu](../../src/modules/guest-menu). **Public files:** [src/modules/guest-menu/bloom-settings.ts](../../src/modules/guest-menu/bloom-settings.ts), [src/modules/guest-menu/brew-settings.ts](../../src/modules/guest-menu/brew-settings.ts), [src/modules/guest-menu/copy.ts](../../src/modules/guest-menu/copy.ts), [src/modules/guest-menu/editorial-settings.ts](../../src/modules/guest-menu/editorial-settings.ts), [src/modules/guest-menu/ember-settings.ts](../../src/modules/guest-menu/ember-settings.ts), [src/modules/guest-menu/guest-locale.ts](../../src/modules/guest-menu/guest-locale.ts), [src/modules/guest-menu/guest-theme.ts](../../src/modules/guest-menu/guest-theme.ts), [src/modules/guest-menu/index.ts](../../src/modules/guest-menu/index.ts), [src/modules/guest-menu/links-api.ts](../../src/modules/guest-menu/links-api.ts), [src/modules/guest-menu/makkboz-preview.ts](../../src/modules/guest-menu/makkboz-preview.ts), [src/modules/guest-menu/makkboz-settings.ts](../../src/modules/guest-menu/makkboz-settings.ts), [src/modules/guest-menu/meat-lovers-preview.ts](../../src/modules/guest-menu/meat-lovers-preview.ts), [src/modules/guest-menu/meat-lovers-settings.ts](../../src/modules/guest-menu/meat-lovers-settings.ts), [src/modules/guest-menu/money.ts](../../src/modules/guest-menu/money.ts), [src/modules/guest-menu/offer-sheet.ts](../../src/modules/guest-menu/offer-sheet.ts), [src/modules/guest-menu/offers-copy.ts](../../src/modules/guest-menu/offers-copy.ts), [src/modules/guest-menu/offers-strip.ts](../../src/modules/guest-menu/offers-strip.ts), [src/modules/guest-menu/price-format.ts](../../src/modules/guest-menu/price-format.ts), [src/modules/guest-menu/product-card.ts](../../src/modules/guest-menu/product-card.ts), [src/modules/guest-menu/product-sheet.ts](../../src/modules/guest-menu/product-sheet.ts), [src/modules/guest-menu/public-api.ts](../../src/modules/guest-menu/public-api.ts), [src/modules/guest-menu/restaurant-seo.ts](../../src/modules/guest-menu/restaurant-seo.ts), [src/modules/guest-menu/sherbiny-preview.ts](../../src/modules/guest-menu/sherbiny-preview.ts), [src/modules/guest-menu/sherbiny-settings.ts](../../src/modules/guest-menu/sherbiny-settings.ts), [src/modules/guest-menu/theme.ts](../../src/modules/guest-menu/theme.ts), [src/modules/guest-menu/types.ts](../../src/modules/guest-menu/types.ts), [src/modules/guest-menu/verde-preview.ts](../../src/modules/guest-menu/verde-preview.ts), [src/modules/guest-menu/verde-settings.ts](../../src/modules/guest-menu/verde-settings.ts).
- **Important internals:** [src/modules/guest-menu/components/PublicMenuView.tsx](../../src/modules/guest-menu/components/PublicMenuView.tsx), [src/modules/guest-menu/hooks/use-guest-cart.ts](../../src/modules/guest-menu/hooks/use-guest-cart.ts), [src/modules/guest-menu/hooks/use-guest-checkout.ts](../../src/modules/guest-menu/hooks/use-guest-checkout.ts), [src/modules/guest-menu/hooks/use-guest-order-submission.ts](../../src/modules/guest-menu/hooks/use-guest-order-submission.ts).
- **API ownership:** [src/modules/guest-menu/api/guest-links.ts](../../src/modules/guest-menu/api/guest-links.ts), [src/modules/guest-menu/api/guest-menu.ts](../../src/modules/guest-menu/api/guest-menu.ts), [src/modules/guest-menu/api/guest-orders.ts](../../src/modules/guest-menu/api/guest-orders.ts)
- **Rules:** Preserve identity-only cart lines, exact display arithmetic, pending retry identity and server refusal/refresh handling.
- **Specifications:** [MENU](../../../operations/docs/01-domain/MENU_SPEC.md), [GUEST](../../../operations/docs/03-ui-ux/GUEST_EXPERIENCE_SPEC.md), [QR](../../../operations/docs/01-domain/QR_SPEC.md), [ORDER](../../../operations/docs/01-domain/ORDER_LIFECYCLE_SPEC.md), [OFFERS](../../../operations/docs/01-domain/OFFERS_SPEC.md), [CHECKOUT](../../../operations/docs/03-ui-ux/GUEST_CHECKOUT_VALIDATION_IMPLEMENTATION.md), [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md). Decision context: DEC-038, DEC-041, DEC-042, DEC-044, DEC-066, DEC-068, DEC-069.
- **Client/server boundary:** Server menu read/page/layout; interactive view and workflow hooks are client code. Keep server composition out of browser-safe root exports.
- **Tests/checks:** 18 colocated test files; examples: [src/modules/guest-menu/tests/bloom-settings.contract.test.mjs](../../src/modules/guest-menu/tests/bloom-settings.contract.test.mjs), [src/modules/guest-menu/tests/bloom-typography.contract.test.mjs](../../src/modules/guest-menu/tests/bloom-typography.contract.test.mjs), [src/modules/guest-menu/tests/brew-contract.test.mjs](../../src/modules/guest-menu/tests/brew-contract.test.mjs). 9 recorded function-preservation cases reference this module in [tests/contracts/request-implementations.json](../../tests/contracts/request-implementations.json) via [tests/request-contracts.test.mjs](../../tests/request-contracts.test.mjs). Pure behavior examples: [tests/shared/domain-behavior.test.mjs](../../tests/shared/domain-behavior.test.mjs). Global checks above apply; runtime/browser coverage is not certified here.
- **Constraints/risks:** Exclusive-renderer source exists despite mixed decision approval states; existence is not owner acceptance.

## kitchen

Branch-scoped kitchen ticket presentation and allowed order actions.

- **Source:** [src/modules/kitchen](../../src/modules/kitchen). **Public files:** [src/modules/kitchen/capabilities.ts](../../src/modules/kitchen/capabilities.ts), [src/modules/kitchen/index.ts](../../src/modules/kitchen/index.ts).
- **Important internals:** [src/modules/kitchen/components/KitchenBoard.tsx](../../src/modules/kitchen/components/KitchenBoard.tsx), [src/modules/kitchen/components/KitchenTicketCard.tsx](../../src/modules/kitchen/components/KitchenTicketCard.tsx).
- **API ownership:** [src/modules/kitchen/api/kitchen.ts](../../src/modules/kitchen/api/kitchen.ts) api/kitchen.ts owns ticket reads; inspect KitchenBoard imports for the orders public API used by mutations.
- **Rules:** Keep kitchen permissions, active-branch selection and allowed actions.
- **Specifications:** [ORDER](../../../operations/docs/01-domain/ORDER_LIFECYCLE_SPEC.md), [STAFF](../../../operations/docs/03-ui-ux/STAFF_DASHBOARD_UX_SPEC.md), [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md). Decision context: DEC-009, DEC-054.
- **Client/server boundary:** Server-default route composition where present; interactive controls/hooks use client boundaries. Presence of a page does not authorize moving mutations to the server.
- **Tests/checks:** No colocated test file found. 1 recorded function-preservation case references this module in [tests/contracts/request-implementations.json](../../tests/contracts/request-implementations.json) via [tests/request-contracts.test.mjs](../../tests/request-contracts.test.mjs). Global checks above apply; runtime/browser coverage is not certified here.
- **Constraints/risks:** KITCHEN feature entitlement and order transitions are distinct from showing the board.

## marketing

Public landing pages, plan presentation, lead forms and menu showcases.

- **Source:** [src/modules/marketing](../../src/modules/marketing). **Public files:** [src/modules/marketing/editorial-menu-showcase.ts](../../src/modules/marketing/editorial-menu-showcase.ts), [src/modules/marketing/index.ts](../../src/modules/marketing/index.ts), [src/modules/marketing/premium-menu-showcase.ts](../../src/modules/marketing/premium-menu-showcase.ts).
- **Important internals:** [src/modules/marketing/components/landing/LeadProvider.tsx](../../src/modules/marketing/components/landing/LeadProvider.tsx), [src/modules/marketing/components/landing/plans-api.ts](../../src/modules/marketing/components/landing/plans-api.ts), [src/modules/marketing/components/clay/LeadProvider.tsx](../../src/modules/marketing/components/clay/LeadProvider.tsx).
- **API ownership:** No module `api/` implementation found. No module api/ directory: landing/clay plans-api and LeadProvider files own public plan/lead calls.
- **Rules:** Preserve public plan/lead contracts and localized marketing copy.
- **Specifications:** [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md), [I18N](../../../operations/docs/01-domain/I18N_SPEC.md), [DESIGN](../../../operations/docs/03-ui-ux/DESIGN_SYSTEM.md). Decision context: DEC-053, DEC-055.
- **Client/server boundary:** Server landing page composition; client lead forms and interactive showcases. Public request helpers remain owned by the landing variant.
- **Tests/checks:** No colocated test file found. No domain-specific automated coverage established by this inventory. Global checks above apply; runtime/browser coverage is not certified here.
- **Constraints/risks:** Not all request owners live in api/: inspect each landing variant; showcases are not real operational metrics.

## menu

Menus, categories, products, variants, modifiers and modifier-preset management.

- **Source:** [src/modules/menu](../../src/modules/menu). **Public files:** [src/modules/menu/api.ts](../../src/modules/menu/api.ts), [src/modules/menu/capabilities.ts](../../src/modules/menu/capabilities.ts), [src/modules/menu/cover-image-validation.ts](../../src/modules/menu/cover-image-validation.ts), [src/modules/menu/guest-menu-fab.ts](../../src/modules/menu/guest-menu-fab.ts), [src/modules/menu/guest-menu-link.ts](../../src/modules/menu/guest-menu-link.ts), [src/modules/menu/image-field.ts](../../src/modules/menu/image-field.ts), [src/modules/menu/image-validation.ts](../../src/modules/menu/image-validation.ts), [src/modules/menu/index.ts](../../src/modules/menu/index.ts), [src/modules/menu/menu-hub-back-link.ts](../../src/modules/menu/menu-hub-back-link.ts), [src/modules/menu/menu-section-tabs.ts](../../src/modules/menu/menu-section-tabs.ts), [src/modules/menu/open-guest-menu-button.ts](../../src/modules/menu/open-guest-menu-button.ts), [src/modules/menu/types.ts](../../src/modules/menu/types.ts).
- **Important internals:** [src/modules/menu/components/MenuWorkspace.tsx](../../src/modules/menu/components/MenuWorkspace.tsx), [src/modules/menu/components/CategoryNavigation.tsx](../../src/modules/menu/components/CategoryNavigation.tsx), [src/modules/menu/components/products/ProductEditor.tsx](../../src/modules/menu/components/products/ProductEditor.tsx), [src/modules/menu/components/modifier-presets/ModifierPresetsWorkspace.tsx](../../src/modules/menu/components/modifier-presets/ModifierPresetsWorkspace.tsx).
- **API ownership:** [src/modules/menu/api/categories.ts](../../src/modules/menu/api/categories.ts), [src/modules/menu/api/menus.ts](../../src/modules/menu/api/menus.ts), [src/modules/menu/api/modifier-presets.ts](../../src/modules/menu/api/modifier-presets.ts), [src/modules/menu/api/modifiers.ts](../../src/modules/menu/api/modifiers.ts), [src/modules/menu/api/products.ts](../../src/modules/menu/api/products.ts), [src/modules/menu/api/variants.ts](../../src/modules/menu/api/variants.ts)
- **Rules:** Keep product/variant identity, translation fallback and modifier selection constraints; reuse extracted forms.
- **Specifications:** [MENU](../../../operations/docs/01-domain/MENU_SPEC.md), [PROMO](../../../operations/docs/01-domain/PROMOTIONS_SPEC.md), [I18N](../../../operations/docs/01-domain/I18N_SPEC.md), [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md). Decision context: DEC-036, DEC-041.
- **Client/server boundary:** Server-default route composition where present; interactive controls/hooks use client boundaries. Presence of a page does not authorize moving mutations to the server.
- **Tests/checks:** No colocated test file found. 68 recorded function-preservation cases reference this module in [tests/contracts/request-implementations.json](../../tests/contracts/request-implementations.json) via [tests/request-contracts.test.mjs](../../tests/request-contracts.test.mjs). Global checks above apply; runtime/browser coverage is not certified here.
- **Constraints/risks:** File moves must preserve source-contract mapping and API bodies; root public shims are not arbitrary internal deep-import access.

## menu-import

Upload/import job presentation, extracted draft review and approve/discard workflow.

- **Source:** [src/modules/menu-import](../../src/modules/menu-import). **Public files:** [src/modules/menu-import/index.ts](../../src/modules/menu-import/index.ts).
- **Important internals:** [src/modules/menu-import/components/menu/import/MenuImportWorkspace.tsx](../../src/modules/menu-import/components/menu/import/MenuImportWorkspace.tsx), [src/modules/menu-import/components/menu/import/ImportReview.tsx](../../src/modules/menu-import/components/menu/import/ImportReview.tsx), [src/modules/menu-import/utils/files.ts](../../src/modules/menu-import/utils/files.ts).
- **API ownership:** [src/modules/menu-import/api/menu-import.ts](../../src/modules/menu-import/api/menu-import.ts)
- **Rules:** Preserve file validation, draft review and approval boundary.
- **Specifications:** [IMPORT](../../../operations/docs/01-domain/MENU_IMPORT_SPEC.md), [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md), [API](../../../operations/docs/02-technical/API_CONVENTIONS.md). Decision context: DEC-039, DEC-040, DEC-057, DEC-058, DEC-059.
- **Client/server boundary:** Server-default route composition where present; interactive controls/hooks use client boundaries. Presence of a page does not authorize moving mutations to the server.
- **Tests/checks:** No colocated test file found. 9 recorded function-preservation cases reference this module in [tests/contracts/request-implementations.json](../../tests/contracts/request-implementations.json) via [tests/request-contracts.test.mjs](../../tests/request-contracts.test.mjs). Global checks above apply; runtime/browser coverage is not certified here.
- **Constraints/risks:** AI extraction is draft-only; the frontend does not acquire provider keys or bypass import entitlement.

## offers

Offer library, included items, choice slots, draft editing and preview.

- **Source:** [src/modules/offers](../../src/modules/offers). **Public files:** [src/modules/offers/index.ts](../../src/modules/offers/index.ts).
- **Important internals:** [src/modules/offers/components/menu/offers/OffersWorkspace.tsx](../../src/modules/offers/components/menu/offers/OffersWorkspace.tsx), [src/modules/offers/components/menu/offers/use-offers-editor.ts](../../src/modules/offers/components/menu/offers/use-offers-editor.ts), [src/modules/offers/components/menu/offers/offer-draft.ts](../../src/modules/offers/components/menu/offers/offer-draft.ts).
- **API ownership:** [src/modules/offers/api/offers.ts](../../src/modules/offers/api/offers.ts)
- **Rules:** Keep fixed/single/multi choice rules, exact adjustments, translations and serialized mutations.
- **Specifications:** [OFFERS](../../../operations/docs/01-domain/OFFERS_SPEC.md), [API](../../../operations/docs/02-technical/API_CONVENTIONS.md), [I18N](../../../operations/docs/01-domain/I18N_SPEC.md). Decision context: DEC-069.
- **Client/server boundary:** Server-default route composition where present; interactive controls/hooks use client boundaries. Presence of a page does not authorize moving mutations to the server.
- **Tests/checks:** No colocated test file found. 9 recorded function-preservation cases reference this module in [tests/contracts/request-implementations.json](../../tests/contracts/request-implementations.json) via [tests/request-contracts.test.mjs](../../tests/request-contracts.test.mjs). Pure behavior examples: [tests/shared/domain-behavior.test.mjs](../../tests/shared/domain-behavior.test.mjs). Global checks above apply; runtime/browser coverage is not certified here.
- **Constraints/risks:** Preview totals are advisory; backend revalidates availability, slot completeness and price.

## orders

Staff order listing/filtering, details, receipt and transition actions.

- **Source:** [src/modules/orders](../../src/modules/orders). **Public files:** [src/modules/orders/api.ts](../../src/modules/orders/api.ts), [src/modules/orders/capabilities.ts](../../src/modules/orders/capabilities.ts), [src/modules/orders/index.ts](../../src/modules/orders/index.ts), [src/modules/orders/order-type-badge.ts](../../src/modules/orders/order-type-badge.ts), [src/modules/orders/order-views.ts](../../src/modules/orders/order-views.ts), [src/modules/orders/status-badge.ts](../../src/modules/orders/status-badge.ts), [src/modules/orders/transitions.ts](../../src/modules/orders/transitions.ts), [src/modules/orders/types.ts](../../src/modules/orders/types.ts).
- **Important internals:** [src/modules/orders/components/OrdersWorkspace.tsx](../../src/modules/orders/components/OrdersWorkspace.tsx), [src/modules/orders/components/OrderDetailDialog.tsx](../../src/modules/orders/components/OrderDetailDialog.tsx), [src/modules/orders/utils/transitions.ts](../../src/modules/orders/utils/transitions.ts).
- **API ownership:** [src/modules/orders/api/orders.ts](../../src/modules/orders/api/orders.ts)
- **Rules:** Preserve branch/permission filters and existing transition vocabulary.
- **Specifications:** [ORDER](../../../operations/docs/01-domain/ORDER_LIFECYCLE_SPEC.md), [AUTH](../../../operations/docs/02-technical/AUTH_TENANCY_SPEC.md), [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md). Decision context: DEC-035, DEC-042.
- **Client/server boundary:** Server-default route composition where present; interactive controls/hooks use client boundaries. Presence of a page does not authorize moving mutations to the server.
- **Tests/checks:** No colocated test file found. 4 recorded function-preservation cases reference this module in [tests/contracts/request-implementations.json](../../tests/contracts/request-implementations.json) via [tests/request-contracts.test.mjs](../../tests/request-contracts.test.mjs). Global checks above apply; runtime/browser coverage is not certified here.
- **Constraints/risks:** Do not infer completed/paid revenue from a submitted order or enable unsupported transitions.

## qr

Restaurant QR management, ordering options and printable/exportable QR stands.

- **Source:** [src/modules/qr](../../src/modules/qr). **Public files:** [src/modules/qr/api.ts](../../src/modules/qr/api.ts), [src/modules/qr/index.ts](../../src/modules/qr/index.ts), [src/modules/qr/ordering-options-card.ts](../../src/modules/qr/ordering-options-card.ts), [src/modules/qr/qr-matrix.ts](../../src/modules/qr/qr-matrix.ts), [src/modules/qr/stand-designer.ts](../../src/modules/qr/stand-designer.ts), [src/modules/qr/stand-svg.ts](../../src/modules/qr/stand-svg.ts), [src/modules/qr/style.ts](../../src/modules/qr/style.ts), [src/modules/qr/use-qr-image.ts](../../src/modules/qr/use-qr-image.ts).
- **Important internals:** [src/modules/qr/components/settings/guest-qr/GuestQrWorkspace.tsx](../../src/modules/qr/components/settings/guest-qr/GuestQrWorkspace.tsx), [src/modules/qr/components/StandDesigner.tsx](../../src/modules/qr/components/StandDesigner.tsx), [src/modules/qr/utils/stand/stand-svg.ts](../../src/modules/qr/utils/stand/stand-svg.ts).
- **API ownership:** [src/modules/qr/api/qr.ts](../../src/modules/qr/api/qr.ts)
- **Rules:** Keep public-code identity and stand/export assets/locale; QR is not session authorization.
- **Specifications:** [QR](../../../operations/docs/01-domain/QR_SPEC.md), [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md), [DESIGN](../../../operations/docs/03-ui-ux/DESIGN_SYSTEM.md). Decision context: DEC-066, DEC-070.
- **Client/server boundary:** Server-default route composition where present; interactive controls/hooks use client boundaries. Presence of a page does not authorize moving mutations to the server.
- **Tests/checks:** 1 colocated test file; example: [src/modules/qr/tests/stand/stand.contract.test.mjs](../../src/modules/qr/tests/stand/stand.contract.test.mjs). 4 recorded function-preservation cases reference this module in [tests/contracts/request-implementations.json](../../tests/contracts/request-implementations.json) via [tests/request-contracts.test.mjs](../../tests/request-contracts.test.mjs). Global checks above apply; runtime/browser coverage is not certified here.
- **Constraints/risks:** QR scans do not themselves open sessions or create orders; validate visual exports separately.

## restaurant-setup

Setup status/checklist, enrollment/review actions and isolated preview UI.

- **Source:** [src/modules/restaurant-setup](../../src/modules/restaurant-setup). **Public files:** [src/modules/restaurant-setup/index.ts](../../src/modules/restaurant-setup/index.ts), [src/modules/restaurant-setup/restaurant-setup-panel.ts](../../src/modules/restaurant-setup/restaurant-setup-panel.ts).
- **Important internals:** [src/modules/restaurant-setup/components/RestaurantSetupPanel.tsx](../../src/modules/restaurant-setup/components/RestaurantSetupPanel.tsx), [src/modules/restaurant-setup/components/setup-preview/SetupPreviewWorkspace.tsx](../../src/modules/restaurant-setup/components/setup-preview/SetupPreviewWorkspace.tsx), [src/modules/restaurant-setup/utils/restaurant-setup.ts](../../src/modules/restaurant-setup/utils/restaurant-setup.ts).
- **API ownership:** [src/modules/restaurant-setup/api/restaurant-setup.ts](../../src/modules/restaurant-setup/api/restaurant-setup.ts)
- **Rules:** Current API calls supply status; preserve actual permission-aware actions without deriving canonical readiness from defaults.
- **Specifications:** [SETUP-P](../../../operations/docs/03-ui-ux/RESTAURANT_SETUP_CHECKLIST_UX_SPEC.md), [SETUP-I](../../../operations/docs/03-ui-ux/RESTAURANT_SETUP_CHECKLIST_IMPLEMENTATION.md), [STAFF](../../../operations/docs/03-ui-ux/STAFF_DASHBOARD_UX_SPEC.md), [API](../../../operations/docs/02-technical/API_CONVENTIONS.md). Decision context: No independently verified approval for the proposal.
- **Client/server boundary:** Server-default route composition where present; interactive controls/hooks use client boundaries. Presence of a page does not authorize moving mutations to the server.
- **Tests/checks:** 2 colocated test files; examples: [src/modules/restaurant-setup/tests/restaurant-setup-preview.contract.test.mjs](../../src/modules/restaurant-setup/tests/restaurant-setup-preview.contract.test.mjs), [src/modules/restaurant-setup/tests/restaurant-setup.test.mjs](../../src/modules/restaurant-setup/tests/restaurant-setup.test.mjs). 7 recorded function-preservation cases reference this module in [tests/contracts/request-implementations.json](../../tests/contracts/request-implementations.json) via [tests/request-contracts.test.mjs](../../tests/request-contracts.test.mjs). Global checks above apply; runtime/browser coverage is not certified here.
- **Constraints/risks:** Approval unresolved: proposal says unapproved while draft implementation/current API calls exist; utils header still describes a future endpoint.

## settings

Restaurant profile, ordering, languages and guest-design settings/editors.

- **Source:** [src/modules/settings](../../src/modules/settings). **Public files:** [src/modules/settings/api.ts](../../src/modules/settings/api.ts), [src/modules/settings/capabilities.ts](../../src/modules/settings/capabilities.ts), [src/modules/settings/index.ts](../../src/modules/settings/index.ts), [src/modules/settings/settings-back-link.ts](../../src/modules/settings/settings-back-link.ts), [src/modules/settings/types.ts](../../src/modules/settings/types.ts), [src/modules/settings/use-active-locales.ts](../../src/modules/settings/use-active-locales.ts).
- **Important internals:** [src/modules/settings/components/profile/ProfileWorkspace.tsx](../../src/modules/settings/components/profile/ProfileWorkspace.tsx), [src/modules/settings/components/ordering/OrderingWorkspace.tsx](../../src/modules/settings/components/ordering/OrderingWorkspace.tsx), [src/modules/settings/components/design/DesignWorkspace.tsx](../../src/modules/settings/components/design/DesignWorkspace.tsx).
- **API ownership:** [src/modules/settings/api/settings.ts](../../src/modules/settings/api/settings.ts)
- **Rules:** Keep restaurant-language readiness, ordering-channel switches and normalized preview settings.
- **Specifications:** [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md), [I18N](../../../operations/docs/01-domain/I18N_SPEC.md), [AUTH](../../../operations/docs/02-technical/AUTH_TENANCY_SPEC.md), [API](../../../operations/docs/02-technical/API_CONVENTIONS.md). Decision context: DEC-037, DEC-038, DEC-043, DEC-044.
- **Client/server boundary:** Server-default route composition where present; interactive controls/hooks use client boundaries. Presence of a page does not authorize moving mutations to the server.
- **Tests/checks:** No colocated test file found. 65 recorded function-preservation cases reference this module in [tests/contracts/request-implementations.json](../../tests/contracts/request-implementations.json) via [tests/request-contracts.test.mjs](../../tests/request-contracts.test.mjs). Global checks above apply; runtime/browser coverage is not certified here.
- **Constraints/risks:** Design proposals/implementation records have mixed approval states; do not treat all configurable designs as approved release commitments.

## staff

Restaurant shell/navigation, staff members, role/access forms and staff landing.

- **Source:** [src/modules/staff](../../src/modules/staff). **Public files:** [src/modules/staff/capabilities.ts](../../src/modules/staff/capabilities.ts), [src/modules/staff/index.ts](../../src/modules/staff/index.ts), [src/modules/staff/role-display.ts](../../src/modules/staff/role-display.ts).
- **Important internals:** [src/modules/staff/components/StaffShell.tsx](../../src/modules/staff/components/StaffShell.tsx), [src/modules/staff/components/StaffWorkspace.tsx](../../src/modules/staff/components/StaffWorkspace.tsx), [src/modules/staff/components/roles/RolesWorkspace.tsx](../../src/modules/staff/components/roles/RolesWorkspace.tsx).
- **API ownership:** [src/modules/staff/api/staff.ts](../../src/modules/staff/api/staff.ts)
- **Rules:** Preserve membership/branch/permission-aware navigation and access editing.
- **Specifications:** [AUTH](../../../operations/docs/02-technical/AUTH_TENANCY_SPEC.md), [STAFF](../../../operations/docs/03-ui-ux/STAFF_DASHBOARD_UX_SPEC.md), [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md). Decision context: DEC-003.
- **Client/server boundary:** Server-default route composition where present; interactive controls/hooks use client boundaries. Presence of a page does not authorize moving mutations to the server.
- **Tests/checks:** 6 colocated test files; examples: [src/modules/staff/tests/focus-invalid-field.test.mjs](../../src/modules/staff/tests/focus-invalid-field.test.mjs), [src/modules/staff/tests/menu-hub.contract.test.mjs](../../src/modules/staff/tests/menu-hub.contract.test.mjs), [src/modules/staff/tests/mobile-navigation.contract.test.mjs](../../src/modules/staff/tests/mobile-navigation.contract.test.mjs). 9 recorded function-preservation cases reference this module in [tests/contracts/request-implementations.json](../../tests/contracts/request-implementations.json) via [tests/request-contracts.test.mjs](../../tests/request-contracts.test.mjs). Global checks above apply; runtime/browser coverage is not certified here.
- **Constraints/risks:** Hiding a control is not authorization; shared session infrastructure remains outside this module.

## subscription

Restaurant subscription status/banner, available plans and upgrade-request UI.

- **Source:** [src/modules/subscription](../../src/modules/subscription). **Public files:** [src/modules/subscription/index.ts](../../src/modules/subscription/index.ts), [src/modules/subscription/subscription-banner.ts](../../src/modules/subscription/subscription-banner.ts).
- **Important internals:** [src/modules/subscription/components/SubscriptionWorkspace.tsx](../../src/modules/subscription/components/SubscriptionWorkspace.tsx), [src/modules/subscription/components/SubscriptionBanner.tsx](../../src/modules/subscription/components/SubscriptionBanner.tsx).
- **API ownership:** [src/modules/subscription/api/subscription.ts](../../src/modules/subscription/api/subscription.ts)
- **Rules:** Keep exact plan prices, current-plan comparison and existing request eligibility.
- **Specifications:** [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md), [API](../../../operations/docs/02-technical/API_CONVENTIONS.md). Decision context: DEC-050, DEC-051, DEC-056.
- **Client/server boundary:** Server-default route composition where present; interactive controls/hooks use client boundaries. Presence of a page does not authorize moving mutations to the server.
- **Tests/checks:** No colocated test file found. 3 recorded function-preservation cases reference this module in [tests/contracts/request-implementations.json](../../tests/contracts/request-implementations.json) via [tests/request-contracts.test.mjs](../../tests/request-contracts.test.mjs). Global checks above apply; runtime/browser coverage is not certified here.
- **Constraints/risks:** A request is not subscription activation or successful payment.

## suggestions

Staff configuration of guest product-suggestion behavior.

- **Source:** [src/modules/suggestions](../../src/modules/suggestions). **Public files:** [src/modules/suggestions/api.ts](../../src/modules/suggestions/api.ts), [src/modules/suggestions/index.ts](../../src/modules/suggestions/index.ts).
- **Important internals:** [src/modules/suggestions/components/settings/suggestions/SuggestionsWorkspace.tsx](../../src/modules/suggestions/components/settings/suggestions/SuggestionsWorkspace.tsx).
- **API ownership:** [src/modules/suggestions/api/suggestions.ts](../../src/modules/suggestions/api/suggestions.ts)
- **Rules:** Keep suggestion-mode configuration and current permission checks.
- **Specifications:** [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md), [MENU](../../../operations/docs/01-domain/MENU_SPEC.md), [API](../../../operations/docs/02-technical/API_CONVENTIONS.md). Decision context: DEC-042.
- **Client/server boundary:** Server-default route composition where present; interactive controls/hooks use client boundaries. Presence of a page does not authorize moving mutations to the server.
- **Tests/checks:** No colocated test file found. 4 recorded function-preservation cases reference this module in [tests/contracts/request-implementations.json](../../tests/contracts/request-implementations.json) via [tests/request-contracts.test.mjs](../../tests/request-contracts.test.mjs). Global checks above apply; runtime/browser coverage is not certified here.
- **Constraints/risks:** Suggested display items must not override product eligibility or add paid items automatically.

## table-sessions

Reusable table-board/session API contracts, capability helpers and time hook.

- **Source:** [src/modules/table-sessions](../../src/modules/table-sessions). **Public files:** [src/modules/table-sessions/api.ts](../../src/modules/table-sessions/api.ts), [src/modules/table-sessions/capabilities.ts](../../src/modules/table-sessions/capabilities.ts), [src/modules/table-sessions/index.ts](../../src/modules/table-sessions/index.ts), [src/modules/table-sessions/types.ts](../../src/modules/table-sessions/types.ts), [src/modules/table-sessions/use-now.ts](../../src/modules/table-sessions/use-now.ts).
- **Important internals:** [src/modules/table-sessions/hooks/use-now.ts](../../src/modules/table-sessions/hooks/use-now.ts), [src/modules/table-sessions/utils/capabilities.ts](../../src/modules/table-sessions/utils/capabilities.ts).
- **API ownership:** [src/modules/table-sessions/api/table-sessions.ts](../../src/modules/table-sessions/api/table-sessions.ts)
- **Rules:** Keep existing board/session/bill actions and response types; current root index has no runtime exports.
- **Specifications:** [TABLE](../../../operations/docs/01-domain/TABLE_SESSION_SPEC.md), [ORDER](../../../operations/docs/01-domain/ORDER_LIFECYCLE_SPEC.md), [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md). Decision context: DEC-006, DEC-035.
- **Client/server boundary:** Client-safe capability/request entries; no exported route implementation in root index. Shared transport is browser-side.
- **Tests/checks:** No colocated test file found. 9 recorded function-preservation cases reference this module in [tests/contracts/request-implementations.json](../../tests/contracts/request-implementations.json) via [tests/request-contracts.test.mjs](../../tests/request-contracts.test.mjs). Global checks above apply; runtime/browser coverage is not certified here.
- **Constraints/risks:** Consumed through focused public files; do not invent a separate page or payment lifecycle.

## tables

Table board, session history, session actions and bill/QR presentation.

- **Source:** [src/modules/tables](../../src/modules/tables). **Public files:** [src/modules/tables/capabilities.ts](../../src/modules/tables/capabilities.ts), [src/modules/tables/index.ts](../../src/modules/tables/index.ts), [src/modules/tables/session-badges.ts](../../src/modules/tables/session-badges.ts).
- **Important internals:** [src/modules/tables/components/TablesWorkspace.tsx](../../src/modules/tables/components/TablesWorkspace.tsx), [src/modules/tables/components/SessionActionDialogs.tsx](../../src/modules/tables/components/SessionActionDialogs.tsx), [src/modules/tables/components/SessionHistoryPanel.tsx](../../src/modules/tables/components/SessionHistoryPanel.tsx).
- **API ownership:** [src/modules/tables/api/tables.ts](../../src/modules/tables/api/tables.ts)
- **Rules:** Preserve table identity, session capabilities and existing settlement/closure boundaries.
- **Specifications:** [TABLE](../../../operations/docs/01-domain/TABLE_SESSION_SPEC.md), [QR](../../../operations/docs/01-domain/QR_SPEC.md), [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md). Decision context: DEC-005, DEC-035.
- **Client/server boundary:** Server-default route composition where present; interactive controls/hooks use client boundaries. Presence of a page does not authorize moving mutations to the server.
- **Tests/checks:** No colocated test file found. 5 recorded function-preservation cases reference this module in [tests/contracts/request-implementations.json](../../tests/contracts/request-implementations.json) via [tests/request-contracts.test.mjs](../../tests/request-contracts.test.mjs). Global checks above apply; runtime/browser coverage is not certified here.
- **Constraints/risks:** The frontend is not a POS ledger; source may expose views for later states without authorizing new transitions.

## whatsapp-tracking

Restaurant WhatsApp connection UI, pairing presentation and received-order counts.

- **Source:** [src/modules/whatsapp-tracking](../../src/modules/whatsapp-tracking). **Public files:** [src/modules/whatsapp-tracking/api.ts](../../src/modules/whatsapp-tracking/api.ts), [src/modules/whatsapp-tracking/index.ts](../../src/modules/whatsapp-tracking/index.ts), [src/modules/whatsapp-tracking/whatsapp-connection-card.ts](../../src/modules/whatsapp-tracking/whatsapp-connection-card.ts).
- **Important internals:** [src/modules/whatsapp-tracking/components/settings/ordering/WhatsappConnectionCard.tsx](../../src/modules/whatsapp-tracking/components/settings/ordering/WhatsappConnectionCard.tsx).
- **API ownership:** [src/modules/whatsapp-tracking/api/whatsapp-tracking.ts](../../src/modules/whatsapp-tracking/api/whatsapp-tracking.ts)
- **Rules:** A launch/click is not a verified received order or completed sale.
- **Specifications:** [TRACK](../../../operations/docs/02-technical/EVOLUTION_WHATSAPP_TRACKING.md), [API](../../../operations/docs/02-technical/API_CONVENTIONS.md). Decision context: See approved purpose in TRACK; release readiness not established.
- **Client/server boundary:** Client-safe capability/request entries; no exported route implementation in root index. Shared transport is browser-side.
- **Tests/checks:** No colocated test file found. 3 recorded function-preservation cases reference this module in [tests/contracts/request-implementations.json](../../tests/contracts/request-implementations.json) via [tests/request-contracts.test.mjs](../../tests/request-contracts.test.mjs). Global checks above apply; runtime/browser coverage is not certified here.
- **Constraints/risks:** Provider pairing and signed-message/DB integration are not verified by the frontend; root index has no runtime exports.
