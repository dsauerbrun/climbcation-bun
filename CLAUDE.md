# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (auto-reload via nodemon)
npm start

# Production
npm run start:prod        # builds then runs

# Build only
npm run build             # rm -rf dist/* && tsc

# Database migrations
npm run migrate:up
npm run migrate:down

# Regenerate TypeScript types from DB schema
npm run codegen           # requires DATABASE_URL to be set
```

No test suite is configured (`npm test` exits with error).

## Environment Setup

Required environment variables:
- `DATABASE_URL` — PostgreSQL connection string
- `COOKIE_SECRET` — session secret
- `CLIMBCATION_PORT` — optional, defaults to `8080`

SSL certs (`key.pem`, `cert.pem`) must exist in the project root. Generate with:
```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -sha256 -days 365 -nodes
```

## Architecture

**Stack:** Express.js + TypeScript, PostgreSQL via Kysely (SQL query builder, not ORM), Passport.js sessions stored in PostgreSQL.

The server runs HTTPS only (see `src/index.ts`). There's a commented-out HTTP fallback.

**Request flow:**
```
HTTPS → bodyParser → express-session (pg store) → passport.authenticate('session') → route middlewares → controller → service → Kysely → PostgreSQL
```

**Layers:**
- `src/controllers/` — define `ControllerEndpoint[]` arrays (routePath, method, middlewares, executionFunction). All controllers are aggregated in `src/routes/index.ts`, which checks for duplicate routes and wraps each handler with timing/error logic via `routeWrapper`.
- `src/services/` — business logic, organized as `user.service/`, `location.service/`, etc. Services return `{ data?, error? }` objects rather than throwing.
- `src/lib/middlewares/` — `rateLimiter` (NodeCache, 10 req/sec per userId), `authenticate` (Passport local strategy), `isAuthenticated` (session guard), `queryParamJson` (parse JSON query params).
- `src/db/` — Kysely instance in `db.ts` with `CamelCasePlugin` (snake_case DB ↔ camelCase JS) and `DeduplicateJoinsPlugin`. Migrations in `src/db/migrations/` with timestamp filenames, each exporting `up()` and `down()`.

**Key types** (`src/lib/models.ts`):
- `ControllerEndpoint` — shape of each route definition
- `ServiceResponseError` — base for service responses (`{ error?: string }`)
- `TypedRequestBody<T>`, `TypedRequestQuery<T>`, `TypedResponse<T>` — typed Express wrappers

**Authentication:**
- Local strategy (username/password) is active; Google OAuth is fully implemented but commented out in `user.controller.ts`.
- Passport serializes `{ userId, username, email, verified }` to the session. `req.user` is this object (type `SessionUser`), not the full DB record.
- Session table is managed by `connect-pg-simple` via the sessions migration.

**Kysely codegen:** Run `npm run codegen` after schema changes to regenerate types. The `CamelCasePlugin` means DB column `user_id` maps to `userId` in queries.
