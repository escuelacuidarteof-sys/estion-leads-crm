-- ============================================================
-- Treatment Tracking: sessions, symptoms, oncology reviews
-- 2026-03-04
-- ============================================================

-- 1. Treatment Sessions
CREATE TABLE IF NOT EXISTS treatment_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  session_date DATE NOT NULL,
  treatment_type TEXT NOT NULL,        -- chemotherapy, radiotherapy, hormonotherapy, immunotherapy, surgery, other
  treatment_name TEXT,                 -- fármaco / protocolo (ej. "Taxol", "AC-T ciclo 3")
  cycle_number INT,
  total_cycles INT,
  location TEXT,
  notes TEXT,
  overall_feeling INT,                 -- 1-5
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_treatment_sessions_client
  ON treatment_sessions(client_id, session_date DESC);

-- 2. Treatment Symptoms (post-treatment symptom log)
CREATE TABLE IF NOT EXISTS treatment_symptoms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  session_id UUID REFERENCES treatment_sessions(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  fatigue INT DEFAULT 0,
  nausea INT DEFAULT 0,
  vomiting INT DEFAULT 0,
  pain INT DEFAULT 0,
  diarrhea INT DEFAULT 0,
  constipation INT DEFAULT 0,
  appetite_loss INT DEFAULT 0,
  mouth_sores INT DEFAULT 0,
  skin_issues INT DEFAULT 0,
  numbness INT DEFAULT 0,
  brain_fog INT DEFAULT 0,
  mood INT DEFAULT 0,
  sleep_quality INT DEFAULT 0,
  other_symptoms TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_treatment_symptoms_client
  ON treatment_symptoms(client_id, log_date DESC);

-- 3. Oncology Reviews
CREATE TABLE IF NOT EXISTS oncology_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  review_date DATE NOT NULL,
  review_type TEXT NOT NULL,           -- routine, scan, blood_work, follow_up, other
  doctor_name TEXT,
  location TEXT,
  summary TEXT,
  results TEXT,
  next_review_date DATE,
  next_review_notes TEXT,
  mood_after INT,                      -- 1-5
  notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,  -- [{url, name, type, size}] files uploaded by client
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oncology_reviews_client
  ON oncology_reviews(client_id, review_date DESC);
