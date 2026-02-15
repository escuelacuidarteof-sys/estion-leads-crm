-- ============================================================
-- CRM SALUD & BIENESTAR - ESQUEMA GENÉRICO
-- ============================================================
-- Ejecutar en Supabase SQL Editor (Settings > SQL Editor)
-- Compatible con cualquier negocio del sector salud/bienestar
-- ============================================================

-- 1. TABLA DE USUARIOS (Staff, Coaches, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'coach', -- admin, head_coach, coach, closer, setter, contabilidad, doctor, psicologo, rrss, direccion, dietitian, super_admin
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  specialty TEXT,
  instagram TEXT,
  linkedin TEXT,
  calendar_url TEXT,
  birth_date DATE,
  address TEXT,

  -- Datos bancarios
  bank_account_holder TEXT,
  bank_account_iban TEXT,
  bank_name TEXT,
  bank_swift_bic TEXT,
  tax_id TEXT,
  billing_address TEXT,

  -- Compensación
  commission_percentage NUMERIC,
  price_per_client NUMERIC,
  max_clients INT,
  tier INT, -- 1, 2, 3
  is_exclusive BOOLEAN DEFAULT false,
  tier_updated_at TIMESTAMP,
  performance_notes TEXT,
  internal_nps NUMERIC,
  task_compliance_rate NUMERIC,
  collegiate_number TEXT,

  -- Permisos
  permissions TEXT[],
  password TEXT, -- Para autenticación interna (no Supabase Auth)

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 2. TABLA DE CLIENTES (Core)
-- ============================================================
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Personal
  first_name TEXT NOT NULL,
  surname TEXT,
  email TEXT,
  phone TEXT,
  id_number TEXT,
  address TEXT,
  city TEXT,
  province TEXT,
  zip TEXT,
  instagram TEXT,
  telegram_id TEXT,
  telegram_group_id TEXT,

  -- Demográficos
  age INT,
  birth_date DATE,
  gender TEXT,
  hormonal_status TEXT,
  average_cycle_length INT,
  hrt_treatment TEXT,
  last_period_start_date DATE,

  -- Físico
  height NUMERIC,
  current_weight NUMERIC,
  initial_weight NUMERIC,
  target_weight NUMERIC,
  abdominal_perimeter NUMERIC,
  arm_perimeter NUMERIC,
  thigh_perimeter NUMERIC,
  last_weight_date DATE,

  -- Médico (genérico)
  diagnosis TEXT,
  diagnosis_date DATE,
  current_treatment TEXT,
  pathologies TEXT,
  medication TEXT,
  medical_notes TEXT,

  -- Suscripción
  status TEXT DEFAULT 'active', -- active, inactive, paused, dropout, completed
  subscription_type TEXT, -- monthly, quarterly, biannual, annual, custom
  subscription_start DATE,
  subscription_end DATE,
  subscription_amount NUMERIC,
  auto_renewal BOOLEAN DEFAULT true,
  program_duration_months INT,

  -- Coach
  coach_id UUID REFERENCES users(id),

  -- Contrato
  contract_signed BOOLEAN DEFAULT false,
  contract_signed_at TIMESTAMP,
  contract_signature_image TEXT,
  contract_link TEXT,
  contract_visible_to_client BOOLEAN DEFAULT false,
  assigned_contract_template_id UUID,
  contract_content_override TEXT,
  contract_date DATE,
  contract_amount NUMERIC,

  -- Nutrición
  allergies TEXT,
  dietary_preferences TEXT,
  dislikes TEXT,
  cooks_for_self BOOLEAN,
  meals_per_day INT,
  dietary_notes TEXT,

  -- Entrenamiento
  activity_level TEXT,
  steps_goal INT,
  strength_training BOOLEAN,
  training_location TEXT,
  injuries TEXT,
  training_notes TEXT,
  availability TEXT,

  -- Objetivos
  motivation TEXT,
  goal_3_months TEXT,
  goal_3_months_status TEXT DEFAULT 'pending',
  goal_6_months TEXT,
  goal_6_months_status TEXT DEFAULT 'pending',
  goal_1_year TEXT,
  goal_1_year_status TEXT DEFAULT 'pending',
  weekly_goal TEXT,

  -- Seguimiento
  general_notes TEXT,
  last_contact_date TIMESTAMP,
  weekly_review_url TEXT,
  weekly_review_date DATE,
  weekly_review_comments TEXT,

  -- Check-ins
  last_checkin_submitted TIMESTAMP,
  last_checkin_status TEXT,
  last_checkin_id UUID,
  last_checkin_reviewed_at TIMESTAMP,
  missed_checkins_count INT DEFAULT 0,

  -- Pausa
  pause_date DATE,
  pause_reason TEXT,
  weeks_paused INT DEFAULT 0,

  -- Baja/Abandono
  abandonment_date DATE,
  abandonment_reason TEXT,
  inactive_date DATE,
  inactive_reason TEXT,

  -- Renovación
  next_renewal_date DATE,
  next_renewal_accepted BOOLEAN,
  renewal_payment_status TEXT DEFAULT 'none',
  renewal_receipt_url TEXT,
  renewal_amount NUMERIC,
  renewal_payment_method TEXT,

  -- Citas
  next_appointment_date DATE,
  next_appointment_time TEXT,
  next_appointment_note TEXT,
  next_appointment_link TEXT,
  next_appointment_status TEXT,
  next_appointment_conclusions TEXT,
  coach_message TEXT,

  -- Onboarding
  onboarding_token TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_completed_at TIMESTAMP,

  -- Portal de cliente
  user_id UUID,
  activation_token TEXT,
  activation_token_created_at TIMESTAMP,
  allow_medical_access BOOLEAN DEFAULT false,
  show_health_tracker BOOLEAN DEFAULT false,

  -- Pagos
  ltv NUMERIC,
  payments_status TEXT,
  high_ticket BOOLEAN DEFAULT false,

  -- Sistema
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 3. HISTORIAL DE PESO
-- ============================================================
CREATE TABLE IF NOT EXISTS weight_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  weight NUMERIC NOT NULL,
  recorded_at TIMESTAMP DEFAULT now(),
  notes TEXT
);

