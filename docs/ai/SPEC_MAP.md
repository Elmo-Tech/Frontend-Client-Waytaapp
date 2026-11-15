# Specification reference map

## Evidence classes

- **Explicitly approved/accepted:** the referenced decision or spec states acceptance; record the exact decision, not approval of the entire surrounding file.
- **Authoritative baseline:** a document calls itself a source of truth; its separate approval date was not independently established here. Check later accepted amendments and the user's task.
- **Historical implementation:** describes a branch, draft PR or a dated build; neither a new requirement nor current release evidence.
- **Proposal / unverified approval:** do not implement as an approved requirement solely because a file or UI exists.
- **Current implementation:** actual frontend files in [DOMAIN_MAP.md](DOMAIN_MAP.md); source existence is not proof of product approval or successful deployment.

Specifications reside in the independent operations repository. Sibling links work only when operations is checked out next to this frontend. They are read-only knowledge references, never runtime/build imports. Without that checkout, use local knowledge maps for preservation and obtain a missing material decision before changing behavior.

## Classified registry

| ID / source | Evidence class | Status evidence and interpretation |
| --- | --- | --- |
| [API](../../../operations/docs/02-technical/API_CONVENTIONS.md) | Self-described authoritative API baseline | Contract reference with later amendments; exact current requests are evidenced by source, not invented from module names. |
| [AUTH](../../../operations/docs/02-technical/AUTH_TENANCY_SPEC.md) | Self-described authoritative auth baseline | Separate guest, restaurant and platform identities and tenant/branch scope. |
| [CHECKOUT](../../../operations/docs/03-ui-ux/GUEST_CHECKOUT_VALIDATION_IMPLEMENTATION.md) | Historical implementation record | Built on 2026-11-05; tied to owner-requested DEC-068. Not a fresh test result. |
| [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md) | Accepted decisions and mixed-status amendments | Read each DEC status; DEC-062 is Proposed; DEC-067 and DEC-068 record built work with release gates. A file title is not approval of every section. |
| [DEMO](../../../operations/docs/01-domain/DEMO_RESTAURANTS_SPEC.md) | Implemented specification tied to accepted decisions | DEC-060/061 accepted; expiry/purge deployment is not verified by frontend existence. |
| [DESIGN](../../../operations/docs/03-ui-ux/DESIGN_SYSTEM.md) | Design baseline reference | Preserve current supplied assets/copy; design reference does not prove rendered equivalence. |
| [GUEST](../../../operations/docs/03-ui-ux/GUEST_EXPERIENCE_SPEC.md) | Self-described authoritative guest UX baseline | Read with later accepted feature decisions; does not establish runtime QA. |
| [I18N](../../../operations/docs/01-domain/I18N_SPEC.md) | Self-described authoritative locale baseline | Read with accepted DEC-037; preserve runtime locale contracts. |
| [IMPORT](../../../operations/docs/01-domain/MENU_IMPORT_SPEC.md) | Accepted specification with amendments | Header records acceptance and DEC-057; DEC-058/059 further govern template/backend extraction. |
| [MENU](../../../operations/docs/01-domain/MENU_SPEC.md) | Self-described authoritative menu baseline; mixed amendments | Some embedded import design prose is proposed; accepted DEC-040/041/057/058/059 provide later import/variant decisions. |
| [MOTION](../../../operations/docs/03-ui-ux/MOTION_ACCESSIBILITY_SPEC.md) | Motion/accessibility baseline reference | Keyboard/focus/reduced-motion checks require actual verification for affected UI. |
| [OFFERS](../../../operations/docs/01-domain/OFFERS_SPEC.md) | Explicit owner-approved specification | DEC-069 explicitly approved; recorded build/release status is historical, not current deployment evidence. |
| [ORDER](../../../operations/docs/01-domain/ORDER_LIFECYCLE_SPEC.md) | Self-described authoritative order baseline | Read with accepted DEC-035 scope correction; do not infer full POS/payment behavior. |
| [PROMO](../../../operations/docs/01-domain/PROMOTIONS_SPEC.md) | Authoritative baseline with narrower accepted scope | Product discount implementation uses DEC-036; do not enable all future promotion ideas. |
| [QR](../../../operations/docs/01-domain/QR_SPEC.md) | Self-described authoritative QR baseline | Use accepted DEC-066/070/071 amendments where relevant. |
| [SEC](../../../operations/docs/02-technical/SECURITY_SPEC.md) | Self-described authoritative security baseline | Use relevant sections; no new security implementation in Phase 1. |
| [SETUP-I](../../../operations/docs/03-ui-ux/RESTAURANT_SETUP_CHECKLIST_IMPLEMENTATION.md) | Historical draft implementation record | Says implemented on Draft PR #12; QA/release gates remain in that record. Current code exists; current approval not established. |
| [SETUP-P](../../../operations/docs/03-ui-ux/RESTAURANT_SETUP_CHECKLIST_UX_SPEC.md) | Unapproved proposal | Version 0.1 explicitly says proposed, not approved/not implemented. Do not promote to an approved requirement. |
| [SPLIT](../../../operations/docs/02-technical/STANDALONE_REPOSITORIES.md) | Current repository decision | 2026-11-12 explicit standalone extraction; supersedes historical workspace paths, not business rules. |
| [STAFF](../../../operations/docs/03-ui-ux/STAFF_DASHBOARD_UX_SPEC.md) | Authoritative baseline with navigation amendments | Contains an owner-approved navigation amendment recorded with draft implementation status. |
| [TABLE](../../../operations/docs/01-domain/TABLE_SESSION_SPEC.md) | Self-described authoritative session baseline | Read with accepted DEC-035; later closure/payment proposal is not an automatic requirement. |
| [TRACK](../../../operations/docs/02-technical/EVOLUTION_WHATSAPP_TRACKING.md) | Approved purpose; draft implementation/release record | Approved-purpose section requires verified received signed messages; header does not establish live provider/DB readiness. |

