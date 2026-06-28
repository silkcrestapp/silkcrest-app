-- =============================================================
-- Silkcrest — Owner auth + pending horse names + invite system
-- Run this in the Supabase SQL editor
-- =============================================================


-- -------------------------------------------------------------
-- 1. owners table — new columns
-- -------------------------------------------------------------

ALTER TABLE owners
  ADD COLUMN auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN email        text UNIQUE;

-- auth_user_id: nullable — existing owners without accounts stay valid
-- email: stored from Google OAuth at registration time; unique across owners

CREATE INDEX idx_owners_auth_user_id ON owners(auth_user_id);


-- -------------------------------------------------------------
-- 2. owner_invites table
-- -------------------------------------------------------------

CREATE TABLE owner_invites (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  save_id     uuid        NOT NULL REFERENCES save_files(id) ON DELETE CASCADE,
  created_by  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_at     timestamptz,                          -- NULL = not yet used
  expires_at  timestamptz NOT NULL DEFAULT now() + interval '7 days'
);

-- Fast lookup for token validation
CREATE INDEX idx_owner_invites_expires ON owner_invites(expires_at);

-- RLS: only admins can create/read invites; validation endpoint uses service role
ALTER TABLE owner_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on invites"
  ON owner_invites
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );


-- -------------------------------------------------------------
-- 3. pending_horse_names table
-- -------------------------------------------------------------

CREATE TABLE pending_horse_names (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid        NOT NULL REFERENCES owners(id)      ON DELETE CASCADE,
  save_id     uuid        NOT NULL REFERENCES save_files(id)  ON DELETE CASCADE,
  name        text        NOT NULL,
  name_jp     text,
  sort_order  integer,            -- NULL when locked (horse assigned)
  horse_id    uuid        REFERENCES horses(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Fast lookups by owner+save (the primary query pattern)
CREATE INDEX idx_phn_owner_save ON pending_horse_names(owner_id, save_id);

-- Enforce unique name per owner per save (case-insensitive)
CREATE UNIQUE INDEX idx_phn_unique_name
  ON pending_horse_names(owner_id, save_id, lower(name));

-- When horse_id is set, sort_order must be NULL
ALTER TABLE pending_horse_names
  ADD CONSTRAINT chk_locked_no_sort
  CHECK (
    (horse_id IS NULL)
    OR (horse_id IS NOT NULL AND sort_order IS NULL)
  );


-- -------------------------------------------------------------
-- 4. Helper function — resolve auth.uid() → owner row id
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION auth_owner_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM owners WHERE auth_user_id = auth.uid() LIMIT 1;
$$;


-- -------------------------------------------------------------
-- 5. RLS — pending_horse_names
-- -------------------------------------------------------------

ALTER TABLE pending_horse_names ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read own names"
  ON pending_horse_names FOR SELECT
  USING (
    owner_id = auth_owner_id()
    OR EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Owners insert own names"
  ON pending_horse_names FOR INSERT
  WITH CHECK (owner_id = auth_owner_id());

-- Owners can only edit unlocked rows; cannot set horse_id themselves
CREATE POLICY "Owners update unlocked names"
  ON pending_horse_names FOR UPDATE
  USING (
    owner_id = auth_owner_id()
    AND horse_id IS NULL
  )
  WITH CHECK (
    owner_id = auth_owner_id()
    AND horse_id IS NULL
  );

CREATE POLICY "Owners delete unlocked names"
  ON pending_horse_names FOR DELETE
  USING (
    owner_id = auth_owner_id()
    AND horse_id IS NULL
  );

-- Admins can do everything including setting horse_id (locking a name)
CREATE POLICY "Admins full access on names"
  ON pending_horse_names FOR ALL
  USING (
    EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );


-- -------------------------------------------------------------
-- 6. RLS — owners table
-- -------------------------------------------------------------

-- If owners table does not yet have RLS enabled, uncomment:
-- ALTER TABLE owners ENABLE ROW LEVEL SECURITY;

-- Owners can read their own row (needed for useOwnerProfile hook)
CREATE POLICY "Owners read own row"
  ON owners FOR SELECT
  USING (
    auth_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );

-- Registration endpoint (service role) handles INSERT — no anon insert policy needed.
-- Admins can update any owner row.
CREATE POLICY "Admins full access on owners"
  ON owners FOR ALL
  USING (
    EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );


-- -------------------------------------------------------------
-- 7. Trigger — auto-null sort_order when horse_id is set
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION clear_sort_order_on_lock()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.horse_id IS NOT NULL AND OLD.horse_id IS NULL THEN
    NEW.sort_order := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_clear_sort_order
  BEFORE UPDATE ON pending_horse_names
  FOR EACH ROW
  EXECUTE FUNCTION clear_sort_order_on_lock();


-- -------------------------------------------------------------
-- Done.
--
-- Backend endpoints to build next (Render API):
--   POST /invites          — admin: generate invite token
--   GET  /invites/:token   — public: validate token
--   POST /register         — public: Google OAuth + owner details → create owner
--
-- Frontend routes to build next:
--   /invite                — admin: generate + copy invite links
--   /register?token=<uuid> — public: owner registration (Google OAuth + racing details)
--   /portal                — owner: dashboard + name list
-- -------------------------------------------------------------