-- 4. MEDICIONES CORPORALES
-- ============================================================
CREATE TABLE IF NOT EXISTS body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  measurement_type TEXT NOT NULL, -- abdominal, arm, thigh, chest, hip
  value NUMERIC NOT NULL,
  recorded_at TIMESTAMP DEFAULT now()
);

-- 5. CHECK-INS DIARIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  responses JSONB,
  rating INT,
  status TEXT DEFAULT 'pending_review', -- pending_review, reviewed
  coach_notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- 6. SESIONES DE COACHING
-- ============================================================
CREATE TABLE IF NOT EXISTS coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES users(id),
  session_date TIMESTAMP,
  duration_minutes INT,
  notes TEXT,
  video_url TEXT,
  status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled, missed
  created_at TIMESTAMP DEFAULT now()
);

-- 7. CHAT - SALAS
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT DEFAULT 'direct', -- direct, group
  name TEXT,
  photo_url TEXT,
  last_message TEXT,
  last_message_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- 8. CHAT - PARTICIPANTES
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_participants (
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP DEFAULT now(),
  last_read_at TIMESTAMP,
  PRIMARY KEY (room_id, user_id)
);

-- 9. CHAT - MENSAJES
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT,
  type TEXT DEFAULT 'text', -- text, image, audio, file
  file_url TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- 10. NOTIFICACIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'system', -- assignment, checkin, task, system, ticket
  link TEXT,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- 11. TAREAS DE COACH
-- ============================================================
CREATE TABLE IF NOT EXISTS coach_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES users(id),
  client_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  due_time TEXT,
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 12. TICKETS DE SOPORTE
-- ============================================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES users(id),
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open', -- open, in_progress, resolved, closed
  priority TEXT DEFAULT 'medium', -- low, medium, high
  category TEXT DEFAULT 'otros',
  assigned_to UUID REFERENCES users(id),
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 13. COMENTARIOS DE TICKETS
-- ============================================================
CREATE TABLE IF NOT EXISTS support_ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- 14. FACTURAS DE COACHES
-- ============================================================
CREATE TABLE IF NOT EXISTS coach_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES users(id),
  period_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  invoice_url TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, paid, rejected
  admin_notes TEXT,
  coach_notes TEXT,
  submitted_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 15. PLANES DE NUTRICIÓN
-- ============================================================
CREATE TABLE IF NOT EXISTS nutrition_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  target_calories INT,
  diet_type TEXT,
  instructions TEXT,
  intro_content TEXT,
  breakfast_content TEXT,
  lunch_content TEXT,
  dinner_content TEXT,
  snack_content TEXT,
  status TEXT DEFAULT 'draft', -- draft, published
  published_at TIMESTAMP,
  published_by UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 16. RECETAS DE NUTRICIÓN
