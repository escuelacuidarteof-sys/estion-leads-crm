import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Sun, Moon, Zap, AlertCircle, Check, FileText, Send, Activity, Heart, Utensils, ThermometerSun, Brain } from 'lucide-react';

interface WellnessLog {
    id: string;
    log_date: string;
    energy_level: number | null;
    sleep_quality: number | null;
    stress_level: number | null;
    mood: string | null;
    notes?: string;
    fatigue_level?: number | null;
    recovery_level?: number | null;
    pain_level?: number | null;
    nausea_level?: number | null;
    appetite_level?: number | null;
    sleep_severity?: number | null;
    bloating_level?: number | null;
    brain_fog_level?: number | null;
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

const SymptomSlider = ({ value, onChange, label, icon: Icon, minLabel = 'Nada', maxLabel = 'Máximo' }: { value: number; onChange: (v: number) => void; label: string; icon: React.ElementType; minLabel?: string; maxLabel?: string }) => (
    <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{label}</span>
            </div>
            <span className={`text-sm font-black ${value > 7 ? 'text-rose-600' : value > 4 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {value}<span className="text-[10px] font-normal text-slate-400">/10</span>
            </span>
        </div>
        <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
        </div>
    </div>
);

const StarRating = ({ value, onChange, label, icon: Icon }: { value: number; onChange: (v: number) => void; label: string; icon: React.ElementType }) => (
    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-bold text-slate-700">{label}</span>
        </div>
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    className={`w-8 h-8 rounded-lg transition-all ${star <= value
                        ? 'bg-amber-400 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
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

    // Symptom state
    const [fatigue, setFatigue] = useState(0);
    const [pain, setPain] = useState(0);
    const [nausea, setNausea] = useState(0);
    const [appetite, setAppetite] = useState(0);
    const [bloating, setBloating] = useState(0);
    const [brainFog, setBrainFog] = useState(0);

    const [isSaving, setIsSaving] = useState(false);
    const [isSavingNote, setIsSavingNote] = useState(false);

    useEffect(() => {
        loadData();
    }, [clientId]);

    const loadData = async () => {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];

        try {
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
                setFatigue(todayData.fatigue_level || 0);
                setPain(todayData.pain_level || 0);
                setNausea(todayData.nausea_level || 0);
                setAppetite(todayData.appetite_level || 0);
                setBloating(todayData.bloating_level || 0);
                setBrainFog(todayData.brain_fog_level || 0);
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
        } catch (error) {
            console.error('Error loading wellness data:', error);
        } finally {
            setLoading(false);
        }
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
                    notes: notes || null,
                    fatigue_level: fatigue,
                    pain_level: pain,
                    nausea_level: nausea,
                    appetite_level: appetite,
                    bloating_level: bloating,
                    brain_fog_level: brainFog
                }, { onConflict: 'client_id,log_date' });

            if (error) throw error;
            loadData();
            setIsExpanded(false);
        } catch (error) {
            console.error('Error saving wellness:', error);
            alert('Error al guardar el registro diario');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveNote = async () => {
        if (!notes.trim()) return;

        setIsSavingNote(true);
        const today = new Date().toISOString().split('T')[0];

        try {
            const { error } = await supabase
                .from('wellness_logs')
                .upsert({
                    client_id: clientId,
                    log_date: today,
                    energy_level: todayLog?.energy_level || energy,
                    sleep_quality: todayLog?.sleep_quality || sleep,
                    stress_level: todayLog?.stress_level || stress,
                    mood: todayLog?.mood || mood,
                    notes: notes,
                    fatigue_level: todayLog?.fatigue_level || fatigue,
                    pain_level: todayLog?.pain_level || pain,
                    nausea_level: todayLog?.nausea_level || nausea,
                    appetite_level: todayLog?.appetite_level || appetite,
                    bloating_level: todayLog?.bloating_level || bloating,
                    brain_fog_level: todayLog?.brain_fog_level || brainFog
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
    const avgFatigue = weekLogs.length > 0
        ? (weekLogs.reduce((s, l) => s + (l.fatigue_level || 0), 0) / weekLogs.length).toFixed(1)
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
                        <h3 className="font-bold text-slate-900">Check-in Diario</h3>
                        <p className="text-sm text-slate-500">Bienestar y Síntomas</p>
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
                        <div className="text-center p-3 bg-white rounded-xl shadow-sm border border-amber-100">
                            <span className="text-2xl">{moodData?.emoji || '😐'}</span>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">{moodData?.label || 'Normal'}</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-xl shadow-sm border border-amber-100">
                            <p className="text-lg font-black text-amber-600">{todayLog?.energy_level || '--'}<span className="text-xs text-slate-400 font-normal">/5</span></p>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Energía</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-xl shadow-sm border border-amber-100">
                            <p className="text-lg font-black text-rose-600">{todayLog?.fatigue_level ?? '--'}<span className="text-xs text-slate-400 font-normal">/10</span></p>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Fatiga</p>
                        </div>
                    </div>

                    {/* Weekly Averages */}
                    <div className="bg-white/50 rounded-xl px-4 py-2 border border-amber-100/50 flex items-center justify-between text-[11px] text-slate-500 mb-4">
                        <div className="flex items-center gap-2">
                            <Zap className="w-3 h-3 text-amber-500" />
                            <span>Energía: <strong className="text-slate-700">{avgEnergy}</strong></span>
                        </div>
                        <div className="w-px h-3 bg-amber-200" />
                        <div className="flex items-center gap-2">
                            <Activity className="w-3 h-3 text-rose-500" />
                            <span>Fatiga: <strong className="text-slate-700">{avgFatigue}</strong></span>
                        </div>
                    </div>

                    {/* Today's Note Preview */}
                    {todayLog?.notes && (
                        <div className="mb-4 p-4 bg-white/80 rounded-2xl border border-amber-200/50 shadow-sm">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                                    <FileText className="w-4 h-4 text-rose-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest mb-1">Nota del día</p>
                                    <p className="text-sm text-slate-700 leading-relaxed font-medium">{todayLog.notes}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => setIsExpanded(true)}
                        className="w-full py-4 bg-white text-amber-600 font-black text-sm uppercase tracking-wider rounded-2xl shadow-sm hover:shadow-md transition-all border border-amber-200 active:scale-95"
                    >
                        {todayLog ? 'Actualizar Registro' : 'Registrar Check-in'}
                    </button>
                </>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                    {/* Mood Selection */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4 text-center">¿Cómo te sientes hoy?</label>
                        <div className="flex gap-2 justify-center">
                            {MOODS.map(m => (
                                <button
                                    key={m.value}
                                    type="button"
                                    onClick={() => setMood(m.value)}
                                    className={`w-12 h-12 rounded-xl text-2xl transition-all ${mood === m.value
                                        ? 'bg-amber-100 ring-4 ring-amber-400/20 scale-110'
                                        : 'bg-slate-50 hover:bg-slate-100'
                                        }`}
                                >
                                    {m.emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Basic Metrics */}
                    <div className="space-y-3">
                        <StarRating value={energy} onChange={setEnergy} label="Nivel de Energía" icon={Zap} />
                        <StarRating value={sleep} onChange={setSleep} label="Calidad de Sueño" icon={Moon} />
                    </div>

                    {/* Symptom Sliders */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Seguimiento de Síntomas</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <SymptomSlider label="Fatiga" value={fatigue} onChange={setFatigue} icon={Zap} />
                            <SymptomSlider label="Dolor" value={pain} onChange={setPain} icon={ThermometerSun} />
                            <SymptomSlider label="Náuseas" value={nausea} onChange={setNausea} icon={Activity} />
                            <SymptomSlider label="Apetito" value={appetite} onChange={setAppetite} icon={Utensils} minLabel="Bien" maxLabel="Sin hambre" />
                            <SymptomSlider label="Hinchazón" value={bloating} onChange={setBloating} icon={Heart} />
                            <SymptomSlider label="Niebla Mental" value={brainFog} onChange={setBrainFog} icon={Brain} />
                        </div>
                    </div>

                    {/* Important Notes Section */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-rose-500" />
                            Nota Importante del Día
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ej: Hoy he tenido una visita médica. Me siento con más fuerza para los ejercicios..."
                            rows={3}
                            className="w-full p-4 text-sm border-2 border-slate-50 rounded-xl focus:border-amber-400 outline-none resize-none bg-slate-50 font-medium placeholder:text-slate-300"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="flex-1 py-4 text-slate-500 font-black text-sm uppercase tracking-wider rounded-2xl hover:bg-white transition-colors border border-transparent"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 py-4 bg-gradient-to-r from-brand-green to-emerald-600 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-200 hover:shadow-xl disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Check className="w-5 h-5" />
                                    Guardar Registro
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Quick Note Button */}
            {!isExpanded && !showNotesInput && !todayLog?.notes && (
                <button
                    onClick={() => setShowNotesInput(true)}
                    className="w-full mt-3 py-3 bg-white text-rose-600 font-bold rounded-2xl border border-rose-100 hover:bg-rose-50 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                >
                    <FileText className="w-4 h-4" />
                    Añadir Nota Importante
                </button>
            )}

            {/* Quick Note Input */}
            {!isExpanded && showNotesInput && (
                <div className="mt-4 p-5 bg-white rounded-3xl border border-rose-200 shadow-xl animate-in zoom-in-95">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-rose-500" />
                        </div>
                        <span className="text-sm font-black text-slate-700 uppercase tracking-wider">Nota del día</span>
                    </div>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Escribe algo importante para tu coach..."
                        rows={3}
                        className="w-full p-4 text-sm border-2 border-slate-50 rounded-2xl focus:border-rose-400 outline-none resize-none bg-slate-50 font-medium"
                        autoFocus
                    />
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={() => { setShowNotesInput(false); setNotes(todayLog?.notes || ''); }}
                            className="flex-1 py-3 text-slate-400 font-bold rounded-xl hover:bg-slate-50 transition-colors text-xs uppercase"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSaveNote}
                            disabled={isSavingNote || !notes.trim()}
                            className="flex-1 py-3 bg-rose-500 text-white font-black rounded-xl shadow-lg shadow-rose-200 hover:shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-xs uppercase"
                        >
                            {isSavingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Enviar
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper Loader component
const Loader2 = ({ className }: { className?: string }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

