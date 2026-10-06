# Silkcrest

A personal horse racing site inspired by netkeiba, built around Winning Post 10 2026 data. Friends are the in-game owners, and everyone can browse horses, races, results, and owner silks.

This is a ground-up rewrite. The previous React/Express version lives in [`silkcrest-app-legacy`](https://github.com/silkcrestapp/silkcrest-app-legacy) (archived).

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | Angular + Angular Material, SSR for public pages |
| Backend | Django + Django REST Framework |
| Database | PostgreSQL (Supabase in production) |
| Auth | django-allauth, cookie sessions |
| API types | OpenAPI schema (drf-spectacular), TypeScript types generated from it |

## Repository layout

```text
.
├── backend/    Django project (apps: accounts, silks, racing)
├── frontend/   Angular app
└── docs/       Design notes and the decision log
```

## Documentation

The reasoning behind the architecture is in [`docs/silkcrest-decisions.md`](docs/silkcrest-decisions.md). Read it before changing the data model, auth flow, or deployment setup.

## Getting started

### Backend

Setup instructions will be added here once the backend skeleton is in place.

### Frontend

Not started yet.

## Status

Early development. The backend is being built first, starting with the custom user model and the `accounts` app.