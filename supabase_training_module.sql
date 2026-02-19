-- TRAINING MODULE SCHEMA

-- 1. Exercises table
CREATE TABLE IF NOT EXISTS training_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    media_type TEXT CHECK (media_type IN ('youtube', 'vimeo', 'image', 'none')) DEFAULT 'none',
    media_url TEXT,
    instructions TEXT,
    muscle_main TEXT,
    muscle_secondary TEXT[],
    equipment TEXT[],
    movement_pattern TEXT,
    level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    mechanics TEXT CHECK (mechanics IN ('compound', 'isolation')),
    articulation TEXT CHECK (articulation IN ('single', 'multi')),
    tags TEXT[],
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Workouts table (Templates)
CREATE TABLE IF NOT EXISTS training_workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    goal TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Workout Blocks (Warmup, Main, Finisher, etc)
CREATE TABLE IF NOT EXISTS training_workout_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID REFERENCES training_workouts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Exercises within blocks
CREATE TABLE IF NOT EXISTS training_workout_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block_id UUID REFERENCES training_workout_blocks(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES training_exercises(id),
    sets INTEGER DEFAULT 3,
    reps TEXT DEFAULT '12',
    rest_seconds INTEGER DEFAULT 60,
    notes TEXT,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Training Programs (Full calendars)
CREATE TABLE IF NOT EXISTS training_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    weeks_count INTEGER DEFAULT 4,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Days within Programs
CREATE TABLE IF NOT EXISTS training_program_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES training_programs(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 7),
    UNIQUE(program_id, week_number, day_number)
);

-- 7. Activities within Days
CREATE TABLE IF NOT EXISTS training_program_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_id UUID REFERENCES training_program_days(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('workout', 'metrics', 'photo', 'form', 'custom')),
    activity_id UUID, -- References training_workouts(id) if type is 'workout'
    title TEXT NOT NULL,
    description TEXT,
    position INTEGER DEFAULT 0,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. Client Assignments
CREATE TABLE IF NOT EXISTS client_training_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    program_id UUID REFERENCES training_programs(id),
    start_date DATE NOT NULL,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS Policies
ALTER TABLE training_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_workout_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_program_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_program_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_training_assignments ENABLE ROW LEVEL SECURITY;

-- Simple RLS: All authenticated users can read, creators can edit
CREATE POLICY "Authenticated users can view training" ON training_exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "Creators can manage their exercises" ON training_exercises FOR ALL TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can view workouts" ON training_workouts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Creators can manage their workouts" ON training_workouts FOR ALL TO authenticated USING (auth.uid() = created_by);

-- ... Repeat for others or simplify based on existing CRM patterns
