-- Migración: Gestión avanzada de asignaciones de entrenamiento
-- Fecha: 2026-03-26
-- Descripción: Añade status (soft-delete) y next_program_id (encadenamiento) a client_training_assignments

-- 1. Columna status para soft-delete (active/cancelled/completed)
ALTER TABLE client_training_assignments
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'cancelled', 'completed'));

-- 2. Columna next_program_id para encadenar programas
ALTER TABLE client_training_assignments
  ADD COLUMN IF NOT EXISTS next_program_id UUID REFERENCES training_programs(id) ON DELETE SET NULL;

-- 3. Índice para búsqueda de asignaciones por cliente y estado
CREATE INDEX IF NOT EXISTS idx_assignments_client_status
  ON client_training_assignments(client_id, status);
