-- Persist weekly meal planner selections across devices

CREATE TABLE IF NOT EXISTS public.client_meal_plan_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.nutrition_plans(id) ON DELETE CASCADE,
  grid jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, plan_id)
);

CREATE INDEX IF NOT EXISTS idx_client_meal_plan_state_client ON public.client_meal_plan_state(client_id);
CREATE INDEX IF NOT EXISTS idx_client_meal_plan_state_plan ON public.client_meal_plan_state(plan_id);

ALTER TABLE public.client_meal_plan_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon can read client meal plan state" ON public.client_meal_plan_state;
CREATE POLICY "anon can read client meal plan state"
ON public.client_meal_plan_state
FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS "anon can insert client meal plan state" ON public.client_meal_plan_state;
CREATE POLICY "anon can insert client meal plan state"
ON public.client_meal_plan_state
FOR INSERT
TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS "anon can update client meal plan state" ON public.client_meal_plan_state;
CREATE POLICY "anon can update client meal plan state"
ON public.client_meal_plan_state
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "anon can delete client meal plan state" ON public.client_meal_plan_state;
CREATE POLICY "anon can delete client meal plan state"
ON public.client_meal_plan_state
FOR DELETE
TO anon
USING (true);
