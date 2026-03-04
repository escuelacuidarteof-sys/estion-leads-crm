ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS onboarding_call_url TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_initial_assessment TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_initial_assessment_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_initial_assessment_author TEXT;
