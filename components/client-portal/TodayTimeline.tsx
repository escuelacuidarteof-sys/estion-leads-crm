import React, { useState, useEffect } from 'react';
import { Pill, Dumbbell, Utensils, Calendar, Clock, CheckCircle2, Circle } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { MedicationSchedule, MedicationLog } from '../../types';

interface TodayTimelineProps {
  clientId: string;
  nutritionPlanId?: string;
}

interface TimelineItem {
  id: string;
  type: 'medication' | 'training' | 'meal' | 'treatment';
  time_of_day: string; // morning, afternoon, evening, night
  title: string;
  description?: string;
  completed: boolean;
}

const TIME_ORDER = { morning: 1, afternoon: 2, evening: 3, night: 4 };

export function TodayTimeline({ clientId, nutritionPlanId }: TodayTimelineProps) {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { loadTimeline(); }, [clientId]);

  const loadTimeline = async () => {
    try {
      const allItems: TimelineItem[] = [];

      // 1. Medications
      const { data: meds } = await supabase.from('medication_schedule').select('*').eq('client_id', clientId).eq('active', true);
      const { data: medLogs } = await supabase.from('medication_logs').select('*').eq('client_id', clientId).eq('log_date', today);

      meds?.forEach(m => {
        allItems.push({
          id: `med-${m.id}`,
          type: 'medication',
          time_of_day: m.time_of_day,
          title: m.medication_name,
          description: m.dosage || '',
          completed: medLogs?.find(l => l.medication_id === m.id)?.taken || false,
        });
      });

      // 2. Training (if scheduled for today)
      // Logic: if current program day is active today
      const { data: trainingLogs } = await supabase.from('training_client_day_logs').select('*').eq('client_id', clientId).eq('log_date', today);
      if (trainingLogs && trainingLogs.length > 0) {
        allItems.push({
          id: 'training-today',
          type: 'training',
          time_of_day: 'afternoon', // Default
          title: 'Entrenamiento del día',
          completed: trainingLogs[0].completed,
        });
      }

      // 3. Meals from WeeklyPlanner
      if (nutritionPlanId) {
        try {
          const d = new Date();
          const dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1;
          const saved = localStorage.getItem(`ec_crm_weekly_plan_${nutritionPlanId}`);
          if (saved) {
            const grid = JSON.parse(saved);
            if (grid[`${dayOfWeek}-breakfast`]) {
              allItems.push({ id: 'meal-b', type: 'meal', time_of_day: 'morning', title: 'Desayuno', description: grid[`${dayOfWeek}-breakfast`], completed: false });
            }
            if (grid[`${dayOfWeek}-lunch`]) {
              allItems.push({ id: 'meal-l', type: 'meal', time_of_day: 'afternoon', title: 'Almuerzo', description: grid[`${dayOfWeek}-lunch`], completed: false });
            }
            if (grid[`${dayOfWeek}-dinner`]) {
              allItems.push({ id: 'meal-d', type: 'meal', time_of_day: 'evening', title: 'Cena', description: grid[`${dayOfWeek}-dinner`], completed: false });
            }
          }
        } catch {}
      }

      // 4. Treatment
      const { data: treatments } = await supabase.from('treatment_sessions').select('*').eq('client_id', clientId).eq('session_date', today);
      treatments?.forEach(t => {
        allItems.push({
          id: `treat-${t.id}`,
          type: 'treatment',
          time_of_day: 'morning',
          title: t.treatment_name || t.treatment_type,
          description: 'Sesión hoy',
          completed: false,
        });
      });

      setItems(allItems.sort((a, b) => (TIME_ORDER[a.time_of_day as keyof typeof TIME_ORDER] || 0) - (TIME_ORDER[b.time_of_day as keyof typeof TIME_ORDER] || 0)));
    } catch (err) {
      console.warn('TodayTimeline error:', err);
    }
    setLoading(false);
  };

  if (loading || items.length === 0) return null;

  const ICON_MAP = {
    medication: Pill,
    training: Dumbbell,
    meal: Utensils,
    treatment: Calendar,
  };

  const COLOR_MAP = {
    medication: 'text-violet-500 bg-violet-50 dark:bg-violet-950/30',
    training: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
    meal: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30',
    treatment: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30',
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-brand-green" />
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Cronograma de Hoy</h3>
      </div>

      <div className="relative space-y-4 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
        {items.map(item => {
          const Icon = ICON_MAP[item.type];
          return (
            <div key={item.id} className="relative pl-9">
              <div className={`absolute left-1.5 top-0.5 w-4 h-4 rounded-full border-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 z-10 flex items-center justify-center ${item.completed ? 'border-emerald-500 bg-emerald-50! dark:bg-emerald-950!' : ''}`}>
                {item.completed && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />}
              </div>
              <div className={`rounded-xl p-3 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-colors ${item.completed ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${COLOR_MAP[item.type]}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${item.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-[11px] text-slate-400 truncate">{item.description}</p>
                    )}
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-300 dark:text-slate-600 tracking-wider">
                    {item.time_of_day}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
