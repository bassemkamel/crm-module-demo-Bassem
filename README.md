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

## Features

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

# backend unit tests
cd backend && npm test
```

## Documentation

- [`DECISIONS.md`](./DECISIONS.md) - assumptions and trade-offs for the brief's grey zones.
