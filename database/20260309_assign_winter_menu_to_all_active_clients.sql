-- Asignar menu de invierno a todas las clientas activas
-- Ejecutar en Supabase SQL Editor

-- Paso 1: vista previa de planes de invierno disponibles
SELECT id, name, status, updated_at
FROM public.nutrition_plans
WHERE lower(name) LIKE '%invierno%'
ORDER BY updated_at DESC;

-- Paso 2: asignacion masiva
-- Cambia estos valores si quieres mayor precision
DO $$
DECLARE
  v_plan_name text := 'Menu de Invierno';
  v_assigned_by_email text := 'odile@escuelacuidarte.com';
  v_plan_id uuid;
  v_assigned_by uuid;
  v_rows int := 0;
BEGIN
  SELECT id
  INTO v_plan_id
  FROM public.nutrition_plans
  WHERE lower(name) = lower(v_plan_name)
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'No se encontro el plan exacto: %', v_plan_name;
  END IF;

  SELECT id
  INTO v_assigned_by
  FROM public.users
  WHERE lower(email) = lower(v_assigned_by_email)
  LIMIT 1;

  INSERT INTO public.client_nutrition_assignments (client_id, plan_id, assigned_by, assigned_at)
  SELECT c.id, v_plan_id, v_assigned_by, now()
  FROM public.clientes c
  WHERE c.status = 'active'
  ON CONFLICT (client_id)
  DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    assigned_by = EXCLUDED.assigned_by,
    assigned_at = EXCLUDED.assigned_at;

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  RAISE NOTICE 'Asignacion completada. Filas afectadas: %', v_rows;
END $$;
