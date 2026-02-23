-- Añadir soporte de superseries a training_workout_exercises
-- Ejecutar en Supabase → SQL Editor

ALTER TABLE training_workout_exercises
  ADD COLUMN IF NOT EXISTS superset_id TEXT DEFAULT NULL;

-- Verificar
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'training_workout_exercises'
ORDER BY ordinal_position;
