# 🏇 Silkcrest

> A personal horse racing companion app inspired by [netkeiba](https://www.netkeiba.com/), built around data from **Winning Post 10 2026** (Nintendo Switch). Silkcrest makes your friends feel like real racehorse owners.

---

## What Is This?

Silkcrest is a private web app for a friend group who play Winning Post 10 2026 together. Each friend is an in-game horse owner (an *"Owner"*), and Silkcrest gives them a real home on the web — their horses, their race records, pedigree trees, and results, all presented in the style of a professional racing platform.

Think of it as the fan site your stable deserves.

---

## Features

- 🔐 **Auth & admin guard** — Supabase Auth with role-based access; admin-only actions locked behind `isAdmin` checks
- 👤 **Owner profiles** — each friend has their own owner page with their stable of horses
- 🐴 **Horse detail pages** — 3-generation pedigree tree, full race results ledger
- 🏁 **Race management** — add races, record entries, log results
- 📊 **Results ledger** — sortable, per-horse race history with finishing positions and race metadata
- 🛡️ **RLS on all tables** — Supabase Row Level Security enforced throughout

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript, deployed to **Vercel** |
| Backend | Supabase (PostgreSQL) with RLS enabled |
| API (if needed) | Render |
| Database migrations | SQL files in `/database` |
| Language split | TypeScript 88%, CSS 8%, Python 3% |

---

## Monorepo Structure

```
silkcrest-app/
├── frontend/          # React + TypeScript app
│   └── src/
│       ├── components/
│       │   ├── AddOwner.tsx
│       │   ├── AddRace.tsx
│       │   ├── AddResult.tsx
│       │   └── HorseDetail.tsx
│       └── types/
│           └── database.ts   # All shared types live here
├── backend/           # API layer (Render)
├── database/          # SQL migrations & schema
└── README.md
```

---

## Data Model (Core Types)

All types are defined in `frontend/src/types/database.ts`. Supabase join results use **extended interfaces** — never inline types.

```
Owner
Horse
Race
RaceEntry
RaceEntryWithRace   // extends RaceEntry with nested races(*)
```

> **Convention:** IDs are UUIDs throughout. Never wrap in `Number()`. Use `??` over `||` for null coalescing. No `any` types.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (get your `SUPABASE_URL` and `SUPABASE_ANON_KEY`)

### 1. Clone the repo

```bash
git clone https://github.com/silkcrestapp/silkcrest-app.git
cd silkcrest-app
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

### 3. Set up environment variables

Create `frontend/.env.local`:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run the database migrations

Apply the SQL files in `/database` to your Supabase project via the Supabase dashboard or CLI.

### 5. Start the dev server

```bash
npm run dev
```

---

## Deployment

| Target | Service |
|---|---|
| Frontend | Vercel (auto-deploy from `main`) |
| API | Render |
| Database | Supabase |
| Domain | silkcrest.app *(pending)* |

---

## Contributing

This is a private project for a specific friend group, so the repo is public for reference but not open for external contributions. Feel free to fork it as a template for your own Winning Post fan site though.

---

## Data Source

All race data is manually entered from playthroughs of **Winning Post 10 2026** on Nintendo Switch. This app has no affiliation with Koei Tecmo or the Winning Post franchise.

---

*Built with love for a stable that deserves its own website.*
