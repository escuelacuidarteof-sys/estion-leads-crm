-- ==========================================
-- FIX: Guardado de entrenamientos cliente
-- - Evita fallo de upsert por conflicto
-- - Elimina duplicados previos
-- - Asegura indices unicos necesarios
-- - Desactiva RLS para tablas training operacionales
-- ==========================================

BEGIN;

ALTER TABLE IF EXISTS training_client_day_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS training_client_exercise_logs DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regclass('public.training_client_day_logs') IS NOT NULL THEN
    EXECUTE '
      WITH ranked AS (
        SELECT
          id,
          ROW_NUMBER() OVER (
            PARTITION BY client_id, day_id
            ORDER BY completed_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
          ) AS rn
        FROM training_client_day_logs
      )
      DELETE FROM training_client_day_logs d
      USING ranked r
      WHERE d.id = r.id
        AND r.rn > 1
    ';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.training_client_exercise_logs') IS NOT NULL THEN
    EXECUTE '
      WITH ranked AS (
        SELECT
          id,
          ROW_NUMBER() OVER (
            PARTITION BY log_id, workout_exercise_id
            ORDER BY created_at DESC NULLS LAST, id DESC
          ) AS rn
        FROM training_client_exercise_logs
      )
      DELETE FROM training_client_exercise_logs e
      USING ranked r
      WHERE e.id = r.id
        AND r.rn > 1
    ';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_training_client_day_logs_client_day
  ON training_client_day_logs (client_id, day_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_training_client_exercise_logs_log_exercise
  ON training_client_exercise_logs (log_id, workout_exercise_id);

COMMIT;

-- Verificacion
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_training_client_day_logs_client_day',
    'idx_training_client_exercise_logs_log_exercise'
  )
ORDER BY indexname;

SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('training_client_day_logs', 'training_client_exercise_logs')
ORDER BY tablename;
