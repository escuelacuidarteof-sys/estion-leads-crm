import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar, AlertTriangle, TrendingUp, Dumbbell, Utensils, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface SymptomInsightsProps {
  clientId: string;
  nutritionPlanId?: string;
}

interface DayCorrelation {
  date: string;
  fatigue: number | null;
  nausea: number | null;
  pain: number | null;
  energy: number | null;
  trained: boolean;
  trainingType?: string;
  hadTreatment: boolean;
  treatmentType?: string;
  meals: { breakfast?: string; lunch?: string; dinner?: string };
  insights: string[];
}

export function SymptomInsights({ clientId, nutritionPlanId }: SymptomInsightsProps) {
  const [data, setData] = useState<DayCorrelation[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadWeekData(); }, [clientId]);

  const loadWeekData = async () => {
    setLoading(true);
    try {
      const days: DayCorrelation[] = [];
      const now = new Date();

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        // Wellness
        const { data: wellness } = await supabase
          .from('wellness_logs')
          .select('fatigue_level, nausea_level, pain_level, energy_level')
          .eq('client_id', clientId)
          .eq('log_date', dateStr)
          .maybeSingle();

        // Training
        const { data: training } = await supabase
          .from('training_client_day_logs')
          .select('completed')
          .eq('client_id', clientId)
          .eq('log_date', dateStr);

        // Treatment
        const { data: treatment } = await supabase
          .from('treatment_sessions')
          .select('treatment_type, treatment_name')
          .eq('client_id', clientId)
          .eq('session_date', dateStr);

        // Meals from localStorage
        const meals: { breakfast?: string; lunch?: string; dinner?: string } = {};
        if (nutritionPlanId) {
          try {
            const dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1;
            const saved = localStorage.getItem(`ec_crm_weekly_plan_${nutritionPlanId}`);
            if (saved) {
              const grid = JSON.parse(saved);
              meals.breakfast = grid[`${dayOfWeek}-breakfast`] || undefined;
              meals.lunch = grid[`${dayOfWeek}-lunch`] || undefined;
              meals.dinner = grid[`${dayOfWeek}-dinner`] || undefined;
            }
          } catch {}
        }

        const fatigue = wellness?.fatigue_level ?? null;
        const nausea = wellness?.nausea_level ?? null;
        const pain = wellness?.pain_level ?? null;
        const trained = training?.some((t: any) => t.completed) || false;
        const hadTreatment = (treatment?.length || 0) > 0;

        // Auto insights
        const insights: string[] = [];
        if (fatigue != null && fatigue > 7 && trained) {
          insights.push('Alta fatiga en día de entrenamiento');
        }
        if (fatigue != null && fatigue > 7 && hadTreatment) {
          insights.push('Alta fatiga post-tratamiento');
        }
        if (nausea != null && nausea > 6) {
          insights.push('Náuseas elevadas');
        }
        if (hadTreatment) {
          insights.push(`Sesión: ${treatment?.[0]?.treatment_name || treatment?.[0]?.treatment_type || 'Tratamiento'}`);
        }

        days.push({
          date: dateStr,
          fatigue,
          nausea,
          pain,
          energy: wellness?.energy_level ?? null,
          trained,
          hadTreatment,
          treatmentType: treatment?.[0]?.treatment_type,
          meals,
          insights,
        });
      }

      setData(days);
    } catch (err) {
      console.warn('SymptomInsights error:', err);
    }
    setLoading(false);
  };

  if (loading) return null;

  const hasData = data.some(d => d.fatigue != null || d.nausea != null || d.pain != null);
  if (!hasData) return null;

  const selected = selectedDate ? data.find(d => d.date === selectedDate) : null;

  const symptomColor = (val: number | null) => {
    if (val == null) return 'bg-slate-200 dark:bg-slate-700';
    if (val <= 3) return 'bg-green-400';
    if (val <= 6) return 'bg-amber-400';
    return 'bg-red-400';
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full px-4 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-sm text-indigo-800 dark:text-indigo-300">Correlaciones</h3>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-indigo-500" /> : <ChevronDown className="w-4 h-4 text-indigo-500" />}
      </button>

      {expanded && (
        <div className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
          <p className="text-[11px] text-slate-500 mb-2">Selecciona un día para ver la relación entre tus síntomas, comidas y ejercicio.</p>
          
          <div className="flex gap-1.5 h-12">
            {data.map(d => (
              <button
                key={d.date}
                onClick={() => setSelectedDate(d.date === selectedDate ? null : d.date)}
                className={`flex-1 flex flex-col items-center justify-end rounded-lg transition-all border-2 ${selectedDate === d.date ? 'border-indigo-500 shadow-md' : 'border-transparent'}`}
              >
                <div className={`w-full rounded-md transition-all ${symptomColor(d.fatigue)}`} style={{ height: `${(d.fatigue || 0) * 10}%`, minHeight: '4px' }} />
                <span className="text-[8px] font-bold text-slate-400 mt-1">{new Date(d.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'narrow' })}</span>
              </button>
            ))}
          </div>

          {selected ? (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b dark:border-slate-700 pb-2">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{new Date(selected.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
                {selected.insights.length > 0 && <span className="text-[9px] font-black uppercase text-red-500 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Patrón detectado</span>}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Síntomas */}
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><Zap className="w-3 h-3" /> Síntomas</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Fatiga</span>
                      <span className={`font-bold ${selected.fatigue && selected.fatigue > 7 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>{selected.fatigue || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Náuseas</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{selected.nausea || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Energía</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{selected.energy || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Dieta */}
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><Utensils className="w-3 h-3" /> Dieta</p>
                  <div className="space-y-0.5 min-h-[30px]">
                    {selected.meals.lunch ? (
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-tight">Almuerzo: {selected.meals.lunch}</p>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">Sin registro</p>
                    )}
                  </div>
                </div>

                {/* Entrenamiento */}
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><Dumbbell className="w-3 h-3" /> Ejercicio</p>
                  <div className="flex items-center gap-1">
                    {selected.trained ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">Completado</span>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No realizado</span>
                    )}
                  </div>
                </div>
              </div>

              {selected.insights.length > 0 && (
                <div className="pt-2 border-t dark:border-slate-700">
                  {selected.insights.map((insight, idx) => (
                    <p key={idx} className="text-[10px] font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                      • {insight}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] text-slate-400 italic justify-center py-4">
              <TrendingUp className="w-3.5 h-3.5" /> Pulsa en una barra para analizar patrones
            </div>
          )}
        </div>
      )}
    </div>
  );
}
