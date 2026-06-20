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
  speed?: number;
  stamina?: number;
  power?: number;
  guts?: number;
  intelligence?: number;
  spurt?: number;
  flexibility?: number;
  health?: number;
  growth_type?: string;
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

## Database Migrations

```sql
ALTER TABLE race_entries
ADD COLUMN number_of_runners integer,
ADD COLUMN favorite_ranking integer,
ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
```

---

## Utilities (`src/utils/`)

### `finishTime.ts`
- `parseFinishTime(str)` — converts `"1:23.4"` → `83.4` (for DB insert)
- `formatFinishTime(num)` — converts `83.4` → `"1:23.4"` (for display)
- `validateFinishTime(str)` — returns error string or `null`

### `wakuban.ts`
- `WAKU_COLORS` — Record of frame numbers 1–8 with `bg`, `text`, `label`
- `getWakuban(gateNumber, numberOfRunners)` — derives 枠番 using the official JRA allocation table for 1–18 runners

---

## Pages Built

### `src/pages/Home.tsx` ✅
- Hero with Silkcrest branding
- 3 stat counters: total horses, total owners, total race results
- Recent Race Results table (last 10 by `created_at`) — horse name (linked), owner name, grade badge, race name, year, wakuban dot, finish position, finish time
- Owner Roster sidebar — owners sorted by horse count with badge
- **Pending fix:** owner roster left-side text alignment — add `min-w-0` to left div and `truncate` to both text lines
- **Pending improvement:** filter out 0-horse owners; homepage "Race Results Logged" counter uses 10-item limited query — replace with a proper `count` query

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
- Game Attributes grid (SP, ST, Power, Guts, Intelligence, Spurt, Flexibility, Health)
- Race Results ledger — finish time via `formatFinishTime()`
- 3-generation pedigree tree — sire=blue, dam=pink
- `PedigreeBox` takes `side: 'sire' | 'dam'` prop
- `StatItem` helper defined outside component
- **Pending:** update race results ledger to show `number_of_runners`, `odds`, `favorite_ranking`, and wakuban dot

### `src/pages/RaceDirectory.tsx` ✅ *(migrated this session)*
- shadcn `Table`, `Badge`, `Button`, `Select`
- Columns: 開催時期 (month/week), 格付け (grade badge), レース名 (JP + EN), 競馬場 (racecourse), コース (surface + distance)
- Grade badge colours: G1 blue, G2 red, G3 green, others outline
- Surface text colours: Turf green, Dirt amber
- Filter by grade (All / G1 / G2 / G3 / OP / Pre-Open / Maiden) and surface (All / Turf / Dirt)
- Pagination: 10 per page with Previous/Next and "X–Y of Z races" count
- Filter change resets page to 1 — done via `onValueChange` handler (not `useEffect`, to avoid cascading render lint error)
- Data ordered by `race_month` then `race_week` ascending

### `src/pages/AddResult.tsx` ✅
- shadcn `Card`, `Input`, `Label`, `Button`
- Combobox (custom, not shadcn Select) — real-time search by JP/EN name for horse and race selectors
- Live WakubanBadge next to Gate Number label — appears once gate + runners are filled
- Fields: `number_of_runners`, `odds`, `favorite_ranking`
- Finish time: text input with live format validation (`m:ss.f`)
- On submit: navigates to `/horses/:id` of selected horse

---

## What's Working (Pre-existing)
- Auth + `isAdmin` guard on navbar
- `AddOwner.tsx`, `AddRace.tsx` — functional but not yet migrated to shadcn
- RLS locked to `authenticated` + `auth.uid() = id` on `admin_profiles`

---

## Next Up
- Migrate `AddOwner.tsx` and `AddRace.tsx` to shadcn
- Update `HorseDetail.tsx` race results ledger: add `number_of_runners`, `odds`, `favorite_ranking`, wakuban dot
- Fix owner roster alignment in `Home.tsx` (`min-w-0` + `truncate`)
- Replace homepage race results count query with a proper Supabase `count` query
- Consider owner profile pages