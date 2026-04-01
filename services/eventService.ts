import { supabase } from './supabaseClient';
import { PortalEvent, CalendarItem } from '../types';

const CATEGORY_COLORS: Record<string, string> = {
  clase: '#6BA06B',
  taller: '#D4AF37',
  webinar: '#7c3aed',
  comunidad: '#3b82f6',
  nutricion: '#f59e0b',
  entrenamiento: '#10b981',
  mindset: '#8b5cf6',
  general: '#64748b',
};

const TREATMENT_COLORS: Record<string, string> = {
  chemotherapy: '#7c3aed',
  radiotherapy: '#f59e0b',
  hormonotherapy: '#10b981',
  immunotherapy: '#3b82f6',
  surgery: '#ef4444',
  other: '#64748b',
};

function resolveColor(category: string, customColor?: string): string {
  if (customColor) return customColor;
  const key = category.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.general;
}

export async function getPortalEvents(startDate: string, endDate: string): Promise<PortalEvent[]> {
  const { data, error } = await supabase
    .from('portal_events')
    .select('*')
    .eq('is_visible', true)
    .gte('event_date', startDate)
    .lte('event_date', endDate)
    .order('event_date', { ascending: true });

  if (error) {
    console.warn('Error fetching portal events:', error);
    return [];
  }
  return data || [];
}

export async function getCalendarItems(
  clientId: string,
  startDate: string,
  endDate: string
): Promise<CalendarItem[]> {
  const items: CalendarItem[] = [];

  const [eventsRes, treatmentsRes, clientRes] = await Promise.all([
    // 1. Public events (everyone sees these)
    supabase
      .from('portal_events')
      .select('*')
      .eq('is_visible', true)
      .gte('event_date', startDate)
      .lte('event_date', endDate)
      .order('event_date', { ascending: true }),

    // 2. Treatment sessions (only this client)
    supabase
      .from('treatment_sessions')
      .select('id, session_date, treatment_type, treatment_name, location, notes')
      .eq('client_id', clientId)
      .gte('session_date', startDate)
      .lte('session_date', endDate)
      .order('session_date', { ascending: true }),

    // 3. Client appointment
    supabase
      .from('clientes_ado_notion')
      .select('next_appointment_date, next_appointment_time, next_appointment_note, next_appointment_video_url')
      .eq('id', clientId)
      .single(),
  ]);

  // Process portal events
  eventsRes.data?.forEach(e => {
    items.push({
      id: `event-${e.id}`,
      title: e.title,
      description: e.description || undefined,
      date: e.event_date,
      time: e.event_time || undefined,
      endTime: e.end_time || undefined,
      category: e.category,
      color: resolveColor(e.category, e.category_color),
      source: 'event',
      url: e.url || undefined,
      location: e.location || undefined,
      speaker: e.speaker || undefined,
    });
  });

  // Process treatment sessions
  const TREATMENT_LABELS: Record<string, string> = {
    chemotherapy: 'Quimioterapia', radiotherapy: 'Radioterapia',
    hormonotherapy: 'Hormonoterapia', immunotherapy: 'Inmunoterapia',
    surgery: 'Cirugía', other: 'Tratamiento',
  };

  treatmentsRes.data?.forEach(t => {
    items.push({
      id: `treatment-${t.id}`,
      title: t.treatment_name || TREATMENT_LABELS[t.treatment_type] || 'Sesión de tratamiento',
      description: t.notes || undefined,
      date: t.session_date,
      category: 'Tratamiento',
      color: TREATMENT_COLORS[t.treatment_type] || TREATMENT_COLORS.other,
      source: 'treatment',
      location: t.location || undefined,
    });
  });

  // Process coach appointment
  const clientData = clientRes.data as any;
  if (clientData?.next_appointment_date) {
    const apptDate = clientData.next_appointment_date;
    if (apptDate >= startDate && apptDate <= endDate) {
      items.push({
        id: `appointment-${apptDate}`,
        title: 'Cita con tu coach',
        description: clientData.next_appointment_note || undefined,
        date: apptDate,
        time: clientData.next_appointment_time || undefined,
        category: 'Cita',
        color: '#6BA06B',
        source: 'appointment',
        url: clientData.next_appointment_video_url || undefined,
      });
    }
  }

  return items.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return (a.time || '23:59').localeCompare(b.time || '23:59');
  });
}
