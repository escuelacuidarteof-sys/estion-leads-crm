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
  invited_by text REFERENCES public.users(id)
);

ALTER TABLE public.team_invitations
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz;

ALTER TABLE public.team_invitations
  ADD COLUMN IF NOT EXISTS invited_by text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'team_invitations_invited_by_fkey'
      AND conrelid = 'public.team_invitations'::regclass
  ) THEN
    ALTER TABLE public.team_invitations
      ADD CONSTRAINT team_invitations_invited_by_fkey
      FOREIGN KEY (invited_by) REFERENCES public.users(id);
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
