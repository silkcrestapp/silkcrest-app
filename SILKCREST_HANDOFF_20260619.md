# Silkcrest — Session Handoff

## Project Overview
Personal horse racing web app inspired by netkeiba, built around data from **Winning Post 10 2026** (Nintendo Switch). Friends are in-game horse owners; the site makes them feel like real racehorse owners.

---

## Stack
- **Frontend:** React + TypeScript, deployed to Vercel
- **Backend:** Supabase (PostgreSQL) with RLS enabled
- **Hosting:** Render (API if needed)
- **Repo:** single monorepo — `/frontend`, `/backend`, `/database`
- **Domain:** silkcrest.app (pending)
- **UI:** shadcn/ui + Tailwind CSS v4

---

## Key Conventions
- IDs are UUIDs — never wrap in `Number()`
- Use `??` not `||` for null coalescing
- No `any` types — all Supabase joins use extended interfaces (e.g. `RaceEntryWithRace extends RaceEntry`)
- Types defined outside components, not inside
- Supabase joined queries use nested select: `select('*, races(*)')`
- Supabase client imported as `import { supabase } from '../utils/supabaseClient'`

---

## shadcn/ui Setup Notes
- Installed with `npx shadcn@4.10.0 init` (pin to this version — latest CLI has a monorepo bug)
- Component library: **Radix**, Preset: **Nova**
- Tailwind v4 — no `tailwind.config.js`, configured via Vite plugin
- `tsconfig.app.json` requires two changes:
  ```jsonc
  "paths": { "@/*": ["./src/*"] }
  // and
  "include": ["src", "@"]
  ```
- `src/index.css` contains only: `@import "tailwindcss";`

---

## Current Types (`src/types/database.ts`)

```typescript
export interface Owner {
  id: string;
  display_name: string;
  display_name_jp?: string;
  silks_color?: string;
  silks_pattern?: string;
}

export interface Horse {
  id: string;
  name?: string;
  name_jp?: string;
  owner_id?: string;
  sire_id?: string;
  dam_id?: string;
  gender?: 'Male' | 'Female' | 'Gelding';
  birth_year: number;
  coat_color?: string;
  bloodline_type?: string;
  growth_type?: string;
  // Stat columns — smallint rank 1–15, or null if unknown
  speed?:        number | null;
  grit?:         number | null;
  power?:        number | null;
  guts?:         number | null;
  intelligence?: number | null;
  spurt?:        number | null;
  flexibility?:  number | null;
  health?:       number | null;
}

export interface HorseWithOwner extends Horse {
  owners: Owner | null;
}

export interface Race {
  id: string;
  name: string;
  name_jp?: string;
  grade?: 'G1' | 'G2' | 'G3' | 'OP' | 'Pre-Open' | 'Maiden';
  surface?: 'Turf' | 'Dirt';
  distance: number;
  racecourse: string;
  racecourse_jp?: string;
  race_month?: number;
  race_week?: 'Week 1' | 'Week 2' | 'Week 3' | 'Week 4' | 'Week 5';
}

export interface RaceEntry {
  id: string;
  race_id: string;
  horse_id: string;
  race_year: number;
  finish_position?: number;
  finish_time?: number;       // float8 stored as seconds, e.g. 83.4
  gate_number?: number;
  number_of_runners?: number;
  jockey?: string;
  odds?: number;
  favorite_ranking?: number;  // 人気
  created_at?: string;        // timestamptz as ISO string
}

export interface RaceEntryWithRace extends RaceEntry {
  races: Race;
}
```

---

## Database Migrations (applied)

```sql
-- Added columns to race_entries
ALTER TABLE race_entries
  ADD COLUMN number_of_runners integer,
  ADD COLUMN favorite_ranking integer,
  ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();

-- Stats revamp: remapped old numeric values to rank integers (1–15),
-- changed columns to smallint, dropped NOT NULL, added check constraints
-- (see migration_stats_revamp.sql for full script)

-- Renamed stamina → grit
ALTER TABLE horses RENAME COLUMN stamina TO grit;
```

---

## Stat Grade System (`src/utils/gradeUtils.ts`)

Horse stats are stored as **rank integers (1–15)** in the DB. The UI converts them to letter grades for display.

### Grade scale
| Rank | Grade | Rank | Grade |
|------|-------|------|-------|
| 15   | S+    | 7    | D+    |
| 14   | S     | 6    | D     |
| 13   | A+    | 5    | E+    |
| 12   | A     | 4    | E     |
| 11   | B+    | 3    | F+    |
| 10   | B     | 2    | F     |
| 9    | C+    | 1    | G     |
| 8    | C     |      |       |

- `null` in the DB = unknown stat → displays as `???`
- All 8 stat columns allow NULL — none are required on registration

### Key exports
- `rankToGrade(rank)` — rank integer or null → grade string or `'???'`
- `gradeToRank(grade)` — grade string → rank integer
- `gradeColorClass(grade)` — Tailwind text-color class
- `gradeColorHex(grade)` — hex color for SVG/canvas use
- `radarValue(rank, lowestKnownRank)` — plot value for radar chart; unknown stats render at floor (lowestKnown - 1, min 1)
- `lowestKnownRank(ranks)` — finds the lowest non-null rank in an array

---

## The 8 Stats (clockwise radar order)