-- ============================================================
CREATE TABLE IF NOT EXISTS nutrition_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES nutrition_plans(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- breakfast, lunch, dinner, snack
  position INT DEFAULT 0,
  name TEXT NOT NULL,
  ingredients JSONB DEFAULT '[]',
  preparation TEXT,
  calories INT,
  protein NUMERIC,
  carbs NUMERIC,
  fat NUMERIC,
  fiber NUMERIC,
  image_url TEXT,
  is_draft BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 17. ASIGNACIONES DE NUTRICIÓN A CLIENTES
-- ============================================================
CREATE TABLE IF NOT EXISTS client_nutrition_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES nutrition_plans(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT now(),
  assigned_by UUID REFERENCES users(id)
);

-- 18. PERSONALIZACIONES DE NUTRICIÓN POR CLIENTE
-- ============================================================
CREATE TABLE IF NOT EXISTS client_nutrition_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES nutrition_recipes(id) ON DELETE CASCADE,
  custom_name TEXT,
  custom_ingredients JSONB,
  custom_preparation TEXT,
  custom_calories INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 19. SESIONES DE CLASE / TALLERES
-- ============================================================
CREATE TABLE IF NOT EXISTS class_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  speaker TEXT,
  date TIMESTAMP,
  url TEXT,
  category TEXT DEFAULT 'General', -- Entrenamiento, Nutrición, Mindset, General
  is_recorded BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

-- 20. ALERTAS DE RIESGO (ANTIABANDONO)
-- ============================================================
CREATE TABLE IF NOT EXISTS risk_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES users(id),
  reason_category TEXT NOT NULL, -- no_response, no_checkins, not_following_plan, demotivated, personal_issues, other
  notes TEXT,
  status TEXT DEFAULT 'active', -- active, resolved, escalated
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 21. COMENTARIOS DE ALERTAS DE RIESGO
-- ============================================================
CREATE TABLE IF NOT EXISTS risk_alert_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES risk_alerts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- 22. PLANTILLAS DE CONTRATO
-- ============================================================
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT NOT NULL, -- HTML del contrato
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 23. ANUNCIOS DEL EQUIPO
-- ============================================================
CREATE TABLE IF NOT EXISTS team_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES users(id),
  target_roles TEXT[], -- Roles destinatarios
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

-- 24. OBJETIVOS DE COACH PARA CLIENTES
-- ============================================================
CREATE TABLE IF NOT EXISTS coach_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  deadline DATE,
  completed_at TIMESTAMP,
  goal_type TEXT DEFAULT 'custom', -- weekly, monthly, custom
  status TEXT DEFAULT 'pending', -- pending, achieved, failed
  feedback TEXT,
  failure_reason TEXT,
  action_plan TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

-- 25. MATERIALES DE CLIENTE
-- ============================================================
CREATE TABLE IF NOT EXISTS client_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  title TEXT NOT NULL,
  type TEXT DEFAULT 'link', -- link, document, video
  url TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 26. AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  target_table TEXT NOT NULL,
  target_id TEXT NOT NULL,
  changes JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- 27. CONFIGURACIÓN DE LA APP
-- ============================================================
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT now()
);

-- 28. VENTAS (CONTABILIDAD)
-- ============================================================
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  closer_id UUID REFERENCES users(id),
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  sale_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- 29. MÉTODOS DE PAGO
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  platform_fee_percentage NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- 30. ENLACES DE PAGO
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  amount NUMERIC,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- 31. PAUSAS DE CONTRATO (HISTORIAL)
-- ============================================================
CREATE TABLE IF NOT EXISTS contract_pauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  reason TEXT,
  weeks INT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

-- ============================================================
-- ÍNDICES PARA RENDIMIENTO
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_clientes_coach_id ON clientes(coach_id);
CREATE INDEX IF NOT EXISTS idx_clientes_status ON clientes(status);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_weight_history_client ON weight_history(client_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_client ON daily_checkins(client_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_tasks_coach ON coach_tasks(coach_id);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_client ON risk_alerts(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_client ON sales(client_id);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

-- Insertar métodos de pago por defecto
INSERT INTO payment_methods (name, platform_fee_percentage) VALUES
  ('Transferencia bancaria', 0),
  ('Stripe', 2.9),
  ('PayPal', 3.4)
ON CONFLICT DO NOTHING;

-- ============================================================
-- FIN DEL ESQUEMA
-- ============================================================
-- NOTA: Ejecutar database/rls_policies.sql después de crear las tablas
-- para configurar las políticas de seguridad por fila (RLS).
