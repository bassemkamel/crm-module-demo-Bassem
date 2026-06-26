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
| Backend  | http://localhost:3001        |
| Postgres | localhost:5432               |
| Adminer  | http://localhost:81          |

Adminer (DB web UI) opens straight onto PostgreSQL with the login form
pre-filled from your `.env` (`POSTGRES_USER` / `POSTGRES_PASSWORD` /
`POSTGRES_DB`, defaults `crm` / `crm` / `crm`) - just click **Login**.

Source code is bind-mounted, so both apps hot-reload on file changes.

Stop with `docker compose down` (add `-v` to also drop the database volume).

> Database migrations and seeding run automatically on backend startup
> (wired in once Prisma is added).

## Local dev (without Docker, optional)

Requires Node.js 22 and a local PostgreSQL reachable via `DATABASE_URL`.

```bash
# backend
cd backend && npm install && npm run start:dev

# frontend (in another terminal)
cd frontend && npm install && npm run dev
```

## Documentation

- [`DECISIONS.md`](./DECISIONS.md) - assumptions and trade-offs for the brief's grey zones.
