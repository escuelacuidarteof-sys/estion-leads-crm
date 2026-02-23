-- ==========================================
-- FIX: RLS y políticas en tablas de training
-- Ejecutar en Supabase → SQL Editor
-- ==========================================
-- PROBLEMA: Los ejercicios del workout no se guardan (INSERT silencioso)
-- CAUSA: RLS habilitado sin políticas de INSERT en training_workout_exercises

DO $$
BEGIN

  -- training_exercises
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'training_exercises' AND policyname = 'Authenticated users can manage training_exercises') THEN
    CREATE POLICY "Authenticated users can manage training_exercises" ON training_exercises
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'training_exercises' AND policyname = 'Anon can read training_exercises') THEN
    CREATE POLICY "Anon can read training_exercises" ON training_exercises
      FOR SELECT TO anon USING (true);
  END IF;

  -- training_workouts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'training_workouts' AND policyname = 'Authenticated users can manage training_workouts') THEN
    CREATE POLICY "Authenticated users can manage training_workouts" ON training_workouts
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'training_workouts' AND policyname = 'Anon can read training_workouts') THEN
    CREATE POLICY "Anon can read training_workouts" ON training_workouts
      FOR SELECT TO anon USING (true);
  END IF;

  -- training_workout_blocks
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'training_workout_blocks' AND policyname = 'Authenticated users can manage training_workout_blocks') THEN
    CREATE POLICY "Authenticated users can manage training_workout_blocks" ON training_workout_blocks
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'training_workout_blocks' AND policyname = 'Anon can read training_workout_blocks') THEN
    CREATE POLICY "Anon can read training_workout_blocks" ON training_workout_blocks
      FOR SELECT TO anon USING (true);
  END IF;

  -- training_workout_exercises  ← la más crítica
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'training_workout_exercises' AND policyname = 'Authenticated users can manage training_workout_exercises') THEN
    CREATE POLICY "Authenticated users can manage training_workout_exercises" ON training_workout_exercises
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'training_workout_exercises' AND policyname = 'Anon can read training_workout_exercises') THEN
    CREATE POLICY "Anon can read training_workout_exercises" ON training_workout_exercises
      FOR SELECT TO anon USING (true);
  END IF;

  -- training_programs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'training_programs' AND policyname = 'Authenticated users can manage training_programs') THEN
    CREATE POLICY "Authenticated users can manage training_programs" ON training_programs
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'training_programs' AND policyname = 'Anon can read training_programs') THEN
    CREATE POLICY "Anon can read training_programs" ON training_programs
      FOR SELECT TO anon USING (true);
  END IF;

  -- training_program_days
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'training_program_days' AND policyname = 'Authenticated users can manage training_program_days') THEN
    CREATE POLICY "Authenticated users can manage training_program_days" ON training_program_days
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'training_program_days' AND policyname = 'Anon can read training_program_days') THEN
    CREATE POLICY "Anon can read training_program_days" ON training_program_days
      FOR SELECT TO anon USING (true);
  END IF;

  -- training_program_activities
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'training_program_activities' AND policyname = 'Authenticated users can manage training_program_activities') THEN
    CREATE POLICY "Authenticated users can manage training_program_activities" ON training_program_activities
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'training_program_activities' AND policyname = 'Anon can read training_program_activities') THEN
    CREATE POLICY "Anon can read training_program_activities" ON training_program_activities
      FOR SELECT TO anon USING (true);
  END IF;

  -- client_training_assignments
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_training_assignments' AND policyname = 'Authenticated users can manage client_training_assignments') THEN
    CREATE POLICY "Authenticated users can manage client_training_assignments" ON client_training_assignments
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_training_assignments' AND policyname = 'Anon can read client_training_assignments') THEN
    CREATE POLICY "Anon can read client_training_assignments" ON client_training_assignments
      FOR SELECT TO anon USING (true);
  END IF;

END $$;

-- Verificar políticas creadas
SELECT tablename, policyname, cmd, permissive
FROM pg_policies
WHERE tablename IN (
  'training_exercises', 'training_workouts', 'training_workout_blocks',
  'training_workout_exercises', 'training_programs', 'training_program_days',
  'training_program_activities', 'client_training_assignments'
)
ORDER BY tablename, cmd;
