-- =====================================================
-- 🛠️ CORRECCIÓN DE COLUMNAS FALTANTES EN TABLA 'SALES'
-- =====================================================
-- Este script ayuda a solucionar el error PGRST204 al completar el onboarding.

-- 1. Asegurar columnas de onboarding y cliente en la tabla sales
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS contract_template_id UUID;

-- 2. Asegurar que los tipos de datos sean correctos para el join si es necesario
-- (Nota: client_id en clientes_ado_notion es UUID, en sales lo pusimos como TEXT por flexibilidad, esto es correcto)

-- 3. Comentarios para documentación
COMMENT ON COLUMN public.sales.onboarding_completed_at IS 'Fecha y hora en la que el cliente terminó su onboarding';
COMMENT ON COLUMN public.sales.client_id IS 'ID del cliente creado en la tabla clientes';

-- =====================================================
-- ✅ LISTO - EJECUTAR EN EL EDITOR SQL DE SUPABASE
-- =====================================================
