import React, { useEffect, useState } from 'react';
import { ClipboardCheck, Phone, ShieldAlert, CheckSquare, ChevronRight, Sparkles } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { User } from '../types';

interface TodayFocusWidgetProps {
  user: User;
  onNavigateToView?: (view: string) => void;
}

interface FocusItem {
  icon: React.ElementType;
  label: string;
  count: number;
  color: string;
  bgColor: string;
  view: string;
}

export function TodayFocusWidget({ user, onNavigateToView }: TodayFocusWidgetProps) {
  const [pendingCheckins, setPendingCheckins] = useState(0);
  const [todayAppointments, setTodayAppointments] = useState(0);
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFocusData();
  }, [user.id]);

  const loadFocusData = async () => {
    try {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const todayStr = now.toISOString().split('T')[0];

      // Parallel queries
      const [checkinsRes, appointmentsRes, alertsRes, tasksRes] = await Promise.all([
        // Checkins this week without coach_notes (pending review)
        supabase
          .from('weekly_checkins')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', weekStartStr)
          .or('coach_notes.is.null,coach_notes.eq.'),
        // Today's appointments
        supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .eq('next_appointment_date', todayStr),
        // Active risk alerts for this coach
        supabase
          .from('risk_alerts')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .eq('coach_id', user.id),
        // Pending tasks
        supabase
          .from('coach_tasks')
          .select('id', { count: 'exact', head: true })
          .eq('assigned_to', user.id)
          .eq('status', 'pending'),
      ]);

      setPendingCheckins(checkinsRes.count || 0);
      setTodayAppointments(appointmentsRes.count || 0);
      setActiveAlerts(alertsRes.count || 0);
      setPendingTasks(tasksRes.count || 0);
    } catch (e) {
      console.error('TodayFocus load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
  const firstName = user.name?.split(' ')[0] || 'Coach';

  const items: FocusItem[] = [
    { icon: ClipboardCheck, label: 'Check-ins por revisar', count: pendingCheckins, color: 'text-blue-600', bgColor: 'bg-blue-50', view: 'reviews' },
    { icon: Phone, label: 'Llamadas hoy', count: todayAppointments, color: 'text-emerald-600', bgColor: 'bg-emerald-50', view: 'coach-agenda' },
    { icon: ShieldAlert, label: 'Alertas activas', count: activeAlerts, color: 'text-rose-600', bgColor: 'bg-rose-50', view: 'risk-alerts' },
    { icon: CheckSquare, label: 'Tareas pendientes', count: pendingTasks, color: 'text-amber-600', bgColor: 'bg-amber-50', view: 'coach-tasks' },
  ].filter(i => i.count > 0);

  if (loading) return null;

  // If nothing pending, show a success message
  if (items.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 rounded-xl">
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-black text-emerald-800 text-sm">{greeting}, {firstName}</p>
            <p className="text-xs text-emerald-600">Todo al día. Sin pendientes ahora mismo.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-tour="today-focus" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-blue-50 border border-slate-200 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tu día</p>
          <p className="font-black text-slate-800 text-lg leading-tight">{greeting}, {firstName}</p>
        </div>
        <p className="text-xs text-slate-400 font-medium">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.view}
              onClick={() => onNavigateToView?.(item.view)}
              className="flex flex-col items-start gap-2 p-3 rounded-xl bg-white border border-slate-100 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all text-left group"
            >
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-800 leading-none">{item.count}</p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-tight">{item.label}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 self-end opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
