-- ============================================================
-- CRM SALUD & BIENESTAR - POLÍTICAS RLS (Row Level Security)
-- ============================================================
-- Ejecutar DESPUÉS de schema_generic.sql
-- ============================================================

-- Habilitar RLS en tablas principales
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_invoices ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLÍTICA: USERS
-- ============================================================
-- Todos los usuarios autenticados pueden ver el listado de staff
CREATE POLICY "users_select_authenticated" ON users
  FOR SELECT TO authenticated USING (true);

-- Solo admins pueden modificar usuarios
CREATE POLICY "users_modify_admin" ON users
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin', 'head_coach')
    )
  );

-- ============================================================
-- POLÍTICA: CLIENTES
-- ============================================================
-- Admins y head_coach ven todos los clientes
CREATE POLICY "clientes_select_admin" ON clientes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin', 'head_coach', 'direccion', 'contabilidad')
    )
  );

-- Coaches solo ven sus clientes asignados
CREATE POLICY "clientes_select_coach" ON clientes
  FOR SELECT TO authenticated
  USING (coach_id = auth.uid());

-- Clientes ven su propio perfil
CREATE POLICY "clientes_select_self" ON clientes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins pueden modificar cualquier cliente
CREATE POLICY "clientes_modify_admin" ON clientes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin', 'head_coach')
    )
  );

-- Coaches pueden modificar sus clientes
CREATE POLICY "clientes_update_coach" ON clientes
  FOR UPDATE TO authenticated
  USING (coach_id = auth.uid());

-- ============================================================
-- POLÍTICA: NOTIFICACIONES
-- ============================================================
CREATE POLICY "notifications_own" ON notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- POLÍTICA: CHAT
-- ============================================================
CREATE POLICY "chat_rooms_participant" ON chat_rooms
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants cp
      WHERE cp.room_id = chat_rooms.id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "chat_messages_participant" ON chat_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants cp
      WHERE cp.room_id = chat_messages.room_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "chat_messages_insert" ON chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- ============================================================
-- POLÍTICA: COACH TASKS
-- ============================================================
CREATE POLICY "coach_tasks_own" ON coach_tasks
  FOR ALL TO authenticated
  USING (coach_id = auth.uid());

CREATE POLICY "coach_tasks_admin" ON coach_tasks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin', 'head_coach')
    )
  );

-- ============================================================
-- POLÍTICA: WEIGHT HISTORY
-- ============================================================
CREATE POLICY "weight_history_coach" ON weight_history
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clientes c
      WHERE c.id = weight_history.client_id
      AND (c.coach_id = auth.uid() OR c.user_id = auth.uid())
    )
  );

CREATE POLICY "weight_history_admin" ON weight_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin', 'head_coach')
    )
  );

-- ============================================================
-- POLÍTICA: DAILY CHECKINS
-- ============================================================
CREATE POLICY "checkins_coach_client" ON daily_checkins
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clientes c
      WHERE c.id = daily_checkins.client_id
      AND (c.coach_id = auth.uid() OR c.user_id = auth.uid())
    )
  );

-- ============================================================
-- POLÍTICA: SUPPORT TICKETS
-- ============================================================
CREATE POLICY "tickets_own" ON support_tickets
  FOR ALL TO authenticated
  USING (created_by = auth.uid() OR assigned_to = auth.uid());

CREATE POLICY "tickets_admin" ON support_tickets
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin', 'head_coach')
    )
  );

-- ============================================================
-- POLÍTICA: RISK ALERTS
-- ============================================================
CREATE POLICY "risk_alerts_coach" ON risk_alerts
  FOR ALL TO authenticated
  USING (coach_id = auth.uid());

CREATE POLICY "risk_alerts_admin" ON risk_alerts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin', 'head_coach')
    )
  );

-- ============================================================
-- POLÍTICA: COACH INVOICES
-- ============================================================
CREATE POLICY "invoices_own" ON coach_invoices
  FOR ALL TO authenticated
  USING (coach_id = auth.uid());

CREATE POLICY "invoices_admin" ON coach_invoices
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin', 'contabilidad')
    )
  );
