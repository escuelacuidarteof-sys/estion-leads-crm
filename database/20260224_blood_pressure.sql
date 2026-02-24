-- ==========================================
-- Añadir campos de presión arterial a day_logs
-- Ejecutar en Supabase → SQL Editor
-- ==========================================

ALTER TABLE IF EXISTS training_client_day_logs
  ADD COLUMN IF NOT EXISTS pre_bp_systolic TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pre_bp_diastolic TEXT DEFAULT NULL;

-- Verificar
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'training_client_day_logs'
  AND column_name IN ('pre_bp_systolic', 'pre_bp_diastolic');
