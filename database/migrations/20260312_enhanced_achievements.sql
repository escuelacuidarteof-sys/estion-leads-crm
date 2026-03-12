-- ============================================================
-- Enhanced achievements: streaks, treatment milestones
-- 2026-03-12
-- ============================================================

INSERT INTO achievements (code, title, description, icon, category) VALUES
  ('streak_7_diary',      'Semana Consciente',      '7 días seguidos completando el diario',   '📖', 'streak'),
  ('streak_4_checkins',   'Mes Constante',          '4 check-ins semanales consecutivos',      '✅', 'streak'),
  ('streak_14_wellness',  'Dos Semanas Fuertes',    '14 días registrando bienestar',           '💚', 'streak'),
  ('treatment_3_cycles',  'Guerrera - 3 Ciclos',    'Completaste 3 ciclos de tratamiento',     '💪', 'treatment'),
  ('treatment_6_cycles',  'Imparable - 6 Ciclos',   'Completaste 6 ciclos de tratamiento',     '🏆', 'treatment'),
  ('treatment_final',     'Última Sesión',          'Completaste tu último ciclo',             '🎉', 'treatment'),
  ('hydration_7_days',    'Hidratación Perfecta',   '7 días cumpliendo objetivo de agua',      '💧', 'streak'),
  ('first_photo',         'Primera Foto',           'Subiste tu primera foto de progreso',     '📸', 'milestone')
ON CONFLICT (code) DO NOTHING;
