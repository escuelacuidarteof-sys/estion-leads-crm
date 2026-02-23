-- ==========================================
-- Actividades interactivas: tabla de logs + config
-- Ejecutar en Supabase → SQL Editor
-- ==========================================

-- 1. Añadir 'walking' al CHECK constraint de training_program_activities
-- para que no se pierda el tipo al guardar
ALTER TABLE IF EXISTS training_program_activities
  DROP CONSTRAINT IF EXISTS training_program_activities_type_check;

ALTER TABLE IF EXISTS training_program_activities
  ADD CONSTRAINT training_program_activities_type_check
  CHECK (type IN ('workout', 'metrics', 'photo', 'form', 'custom', 'walking'));

-- 2. Añadir columna config JSONB para configuración del coach
ALTER TABLE IF EXISTS training_program_activities
  ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}';

-- 3. Crear tabla de logs de actividades del cliente
CREATE TABLE IF NOT EXISTS training_client_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  activity_id UUID NOT NULL,
  day_id UUID NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, activity_id, day_id)
);

-- 4. Deshabilitar RLS (consistente con el resto de tablas training)
ALTER TABLE IF EXISTS training_client_activity_logs DISABLE ROW LEVEL SECURITY;

-- 5. Verificar
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'training_program_activities'
  AND column_name = 'config';

SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'training_client_activity_logs';
