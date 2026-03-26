-- ============================================================
-- Medication tracking + Hydration logs
-- 2026-03-12
-- ============================================================

-- 1. Medication schedule (what the patient takes)
CREATE TABLE IF NOT EXISTS medication_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT DEFAULT 'daily',
  time_of_day TEXT DEFAULT 'morning',  -- morning, afternoon, evening, night
  active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_med_schedule_client ON medication_schedule(client_id);

-- 2. Medication logs (daily taken/not-taken)
CREATE TABLE IF NOT EXISTS medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  medication_id UUID REFERENCES medication_schedule(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  taken BOOLEAN DEFAULT false,
  taken_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(medication_id, log_date)
);
CREATE INDEX IF NOT EXISTS idx_med_logs_client ON medication_logs(client_id, log_date DESC);

-- 3. Hydration logs
CREATE TABLE IF NOT EXISTS hydration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  log_date DATE NOT NULL,
  glasses INT DEFAULT 0,
  target_glasses INT DEFAULT 8,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, log_date)
);
CREATE INDEX IF NOT EXISTS idx_hydration_client ON hydration_logs(client_id, log_date DESC);
