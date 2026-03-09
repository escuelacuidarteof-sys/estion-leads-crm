-- Crea team_invitations de forma segura (sin borrar datos existentes)
-- Ejecutar en Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  role text NOT NULL,
  token text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  invited_by text
);

ALTER TABLE public.team_invitations
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz;

ALTER TABLE public.team_invitations
  ADD COLUMN IF NOT EXISTS invited_by text;

DO $$
DECLARE
  users_id_udt text;
BEGIN
  SELECT c.udt_name
  INTO users_id_udt
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'users'
    AND c.column_name = 'id';

  IF users_id_udt = 'uuid' THEN
    UPDATE public.team_invitations
    SET invited_by = null
    WHERE invited_by IS NOT NULL
      AND invited_by !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

    EXECUTE 'ALTER TABLE public.team_invitations ALTER COLUMN invited_by TYPE uuid USING invited_by::uuid';
  ELSE
    EXECUTE 'ALTER TABLE public.team_invitations ALTER COLUMN invited_by TYPE text USING invited_by::text';
  END IF;
END $$;

ALTER TABLE public.team_invitations
  DROP CONSTRAINT IF EXISTS team_invitations_invited_by_fkey;

DO $$
DECLARE
  users_id_udt text;
BEGIN
  SELECT c.udt_name
  INTO users_id_udt
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'users'
    AND c.column_name = 'id';

  IF users_id_udt = 'uuid' THEN
    EXECUTE 'ALTER TABLE public.team_invitations ADD CONSTRAINT team_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id)';
  ELSIF users_id_udt IN ('text', 'varchar', 'bpchar') THEN
    EXECUTE 'ALTER TABLE public.team_invitations ADD CONSTRAINT team_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'team_invitations_status_check'
      AND conrelid = 'public.team_invitations'::regclass
  ) THEN
    ALTER TABLE public.team_invitations
      ADD CONSTRAINT team_invitations_status_check
      CHECK (status IN ('pending', 'accepted', 'expired', 'revoked'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS team_invitations_email_key ON public.team_invitations (email);
CREATE UNIQUE INDEX IF NOT EXISTS team_invitations_token_key ON public.team_invitations (token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_created_at ON public.team_invitations (created_at DESC);

ALTER TABLE public.team_invitations DISABLE ROW LEVEL SECURITY;
