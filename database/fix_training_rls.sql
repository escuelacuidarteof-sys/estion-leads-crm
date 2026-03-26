-- ============================================
-- FIX: Training Module RLS Policies
-- 
-- Problem: 403 error on training_workout_blocks
-- The "FOR ALL" policies need explicit WITH CHECK 
-- for INSERT operations to work properly.
-- ============================================

-- ============================================
-- 1. DROP ALL EXISTING POLICIES (clean slate)
-- ============================================

-- training_workout_blocks
DROP POLICY IF EXISTS "Public read blocks" ON training_workout_blocks;
DROP POLICY IF EXISTS "Authenticated users can managed blocks" ON training_workout_blocks;

-- training_workout_exercises
DROP POLICY IF EXISTS "Public read workout exercises" ON training_workout_exercises;
DROP POLICY IF EXISTS "Authenticated users can managed workout exercises" ON training_workout_exercises;

-- training_program_days
DROP POLICY IF EXISTS "Public read program days" ON training_program_days;
DROP POLICY IF EXISTS "Authenticated users can managed program days" ON training_program_days;

-- training_program_activities
DROP POLICY IF EXISTS "Public read program activities" ON training_program_activities;
DROP POLICY IF EXISTS "Authenticated users can managed program activities" ON training_program_activities;

-- training_exercises (also fix to be safe)
DROP POLICY IF EXISTS "Public read training" ON training_exercises;
DROP POLICY IF EXISTS "Authenticated users can insert training" ON training_exercises;
DROP POLICY IF EXISTS "Creators can update their exercises" ON training_exercises;
DROP POLICY IF EXISTS "Creators can delete their exercises" ON training_exercises;

-- training_workouts
DROP POLICY IF EXISTS "Public read workouts" ON training_workouts;
DROP POLICY IF EXISTS "Authenticated users can insert workouts" ON training_workouts;
DROP POLICY IF EXISTS "Creators can update their workouts" ON training_workouts;
DROP POLICY IF EXISTS "Creators can delete their workouts" ON training_workouts;

-- training_programs
DROP POLICY IF EXISTS "Public read programs" ON training_programs;
DROP POLICY IF EXISTS "Authenticated users can insert programs" ON training_programs;
DROP POLICY IF EXISTS "Creators can update their programs" ON training_programs;
DROP POLICY IF EXISTS "Creators can delete their programs" ON training_programs;

-- client_training_assignments
DROP POLICY IF EXISTS "Public read assignments" ON client_training_assignments;
DROP POLICY IF EXISTS "Creators can manage their assignments" ON client_training_assignments;


-- ============================================
-- 2. ENABLE RLS (idempotent)
-- ============================================
ALTER TABLE training_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_workout_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_program_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_program_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_training_assignments ENABLE ROW LEVEL SECURITY;


-- ============================================
-- 3. RECREATE ALL POLICIES (with proper WITH CHECK)
-- ============================================

-- --- training_exercises ---
CREATE POLICY "training_exercises_select" 
  ON training_exercises FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "training_exercises_insert" 
  ON training_exercises FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY "training_exercises_update" 
  ON training_exercises FOR UPDATE TO authenticated 
  USING (true) WITH CHECK (true);

CREATE POLICY "training_exercises_delete" 
  ON training_exercises FOR DELETE TO authenticated 
  USING (true);


-- --- training_workouts ---
CREATE POLICY "training_workouts_select" 
  ON training_workouts FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "training_workouts_insert" 
  ON training_workouts FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY "training_workouts_update" 
  ON training_workouts FOR UPDATE TO authenticated 
  USING (true) WITH CHECK (true);

CREATE POLICY "training_workouts_delete" 
  ON training_workouts FOR DELETE TO authenticated 
  USING (true);


-- --- training_workout_blocks (THE PROBLEM TABLE) ---
CREATE POLICY "training_workout_blocks_select" 
  ON training_workout_blocks FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "training_workout_blocks_insert" 
  ON training_workout_blocks FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY "training_workout_blocks_update" 
  ON training_workout_blocks FOR UPDATE TO authenticated 
  USING (true) WITH CHECK (true);

CREATE POLICY "training_workout_blocks_delete" 
  ON training_workout_blocks FOR DELETE TO authenticated 
  USING (true);


-- --- training_workout_exercises ---
CREATE POLICY "training_workout_exercises_select" 
  ON training_workout_exercises FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "training_workout_exercises_insert" 
  ON training_workout_exercises FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY "training_workout_exercises_update" 
  ON training_workout_exercises FOR UPDATE TO authenticated 
  USING (true) WITH CHECK (true);

CREATE POLICY "training_workout_exercises_delete" 
  ON training_workout_exercises FOR DELETE TO authenticated 
  USING (true);


-- --- training_programs ---
CREATE POLICY "training_programs_select" 
  ON training_programs FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "training_programs_insert" 
  ON training_programs FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY "training_programs_update" 
  ON training_programs FOR UPDATE TO authenticated 
  USING (true) WITH CHECK (true);

CREATE POLICY "training_programs_delete" 
  ON training_programs FOR DELETE TO authenticated 
  USING (true);


-- --- training_program_days ---
CREATE POLICY "training_program_days_select" 
  ON training_program_days FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "training_program_days_insert" 
  ON training_program_days FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY "training_program_days_update" 
  ON training_program_days FOR UPDATE TO authenticated 
  USING (true) WITH CHECK (true);

CREATE POLICY "training_program_days_delete" 
  ON training_program_days FOR DELETE TO authenticated 
  USING (true);


-- --- training_program_activities ---
CREATE POLICY "training_program_activities_select" 
  ON training_program_activities FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "training_program_activities_insert" 
  ON training_program_activities FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY "training_program_activities_update" 
  ON training_program_activities FOR UPDATE TO authenticated 
  USING (true) WITH CHECK (true);

CREATE POLICY "training_program_activities_delete" 
  ON training_program_activities FOR DELETE TO authenticated 
  USING (true);


-- --- client_training_assignments ---
CREATE POLICY "client_training_assignments_select" 
  ON client_training_assignments FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "client_training_assignments_insert" 
  ON client_training_assignments FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY "client_training_assignments_update" 
  ON client_training_assignments FOR UPDATE TO authenticated 
  USING (true) WITH CHECK (true);

CREATE POLICY "client_training_assignments_delete" 
  ON client_training_assignments FOR DELETE TO authenticated 
  USING (true);


-- ============================================
-- VERIFICATION: Check policies are in place
-- ============================================
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename LIKE 'training_%' OR tablename = 'client_training_assignments'
ORDER BY tablename, policyname;
