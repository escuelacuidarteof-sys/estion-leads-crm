-- =====================================================
-- Client Program Customization (Copy-on-Write)
-- Allows coaches to personalize assigned programs per client
-- =====================================================

-- 1. Add is_customized flag to assignments
ALTER TABLE client_training_assignments
ADD COLUMN IF NOT EXISTS is_customized BOOLEAN DEFAULT false;

-- 2. Client-specific program days
CREATE TABLE IF NOT EXISTS client_program_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES client_training_assignments(id) ON DELETE CASCADE,
    source_day_id UUID REFERENCES training_program_days(id) ON DELETE SET NULL,
    week_number INTEGER NOT NULL,
    day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 7),
    is_rest_day BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(assignment_id, week_number, day_number)
);

-- 3. Client-specific workouts (copies of template workouts)
CREATE TABLE IF NOT EXISTS client_workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES client_training_assignments(id) ON DELETE CASCADE,
    source_workout_id UUID REFERENCES training_workouts(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    goal TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Client-specific workout blocks
CREATE TABLE IF NOT EXISTS client_workout_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_workout_id UUID NOT NULL REFERENCES client_workouts(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Principal',
    description TEXT,
    position INTEGER DEFAULT 0,
    structure_type TEXT DEFAULT 'lineal',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Client-specific workout exercises (references shared exercise library)
CREATE TABLE IF NOT EXISTS client_workout_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_id UUID NOT NULL REFERENCES client_workout_blocks(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES training_exercises(id) ON DELETE SET NULL,
    sets INTEGER DEFAULT 3,
    reps TEXT DEFAULT '12',
    rest_seconds INTEGER DEFAULT 60,
    notes TEXT,
    position INTEGER DEFAULT 0,
    superset_id UUID,
    superset_rounds INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Client-specific program activities
CREATE TABLE IF NOT EXISTS client_program_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_day_id UUID NOT NULL REFERENCES client_program_days(id) ON DELETE CASCADE,
    source_activity_id UUID REFERENCES training_program_activities(id) ON DELETE SET NULL,
    type TEXT NOT NULL DEFAULT 'workout',
    activity_id UUID, -- points to client_workouts.id for workout type
    title TEXT,
    description TEXT,
    position INTEGER DEFAULT 0,
    color TEXT,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_program_days_assignment ON client_program_days(assignment_id);
CREATE INDEX IF NOT EXISTS idx_client_program_activities_day ON client_program_activities(client_day_id);
CREATE INDEX IF NOT EXISTS idx_client_workouts_assignment ON client_workouts(assignment_id);
CREATE INDEX IF NOT EXISTS idx_client_workout_blocks_workout ON client_workout_blocks(client_workout_id);
CREATE INDEX IF NOT EXISTS idx_client_workout_exercises_block ON client_workout_exercises(block_id);

-- 8. Disable RLS on new tables (matching existing training table pattern)
ALTER TABLE client_program_days DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_program_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_workouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_workout_blocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_workout_exercises DISABLE ROW LEVEL SECURITY;

-- 9. Drop foreign key constraints on log tables so they can reference client table IDs too
-- training_client_day_logs.day_id needs to accept both training_program_days.id and client_program_days.id
DO $$
BEGIN
    -- Drop day_id FK if exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'training_client_day_logs_day_id_fkey') THEN
        ALTER TABLE training_client_day_logs DROP CONSTRAINT training_client_day_logs_day_id_fkey;
    END IF;
    -- Drop workout_exercise_id FK if exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'training_client_exercise_logs_workout_exercise_id_fkey') THEN
        ALTER TABLE training_client_exercise_logs DROP CONSTRAINT training_client_exercise_logs_workout_exercise_id_fkey;
    END IF;
END $$;
