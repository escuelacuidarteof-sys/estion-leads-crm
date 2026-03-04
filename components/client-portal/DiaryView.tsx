import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookText, Calendar, Heart, Loader2, Save } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface DiaryViewProps {
  clientId: string;
  clientName: string;
  onBack: () => void;
}

interface DiaryEntry {
  id: string;
  log_date: string;
  notes: string | null;
  mood: string | null;
  energy_level: number | null;
}

const MOODS = [
  { value: 'great', label: 'Genial', emoji: '😊' },
  { value: 'good', label: 'Bien', emoji: '🙂' },
  { value: 'neutral', label: 'Normal', emoji: '😐' },
  { value: 'low', label: 'Bajo', emoji: '😕' },
  { value: 'bad', label: 'Mal', emoji: '😢' }
];

export function DiaryView({ clientId, clientName, onBack }: DiaryViewProps) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [todayNotes, setTodayNotes] = useState('');
  const [todayMood, setTodayMood] = useState('neutral');
  const [todayEnergy, setTodayEnergy] = useState(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const loadEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wellness_logs')
        .select('id, log_date, notes, mood, energy_level')
        .eq('client_id', clientId)
        .not('notes', 'is', null)
        .neq('notes', '')
        .order('log_date', { ascending: false })
        .limit(45);

      if (error) throw error;

      const items = (data || []) as DiaryEntry[];
      setEntries(items);

      const todayEntry = items.find((e) => e.log_date === today);
      if (todayEntry) {
        setTodayNotes(todayEntry.notes || '');
        setTodayMood(todayEntry.mood || 'neutral');
        const safeEnergy = Math.min(5, Math.max(1, Number(todayEntry.energy_level) || 3));
        setTodayEnergy(safeEnergy);
      }
    } catch (error) {
      console.error('Error loading diary entries:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [clientId]);

  const saveTodayEntry = async () => {
    if (!todayNotes.trim()) return;
    setSaving(true);
    try {
      const normalizedEnergy = Math.min(5, Math.max(1, Number(todayEnergy) || 3));
      const { error } = await supabase
        .from('wellness_logs')
        .upsert({
          client_id: clientId,
          log_date: today,
          notes: todayNotes.trim(),
          mood: todayMood,
          energy_level: normalizedEnergy
        }, { onConflict: 'client_id,log_date' });

      if (error) throw error;
      await loadEntries();
    } catch (error) {
      console.error('Error saving diary entry:', error);
      alert('No se pudo guardar tu diario. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const moodPreview = useMemo(() => {
    return MOODS.find((m) => m.value === todayMood);
  }, [todayMood]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> Volver
        </button>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                <BookText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Tu diario</h1>
                <p className="text-emerald-100 text-sm">Escribe cómo te sientes hoy, {clientName}.</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Estado de ánimo</p>
                <div className="flex gap-1.5 flex-wrap">
                  {MOODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setTodayMood(m.value)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${todayMood === m.value ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-white border-slate-200 text-slate-600'}`}
                    >
                      {m.emoji} {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Energía hoy</p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={todayEnergy}
                    onChange={(e) => setTodayEnergy(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                  <span className="text-sm font-bold text-emerald-700 w-10 text-right">{todayEnergy}/5</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">¿Cómo te sientes hoy?</label>
              <textarea
                value={todayNotes}
                onChange={(e) => setTodayNotes(e.target.value)}
                rows={5}
                placeholder="Escribe libremente cómo te has sentido, qué te ayudó hoy, qué te preocupó o qué necesitas del equipo..."
                className="mt-2 w-full rounded-xl border border-slate-200 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveTodayEntry}
                disabled={saving || !todayNotes.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar entrada de hoy
              </button>
            </div>

            {moodPreview && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 flex items-center gap-2">
                <Heart className="w-4 h-4" /> Tu registro de hoy: {moodPreview.emoji} {moodPreview.label} · Energía {todayEnergy}/5
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Historial de diario</h2>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Cargando entradas...
            </div>
          ) : entries.length === 0 ? (
            <div className="py-10 text-center text-slate-500">
              Aún no tienes entradas en tu diario.
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {entries.map((entry) => {
                const moodInfo = MOODS.find((m) => m.value === (entry.mood || 'neutral'));
                return (
                  <div key={entry.id} className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{new Date(entry.log_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                      <p className="text-xs text-slate-500">{moodInfo?.emoji || '😐'} {moodInfo?.label || 'Normal'} · {entry.energy_level || '-'} /5</p>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-line">{entry.notes}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
