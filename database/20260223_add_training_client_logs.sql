-- 1. Añadir la columna superset_id a training_workout_exercises
ALTER TABLE training_workout_exercises 
ADD COLUMN IF NOT EXISTS superset_id UUID;

-- 2. Crear tabla principal de registros de entrenamiento por día
CREATE TABLE IF NOT EXISTS training_client_day_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    day_id UUID REFERENCES training_program_days(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    effort_rating INTEGER CHECK (effort_rating >= 1 AND effort_rating <= 10),
    notes TEXT,
    duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Crear tabla detalle de registro por ejercicio
CREATE TABLE IF NOT EXISTS training_client_exercise_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    log_id UUID REFERENCES training_client_day_logs(id) ON DELETE CASCADE,
    workout_exercise_id UUID REFERENCES training_workout_exercises(id) ON DELETE CASCADE,
    sets_completed INTEGER,
    reps_completed TEXT,
    weight_used TEXT,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(log_id, workout_exercise_id)
);

-- Habilitar RLS
ALTER TABLE training_client_day_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_client_exercise_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para training_client_day_logs
CREATE POLICY "Clients can view their own day logs" 
    ON training_client_day_logs FOR SELECT TO authenticated 
    USING (auth.uid() = client_id OR EXISTS (
        SELECT 1 FROM clientes WHERE clientes.id = training_client_day_logs.client_id AND clientes.coach_id = auth.uid()
    ));

CREATE POLICY "Clients can insert their own day logs" 
    ON training_client_day_logs FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update their own day logs" 
    ON training_client_day_logs FOR UPDATE TO authenticated 
    USING (auth.uid() = client_id);

-- Políticas para training_client_exercise_logs
CREATE POLICY "Clients can view their own exercise logs" 
    ON training_client_exercise_logs FOR SELECT TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM training_client_day_logs 
        WHERE training_client_day_logs.id = training_client_exercise_logs.log_id 
        AND (training_client_day_logs.client_id = auth.uid() OR EXISTS (
            SELECT 1 FROM clientes WHERE clientes.id = training_client_day_logs.client_id AND clientes.coach_id = auth.uid()
        ))
    ));

CREATE POLICY "Clients can insert their own exercise logs" 
    ON training_client_exercise_logs FOR INSERT TO authenticated 
    WITH CHECK (EXISTS (
        SELECT 1 FROM training_client_day_logs 
        WHERE training_client_day_logs.id = training_client_exercise_logs.log_id 
        AND training_client_day_logs.client_id = auth.uid()
    ));

CREATE POLICY "Clients can update their own exercise logs" 
    ON training_client_exercise_logs FOR UPDATE TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM training_client_day_logs 
        WHERE training_client_day_logs.id = training_client_exercise_logs.log_id 
        AND training_client_day_logs.client_id = auth.uid()
    ));
