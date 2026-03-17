import React, { useEffect, useState } from 'react';
import { CalendarClock, ChevronRight, Phone, User as UserIcon } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { User, Client } from '../types';
import { mapRowToClient } from '../services/mockSupabase';

interface AgendaMiniWidgetProps {
  user: User;
  onNavigateToClient: (client: Client) => void;
  onNavigateToView?: (view: string) => void;
}

interface AppointmentEntry {
  clientId: string;
  clientName: string;
  date: string;
  time: string;
  isToday: boolean;
  client?: Client;
}

export function AgendaMiniWidget({ user, onNavigateToClient, onNavigateToView }: AgendaMiniWidgetProps) {
  const [appointments, setAppointments] = useState<AppointmentEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, [user.id]);

  const loadAppointments = async () => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('status', 'active')
        .in('next_appointment_date', [todayStr, tomorrowStr])
        .order('next_appointment_time', { ascending: true })
        .limit(6);

      if (error) throw error;

      const entries: AppointmentEntry[] = (data || []).map((row: any) => {
        const client = mapRowToClient(row);
        return {
          clientId: client.id,
          clientName: `${client.firstName} ${client.surname || ''}`.trim(),
          date: row.next_appointment_date,
          time: row.next_appointment_time || '',
          isToday: row.next_appointment_date === todayStr,
          client,
        };
      });

      setAppointments(entries);
    } catch (e) {
      console.error('AgendaMini load error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 h-full">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-100 rounded w-1/2" />
          <div className="h-10 bg-slate-50 rounded-xl" />
          <div className="h-10 bg-slate-50 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-black text-slate-800">Próximas citas</h3>
        </div>
        <button
          onClick={() => onNavigateToView?.('coach-agenda')}
          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 transition-colors"
        >
          Ver agenda <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-4">
          <p className="text-xs text-slate-400 text-center">Sin citas hoy ni mañana</p>
        </div>
      ) : (
        <div className="space-y-2 flex-1">
          {appointments.map((appt, i) => (
            <button
              key={i}
              onClick={() => appt.client && onNavigateToClient(appt.client)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all text-left group"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${appt.isToday ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                {appt.isToday
                  ? <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  : <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-700 truncate group-hover:text-blue-600 transition-colors">{appt.clientName}</p>
                <p className="text-[10px] text-slate-400">
                  {appt.isToday ? 'Hoy' : 'Mañana'}{appt.time ? ` · ${appt.time}` : ''}
                </p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-slate-400 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
