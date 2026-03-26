-- Visibility scope for nutrition plans
-- public  => eligible for automatic assignment
-- private => only available through manual assignment

ALTER TABLE public.nutrition_plans
ADD COLUMN IF NOT EXISTS visibility_scope TEXT NOT NULL DEFAULT 'public';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'nutrition_plans_visibility_scope_check'
  ) THEN
    ALTER TABLE public.nutrition_plans
    ADD CONSTRAINT nutrition_plans_visibility_scope_check
    CHECK (visibility_scope IN ('public', 'private'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_nutrition_plans_auto_lookup_visibility
ON public.nutrition_plans (status, visibility_scope, diet_type, target_calories, target_month, target_fortnight);
