-- =====================================================
-- 🏥 SCHEMA INTEGRAL CUIDARTE - VERSIÓN FINAL EXHAUSTIVA
-- =====================================================

-- 1. Datos Personales y Geográficos (Bloque 1)
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS postal_address TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS population TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS id_number TEXT; -- DNI / NIE

-- 2. Contexto Oncológico y Clínico (Bloque 2)
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS oncology_status TEXT; -- activo, finalizado, seguimiento
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS current_treatments TEXT[]; -- ['quimio', 'radio', etc]
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS oncology_diagnosis_date DATE;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS health_conditions_prev TEXT[]; 
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS drug_allergies TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS exercise_medical_limitations_details TEXT;

-- 3. Salud Hormonal y Analíticas (Bloque 3)
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS menopause_status TEXT; -- natural, inducida, regular, etc
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS menopause_symptoms TEXT[]; -- ['sofocos', 'insomnio', etc]
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS lab_otros_notes TEXT; -- Analíticas recientes

-- 4. Síntomas y Descanso (Bloque 4 - Escala 0-10)
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS symptom_fatigue INTEGER;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS fatigue_interference INTEGER; -- En qué medida interfiere
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS symptom_pain INTEGER;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS symptom_nausea INTEGER;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS symptom_vomiting INTEGER;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS symptom_diarrhea INTEGER;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS symptom_constipation INTEGER;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS symptom_appetite_loss INTEGER;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS symptom_taste_alteration INTEGER; -- Llagas o sabor metálico
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS symptom_bloating INTEGER;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS symptom_sleep_quality INTEGER;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS sleep_hours NUMERIC;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS stress_level INTEGER;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS recovery_capacity INTEGER;

-- 5. Antropometría (Bloque 5)
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS habitual_weight_6_months NUMERIC;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS weight_evolution_status TEXT; -- perdido, mantenido, ganado...
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS body_evolution_goal_notes TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS measurement_arm NUMERIC;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS measurement_belly NUMERIC;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS measurement_thigh NUMERIC;

-- 6 & 7. Nutrición y Psicología (Bloques 6 y 7)
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS regular_foods TEXT[];
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS unwanted_foods TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS cooks_self TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS meals_per_day INTEGER;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS meal_schedules JSONB; -- {breakfast: '08:00', ...}
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS weigh_food_preference TEXT; -- exacto vs visual
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS alcohol_weekly TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS smoking_status TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS eating_disorder TEXT; -- TCA historia
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS food_fear_tumor BOOLEAN DEFAULT false;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS ed_binge_eating BOOLEAN DEFAULT false;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS ed_emotional_eating BOOLEAN DEFAULT false;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS last_recall_meal TEXT; -- Recordatorio 24h

-- 8. Actividad Física (Bloque 8)
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS daily_routine_description TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS exercise_availability_slots TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS strength_training_history BOOLEAN DEFAULT false;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS current_strength_score INTEGER;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS func_test_lift_bags BOOLEAN DEFAULT false;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS func_test_get_up_chair BOOLEAN DEFAULT false;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS func_test_stairs BOOLEAN DEFAULT false;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS func_test_falls BOOLEAN DEFAULT false;

-- 9. Objetivos (Bloque 9)
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS main_priority_notes TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS desired_feeling_notes TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS short_term_milestone_notes TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS why_trust_us TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS concerns_fears_notes TEXT;
