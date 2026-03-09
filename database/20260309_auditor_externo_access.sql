-- Rol de solo lectura para auditor externo
-- Ejecutar en Supabase SQL Editor

DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.users'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%role%IN%'
  LOOP
    EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT IF EXISTS %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE public.users
ADD CONSTRAINT users_role_check
CHECK (
  role IN (
    'admin', 'head_coach', 'coach', 'closer', 'setter',
    'contabilidad', 'doctor', 'endocrino', 'psicologo', 'rrss',
    'direccion', 'dietitian', 'super_admin', 'client', 'auditor_externo'
  )
);

-- Convertir cuenta externa a rol auditor (si ya existe)
UPDATE public.users
SET role = 'auditor_externo'
WHERE lower(email) = 'atlasagent82@gmail.com';

-- Permisos por rol (solo lectura de clientes y salud)
CREATE TABLE IF NOT EXISTS public.role_permissions_registry (
  role text NOT NULL,
  permission text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  PRIMARY KEY (role, permission)
);

UPDATE public.role_permissions_registry
SET enabled = false
WHERE role = 'auditor_externo';

INSERT INTO public.role_permissions_registry (role, permission, enabled)
VALUES
  ('auditor_externo', 'access:clients', true),
  ('auditor_externo', 'access:medical', true)
ON CONFLICT (role, permission)
DO UPDATE SET enabled = EXCLUDED.enabled;
