import { supabase } from './supabaseClient';

export interface ClientNotification {
  id: string;
  type: 'coach_reply' | 'doctor_reply' | 'treatment_reminder' | 'review_reminder' | 'checkin_reminder' | 'class_reminder';
  title: string;
  message: string;
  timestamp: string;
  action?: { tab: string; view?: string };
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'Ayer';
  if (diffD < 7) return `Hace ${diffD} días`;
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export { timeAgo };

// In-memory cache of read IDs per client (loaded from Supabase on first call)
const readCache = new Map<string, Set<string>>();
let cacheLoaded = new Map<string, boolean>();

async function ensureReadCacheLoaded(clientId: string): Promise<Set<string>> {
  if (cacheLoaded.get(clientId)) return readCache.get(clientId) || new Set();

  const ids = new Set<string>();
  try {
    const { data } = await supabase
      .from('client_notifications_read')
      .select('notification_id')
      .eq('client_id', clientId);
    data?.forEach(r => ids.add(r.notification_id));
  } catch (err) {
    console.warn('Error loading read notifications:', err);
  }
  readCache.set(clientId, ids);
  cacheLoaded.set(clientId, true);
  return ids;
}

export async function loadReadIds(clientId: string): Promise<Set<string>> {
  return ensureReadCacheLoaded(clientId);
}

export async function markNotificationRead(clientId: string, notifId: string) {
  const ids = await ensureReadCacheLoaded(clientId);
  if (ids.has(notifId)) return; // already read
  ids.add(notifId);
  readCache.set(clientId, ids);
  try {
    await supabase
      .from('client_notifications_read')
      .upsert({ client_id: clientId, notification_id: notifId }, { onConflict: 'client_id,notification_id' });
  } catch (err) {
    console.warn('Error marking notification read:', err);
  }
}

export async function markAllRead(clientId: string, notifIds: string[]) {
  const ids = await ensureReadCacheLoaded(clientId);
  const newIds = notifIds.filter(id => !ids.has(id));
  if (newIds.length === 0) return;
  newIds.forEach(id => ids.add(id));
  readCache.set(clientId, ids);
  try {
    const rows = newIds.map(id => ({ client_id: clientId, notification_id: id }));
    await supabase
      .from('client_notifications_read')
      .upsert(rows, { onConflict: 'client_id,notification_id' });
  } catch (err) {
    console.warn('Error marking all notifications read:', err);
  }
}

export async function pruneReadIds(clientId: string, activeNotifIds: string[]) {
  const activeSet = new Set(activeNotifIds);
  const ids = await ensureReadCacheLoaded(clientId);
  const staleIds = [...ids].filter(id => !activeSet.has(id));
  if (staleIds.length === 0) return;
  staleIds.forEach(id => ids.delete(id));
  readCache.set(clientId, ids);
  try {
    await supabase
      .from('client_notifications_read')
      .delete()
      .eq('client_id', clientId)
      .in('notification_id', staleIds);
  } catch (err) {
    console.warn('Error pruning read IDs:', err);
  }
}

export function isNotificationRead(clientId: string, notifId: string): boolean {
  const ids = readCache.get(clientId);
  return ids ? ids.has(notifId) : false;
}

export async function getClientNotifications(clientId: string): Promise<ClientNotification[]> {
  const notifications: ClientNotification[] = [];
  const now = new Date();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000).toISOString();

