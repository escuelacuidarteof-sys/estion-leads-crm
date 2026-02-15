import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Sun, Moon, Zap, AlertCircle, Check, FileText, Send } from 'lucide-react';

interface WellnessLog {
    id: string;
    log_date: string;
    energy_level: number | null;
    sleep_quality: number | null;
    stress_level: number | null;
    mood: string | null;
    notes?: string;
}

interface WellnessCardProps {
    clientId: string;
}

const MOODS = [
    { value: 'great', label: 'Genial', emoji: '😊', color: 'text-emerald-500' },
    { value: 'good', label: 'Bien', emoji: '🙂', color: 'text-green-500' },
    { value: 'neutral', label: 'Normal', emoji: '😐', color: 'text-amber-500' },
    { value: 'low', label: 'Bajo', emoji: '😕', color: 'text-orange-500' },
    { value: 'bad', label: 'Mal', emoji: '😢', color: 'text-rose-500' }
];

const StarRating = ({ value, onChange, label, icon: Icon }: { value: number; onChange: (v: number) => void; label: string; icon: React.ElementType }) => (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
        <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">{label}</span>
        </div>
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    className={`w-8 h-8 rounded-lg transition-all ${star <= value
                        ? 'bg-amber-400 text-white shadow-sm'
                        : 'bg-slate-200 text-slate-400 hover:bg-slate-300'
                        }`}
                >
                    {star <= value ? '★' : '☆'}
                </button>
            ))}
        </div>
    </div>
);

