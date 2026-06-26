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

## Quick start

> Full setup instructions (single `docker compose up`) are added in a later phase.

1. Copy `.env.example` to `.env` and adjust if needed.
2. See `backend/` and `frontend/` for app-specific scripts.

## Documentation

- [`DECISIONS.md`](./DECISIONS.md) - assumptions and trade-offs for the brief's grey zones.
