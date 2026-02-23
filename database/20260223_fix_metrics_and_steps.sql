-- ==============================================================================
-- 🛠️ FIX: BODY MEASUREMENTS & STEPS HISTORY MIGRATION
-- ==============================================================================
-- Propósito: Sincronizar la base de datos con los componentes del portal.
-- - Corrige nombres de columnas en body_measurements.
-- - Crea la tabla steps_history si no existe.
-- - Asegura que las políticas RLS estén aplicadas.
-- ==============================================================================

-- 1. CORRECCIÓN DE LA TABLA body_measurements
DO $$ 
BEGIN
    -- Asegurar que la tabla existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'body_measurements') THEN
        CREATE TABLE public.body_measurements (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            client_id TEXT NOT NULL,
            measured_at DATE NOT NULL DEFAULT CURRENT_DATE,
            abdominal_cm DECIMAL(5,1),
            arm_cm DECIMAL(5,1),
            thigh_cm DECIMAL(5,1),
            hip_cm DECIMAL(5,1),
            chest_cm DECIMAL(5,1),
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(client_id, measured_at)
        );
    ELSE
        -- 1.1 Renombrar columnas si existen con nombres antiguos
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'body_measurements' AND column_name = 'waist') THEN
            ALTER TABLE public.body_measurements RENAME COLUMN waist TO abdominal_cm;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'body_measurements' AND column_name = 'hips') THEN
            ALTER TABLE public.body_measurements RENAME COLUMN hips TO hip_cm;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'body_measurements' AND column_name = 'arms') THEN
            ALTER TABLE public.body_measurements RENAME COLUMN arms TO arm_cm;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'body_measurements' AND column_name = 'thighs') THEN
            ALTER TABLE public.body_measurements RENAME COLUMN thighs TO thigh_cm;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'body_measurements' AND column_name = 'date') THEN
            ALTER TABLE public.body_measurements RENAME COLUMN "date" TO measured_at;
        END IF;

        -- 1.2 Añadir columnas nuevas si faltan
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'body_measurements' AND column_name = 'measured_at') THEN
            ALTER TABLE public.body_measurements ADD COLUMN measured_at DATE NOT NULL DEFAULT CURRENT_DATE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'body_measurements' AND column_name = 'chest_cm') THEN
            ALTER TABLE public.body_measurements ADD COLUMN chest_cm DECIMAL(5,1);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'body_measurements' AND column_name = 'hip_cm') THEN
            ALTER TABLE public.body_measurements ADD COLUMN hip_cm DECIMAL(5,1);
        END IF;
        
        -- 1.3 Asegurar el UNIQUE constraint
        -- Primero borramos los posibles duplicados o constraints antiguos
        ALTER TABLE public.body_measurements DROP CONSTRAINT IF EXISTS body_measurements_client_id_date_key;
        ALTER TABLE public.body_measurements DROP CONSTRAINT IF EXISTS body_measurements_client_id_measured_at_key;
        
        -- Verificar si la columna measured_at realmente existe antes de crear el constraint
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'body_measurements' AND column_name = 'measured_at') THEN
            ALTER TABLE public.body_measurements ADD CONSTRAINT body_measurements_client_id_measured_at_key UNIQUE (client_id, measured_at);
        END IF;
    END IF;
END $$;

-- 2. CREACIÓN DE LA TABLA steps_history
CREATE TABLE IF NOT EXISTS public.steps_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    steps INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, date)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_steps_client_date ON public.steps_history(client_id, date DESC);

-- 3. ACTUALIZAR RLS POLICIES
-- Usamos la función helper definida en seguridad_total_rls.sql
SELECT public.setup_standard_policies('body_measurements');
SELECT public.setup_standard_policies('steps_history');

-- Si la función no existe, definimos las políticas manualmente
DO $$ 
BEGIN
    -- body_measurements
    ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Staff access all body_measurements" ON public.body_measurements;
    CREATE POLICY "Staff access all body_measurements" ON public.body_measurements FOR ALL USING (public.is_staff());
    DROP POLICY IF EXISTS "Client see own body_measurements" ON public.body_measurements;
    CREATE POLICY "Client see own body_measurements" ON public.body_measurements FOR SELECT USING (client_id::text = auth.uid()::text);
    DROP POLICY IF EXISTS "Client insert own body_measurements" ON public.body_measurements;
    CREATE POLICY "Client insert own body_measurements" ON public.body_measurements FOR INSERT WITH CHECK (client_id::text = auth.uid()::text);
    DROP POLICY IF EXISTS "Client update own body_measurements" ON public.body_measurements;
    CREATE POLICY "Client update own body_measurements" ON public.body_measurements FOR UPDATE USING (client_id::text = auth.uid()::text);

    -- steps_history
    ALTER TABLE public.steps_history ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Staff access all steps_history" ON public.steps_history;
    CREATE POLICY "Staff access all steps_history" ON public.steps_history FOR ALL USING (public.is_staff());
    DROP POLICY IF EXISTS "Client see own steps_history" ON public.steps_history;
    CREATE POLICY "Client see own steps_history" ON public.steps_history FOR SELECT USING (client_id::text = auth.uid()::text);
    DROP POLICY IF EXISTS "Client insert own steps_history" ON public.steps_history;
    CREATE POLICY "Client insert own steps_history" ON public.steps_history FOR INSERT WITH CHECK (client_id::text = auth.uid()::text);
    DROP POLICY IF EXISTS "Client update own steps_history" ON public.steps_history;
    CREATE POLICY "Client update own steps_history" ON public.steps_history FOR UPDATE USING (client_id::text = auth.uid()::text);
END $$;

-- 4. VERIFICACIÓN
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('body_measurements', 'steps_history')
ORDER BY table_name, ordinal_position;
