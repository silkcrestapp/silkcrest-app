# Silkcrest Rewrite: Decision Log

Ground-up rewrite. Nothing is migrated from the old React/Express version, and data is re-entered from scratch. Decisions were made in October 2026.

**Project:** personal horse racing site inspired by netkeiba, built around Winning Post 10 2026 data. Friends are in-game owners.

## Stack

| Layer | Choice |
|---|---|
| Frontend | Angular (not AngularJS) + Angular Material, server-side rendering (SSR) for public pages |
| Backend | Django + Django REST Framework (DRF) |
| Database | Supabase as plain Postgres only (no Supabase client, RLS, or Auth) |
| Auth | Django + django-allauth, cookie sessions |
| Repo | One monorepo: `/backend`, `/frontend`, `/docs` |
| Hosting | Angular on Vercel Hobby, Django on Render free, Supabase free. Zero spend |
| API types | OpenAPI schema (drf-spectacular), TypeScript types generated from it; CI fails if the committed schema is stale |

## Django project layout (split by domain)

Dependency rule: other apps may depend on `accounts`, never the reverse.

- **accounts:** custom user model, owner profile, invites
- **silks:** pattern and palette master tables, owner silk design, SVG/PNG generation (depends on accounts)
- **racing:** saves, horses, races, runnings, entries, stat grades, other vocabularies (depends on accounts and silks)

## Auth and users

- Custom user model from day one, **email** as the unique identifier.
- **Admin** = Django's staff flag. **Owner** = optional profile linked to a user. An owner can exist without a login.
- Admins use email and password. Owners sign in with Google OAuth.
- **Invites:** single-use. Completing one creates the user and the owner profile together. The invite is marked used in the same all-or-nothing transaction, and the "mark used" check is the gatekeeper against race conditions. Invites don't reference a save. The invite token is held in the server-side session across the Google redirect.
- Owners are always public (display name and silks visible to anyone).

## Permissions

- **Public read** on the site, **admin-only write** for horses, races, runnings, results, and master tables.
- **Owners** can: manage their own name list (per save) and edit their own profile (silks).
- Default DRF permission: anyone reads, admin writes. Owner-writable areas override it with object-level checks.
- Use separate public serializers. Never expose emails, invites, accounts, or unpublished name suggestions.
- Throttle anonymous traffic. Note: the SSR server makes API calls from one IP, so it needs a shared-secret header or forwarded visitor IP so it isn't throttled as one visitor.
- Admin UI is built in Angular (not the Django admin). Django admin can stay installed but unexposed as an emergency back door.

## Data model

**Saves**
- Everything racing-related is scoped to a **save**. Exactly one save is **active** (enforce with a DB constraint). Past saves stay viewable.
- Each save stores its **current in-game year** only (no month or week). Horse age = save year minus birth year (confirm the game's age-counting rule and apply it in one place).
- List endpoints default to the active save and accept an optional override. Detail pages work by ID regardless of save.
- **Owners are global.** Every owner takes part in every save, with no membership table.

**Names**
- Each owner has a **name list per save**.
- Admin applies a suggestion to a horse by **copying the text onto the horse**, and the suggestion becomes **locked** (read-only for the owner).
- Horses always carry their own name fields (ancestors and non-suggested horses are fine).

**Horses**
- One horse table scoped to a save. Owner is optional. Sire and dam point to other horses. Unowned horses and ancestors are ordinary rows.
- **Stats:** a single current set on the horse. Stored as a rank number (1 to 15) that references a **grade master table** keyed by the rank itself (letter labels, G to S+). Seed the 15 rows.

**Races**
- **Race:** global reference data (name, grade, surface, distance, course, month, week).
- **Race running:** one per race, save, and year. Holds facts about the event (number of runners as a plain number). Unique on (race, save, year).
- **Race entry:** one per horse in a running (finish, odds, gate, jockey, and so on). Unique on (running, horse).
- Entries exist **only for friends' horses**, not the full field.

**Bilingual names:** paired fields (English and Japanese) on each model. Pick one display fallback rule and apply it everywhere.

**Vocabularies:** master tables for all fixed vocabularies (race grade, surface, gender, racecourse, coat color, bloodline type, growth type). They share one abstract shape: code, English name, Japanese name, display order. Choose fixtures or data migrations for seed data and use one approach everywhere.

## Silks (JRA-style)

- Structured per part (jacket, sleeves, cap): base color, pattern, pattern color.
- Colors come from a **palette master table** (name in both languages, hex). Patterns come from a **pattern master table** storing an **SVG fragment** plus which part it belongs to. Fragments use fixed color slots (base, pattern).
- The **backend generates the image** and serves it at a URL (SVG, plus PNG for link previews because preview crawlers generally don't render SVG).
- Silks belong to the owner, not to a save.
- Serve SVG as an image, not a document, and don't cache to local disk on Render (ephemeral filesystem).

## Deployment

- Two deployments: Angular SSR on **Vercel Hobby** (personal, non-commercial use only) and Django on **Render free**. GitHub Pages was ruled out because it can't do SSR.
- Authenticated pages are rendered in the browser only. SSR covers public pages.
- Use Supabase's **direct or session-mode** connection string for Django, not the transaction pooler.
- Set each host's root directory to its own folder (`/frontend`, `/backend`).
- **No domain planned.** Intended approach: Vercel forwards `/api` to Django so the browser sees a single origin and cookie sessions work. **Untested. Verify against Vercel's rewrite docs.** Fallback: token-based auth (would reopen the session decision).

## Known caveats (free tiers, checked October 2026)

- Render free services sleep after 15 minutes idle (about a minute to wake) and share 750 instance hours a month.
- Supabase free projects pause after 7 days without a database request and need manual reactivation. Use a scheduled pinger. A free-tier change affecting existing projects from Oct 30, 2026 was mentioned but unverified. Check supabase.com/pricing.
- Cloudflare Workers free (10 ms CPU per request) is probably too tight for Angular SSR. Unverified.

## Not yet decided (decide while building)

- Angular internals: folder structure, state handling, routing, Material theming
- Angular SSR specifics on Vercel
- Whether the Angular UI itself is bilingual
- Fixtures vs data migrations for seed data
- Silk preview in the owner editor (calls the backend image endpoint)
- Bulk race registration for the minor race grades (carried over from the old backlog, optional)
