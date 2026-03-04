-- Plan terapéutico operativo + historial de revisiones

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS action_plan_nutrition TEXT,
  ADD COLUMN IF NOT EXISTS action_plan_habits TEXT,
  ADD COLUMN IF NOT EXISTS action_plan_training TEXT,
  ADD COLUMN IF NOT EXISTS action_plan_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS action_plan_updated_by TEXT;

CREATE TABLE IF NOT EXISTS public.coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  coach_id TEXT,
  coach_name TEXT,
  date DATE NOT NULL,
  type TEXT NOT NULL DEFAULT 'seguimiento',
  duration_minutes INTEGER,
  recording_url TEXT,
  coach_comments TEXT,
  summary TEXT,
  highlights TEXT,
  action_items JSONB,
  client_feedback INTEGER CHECK (client_feedback BETWEEN 1 AND 5),
  client_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compatibilidad con tablas existentes (si coaching_sessions ya existia con otro esquema)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'coaching_sessions' AND column_name = 'date'
  ) THEN
    ALTER TABLE public.coaching_sessions ADD COLUMN date DATE;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'coaching_sessions' AND column_name = 'submission_date'
    ) THEN
      EXECUTE 'UPDATE public.coaching_sessions SET date = submission_date::date WHERE date IS NULL';
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'coaching_sessions' AND column_name = 'created_at'
    ) THEN
      EXECUTE 'UPDATE public.coaching_sessions SET date = created_at::date WHERE date IS NULL';
    ELSE
      EXECUTE 'UPDATE public.coaching_sessions SET date = CURRENT_DATE WHERE date IS NULL';
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'coaching_sessions' AND column_name = 'type'
  ) THEN
    ALTER TABLE public.coaching_sessions ADD COLUMN type TEXT NOT NULL DEFAULT 'seguimiento';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'coaching_sessions' AND column_name = 'action_items'
  ) THEN
    ALTER TABLE public.coaching_sessions ADD COLUMN action_items JSONB;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_coaching_sessions_client_date ON public.coaching_sessions(client_id, date DESC);
