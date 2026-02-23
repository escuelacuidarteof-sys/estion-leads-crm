-- ==========================================
-- Añadir campos de Safety Pass (Semáforo)
-- ==========================================

ALTER TABLE training_client_day_logs
ADD COLUMN IF NOT EXISTS pre_fatigue INTEGER,
ADD COLUMN IF NOT EXISTS pre_rpe_type TEXT, -- 'verde', 'amarillo'
ADD COLUMN IF NOT EXISTS pre_oxygen TEXT,
ADD COLUMN IF NOT EXISTS pre_pulse TEXT,
ADD COLUMN IF NOT EXISTS safety_exclusion_data JSONB,
ADD COLUMN IF NOT EXISTS safety_sequelae_data JSONB;

-- Comentario para documentación
COMMENT ON COLUMN training_client_day_logs.safety_exclusion_data IS 'Datos de criterios de exclusión (Semáforo)';
COMMENT ON COLUMN training_client_day_logs.safety_sequelae_data IS 'Datos de secuelas específicas';
