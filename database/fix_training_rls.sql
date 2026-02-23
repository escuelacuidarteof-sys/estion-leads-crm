-- ==========================================
-- FIX: RLS tablas de training
-- Ejecutar en Supabase → SQL Editor
-- ==========================================
-- PROBLEMA: La app usa clave anon para TODAS las peticiones (coaches y clientes).
-- Las políticas para "authenticated" no aplican. Se necesitan políticas para "anon"
-- O simplemente deshabilitar RLS en estas tablas operacionales.
-- ==========================================

-- Opción A (recomendada): Deshabilitar RLS en tablas de training
-- ya que la app no usa Supabase Auth y no puede diferenciar usuarios por JWT.

ALTER TABLE IF EXISTS training_exercises          DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS training_workouts           DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS training_workout_blocks     DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS training_workout_exercises  DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS training_programs           DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS training_program_days       DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS training_program_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS client_training_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS training_client_day_logs    DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS training_client_exercise_logs DISABLE ROW LEVEL SECURITY;

-- Opción B (alternativa si prefieres mantener RLS):
-- Añadir políticas permisivas para rol anon (que es el que usa la app)
-- Descomenta las líneas de abajo si prefieres B en vez de A.

-- DO $$
-- BEGIN
--   IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'training_workout_exercises' AND policyname = 'Anon full access training_workout_exercises') THEN
--     CREATE POLICY "Anon full access training_workout_exercises" ON training_workout_exercises
--       FOR ALL TO anon USING (true) WITH CHECK (true);
--   END IF;
--   IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'training_exercises' AND policyname = 'Anon full access training_exercises') THEN
--     CREATE POLICY "Anon full access training_exercises" ON training_exercises
--       FOR ALL TO anon USING (true) WITH CHECK (true);
--   END IF;
--   -- (repetir para cada tabla)
-- END $$;

-- Verificar resultado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN (
  'training_exercises', 'training_workouts', 'training_workout_blocks',
  'training_workout_exercises', 'training_programs', 'training_program_days',
  'training_program_activities', 'client_training_assignments',
  'training_client_day_logs', 'training_client_exercise_logs'
)
ORDER BY tablename;
