import React, { useState, useEffect } from 'react';
import { Droplets, Plus, Minus } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface HydrationWidgetProps {
  clientId: string;
}

export function HydrationWidget({ clientId }: HydrationWidgetProps) {
  const [glasses, setGlasses] = useState(0);
  const [target] = useState(8);
  const [weekData, setWeekData] = useState<{ date: string; glasses: number }[]>([]);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { loadToday(); loadWeek(); }, [clientId]);

  const loadToday = async () => {
    const { data } = await supabase.from('hydration_logs').select('glasses').eq('client_id', clientId).eq('log_date', today).maybeSingle();
    if (data) setGlasses(data.glasses);
  };

  const loadWeek = async () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    const { data } = await supabase.from('hydration_logs').select('log_date, glasses').eq('client_id', clientId).gte('log_date', weekAgo.toISOString().split('T')[0]).order('log_date', { ascending: true });
    setWeekData((data || []).map((d: any) => ({ date: d.log_date, glasses: d.glasses })));
  };

  const updateGlasses = async (newVal: number) => {
    const clamped = Math.max(0, Math.min(20, newVal));
    setGlasses(clamped);
    await supabase.from('hydration_logs').upsert({
      client_id: clientId,
      log_date: today,
      glasses: clamped,
      target_glasses: target,
    }, { onConflict: 'client_id,log_date' });
  };

  const pct = Math.min(100, Math.round((glasses / target) * 100));
  const isComplete = glasses >= target;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-cyan-600" />
          <h3 className="font-bold text-sm text-cyan-800 dark:text-cyan-300">Hidratación</h3>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isComplete ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300'}`}>
          {glasses}/{target} vasos
        </span>
      </div>

      <div className="p-4">
        {/* Glass icons */}
        <div className="flex flex-wrap gap-1.5 justify-center mb-3">
          {Array.from({ length: target }).map((_, i) => (
            <button
              key={i}
              onClick={() => updateGlasses(i < glasses ? i : i + 1)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all ${
                i < glasses
                  ? 'bg-cyan-100 dark:bg-cyan-900 scale-100'
                  : 'bg-slate-50 dark:bg-slate-800 scale-95 opacity-40'
              }`}
            >
              💧
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <button onClick={() => updateGlasses(glasses - 1)} disabled={glasses <= 0} className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors">
            <Minus className="w-4 h-4 text-slate-500" />
          </button>
          <div className="text-center">
            <p className={`text-2xl font-black ${isComplete ? 'text-green-600' : 'text-cyan-600'}`}>{glasses}</p>
            <p className="text-[9px] text-slate-400 uppercase font-bold">vasos hoy</p>
          </div>
          <button onClick={() => updateGlasses(glasses + 1)} className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Plus className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
          <div className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-cyan-400 to-blue-500'}`} style={{ width: `${pct}%` }} />
        </div>

        {/* Week mini chart */}
        <div className="flex gap-1 items-end h-8">
          {Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dateStr = d.toISOString().split('T')[0];
            const entry = weekData.find(w => w.date === dateStr);
            const g = entry?.glasses || 0;
            const h = Math.max(12, (g / target) * 100);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className={`w-full rounded-sm transition-all ${g >= target ? 'bg-green-400' : g > 0 ? 'bg-cyan-300' : 'bg-slate-200 dark:bg-slate-700'}`} style={{ height: `${h}%` }} />
                <span className="text-[8px] text-slate-400">{d.toLocaleDateString('es-ES', { weekday: 'narrow' })}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
