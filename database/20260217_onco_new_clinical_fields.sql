-- =========================================================
-- MIGRACIÓN: Campos clínicos oncológicos adicionales
-- Proyecto: Escuela Cuid-Arte
-- Fecha: 2026-02-17
-- Ejecutar en el Editor SQL de Supabase
-- =========================================================

-- Tipo de tumor (texto libre)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS tumor_type TEXT;

-- Factores de seguridad para prescripción de ejercicio
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS peripheral_neuropathy TEXT DEFAULT 'ninguna';
-- Valores: 'ninguna' | 'leve' | 'moderada_severa'

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS lymphedema TEXT DEFAULT 'ninguno';
-- Valores: 'ninguno' | 'miembro_superior' | 'miembro_inferior' | 'bilateral'

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS venous_access TEXT DEFAULT 'ninguno';
-- Valores: 'ninguno' | 'port_a_cath' | 'picc'

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS bone_risk TEXT DEFAULT 'ninguno';
-- Valores: 'ninguno' | 'osteoporosis' | 'metastasis_oseas'

-- Síntomas oncológicos adicionales (escala 0-10)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS symptom_chemo_brain INTEGER DEFAULT 0;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS symptom_dyspnea INTEGER DEFAULT 0;

-- Indicador clínico de pérdida de peso involuntaria significativa
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS significant_weight_loss BOOLEAN DEFAULT FALSE;
-- TRUE si ha perdido >5% de su peso en los últimos 3 meses sin quererlo

-- Comentarios de documentación
COMMENT ON COLUMN clientes.tumor_type IS 'Tipo y localización del tumor (texto libre, ej: Cáncer de mama HER2+)';
COMMENT ON COLUMN clientes.peripheral_neuropathy IS 'Neuropatía periférica inducida por quimioterapia: ninguna | leve | moderada_severa';
COMMENT ON COLUMN clientes.lymphedema IS 'Presencia y localización del linfedema: ninguno | miembro_superior | miembro_inferior | bilateral';
COMMENT ON COLUMN clientes.venous_access IS 'Acceso venoso permanente que limita ejercicio de hombro/pecho: ninguno | port_a_cath | picc';
COMMENT ON COLUMN clientes.bone_risk IS 'Riesgo óseo relevante para prescripción de cargas: ninguno | osteoporosis | metastasis_oseas';
COMMENT ON COLUMN clientes.symptom_chemo_brain IS 'Niebla mental / quimiocerebro (escala 0-10)';
COMMENT ON COLUMN clientes.symptom_dyspnea IS 'Disnea o sensación de ahogo al esfuerzo (escala 0-10)';
COMMENT ON COLUMN clientes.significant_weight_loss IS 'Pérdida de peso involuntaria >5% en los últimos 3 meses (marcador clínico de riesgo)';

-- =========================================================
-- ✅ LISTO - Ejecutar en Editor SQL de Supabase
-- =========================================================
