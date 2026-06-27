# CRM Module Demo

A small CRM module for an internal sales team: manage **clients** (companies and individuals)
and track their **sales opportunities** through a pipeline, with quick detection of opportunities
that are **late or stagnant**, plus a **pipeline summary**.

## Stack

- **Backend:** NestJS + Prisma + PostgreSQL (TypeScript, strict)
- **Frontend:** Next.js (App Router) + React + TypeScript + Tailwind CSS
- **Infra:** Docker Compose (Postgres + backend + frontend)

## Project structure

```
.
├── backend/    # NestJS API (Prisma, PostgreSQL)
├── frontend/   # Next.js App Router app
├── docker-compose.yml
├── .env.example
├── README.md
└── DECISIONS.md
```

## Quick start (Docker - recommended)

Everything runs in containers. You only need Docker.

```bash
# 1. (optional) configure env - sensible defaults are baked in
cp .env.example .env

# 2. build and start the whole stack (Postgres + backend + frontend)
docker compose up --build
```

Services:

| Service  | URL                          |
| -------- | ---------------------------- |
| Frontend | http://localhost:3000        |
| Backend  | http://localhost:3001/api    |
| API docs | http://localhost:3001/api/docs |
| Postgres | localhost:5432               |
| Adminer  | http://localhost:81          |

The backend exposes interactive **Swagger / OpenAPI** docs at
`http://localhost:3001/api/docs` (raw spec at `/api/docs-json`).

Adminer (DB web UI) opens straight onto PostgreSQL with the login form
pre-filled from your `.env` (`POSTGRES_USER` / `POSTGRES_PASSWORD` /
`POSTGRES_DB`, defaults `crm` / `crm` / `crm`) - just click **Login**.

Source code is bind-mounted, so both apps hot-reload on file changes.

Stop with `docker compose down` (add `-v` to also drop the database volume).

> Database migrations (`prisma migrate deploy`) and **seeding** run automatically
> on backend startup. The seed is idempotent (it skips if data already exists)
> and includes healthy, **late**, **stagnant**, won and lost opportunities so
> every state is visible right away.

> **Windows/macOS note:** Docker bind-mount file events can be missed, so a
> brand-new file occasionally isn't picked up by hot-reload. If a newly added
> route 404s, `docker compose restart backend` (or `frontend`) forces a recompile.

## Authentication

The app is protected by JWT auth. A single admin user is seeded on startup:

| Email             | Password    |
| ----------------- | ----------- |
| `admin@crm.local` | `admin1234` |

Sign in at `http://localhost:3000/login`. Override the credentials/secret via
`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRES_IN` (see
`.env.example`). In Swagger, click **Authorize** and paste the token from
`POST /api/auth/login`.

## Features

- **Auth** — JWT login; every API route is protected and the frontend is gated
  behind a login page (seeded admin account, no public sign-up).
- **Clients** — manage companies and individuals (different required fields per
  type), with list/create/edit/delete.
- **Opportunities** — full CRUD with validation, list with **server-side
  filtering** (stage, client type, problematic) and **pagination**, a detail
  view with the linked client, and create/edit forms.
- **Problematic detection** — opportunities that are **late** or **stagnant** are
  highlighted in the list and explained on the detail view.
- **Pipeline summary** — KPIs (open / weighted / won / lost / problematic) plus a
  per-stage breakdown.
- **API docs** — interactive Swagger UI at `/api/docs`.

See [`DECISIONS.md`](./DECISIONS.md) for the reasoning behind the grey-zone calls.

## Local dev (without Docker, optional)

Requires Node.js 22 and a local PostgreSQL reachable via `DATABASE_URL`
(point it at `localhost`, not the `db` service name).

```bash
# backend
cd backend
npm install
npx prisma migrate deploy   # apply migrations
npx prisma db seed          # optional: load demo data
npm run start:dev

# frontend (in another terminal)
cd frontend && npm install && npm run dev
```

## Tests

The backend has **unit tests** (business logic, services, error mapping) and **e2e tests**
(HTTP status codes end-to-end against a real PostgreSQL database). The frontend has no
automated tests yet.

### Prerequisites

| Test type | Database required? |
| --------- | ------------------ |
| Unit      | No                 |
| E2E       | Yes — PostgreSQL reachable via `DATABASE_URL` |

With Docker running (`docker compose up`), point `DATABASE_URL` at the local Postgres
instance (see `.env.example`). E2E tests seed the admin user if needed and create their
own temporary records.

### Commands (backend)

Run these from the `backend/` directory:

```bash
# Unit tests (33 tests)
npm test

# Unit tests in watch mode
npm run test:watch

# Unit tests with coverage report (statements ~42 %)
npm run test:cov

# End-to-end tests — all HTTP status codes (26 tests)
npm run test:e2e
```

Coverage output is written to `backend/coverage/` (open `coverage/lcov-report/index.html`
in a browser for the detailed report).

Run everything in one go:

```bash
cd backend
npm test && npm run test:e2e
```

### What is covered

**Unit tests** (`src/**/*.spec.ts`):

| Area | Examples |
| ---- | -------- |
| Opportunity health | `OK`, `LATE`, `STAGNANT`, boundary days, terminal stages |
| Pipeline aggregation | open / weighted / won / lost / problematic KPIs |
| Services | `NotFoundException` (404), `BadRequestException` (400), `UnauthorizedException` (401) |
| Global error filter | Prisma P2025→404, P2002→409, P2003→400, unknown→500 |

**E2E tests** (`test/*.e2e-spec.ts`):

| Status | Scenarios |
| ------ | --------- |
| **200** | login, `/auth/me`, list & detail clients/opportunities, pipeline summary |
| **201** | create client, create opportunity |
| **204** | delete client, delete opportunity |
| **400** | validation errors, unknown fields, missing client for opportunity |
| **401** | missing/invalid JWT, wrong password |
| **404** | client or opportunity not found (GET / PATCH / DELETE) |

Status **409** (unique constraint) and **500** (unexpected error) are covered by the
`AllExceptionsFilter` unit tests — no API endpoint currently returns them in normal use.

> E2E tests boot the app with the same global config as production (`/api` prefix,
> `ValidationPipe`, `AllExceptionsFilter`) but are **not** included in the Jest coverage
> report from `npm run test:cov`.

## Documentation

- [`DECISIONS.md`](./DECISIONS.md) - assumptions and trade-offs for the brief's grey zones.