| Key           | JP       | EN            |
|---------------|----------|---------------|
| `speed`       | スピード  | Speed         |
| `guts`        | 勝負根性 | Guts          |
| `power`       | パワー    | Power         |
| `health`      | 健康      | Health        |
| `intelligence`| 賢さ      | Intelligence  |
| `grit`        | 精神力    | Grit          |
| `flexibility` | 柔軟性    | Flexibility   |
| `spurt`       | 瞬発力    | Spurt         |

---

## Utilities (`src/utils/`)

### `finishTime.ts`
- `parseFinishTime(str)` — converts `"1:23.4"` → `83.4` (for DB insert)
- `formatFinishTime(num)` — converts `83.4` → `"1:23.4"` (for display)
- `validateFinishTime(str)` — returns error string or `null`

### `wakuban.ts`
- `WAKU_COLORS` — Record of frame numbers 1–8 with `bg`, `text`, `label`
- `getWakuban(gateNumber, numberOfRunners)` — derives 枠番 using the official JRA allocation table for 1–18 runners

### `gradeUtils.ts`
- See Stat Grade System section above

---

## Pages Built

### `src/pages/Home.tsx` ✅
- Hero with Silkcrest branding
- 3 stat counters: total horses, total owners, total race results
- Recent Race Results table (last 10 by `created_at`) — horse name (linked), owner name, grade badge, race name, year, wakuban dot, finish position, finish time
- Owner Roster sidebar — owners sorted by horse count with badge
- **Pending fix:** owner roster left-side text alignment — add `min-w-0` to left div and `truncate` to both text lines
- **Pending fix:** filter out 0-horse owners
- **Pending fix:** homepage "Race Results Logged" counter uses 10-item limited query — replace with a proper Supabase `count` query

### `src/pages/HorseDirectory.tsx` ✅
- shadcn `Table`, `Input`, `Badge`, `Button`
- Columns: Horse Name, Owner, Sex (牡/牝/騸), Birth Year, Sire, SP, ST, Growth Type
- Client-side sort on: Name, Birth Year, Speed, Stamina, Growth Type
- Client-side search: matches JP and EN name + owner name
- Pagination: 20 per page with Previous/Next
- Sire resolved from already-fetched list (no extra query)
- Uses `HorseWithOwner` extended interface

### `src/pages/HorseDetail.tsx` ✅
- shadcn `Card`, `Table`, `Badge`
- Header: JP name, EN name, birth year, gender
- `HorseStatsPanel` component — SVG radar chart + letter-grade grid side by side
- Race results ledger — netkeiba column order: 年 · 競馬場 · レース名 · 距離 · 枠番 · オッズ · 人気 · 着順 · タイム
  - Grade badge inline with race name (G1 blue, G2 red, G3 green)
  - Surface (芝/ダート) shown below racecourse in green/amber
  - Wakuban coloured circle via `getWakuban` + `WAKU_COLORS`
  - 着順 formatted as `3着`, 人気 as `3番人気`
  - Odds displayed as plain number
- 3-generation pedigree tree — sire=blue, dam=pink
- `PedigreeBox` takes `side: 'sire' | 'dam'` prop

### `src/pages/RaceDirectory.tsx` ✅
- shadcn `Table`, `Badge`, `Button`, `Select`
- Columns: 開催時期 (month/week), 格付け (grade badge), レース名 (JP + EN), 競馬場, コース (surface + distance)
- Filter by grade and surface; pagination 10 per page
- Data ordered by `race_month` then `race_week` ascending

### `src/pages/AddResult.tsx` ✅
- Custom combobox for horse and race selectors (real-time JP/EN search)
- Live WakubanBadge next to Gate Number label
- Fields: `number_of_runners`, `odds`, `favorite_ranking`
- Finish time text input with live format validation (`m:ss.f`)
- On submit: navigates to `/horses/:id` of selected horse

### `src/pages/AddHorse.tsx` ✅
- shadcn `Card`, `Input`, `Label`, `Button`, `Select`
- Basic info: JP/EN name, birth year, gender, owner, sire, dam, growth type, coat color, bloodline type
- Stats section: grade selector button group (S+ → G) for all 8 stats
- All stats optional — default is `null` (displays as `???`)
- Clicking the selected grade again clears it back to unknown
- On submit: converts grade → rank integer before inserting to DB
- Navigates to `/horses/:id` on success

### `src/components/HorseStatsPanel.tsx` ✅
- Pure SVG radar chart — no Chart.js dependency (avoided due to canvas sizing issues in card layouts)
- Grade grid alongside radar, 2×4 layout
- Unknown stats (`null`) render as `???` in muted color; plotted at floor on radar
- Clockwise stat order matches in-game display

---

## What's Working (Pre-existing)
- Auth + `isAdmin` guard on navbar
- `AddOwner.tsx`, `AddRace.tsx` — functional, migrated to shadcn
- RLS locked to `authenticated` + `auth.uid() = id` on `admin_profiles`

---

## Open Tickets

- **Radar chart:** replace SVG implementation with a proper shadcn-compatible chart component
- **Home — owner roster:** add `min-w-0` to left div and `truncate` to both text lines; filter out 0-horse owners
- **Home — race count:** replace 10-item limited query with a proper Supabase `count` query
- **Owner profile pages:** not yet started