# Standalone Wayta repository

This repository was extracted at the user's explicit request on 2026-11-12.
Use npm and Node >=24 <25. This repository is NOT an npm workspace.
All app files, package.json, package-lock.json, and .env belong at this repository root.
Do not add dependencies on sibling source repositories for build or runtime.
The backend remains authoritative for authorization, tenant scope, pricing, and business state.
Preserve the existing product behavior. Never commit or push without explicit instructions.
Run relevant tests, typecheck, lint and build for changes.
The complete original specifications and agent rules are archived in the operations repository.
Read the relevant approved specs before feature changes. Legacy monorepo paths in those specs
are historical; the current extraction decision and README define repository layout and setup.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Modular architecture

Read `docs/ARCHITECTURE.md` before structural changes. Keep app routes thin, business code in modules, and shared infrastructure independent of modules. Import other modules only through focused root public entry points. Run `npm run check:architecture` in addition to existing validation. Preserve current routes, API contracts, UI, auth and locale behavior.
