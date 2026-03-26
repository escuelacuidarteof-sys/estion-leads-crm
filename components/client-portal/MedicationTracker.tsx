import React, { useState, useEffect } from 'react';
import { Pill, Plus, Check, Edit3, Trash2, ChevronUp } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { MedicationSchedule, MedicationLog } from '../../types';

interface MedicationTrackerProps {
  clientId: string;
}

const TIME_LABELS: Record<string, string> = {
  morning: 'Mañana',
  afternoon: 'Mediodía',
  evening: 'Tarde',
  night: 'Noche',
};

const TIME_ICONS: Record<string, string> = {
  morning: '🌅',
  afternoon: '☀️',
  evening: '🌇',
  night: '🌙',
};

export function MedicationTracker({ clientId }: MedicationTrackerProps) {
  const [meds, setMeds] = useState<MedicationSchedule[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingMed, setEditingMed] = useState<Partial<MedicationSchedule> | null>(null);
  const [historyLogs, setHistoryLogs] = useState<MedicationLog[]>([]);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { loadData(); }, [clientId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [schedRes, logsRes] = await Promise.all([
        supabase.from('medication_schedule').select('*').eq('client_id', clientId).eq('active', true).order('time_of_day'),
        supabase.from('medication_logs').select('*').eq('client_id', clientId).eq('log_date', today),
      ]);
      setMeds((schedRes.data || []) as MedicationSchedule[]);
      setLogs((logsRes.data || []) as MedicationLog[]);
    } catch (err) {
      console.warn('MedicationTracker load error:', err);
    }
    setLoading(false);
  };

  const toggleTaken = async (medId: string) => {
    const existing = logs.find(l => l.medication_id === medId);
    const newTaken = !existing?.taken;

    await supabase.from('medication_logs').upsert({
      client_id: clientId,
      medication_id: medId,
      log_date: today,
      taken: newTaken,
      taken_at: newTaken ? new Date().toISOString() : null,
    }, { onConflict: 'medication_id,log_date' });

    setLogs(prev => {
      const filtered = prev.filter(l => l.medication_id !== medId);
      return [...filtered, { id: existing?.id || crypto.randomUUID(), client_id: clientId, medication_id: medId, log_date: today, taken: newTaken, taken_at: newTaken ? new Date().toISOString() : undefined }];
    });
  };

  const saveMed = async () => {
    if (!editingMed?.medication_name?.trim()) return;
    const payload = {
      client_id: clientId,
      medication_name: editingMed.medication_name.trim(),
      dosage: editingMed.dosage || '',
      time_of_day: editingMed.time_of_day || 'morning',
      frequency: 'daily',
      active: true,
      notes: editingMed.notes || '',
    };
    if (editingMed.id) {
      await supabase.from('medication_schedule').update(payload).eq('id', editingMed.id);
    } else {
      await supabase.from('medication_schedule').insert(payload);
    }
    setEditingMed(null);
    setShowConfig(false);
    loadData();
  };

  const deleteMed = async (id: string) => {
    await supabase.from('medication_schedule').update({ active: false }).eq('id', id);
    setEditingMed(null);
    setShowConfig(false);
    loadData();
  };

  const loadHistory = async () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data } = await supabase.from('medication_logs').select('*').eq('client_id', clientId).gte('log_date', weekAgo.toISOString().split('T')[0]).order('log_date', { ascending: false });
    setHistoryLogs((data || []) as MedicationLog[]);
    setShowHistory(true);
  };

  const isTaken = (medId: string) => logs.find(l => l.medication_id === medId)?.taken || false;
  const takenCount = meds.filter(m => isTaken(m.id)).length;

  if (loading) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pill className="w-5 h-5 text-violet-600" />
          <h3 className="font-bold text-sm text-violet-800 dark:text-violet-300">Medicación del Día</h3>
        </div>
        <div className="flex items-center gap-2">
          {meds.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300">
              {takenCount}/{meds.length}
            </span>
          )}
          <button onClick={() => { setEditingMed({ time_of_day: 'morning' }); setShowConfig(true); }} className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900 flex items-center justify-center hover:bg-violet-200 transition-colors">
            <Plus className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </button>
        </div>
      </div>

      {/* Meds list */}
      {meds.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <Pill className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Sin medicación configurada</p>
          <button onClick={() => { setEditingMed({ time_of_day: 'morning' }); setShowConfig(true); }} className="mt-2 text-xs font-bold text-violet-600 hover:underline">
            + Añadir medicamento
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {meds.map(med => {
            const taken = isTaken(med.id);
            return (
              <div key={med.id} className={`px-4 py-3 flex items-center gap-3 transition-colors ${taken ? 'bg-green-50/50 dark:bg-green-950/20' : ''}`}>
                <button
                  onClick={() => toggleTaken(med.id)}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${taken ? 'bg-green-500 border-green-500' : 'border-slate-300 dark:border-slate-600 hover:border-violet-400'}`}
                >
                  {taken && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold transition-colors ${taken ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                    {med.medication_name}
                  </p>
                  {med.dosage && <p className="text-[11px] text-slate-400">{med.dosage}</p>}
                </div>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  {TIME_ICONS[med.time_of_day]} {TIME_LABELS[med.time_of_day]}
                </span>
                <button onClick={() => { setEditingMed(med); setShowConfig(true); }} className="text-slate-300 hover:text-slate-500">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress bar */}
      {meds.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-50 dark:border-slate-800 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-green-500 rounded-full transition-all duration-500" style={{ width: `${meds.length > 0 ? (takenCount / meds.length) * 100 : 0}%` }} />
          </div>
          <button onClick={loadHistory} className="text-[10px] font-semibold text-violet-500 hover:underline whitespace-nowrap">
            Ver historial
          </button>
        </div>
      )}

      {/* History */}
      {showHistory && (
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-500">Últimos 7 días</p>
            <button onClick={() => setShowHistory(false)}><ChevronUp className="w-4 h-4 text-slate-400" /></button>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 7 }).map((_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (6 - i));
              const dateStr = d.toISOString().split('T')[0];
              const dayLogs = historyLogs.filter(l => l.log_date === dateStr);
              const takenDay = dayLogs.filter(l => l.taken).length;
              const pct = meds.length > 0 ? takenDay / meds.length : 0;
              return (
                <div key={i} className="flex-1 text-center">
                  <div className={`h-6 rounded-md ${pct >= 1 ? 'bg-green-400' : pct > 0 ? 'bg-amber-300' : 'bg-slate-200 dark:bg-slate-700'}`} />
                  <p className="text-[9px] text-slate-400 mt-0.5">{d.toLocaleDateString('es-ES', { weekday: 'narrow' })}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Config modal */}
      {showConfig && editingMed && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={() => { setShowConfig(false); setEditingMed(null); }}>
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">{editingMed.id ? 'Editar' : 'Nuevo'} Medicamento</h3>
            <div className="space-y-3">
              <input value={editingMed.medication_name || ''} onChange={e => setEditingMed({ ...editingMed, medication_name: e.target.value })} placeholder="Nombre del medicamento" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-slate-200" />
              <input value={editingMed.dosage || ''} onChange={e => setEditingMed({ ...editingMed, dosage: e.target.value })} placeholder="Dosis (ej: 500mg)" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-slate-200" />
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1.5">Momento del día</p>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(TIME_LABELS).map(([key, label]) => (
                    <button key={key} onClick={() => setEditingMed({ ...editingMed, time_of_day: key })} className={`px-2 py-2 rounded-xl text-xs font-semibold border transition-colors ${editingMed.time_of_day === key ? 'bg-violet-100 border-violet-300 text-violet-700 dark:bg-violet-900 dark:border-violet-600 dark:text-violet-300' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                      {TIME_ICONS[key]} {label}
                    </button>
                  ))}
                </div>
              </div>
              <textarea value={editingMed.notes || ''} onChange={e => setEditingMed({ ...editingMed, notes: e.target.value })} placeholder="Notas (opcional)" rows={2} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-slate-200" />
            </div>
            <div className="flex gap-2 mt-4">
              {editingMed.id && (
                <button onClick={() => deleteMed(editingMed.id!)} className="px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-xl flex items-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" />Eliminar
                </button>
              )}
              <div className="flex-1" />
              <button onClick={() => { setShowConfig(false); setEditingMed(null); }} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-xl">Cancelar</button>
              <button onClick={saveMed} className="px-4 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
