-- ==========================================
-- Superseries con rondas
-- Ejecutar en Supabase → SQL Editor
-- ==========================================

-- Añadir columna superset_rounds a training_workout_exercises
ALTER TABLE IF EXISTS training_workout_exercises
  ADD COLUMN IF NOT EXISTS superset_rounds INTEGER DEFAULT NULL;

-- Verificar
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'training_workout_exercises'
  AND column_name = 'superset_rounds';
