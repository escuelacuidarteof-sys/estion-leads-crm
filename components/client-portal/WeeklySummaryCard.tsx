import React, { useState, useEffect } from 'react';
import { Dumbbell, TrendingDown, TrendingUp, Minus, Calendar, ClipboardCheck, Zap, Scale, Sparkles } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface WeeklySummaryCardProps {
  clientId: string;
}

interface WeeklySummary {
  trainingCompleted: number;
  trainingTotal: number;
  fatigueTrend: number | null;
  fatigueAvg: number | null;
  weightDelta: number | null;
  currentWeight: number | null;
  nextAppointment: { date: string; type: string } | null;
  checkinDone: boolean;
}

export function WeeklySummaryCard({ clientId }: WeeklySummaryCardProps) {
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSummary(); }, [clientId]);

  const loadSummary = async () => {
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];
      const todayStr = now.toISOString().split('T')[0];

      // Training this week
      const { data: dayLogs } = await supabase
        .from('training_client_day_logs')
        .select('completed')
        .eq('client_id', clientId)
        .gte('log_date', weekAgoStr);
      const trainingCompleted = dayLogs?.filter((d: any) => d.completed).length || 0;

      // Fatigue this week vs last week
      const { data: wellnessThisWeek } = await supabase
        .from('wellness_logs')
        .select('fatigue_level')
        .eq('client_id', clientId)
        .gte('log_date', weekAgoStr)
        .not('fatigue_level', 'is', null);

      const { data: wellnessLastWeek } = await supabase
        .from('wellness_logs')
        .select('fatigue_level')
        .eq('client_id', clientId)
        .gte('log_date', twoWeeksAgoStr)
        .lt('log_date', weekAgoStr)
        .not('fatigue_level', 'is', null);

      const avgThis = wellnessThisWeek?.length
        ? wellnessThisWeek.reduce((s: number, w: any) => s + (w.fatigue_level || 0), 0) / wellnessThisWeek.length
        : null;
      const avgLast = wellnessLastWeek?.length
        ? wellnessLastWeek.reduce((s: number, w: any) => s + (w.fatigue_level || 0), 0) / wellnessLastWeek.length
        : null;
      const fatigueTrend = avgThis != null && avgLast != null ? avgThis - avgLast : null;

      // Weight trend
      const { data: weights } = await supabase
        .from('weight_history')
        .select('weight, date')
        .eq('client_id', clientId)
        .order('date', { ascending: false })
        .limit(2);

      const weightDelta = weights && weights.length >= 2 ? weights[0].weight - weights[1].weight : null;
      const currentWeight = weights?.[0]?.weight || null;

      // Next appointment (treatment or oncology review)
      const { data: nextTreatment } = await supabase
        .from('treatment_sessions')
        .select('session_date, treatment_type')
        .eq('client_id', clientId)
        .gte('session_date', todayStr)
        .order('session_date', { ascending: true })
        .limit(1);

      const { data: nextReview } = await supabase
        .from('oncology_reviews')
        .select('next_review_date, review_type')
        .eq('client_id', clientId)
        .not('next_review_date', 'is', null)
        .gte('next_review_date', todayStr)
        .order('next_review_date', { ascending: true })
        .limit(1);

      let nextAppointment: { date: string; type: string } | null = null;
      const t = nextTreatment?.[0];
      const r = nextReview?.[0];
      if (t && r) {
        nextAppointment = t.session_date <= r.next_review_date
          ? { date: t.session_date, type: 'treatment' }
          : { date: r.next_review_date, type: 'review' };
      } else if (t) {
        nextAppointment = { date: t.session_date, type: 'treatment' };
      } else if (r) {
        nextAppointment = { date: r.next_review_date, type: 'review' };
      }

      // Check-in this week
      const monday = new Date(now);
      const day = monday.getDay();
      monday.setDate(monday.getDate() - day + (day === 0 ? -6 : 1));
      monday.setHours(0, 0, 0, 0);
      const { data: checkins } = await supabase
        .from('weekly_checkins')
        .select('id')
        .eq('client_id', clientId)
        .gte('created_at', monday.toISOString())
        .limit(1);

      setSummary({
        trainingCompleted,
        trainingTotal: 4,
        fatigueTrend,
        fatigueAvg: avgThis,
        weightDelta,
        currentWeight,
        nextAppointment,
        checkinDone: (checkins?.length || 0) > 0,
      });
    } catch (err) {
      console.warn('WeeklySummary error:', err);
    }
    setLoading(false);
  };

  if (loading || !summary) return null;

  const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Tu Semana</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Training */}
        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3">
          <Dumbbell className="w-4 h-4 text-emerald-600 mb-1" />
          <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">{summary.trainingCompleted}<span className="text-xs font-medium text-emerald-500">/{summary.trainingTotal}</span></p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-semibold">Entrenamientos</p>
        </div>

        {/* Fatigue */}
        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3">
          <Zap className="w-4 h-4 text-amber-600 mb-1" />
          {summary.fatigueAvg != null ? (
            <>
              <p className="text-lg font-black text-amber-700 dark:text-amber-400">
                {summary.fatigueAvg.toFixed(1)}<span className="text-xs font-medium text-amber-500">/10</span>
              </p>
              {summary.fatigueTrend != null && (
                <p className={`text-[10px] font-semibold flex items-center gap-0.5 ${summary.fatigueTrend < 0 ? 'text-green-600' : summary.fatigueTrend > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                  {summary.fatigueTrend < 0 ? <TrendingDown className="w-3 h-3" /> : summary.fatigueTrend > 0 ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  {summary.fatigueTrend < 0 ? `${Math.abs(summary.fatigueTrend).toFixed(1)} menos` : summary.fatigueTrend > 0 ? `${summary.fatigueTrend.toFixed(1)} más` : 'Estable'}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-amber-500">Sin datos</p>
          )}
          <p className="text-[10px] text-amber-600 dark:text-amber-500 font-semibold">Fatiga media</p>
        </div>

        {/* Weight */}
        {summary.currentWeight && (
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3">
            <Scale className="w-4 h-4 text-blue-600 mb-1" />
            <p className="text-lg font-black text-blue-700 dark:text-blue-400">{summary.currentWeight}<span className="text-xs font-medium text-blue-500">kg</span></p>
            {summary.weightDelta != null && (
              <p className={`text-[10px] font-semibold ${summary.weightDelta <= 0 ? 'text-green-600' : 'text-amber-500'}`}>
                {summary.weightDelta > 0 ? '+' : ''}{summary.weightDelta.toFixed(1)}kg vs anterior
              </p>
            )}
          </div>
        )}

        {/* Next appointment */}
        {summary.nextAppointment && (
          <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-3">
            <Calendar className="w-4 h-4 text-purple-600 mb-1" />
            <p className="text-xs font-bold text-purple-700 dark:text-purple-400 capitalize">{formatDate(summary.nextAppointment.date)}</p>
            <p className="text-[10px] text-purple-500 font-semibold">
              {summary.nextAppointment.type === 'treatment' ? 'Sesión' : 'Revisión'} oncológica
            </p>
          </div>
        )}

        {/* Check-in status */}
        <div className={`rounded-xl p-3 ${summary.checkinDone ? 'bg-green-50 dark:bg-green-950/30' : 'bg-orange-50 dark:bg-orange-950/30'}`}>
          <ClipboardCheck className={`w-4 h-4 mb-1 ${summary.checkinDone ? 'text-green-600' : 'text-orange-600'}`} />
          <p className={`text-xs font-bold ${summary.checkinDone ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'}`}>
            {summary.checkinDone ? 'Completado' : 'Pendiente'}
          </p>
          <p className={`text-[10px] font-semibold ${summary.checkinDone ? 'text-green-500' : 'text-orange-500'}`}>Check-in semanal</p>
        </div>
      </div>
    </div>
  );
}
