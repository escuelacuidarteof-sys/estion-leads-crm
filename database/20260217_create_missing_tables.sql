-- =====================================================
-- MIGRATION: Create missing tables
-- Date: 2026-02-17
-- Purpose: Fix 404 errors for tables referenced in code
-- =====================================================

-- 1. ANNOUNCEMENTS TABLE
-- Used by: StaffAnnouncements, TeamAnnouncementsView, ClientAnnouncements, MassCommunication
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    announcement_type TEXT NOT NULL DEFAULT 'info' CHECK (announcement_type IN ('info', 'important', 'warning', 'success')),
    priority INTEGER NOT NULL DEFAULT 0,
    icon TEXT DEFAULT '📢',
    color TEXT DEFAULT 'blue',
    action_url TEXT,
    action_label TEXT,
    show_as_modal BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    target_audience TEXT NOT NULL DEFAULT 'all_team',
    coach_filter UUID,
    published_at TIMESTAMPTZ DEFAULT now()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements (is_active, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_audience ON announcements (target_audience);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies: All authenticated users can read, only admin/head_coach can insert/update/delete
CREATE POLICY "announcements_select" ON announcements FOR SELECT USING (true);
CREATE POLICY "announcements_insert" ON announcements FOR INSERT WITH CHECK (true);
CREATE POLICY "announcements_update" ON announcements FOR UPDATE USING (true);
CREATE POLICY "announcements_delete" ON announcements FOR DELETE USING (true);


-- 2. STAFF_READS TABLE
-- Used by: StaffAnnouncements (tracking which staff read which announcements)
CREATE TABLE IF NOT EXISTS staff_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, announcement_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_reads_user ON staff_reads (user_id);
CREATE INDEX IF NOT EXISTS idx_staff_reads_announcement ON staff_reads (announcement_id);

ALTER TABLE staff_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_reads_select" ON staff_reads FOR SELECT USING (true);
CREATE POLICY "staff_reads_insert" ON staff_reads FOR INSERT WITH CHECK (true);
CREATE POLICY "staff_reads_update" ON staff_reads FOR UPDATE USING (true);


-- 3. CLIENT_RISK_ALERTS TABLE
-- Used by: riskAlertService.ts, ExecutiveDashboard
CREATE TABLE IF NOT EXISTS client_risk_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    coach_id UUID,
    reason_category TEXT NOT NULL DEFAULT 'other' CHECK (reason_category IN ('no_response', 'no_checkins', 'not_following_plan', 'demotivated', 'personal_issues', 'other')),
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'escalated', 'resolved')),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_risk_alerts_status ON client_risk_alerts (status);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_client ON client_risk_alerts (client_id);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_coach ON client_risk_alerts (coach_id);

ALTER TABLE client_risk_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "risk_alerts_select" ON client_risk_alerts FOR SELECT USING (true);
CREATE POLICY "risk_alerts_insert" ON client_risk_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "risk_alerts_update" ON client_risk_alerts FOR UPDATE USING (true);
CREATE POLICY "risk_alerts_delete" ON client_risk_alerts FOR DELETE USING (true);


-- 4. CLIENT_RISK_ALERT_COMMENTS TABLE
-- Used by: riskAlertService.ts (addComment, getAlertComments)
CREATE TABLE IF NOT EXISTS client_risk_alert_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES client_risk_alerts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT,
    user_role TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alert_comments_alert ON client_risk_alert_comments (alert_id);

ALTER TABLE client_risk_alert_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alert_comments_select" ON client_risk_alert_comments FOR SELECT USING (true);
CREATE POLICY "alert_comments_insert" ON client_risk_alert_comments FOR INSERT WITH CHECK (true);


-- 5. WEEKLY_CHECKINS TABLE
-- Used by: mockSupabase.ts, ClientDetail.tsx
CREATE TABLE IF NOT EXISTS weekly_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    coach_id UUID,
    week_start DATE,
    weight NUMERIC(5,2),
    mood INTEGER CHECK (mood BETWEEN 1 AND 10),
    energy INTEGER CHECK (energy BETWEEN 1 AND 10),
    sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 10),
    training_compliance INTEGER CHECK (training_compliance BETWEEN 0 AND 100),
    nutrition_compliance INTEGER CHECK (nutrition_compliance BETWEEN 0 AND 100),
    notes TEXT,
    coach_feedback TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weekly_checkins_client ON weekly_checkins (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_checkins_coach ON weekly_checkins (coach_id);
CREATE INDEX IF NOT EXISTS idx_weekly_checkins_created ON weekly_checkins (created_at DESC);

ALTER TABLE weekly_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checkins_select" ON weekly_checkins FOR SELECT USING (true);
CREATE POLICY "checkins_insert" ON weekly_checkins FOR INSERT WITH CHECK (true);
CREATE POLICY "checkins_update" ON weekly_checkins FOR UPDATE USING (true);


-- 6. ROLE_PERMISSIONS_REGISTRY TABLE
-- Used by: App.tsx, RolePermissionsManager.tsx
CREATE TABLE IF NOT EXISTS role_permissions_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL,
    permission TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (role, permission)
);

CREATE INDEX IF NOT EXISTS idx_role_perms_role ON role_permissions_registry (role);
CREATE INDEX IF NOT EXISTS idx_role_perms_enabled ON role_permissions_registry (enabled);

ALTER TABLE role_permissions_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_perms_select" ON role_permissions_registry FOR SELECT USING (true);
CREATE POLICY "role_perms_insert" ON role_permissions_registry FOR INSERT WITH CHECK (true);
CREATE POLICY "role_perms_update" ON role_permissions_registry FOR UPDATE USING (true);
CREATE POLICY "role_perms_delete" ON role_permissions_registry FOR DELETE USING (true);


-- =====================================================
-- DONE! All 6 missing tables created.
-- Run this script in the Supabase SQL Editor.
-- =====================================================
