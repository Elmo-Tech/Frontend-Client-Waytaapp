# Coolify deployment — web

This independent repository deploys **only the web frontend**, using its existing standalone Next.js Dockerfile. Public requests still enter the **existing gateway**, which keeps HTTPS routing, same-origin API calls and host-only session cookies. The API, database, uploads, gateway configuration and backend source are not created or modified by this Compose file.

## Topology and prerequisites

`Coolify proxy → existing gateway → waytaweb:3000`

The same gateway continues routing API traffic to the existing API. The Next server uses API_INTERNAL_URL for private server reads. No host port, database, volume, migration, second gateway, BFF or Next API proxy is added.

You need the exact existing public hostname, a private API origin and a Docker network shared by gateway and API on the same VPS. Compose joins this **external** network; it must already exist. Do not create an unrelated network with the same-looking name or assume separate Coolify resources share DNS automatically. Inspect the existing gateway/API network attachments and aliases on the VPS before selecting values. If the API is on another VPS, this configuration needs a separately designed reachable private connection; do not substitute localhost.

## Coolify configuration

Create a Git-based Docker Compose application from **this repository**:

| Setting | Value |
| --- | --- |
| Base Directory | `/` |
| Docker Compose Location | `/docker-compose.yaml` |
| Build context / Dockerfile / target | `.` / `Dockerfile` / `runtime` |
| Frontend service | `waytaweb` |
| Internal listening port | `3000` |
| Domain on this new frontend resource | **None** — keep the public domain on the existing gateway |
| Deployment mode | Normal Compose, not Raw |
| Public host-port mappings | None |

The existing gateway stays Coolify's public receiving service (its current internal port is 8080 in the operations template). Do not assign the same public hostname to this Next container as well: it would bypass the gateway's API/media/host-routing rules. Existing gateway domain/TLS settings remain the source of truth.

Set variables using [coolify.env.example](../coolify.env.example):

| Variable | Purpose |
| --- | --- |
| `WEB_HOST` | Required existing public hostname only; no scheme, path, slash or port. Compiles `https://${WEB_HOST}` as the browser API origin, matching the gateway's public domain |
| `WAYTA_GATEWAY_NETWORK` | Required exact existing Docker network shared by gateway and API |
| `API_INTERNAL_URL` | Required server-only bare API origin, e.g. `http://api:4000` only if that DNS name actually resolves to the API. No `/api/v1`, credentials or frontend origin |
| `WAYTA_WEB_ALIAS` | Gateway-facing DNS alias; defaults to `web` to match the current gateway's `web:3000` upstream. Must be unique among running containers on that network |
| `RESTAURANT_BASE_DOMAIN` | Optional existing bare restaurant base domain; supplied identically to browser build and server runtime. Preserve the current wildcard DNS/TLS and backend tenant configuration |

The browser API prefix is fixed to `/api/v1`, matching the existing gateway; Platform's code appends `/platform`. Public origins/base-domain values are build arguments, not secrets. Changing them requires a **rebuild**, not only a restart. Set the private API origin/network values in Coolify without placing secrets in public build arguments. Required variable expressions prevent an unset/empty host, API origin or network from silently deploying.

## Existing-gateway cutover

The checked-in operations gateway currently resolves `web:3000` and `platform:3001`. This Compose file supplies the corresponding configurable alias on the existing network. Docker DNS must resolve that alias to **one intended running frontend**, not both the old and new containers.

1. Prepare a candidate with a unique staging alias (for example `wayta-web-candidate` or `wayta-platform-candidate`) while the old frontend is running. Verify its container health, private API DNS/connectivity and direct internal route response. It has no public domain until gateway cutover.
2. Plan a coordinated cutover for each frontend. If the old frontend is still a service inside the original all-in-one Compose resource, remove/retire only that frontend service **and its gateway depends_on entry** when updating that resource; preserve gateway/API/migration/database services, volumes and all routes. This repository does not perform that operations change or stop any VPS container.
3. Release the old frontend alias before activating the replacement with alias `web` or `platform`, or explicitly repoint the existing gateway to a unique replacement alias. Never leave duplicate aliases and rely on DNS ordering. Account for a short interruption; zero downtime is not promised.
4. Preserve the existing public hostnames, QR links, wildcard hosts, legacy redirects, API/media/WebSocket routes, cookie/origin settings and API trust-proxy configuration. Verify the rendered gateway configuration and current DNS rather than replacing it with archived monorepo instructions.
5. Rollback must stop/remove the replacement alias before restoring the old frontend/alias. Restore the matching prior image and public build values. Do not remove the existing Coolify application, API/database resources or persisted volumes.

Do not enable automatic previews on this production network/alias/API setup. A preview requires isolated aliases, permitted public origins and a non-production API/environment; shared network naming is not isolation.

## Validation before release

With Docker available, from this repository root, use an example env file copied **outside the repository** and fill its real non-secret connection values:

```sh
docker compose --env-file /path/to/coolify.env -f docker-compose.yaml config --quiet
docker compose --env-file /path/to/coolify.env -f docker-compose.yaml build
```

The existing Dockerfile requires npm 11.12.1/Node 24 and runs the default Next production build; it does not skip errors or switch bundlers. A local example variable value does not verify the real network or API. Before public cutover, inspect startup/health logs and test login, expired/unavailable-session behavior and the affected guest/staff/console routes through the existing gateway. For Web, also check media, printed QR destinations, tenant hosts and WebSockets where in use. A `/login` health response verifies frontend HTTP availability, not authenticated backend/database correctness.

No Docker CLI/Compose or container runtime was available in the implementation environment. YAML/static wiring and scope checks were performed; image build, actual Docker health/network/DNS, gateway cutover, authentication/CORS and VPS deployment remain **not verified**. The earlier native Web build interruption is historical and is not resolved or converted to a pass here.

## References

- [Repository README](../README.md) and [architecture](ARCHITECTURE.md).
- [Standalone repository decision](../../operations/docs/02-technical/STANDALONE_REPOSITORIES.md): independence and preserved same-origin gateway topology; sibling checkout required for this reference.
- [Coolify Compose](https://coolify.io/docs/applications/builds/docker-compose): resource setup, variables, networking and health checks.
- [Coolify domain settings](https://coolify.io/docs/applications/configuration/general): receiving service/internal ports.
- [Coolify previews](https://coolify.io/docs/applications/deployments/preview-deployments): shared-network naming and environment separation.
