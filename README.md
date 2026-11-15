# Wayta web

Standalone Next.js application, extracted from Restaurant QR Platform on 2026-11-12.
Node >=24 <25; npm 11.12.1. This repository installs and builds independently.

## Development (PowerShell)

```powershell
Copy-Item .env.example .env
npm ci
npm run dev
```

Default port: 3000. Start the API separately for frontend data and authentication.

Set NEXT_PUBLIC_API_URL and NEXT_PUBLIC_API_BASE_PATH before building. Keep secrets out of NEXT_PUBLIC_*.
In production, the browser API origin must match this frontend's public origin via Nginx; API_INTERNAL_URL is server-only.
For standalone output set NEXT_OUTPUT=standalone before npm run build; the Dockerfile handles this automatically.

## Validation

```powershell
npm run typecheck
npm test
npm run lint
npm run build
```

Build a container from this repository root using Dockerfile. The API also exposes a tools build target for migrations/provisioning.
Original product specifications, shared Compose/Nginx/n8n configuration and cross-repository tests live in wayta-operations
(locally ../operations). Application builds and unit tests do not require that sibling checkout.
The original monorepo and its Git history are unchanged. Git initialization happened at extraction; inspect current Git history and remotes for the present repository state.

## Architecture and additional checks

See [architecture](docs/ARCHITECTURE.md) and [refactor validation](docs/REFACTOR_VALIDATION.md).

```powershell
npm run check:architecture
npm audit
npm audit --omit=dev
```

Cross-repository source contracts run with `npm test` in `../operations`; standalone web tests and builds require no sibling repositories.

## AI-assisted development

Start with [AI.md](AI.md) and [AGENTS.md](AGENTS.md). The [AI workflow](docs/ai/WORKFLOW.md), [domain rules](docs/ai/DOMAIN_RULES.md), [spec map](docs/ai/SPEC_MAP.md), [change-spec template](docs/ai/CHANGE_SPEC_TEMPLATE.md) and [validation guide](docs/ai/VALIDATION.md) apply to AI-assisted changes. Claude, Copilot and Cursor entry files route to the same guidance; other tools can be given AI.md explicitly.
