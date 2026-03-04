-- ============================================================
-- Migración completa: Treatment Tracking + Adjuntos
-- Crea las 3 tablas de seguimiento oncológico (si no existen)
-- y añade soporte de adjuntos a oncology_reviews
-- 2026-03-04
-- ============================================================

-- ═══════════════════════════════════════════════════════════════
-- PARTE 1: Crear tablas base (idempotente)
-- ═══════════════════════════════════════════════════════════════

-- 1a. Treatment Sessions
CREATE TABLE IF NOT EXISTS treatment_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  session_date DATE NOT NULL,
  treatment_type TEXT NOT NULL,
  treatment_name TEXT,
  cycle_number INT,
  total_cycles INT,
  location TEXT,
  notes TEXT,
  overall_feeling INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_treatment_sessions_client
  ON treatment_sessions(client_id, session_date DESC);

-- 1b. Treatment Symptoms
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

-- 1c. Oncology Reviews
CREATE TABLE IF NOT EXISTS oncology_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  review_date DATE NOT NULL,
  review_type TEXT NOT NULL,
  doctor_name TEXT,
  location TEXT,
  summary TEXT,
  results TEXT,
  next_review_date DATE,
  next_review_notes TEXT,
  mood_after INT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oncology_reviews_client
  ON oncology_reviews(client_id, review_date DESC);

-- ═══════════════════════════════════════════════════════════════
-- PARTE 2: Añadir columna de adjuntos
-- ═══════════════════════════════════════════════════════════════

-- Columna JSONB para array de adjuntos
-- Cada adjunto: { url: string, name: string, type: string, size: number }
ALTER TABLE oncology_reviews
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- ═══════════════════════════════════════════════════════════════
-- PARTE 3: Storage bucket + políticas RLS
-- ═══════════════════════════════════════════════════════════════

-- Bucket para adjuntos oncológicos (privado)
INSERT INTO storage.buckets (id, name, public)
VALUES ('oncology-attachments', 'oncology-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Pacientes pueden subir sus propios adjuntos
DROP POLICY IF EXISTS "Pacientes suben adjuntos oncologicos" ON storage.objects;
CREATE POLICY "Pacientes suben adjuntos oncologicos" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'oncology-attachments' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Pacientes pueden ver sus propios adjuntos
DROP POLICY IF EXISTS "Pacientes ven sus adjuntos oncologicos" ON storage.objects;
CREATE POLICY "Pacientes ven sus adjuntos oncologicos" ON storage.objects
FOR SELECT USING (
    bucket_id = 'oncology-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Staff (admin, coach, endocrino) puede ver todos los adjuntos
DROP POLICY IF EXISTS "Staff ve adjuntos oncologicos" ON storage.objects;
CREATE POLICY "Staff ve adjuntos oncologicos" ON storage.objects
FOR SELECT USING (
    bucket_id = 'oncology-attachments' AND
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id::text = auth.uid()::text
        AND role IN ('admin', 'coach', 'endocrino')
    )
);

-- Pacientes pueden eliminar sus propios adjuntos
DROP POLICY IF EXISTS "Pacientes borran sus adjuntos oncologicos" ON storage.objects;
CREATE POLICY "Pacientes borran sus adjuntos oncologicos" ON storage.objects
FOR DELETE USING (
    bucket_id = 'oncology-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
