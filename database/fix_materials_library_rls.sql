-- =====================================================
-- FIX: RLS de materials_library
-- =====================================================
-- Problema: La política de gestión no incluía super_admin ni dietitian,
-- causando error 42501 al intentar insertar materiales.
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Staff puede ver materiales" ON materials_library;
DROP POLICY IF EXISTS "Staff puede gestionar materiales" ON materials_library;
DROP POLICY IF EXISTS "Clientes ven materiales activos" ON materials_library;

-- Staff puede ver todos los materiales (SELECT)
CREATE POLICY "Staff puede ver materiales" ON materials_library
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'super_admin', 'head_coach', 'coach', 'endocrino', 'direccion', 'dietitian')
        )
    );

-- Staff puede gestionar materiales (INSERT, UPDATE, DELETE)
CREATE POLICY "Staff puede gestionar materiales" ON materials_library
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'super_admin', 'head_coach', 'coach', 'direccion', 'dietitian')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'super_admin', 'head_coach', 'coach', 'direccion', 'dietitian')
        )
    );

-- Clientes pueden ver materiales activos (SELECT)
CREATE POLICY "Clientes ven materiales activos" ON materials_library
    FOR SELECT
    USING (
        is_active = true
        AND EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'client'
        )
    );