## Domain reference map

| Domain | Related references | Decision scope / constraint |
| --- | --- | --- |
| [announcements](DOMAIN_MAP.md#announcements) | [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md), [API](../../../operations/docs/02-technical/API_CONVENTIONS.md), [I18N](../../../operations/docs/01-domain/I18N_SPEC.md) | DEC-042 |
| [auth](DOMAIN_MAP.md#auth) | [AUTH](../../../operations/docs/02-technical/AUTH_TENANCY_SPEC.md), [API](../../../operations/docs/02-technical/API_CONVENTIONS.md) | DEC-003 |
| [branches](DOMAIN_MAP.md#branches) | [AUTH](../../../operations/docs/02-technical/AUTH_TENANCY_SPEC.md), [STAFF](../../../operations/docs/03-ui-ux/STAFF_DASHBOARD_UX_SPEC.md), [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md) | DEC-003, DEC-042 |
| [dashboard](DOMAIN_MAP.md#dashboard) | [STAFF](../../../operations/docs/03-ui-ux/STAFF_DASHBOARD_UX_SPEC.md), [ORDER](../../../operations/docs/01-domain/ORDER_LIFECYCLE_SPEC.md), [TABLE](../../../operations/docs/01-domain/TABLE_SESSION_SPEC.md) | DEC-035 |
| [delivery](DOMAIN_MAP.md#delivery) | [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md), [API](../../../operations/docs/02-technical/API_CONVENTIONS.md) | DEC-042 |
| [demos](DOMAIN_MAP.md#demos) | [DEMO](../../../operations/docs/01-domain/DEMO_RESTAURANTS_SPEC.md), [AUTH](../../../operations/docs/02-technical/AUTH_TENANCY_SPEC.md) | DEC-060, DEC-061 |
| [guest-menu](DOMAIN_MAP.md#guest-menu) | [MENU](../../../operations/docs/01-domain/MENU_SPEC.md), [GUEST](../../../operations/docs/03-ui-ux/GUEST_EXPERIENCE_SPEC.md), [QR](../../../operations/docs/01-domain/QR_SPEC.md), [ORDER](../../../operations/docs/01-domain/ORDER_LIFECYCLE_SPEC.md), [OFFERS](../../../operations/docs/01-domain/OFFERS_SPEC.md), [CHECKOUT](../../../operations/docs/03-ui-ux/GUEST_CHECKOUT_VALIDATION_IMPLEMENTATION.md), [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md) | DEC-038, DEC-041, DEC-042, DEC-044, DEC-066, DEC-068, DEC-069 |
| [kitchen](DOMAIN_MAP.md#kitchen) | [ORDER](../../../operations/docs/01-domain/ORDER_LIFECYCLE_SPEC.md), [STAFF](../../../operations/docs/03-ui-ux/STAFF_DASHBOARD_UX_SPEC.md), [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md) | DEC-009, DEC-054 |
| [marketing](DOMAIN_MAP.md#marketing) | [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md), [I18N](../../../operations/docs/01-domain/I18N_SPEC.md), [DESIGN](../../../operations/docs/03-ui-ux/DESIGN_SYSTEM.md) | DEC-053, DEC-055 |
| [menu](DOMAIN_MAP.md#menu) | [MENU](../../../operations/docs/01-domain/MENU_SPEC.md), [PROMO](../../../operations/docs/01-domain/PROMOTIONS_SPEC.md), [I18N](../../../operations/docs/01-domain/I18N_SPEC.md), [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md) | DEC-036, DEC-041 |
| [menu-import](DOMAIN_MAP.md#menu-import) | [IMPORT](../../../operations/docs/01-domain/MENU_IMPORT_SPEC.md), [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md), [API](../../../operations/docs/02-technical/API_CONVENTIONS.md) | DEC-039, DEC-040, DEC-057, DEC-058, DEC-059 |
| [offers](DOMAIN_MAP.md#offers) | [OFFERS](../../../operations/docs/01-domain/OFFERS_SPEC.md), [API](../../../operations/docs/02-technical/API_CONVENTIONS.md), [I18N](../../../operations/docs/01-domain/I18N_SPEC.md) | DEC-069 |
| [orders](DOMAIN_MAP.md#orders) | [ORDER](../../../operations/docs/01-domain/ORDER_LIFECYCLE_SPEC.md), [AUTH](../../../operations/docs/02-technical/AUTH_TENANCY_SPEC.md), [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md) | DEC-035, DEC-042 |
| [qr](DOMAIN_MAP.md#qr) | [QR](../../../operations/docs/01-domain/QR_SPEC.md), [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md), [DESIGN](../../../operations/docs/03-ui-ux/DESIGN_SYSTEM.md) | DEC-066, DEC-070 |
| [restaurant-setup](DOMAIN_MAP.md#restaurant-setup) | [SETUP-P](../../../operations/docs/03-ui-ux/RESTAURANT_SETUP_CHECKLIST_UX_SPEC.md), [SETUP-I](../../../operations/docs/03-ui-ux/RESTAURANT_SETUP_CHECKLIST_IMPLEMENTATION.md), [STAFF](../../../operations/docs/03-ui-ux/STAFF_DASHBOARD_UX_SPEC.md), [API](../../../operations/docs/02-technical/API_CONVENTIONS.md) | No independently verified approval for the proposal. |
| [settings](DOMAIN_MAP.md#settings) | [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md), [I18N](../../../operations/docs/01-domain/I18N_SPEC.md), [AUTH](../../../operations/docs/02-technical/AUTH_TENANCY_SPEC.md), [API](../../../operations/docs/02-technical/API_CONVENTIONS.md) | DEC-037, DEC-038, DEC-043, DEC-044 |
| [staff](DOMAIN_MAP.md#staff) | [AUTH](../../../operations/docs/02-technical/AUTH_TENANCY_SPEC.md), [STAFF](../../../operations/docs/03-ui-ux/STAFF_DASHBOARD_UX_SPEC.md), [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md) | DEC-003 |
| [subscription](DOMAIN_MAP.md#subscription) | [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md), [API](../../../operations/docs/02-technical/API_CONVENTIONS.md) | DEC-050, DEC-051, DEC-056 |
| [suggestions](DOMAIN_MAP.md#suggestions) | [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md), [MENU](../../../operations/docs/01-domain/MENU_SPEC.md), [API](../../../operations/docs/02-technical/API_CONVENTIONS.md) | DEC-042 |
| [table-sessions](DOMAIN_MAP.md#table-sessions) | [TABLE](../../../operations/docs/01-domain/TABLE_SESSION_SPEC.md), [ORDER](../../../operations/docs/01-domain/ORDER_LIFECYCLE_SPEC.md), [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md) | DEC-006, DEC-035 |
| [tables](DOMAIN_MAP.md#tables) | [TABLE](../../../operations/docs/01-domain/TABLE_SESSION_SPEC.md), [QR](../../../operations/docs/01-domain/QR_SPEC.md), [DEC](../../../operations/docs/00-product/PROJECT_DECISIONS.md) | DEC-005, DEC-035 |
| [whatsapp-tracking](DOMAIN_MAP.md#whatsapp-tracking) | [TRACK](../../../operations/docs/02-technical/EVOLUTION_WHATSAPP_TRACKING.md), [API](../../../operations/docs/02-technical/API_CONVENTIONS.md) | See approved purpose in TRACK; release readiness not established. |

## Conflicts and missing evidence

The standalone extraction decision supersedes the old monorepo/workspace locations in technical baselines and DEC-023; it does not change business authorization or pricing rules. Historical `apps/web` and `apps/platform` paths must be resolved to the current owners, not recreated as directories.

Multiple product decisions have proposal/implementation-only status. In particular DEC-062 and DEC-067 must not be flattened into a blanket statement that every shipped renderer has owner approval. Preserve current behavior for unrelated tasks and resolve the exact decision when changing it.

The restaurant-setup UX proposal explicitly records no approval, while its implementation record and current web source contain setup functionality. That is an unresolved documentary approval conflict, not authorization to delete working code or change operations records. See [the gap analysis](GOVERNANCE_AUDIT.md).

Future proposals under operations/docs/05-future-proposals and archived monorepo instructions are historical/planning context. Do not treat them as current feature requirements. No backend contract or operations document was changed in Phase 1.
