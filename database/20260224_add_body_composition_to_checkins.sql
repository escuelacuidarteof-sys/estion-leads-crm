-- ==============================================================================
-- 🛠️ ADD: BODY COMPOSITION METRICS TO WEEKLY CHECKINS
-- ==============================================================================
-- Propósito: Añadir columnas para registrar grasa corporal, masa muscular
-- y grasa visceral directamente en los check-ins semanales del portal de clientes.
-- ==============================================================================

DO $$ 
BEGIN
    -- Añadir columna de grasa corporal
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'weekly_checkins' AND column_name = 'body_fat_percentage') THEN
        ALTER TABLE public.weekly_checkins ADD COLUMN body_fat_percentage DECIMAL(5,1);
    END IF;

    -- Añadir columna de masa muscular
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'weekly_checkins' AND column_name = 'muscle_mass') THEN
        ALTER TABLE public.weekly_checkins ADD COLUMN muscle_mass DECIMAL(5,1);
    END IF;

    -- Añadir columna de grasa visceral
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'weekly_checkins' AND column_name = 'visceral_fat_level') THEN
        ALTER TABLE public.weekly_checkins ADD COLUMN visceral_fat_level DECIMAL(4,1);
    END IF;

    -- NOTA: El peso ya se registraba dentro de 'responses' u otras tablas,
    -- pero si el cliente necesita weight_log directamente en weekly_checkins
    -- (como se añadió al tipo WeeklyCheckin), lo añadimos también:
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'weekly_checkins' AND column_name = 'weight_log') THEN
        ALTER TABLE public.weekly_checkins ADD COLUMN weight_log DECIMAL(5,1);
    END IF;
END $$;

-- Verificación de las columnas añadidas
SELECT 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'weekly_checkins'
  AND column_name IN ('weight_log', 'body_fat_percentage', 'muscle_mass', 'visceral_fat_level')
ORDER BY ordinal_position;
