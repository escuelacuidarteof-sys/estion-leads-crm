-- =====================================================
-- 🗄️ CONFIGURACIÓN INTEGRAL DE STORAGE BUCKETS
-- =====================================================
-- Este script asegura que todos los buckets necesarios existan
-- y tengan las políticas de acceso correctas para el funcionamiento del CRM.

-- 1. CREACIÓN DE BUCKETS
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('documents', 'documents', true),
    ('invoices', 'invoices', true),
    ('client-materials', 'client-materials', true),
    ('team-photos', 'team-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. LIMPIEZA DE POLÍTICAS PREVIAS (Para evitar duplicados o conflictos)
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public viewing" ON storage.objects;
DROP POLICY IF EXISTS "Allow individual updates" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subida pública" ON storage.objects;
DROP POLICY IF EXISTS "Permitir lectura pública" ON storage.objects;

-- 3. POLÍTICA DE SUBIDA (INSERT)
-- Permite que cualquiera suba archivos a los buckets (necesario para onboarding sin login previo)
CREATE POLICY "Permitir subida pública"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id IN ('documents', 'invoices', 'client-materials', 'team-photos'));

-- 4. POLÍTICA DE LECTURA (SELECT)
-- Permite que los archivos sean visibles públicamente (para mostrar informes, fotos, etc.)
CREATE POLICY "Permitir lectura pública"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id IN ('documents', 'invoices', 'client-materials', 'team-photos'));

-- 5. POLÍTICA DE ACTUALIZACIÓN (UPDATE)
CREATE POLICY "Permitir actualización pública"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id IN ('documents', 'invoices', 'client-materials', 'team-photos'));

-- 6. POLÍTICA DE ELIMINACIÓN (DELETE)
CREATE POLICY "Permitir eliminación pública"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id IN ('documents', 'invoices', 'client-materials', 'team-photos'));

-- =====================================================
-- ✅ CONFIGURACIÓN COMPLETADA
-- =====================================================