  try {
    // 1. Coach replies to check-ins
    const { data: checkins } = await supabase
      .from('weekly_checkins')
      .select('id, created_at, coach_notes, status, reviewed_at')
      .eq('client_id', clientId)
      .eq('status', 'reviewed')
      .not('coach_notes', 'is', null)
      .gte('created_at', twoWeeksAgo)
      .order('created_at', { ascending: false })
      .limit(5);

    checkins?.forEach(c => {
      notifications.push({
        id: `checkin-${c.id}`,
        type: 'coach_reply',
        title: 'Tu coach respondió al check-in',
        message: (c.coach_notes || '').substring(0, 80) + ((c.coach_notes || '').length > 80 ? '...' : ''),
        timestamp: c.reviewed_at || c.created_at,
        action: { tab: 'home', view: 'checkin' },
      });
    });

    // 2. Doctor answers to medical reviews
    const { data: reviews } = await supabase
      .from('medical_reviews')
      .select('id, submission_date, status, doctor_notes, reviewed_at')
      .eq('client_id', clientId)
      .eq('status', 'reviewed')
      .gte('submission_date', twoWeeksAgo)
      .order('submission_date', { ascending: false })
      .limit(5);

    reviews?.forEach(r => {
      notifications.push({
        id: `review-${r.id}`,
        type: 'doctor_reply',
        title: 'La doctora respondió tu consulta',
        message: (r.doctor_notes || 'Tu consulta ha sido revisada').substring(0, 80),
        timestamp: r.reviewed_at || r.submission_date,
        action: { tab: 'consultas' },
      });
    });

    // 3. Upcoming treatment sessions (next 3 days)
    const threeDays = new Date(now.getTime() + 3 * 86400000);
    const { data: treatments } = await supabase
      .from('treatment_sessions')
      .select('id, session_date, treatment_type, treatment_name')
      .eq('client_id', clientId)
      .gte('session_date', now.toISOString().split('T')[0])
      .lte('session_date', threeDays.toISOString().split('T')[0])
      .order('session_date', { ascending: true })
      .limit(3);

    const TREATMENT_LABELS: Record<string, string> = {
      chemotherapy: 'Quimioterapia', radiotherapy: 'Radioterapia',
      hormonotherapy: 'Hormonoterapia', immunotherapy: 'Inmunoterapia',
      surgery: 'Cirugía', other: 'Tratamiento',
    };

    treatments?.forEach(t => {
      notifications.push({
        id: `treatment-${t.id}`,
        type: 'treatment_reminder',
        title: `${TREATMENT_LABELS[t.treatment_type] || 'Sesión'} próximamente`,
        message: `${t.treatment_name || TREATMENT_LABELS[t.treatment_type] || 'Sesión'} el ${new Date(t.session_date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}`,
        timestamp: now.toISOString(),
        action: { tab: 'treatment' },
      });
    });

    // 4. Upcoming oncology reviews (next 7 days)
    const sevenDays = new Date(now.getTime() + 7 * 86400000);
    const { data: oncReviews } = await supabase
      .from('oncology_reviews')
      .select('id, next_review_date, review_type')
      .eq('client_id', clientId)
      .not('next_review_date', 'is', null)
      .gte('next_review_date', now.toISOString().split('T')[0])
      .lte('next_review_date', sevenDays.toISOString().split('T')[0])
      .order('next_review_date', { ascending: true })
      .limit(3);

    oncReviews?.forEach(r => {
      notifications.push({
        id: `oncreview-${r.id}`,
        type: 'review_reminder',
        title: 'Revisión oncológica próxima',
        message: `Tienes revisión el ${new Date(r.next_review_date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}`,
        timestamp: now.toISOString(),
        action: { tab: 'treatment' },
      });
    });

    // 5. Weekly check-in reminder (Fri-Mon if not submitted)
    const dayOfWeek = now.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 1) {
      const monday = getMonday(now);
      const { data: thisWeek } = await supabase
        .from('weekly_checkins')
        .select('id')
        .eq('client_id', clientId)
        .gte('created_at', monday.toISOString())
        .limit(1);

      if (!thisWeek?.length) {
        notifications.push({
          id: `checkin-reminder-${monday.toISOString().split('T')[0]}`,
          type: 'checkin_reminder',
          title: 'Check-in semanal pendiente',
          message: 'Completa tu reporte de esta semana para que tu coach pueda ayudarte',
          timestamp: now.toISOString(),
          action: { tab: 'home', view: 'checkin' },
        });
      }
    }
  } catch (err) {
    console.warn('Error loading notifications:', err);
  }

  return notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
