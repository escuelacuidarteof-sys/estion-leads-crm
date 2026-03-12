-- =============================================================================
-- FIX RLS: Seguimiento hormonal en portal cliente
-- =============================================================================
-- Problema detectado:
-- Las tablas usan client_id (FK -> clientes.id), pero las policies comparaban
-- client_id = auth.uid(). En producción auth.uid() corresponde a clientes.user_id,
-- no a clientes.id. Resultado: INSERT/UPSERT bloqueado por RLS.
--
-- Este parche alinea políticas con el vínculo correcto:
--   hormonal_*.client_id -> clientes.id -> clientes.user_id = auth.uid()
--
-- También añade policy UPDATE para soportar UPSERT.
-- =============================================================================

ALTER TABLE public.menstrual_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hormonal_symptoms ENABLE ROW LEVEL SECURITY;

-- ---------- MENSTRUAL CYCLES ----------
DROP POLICY IF EXISTS "Clientes ven sus ciclos" ON public.menstrual_cycles;
DROP POLICY IF EXISTS "Clientes registran sus ciclos" ON public.menstrual_cycles;
DROP POLICY IF EXISTS "Clientes actualizan sus ciclos" ON public.menstrual_cycles;
DROP POLICY IF EXISTS "Clientes eliminan sus ciclos" ON public.menstrual_cycles;
DROP POLICY IF EXISTS "Staff gestiona ciclos" ON public.menstrual_cycles;

CREATE POLICY "Clientes ven sus ciclos"
ON public.menstrual_cycles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.clientes c
    WHERE c.id = menstrual_cycles.client_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Clientes registran sus ciclos"
ON public.menstrual_cycles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.clientes c
    WHERE c.id = menstrual_cycles.client_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Clientes actualizan sus ciclos"
ON public.menstrual_cycles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.clientes c
    WHERE c.id = menstrual_cycles.client_id
      AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.clientes c
    WHERE c.id = menstrual_cycles.client_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Staff gestiona ciclos"
ON public.menstrual_cycles
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'head_coach', 'coach', 'endocrino', 'doctor', 'direccion')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'head_coach', 'coach', 'endocrino', 'doctor', 'direccion')
  )
);

-- ---------- HORMONAL SYMPTOMS ----------
DROP POLICY IF EXISTS "Clientes ven sus síntomas" ON public.hormonal_symptoms;
DROP POLICY IF EXISTS "Clientes registran sus síntomas" ON public.hormonal_symptoms;
DROP POLICY IF EXISTS "Clientes actualizan sus síntomas" ON public.hormonal_symptoms;
DROP POLICY IF EXISTS "Clientes eliminan sus síntomas" ON public.hormonal_symptoms;
DROP POLICY IF EXISTS "Staff gestiona síntomas" ON public.hormonal_symptoms;

CREATE POLICY "Clientes ven sus síntomas"
ON public.hormonal_symptoms
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.clientes c
    WHERE c.id = hormonal_symptoms.client_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Clientes registran sus síntomas"
ON public.hormonal_symptoms
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.clientes c
    WHERE c.id = hormonal_symptoms.client_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Clientes actualizan sus síntomas"
ON public.hormonal_symptoms
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.clientes c
    WHERE c.id = hormonal_symptoms.client_id
      AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.clientes c
    WHERE c.id = hormonal_symptoms.client_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Staff gestiona síntomas"
ON public.hormonal_symptoms
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'head_coach', 'coach', 'endocrino', 'doctor', 'direccion')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'head_coach', 'coach', 'endocrino', 'doctor', 'direccion')
  )
);
