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
          .single();

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
  const allInsights = data.flatMap(d => d.insights);

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
          {allInsights.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">{allInsights.length} obs.</span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Week chart */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Últimos 7 días</p>
            <div className="flex gap-1">
              {data.map(d => (
                <button
                  key={d.date}
                  onClick={() => setSelectedDate(selectedDate === d.date ? null : d.date)}
                  className={`flex-1 flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-colors ${selectedDate === d.date ? 'bg-indigo-50 dark:bg-indigo-950/40 ring-2 ring-indigo-300' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  {/* Fatigue dot */}
                  <div className={`w-full h-3 rounded-sm ${symptomColor(d.fatigue)}`} title={`Fatiga: ${d.fatigue ?? '—'}`} />
                  {/* Icons */}
                  <div className="flex gap-0.5">
                    {d.trained && <Dumbbell className="w-2.5 h-2.5 text-emerald-500" />}
                    {d.hadTreatment && <Zap className="w-2.5 h-2.5 text-purple-500" />}
                  </div>
                  <span className="text-[8px] text-slate-400">
                    {new Date(d.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'narrow' })}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-2 text-[9px] text-slate-400">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-400" /> 0-3</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400" /> 4-6</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400" /> 7-10</span>
              <span className="flex items-center gap-1"><Dumbbell className="w-2.5 h-2.5 text-emerald-500" /> Entreno</span>
              <span className="flex items-center gap-1"><Zap className="w-2.5 h-2.5 text-purple-500" /> Tto.</span>
            </div>
          </div>

          {/* Selected day detail */}
          {selected && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 space-y-2">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {new Date(selected.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Síntomas</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Fatiga: {selected.fatigue ?? '—'}/10</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Náusea: {selected.nausea ?? '—'}/10</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Dolor: {selected.pain ?? '—'}/10</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Actividad</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{selected.trained ? 'Entrenó' : 'No entrenó'}</p>
                  {selected.hadTreatment && <p className="text-xs text-purple-600 font-semibold">Tratamiento</p>}
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Comidas</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{selected.meals.breakfast ? 'Desayuno ✓' : '—'}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{selected.meals.lunch ? 'Comida ✓' : '—'}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{selected.meals.dinner ? 'Cena ✓' : '—'}</p>
                </div>
              </div>
              {selected.insights.length > 0 && (
                <div className="space-y-1 mt-2">
                  {selected.insights.map((ins, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-lg">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {ins}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Aggregated insights */}
          {allInsights.length > 0 && !selected && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Observaciones de la semana</p>
              {[...new Set(allInsights)].map((ins, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-lg">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {ins}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