export function WellnessCard({ clientId }: WellnessCardProps) {
    const [todayLog, setTodayLog] = useState<WellnessLog | null>(null);
    const [weekLogs, setWeekLogs] = useState<WellnessLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showNotesInput, setShowNotesInput] = useState(false);

    // Form state
    const [energy, setEnergy] = useState(3);
    const [sleep, setSleep] = useState(3);
    const [stress, setStress] = useState(3);
    const [mood, setMood] = useState('neutral');
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingNote, setIsSavingNote] = useState(false);

    useEffect(() => {
        loadData();
    }, [clientId]);

    const loadData = async () => {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];

        // Today's log
        const { data: todayData } = await supabase
            .from('wellness_logs')
            .select('*')
            .eq('client_id', clientId)
            .eq('log_date', today)
            .single();

        if (todayData) {
            setTodayLog(todayData);
            setEnergy(todayData.energy_level || 3);
            setSleep(todayData.sleep_quality || 3);
            setStress(todayData.stress_level || 3);
            setMood(todayData.mood || 'neutral');
            setNotes(todayData.notes || '');
        } else {
            setNotes('');
        }

        // Last 7 days
        const { data: weekData } = await supabase
            .from('wellness_logs')
            .select('*')
            .eq('client_id', clientId)
            .order('log_date', { ascending: false })
            .limit(7);

        if (weekData) setWeekLogs(weekData);
        setLoading(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const today = new Date().toISOString().split('T')[0];

        try {
            const { error } = await supabase
                .from('wellness_logs')
                .upsert({
                    client_id: clientId,
                    log_date: today,
                    energy_level: energy,
                    sleep_quality: sleep,
                    stress_level: stress,
                    mood: mood,
                    notes: notes || null
                }, { onConflict: 'client_id,log_date' });

            if (error) throw error;
            loadData();
            setIsExpanded(false);
        } catch (error) {
            console.error('Error saving wellness:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveNote = async () => {
        if (!notes.trim()) return;

        setIsSavingNote(true);
        const today = new Date().toISOString().split('T')[0];

        try {
            // Si ya existe un registro de hoy, actualizamos solo las notas
            // Si no existe, creamos uno nuevo con valores por defecto
            const { error } = await supabase
                .from('wellness_logs')
                .upsert({
                    client_id: clientId,
                    log_date: today,
                    energy_level: todayLog?.energy_level || null,
                    sleep_quality: todayLog?.sleep_quality || null,
                    stress_level: todayLog?.stress_level || null,
                    mood: todayLog?.mood || null,
                    notes: notes
                }, { onConflict: 'client_id,log_date' });

            if (error) throw error;
            loadData();
            setShowNotesInput(false);
        } catch (error) {
            console.error('Error saving note:', error);
        } finally {
            setIsSavingNote(false);
        }
    };

    // Calculate weekly averages
    const avgEnergy = weekLogs.length > 0
        ? (weekLogs.reduce((s, l) => s + (l.energy_level || 0), 0) / weekLogs.length).toFixed(1)
        : '--';
    const avgSleep = weekLogs.length > 0
        ? (weekLogs.reduce((s, l) => s + (l.sleep_quality || 0), 0) / weekLogs.length).toFixed(1)
        : '--';

    const moodData = MOODS.find(m => m.value === (todayLog?.mood || mood));

    return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 border border-amber-100 hover:shadow-lg transition-shadow">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-200">
                        <Sun className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Bienestar</h3>
                        <p className="text-sm text-slate-500">¿Cómo te sientes hoy?</p>
                    </div>
                </div>
                {todayLog && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                        <Check className="w-3 h-3" /> Registrado
                    </div>
                )}
            </div>

            {/* Quick View or Expanded Form */}
            {!isExpanded ? (
                <>
                    {/* Today's Summary */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center p-3 bg-white rounded-xl shadow-sm">
                            <span className="text-2xl">{moodData?.emoji || '😐'}</span>
                            <p className="text-xs text-slate-500 mt-1">{moodData?.label || 'Normal'}</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-xl shadow-sm">
                            <p className="text-lg font-bold text-amber-600">{todayLog?.energy_level || '--'}<span className="text-xs text-slate-400">/5</span></p>
                            <p className="text-xs text-slate-500">Energía</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-xl shadow-sm">
                            <p className="text-lg font-bold text-indigo-600">{todayLog?.sleep_quality || '--'}<span className="text-xs text-slate-400">/5</span></p>
                            <p className="text-xs text-slate-500">Sueño</p>
                        </div>
                    </div>

                    {/* Weekly Averages */}
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-4 px-2">
                        <span>Promedio semanal: Energía {avgEnergy} • Sueño {avgSleep}</span>
                    </div>

                    {/* Today's Note Preview */}
                    {todayLog?.notes && (
                        <div className="mb-4 p-3 bg-white/80 rounded-xl border border-amber-200/50">
                            <div className="flex items-start gap-2">
                                <FileText className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-amber-700 uppercase mb-1">Nota de hoy</p>
                                    <p className="text-sm text-slate-700 leading-relaxed">{todayLog.notes}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => setIsExpanded(true)}
                        className="w-full py-3 bg-white text-amber-600 font-bold rounded-xl shadow-sm hover:shadow-md transition-all border border-amber-200"
                    >
                        {todayLog ? 'Actualizar Registro' : 'Registrar Hoy'}
                    </button>
                </>
            ) : (
                <div className="space-y-4">
                    {/* Mood Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Estado de ánimo</label>
                        <div className="flex gap-2 justify-center">
                            {MOODS.map(m => (
                                <button
                                    key={m.value}
                                    type="button"
                                    onClick={() => setMood(m.value)}
                                    className={`w-12 h-12 rounded-xl text-2xl transition-all ${mood === m.value
                                        ? 'bg-amber-100 ring-2 ring-amber-400 scale-110'
                                        : 'bg-white hover:bg-slate-50'
                                        }`}
                                >
                                    {m.emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ratings */}
                    <StarRating value={energy} onChange={setEnergy} label="Energía" icon={Zap} />
                    <StarRating value={sleep} onChange={setSleep} label="Calidad sueño" icon={Moon} />
                    <StarRating value={6 - stress} onChange={(v) => setStress(6 - v)} label="Estrés (menos es mejor)" icon={AlertCircle} />

                    {/* Important Notes Section */}
                    <div className="pt-2 border-t border-amber-200/50">
                        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-rose-500" />
                            Nota Importante del Día
                        </label>
                        <p className="text-xs text-slate-500 mb-2">
                            Registra aquí eventos importantes: problemas de salud, efectos del tratamiento, lesiones, visitas al médico, etc. Tu coach lo revisará.
                        </p>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ej: Hoy he tenido más energía después del paseo matutino. He podido hacer toda la rutina de ejercicios. Me siento más fuerte."
                            rows={3}
                            className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none resize-none bg-white"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="flex-1 py-3 text-slate-500 font-bold rounded-xl hover:bg-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-amber-200 hover:shadow-xl disabled:opacity-50 transition-all"
                        >
                            {isSaving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </div>
            )}

            {/* Quick Note Button (Always visible when collapsed and no note exists) */}
            {!isExpanded && !showNotesInput && !todayLog?.notes && (
                <button
                    onClick={() => setShowNotesInput(true)}
                    className="w-full mt-3 py-2.5 bg-rose-50 text-rose-600 font-medium rounded-xl border border-rose-200 hover:bg-rose-100 transition-all flex items-center justify-center gap-2 text-sm"
                >
                    <FileText className="w-4 h-4" />
                    Añadir Nota Importante
                </button>
            )}

            {/* Quick Note Input (When button is clicked) */}
            {!isExpanded && showNotesInput && (
                <div className="mt-4 p-4 bg-white rounded-xl border border-rose-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-rose-500" />
                        <span className="text-sm font-bold text-slate-700">Nota Importante del Día</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                        Solo para eventos importantes: problemas de salud, incidentes, visitas médicas...
                    </p>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ej: Hoy me he dado un golpe en la rodilla y no puedo entrenar..."
                        rows={3}
                        className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none resize-none"
                        autoFocus
                    />
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={() => { setShowNotesInput(false); setNotes(todayLog?.notes || ''); }}
                            className="flex-1 py-2.5 text-slate-500 font-medium rounded-lg hover:bg-slate-50 transition-colors text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSaveNote}
                            disabled={isSavingNote || !notes.trim()}
                            className="flex-1 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold rounded-lg shadow-sm hover:shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm"
                        >
                            {isSavingNote ? 'Enviando...' : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Enviar a Coach
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
