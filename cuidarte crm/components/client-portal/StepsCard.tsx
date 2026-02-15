import React, { useState, useEffect } from 'react';
import { Footprints, Plus, TrendingUp, Calendar, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface StepsEntry {
    id: string;
    client_id: string;
    steps: number;
    date: string;
    created_at: string;
}

interface StepsCardProps {
    clientId: string;
    isClientView?: boolean; // true = portal cliente, false = vista coach
}

// Compact version for coach overview
export function StepsSummary({ clientId }: { clientId: string }) {
    const [todaySteps, setTodaySteps] = useState<number | null>(null);
    const [weeklyAvg, setWeeklyAvg] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSteps = async () => {
            try {
                const { data } = await supabase
                    .from('steps_history')
                    .select('steps, date')
                    .eq('client_id', clientId)
                    .order('date', { ascending: false })
                    .limit(7);

                if (data && data.length > 0) {
                    const today = new Date().toISOString().split('T')[0];
                    const todayEntry = data.find(e => e.date === today);
                    setTodaySteps(todayEntry?.steps || null);

                    const total = data.reduce((sum, e) => sum + e.steps, 0);
                    setWeeklyAvg(Math.round(total / data.length));
                }
            } catch (err) {
                console.log('Steps not available');
            } finally {
                setLoading(false);
            }
        };
        loadSteps();
    }, [clientId]);

    if (loading) {
        return (
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100 animate-pulse">
                <div className="w-8 h-8 bg-orange-200 rounded-lg"></div>
                <div className="h-4 bg-orange-200 rounded w-24"></div>
            </div>
        );
    }

    if (todaySteps === null && weeklyAvg === null) {
        return (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Footprints className="w-5 h-5 text-slate-300" />
                <span className="text-sm text-slate-400">Sin registros de pasos</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
            <div className="p-2 bg-orange-500 rounded-lg text-white">
                <Footprints className="w-5 h-5" />
            </div>
            <div className="flex gap-6">
                <div>
                    <p className="text-[10px] font-bold text-orange-600 uppercase">Hoy</p>
                    <p className="text-lg font-black text-slate-800">{todaySteps?.toLocaleString() || '-'}</p>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-amber-600 uppercase">Media 7d</p>
                    <p className="text-lg font-black text-slate-800">{weeklyAvg?.toLocaleString() || '-'}</p>
                </div>
            </div>
        </div>
    );
}

export function StepsCard({ clientId, isClientView = true }: StepsCardProps) {
    const [stepsHistory, setStepsHistory] = useState<StepsEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newSteps, setNewSteps] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        loadStepsHistory();
    }, [clientId]);

    const loadStepsHistory = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('steps_history')
                .select('*')
                .eq('client_id', clientId)
                .order('date', { ascending: false })
                .limit(30);

            if (error) {
                // Table might not exist yet, that's ok
                console.log('Steps history table may not exist:', error.message);
                setStepsHistory([]);
            } else {
                setStepsHistory(data || []);
            }
        } catch (err) {
            console.error('Error loading steps:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSteps || parseInt(newSteps) <= 0) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('steps_history')
                .upsert(
                    [{
                        client_id: clientId,
                        steps: parseInt(newSteps),
                        date: selectedDate
                    }],
                    { onConflict: 'client_id,date' }
                );

            if (error) throw error;

            await loadStepsHistory();
            setIsModalOpen(false);
            setNewSteps('');
            setSelectedDate(new Date().toISOString().split('T')[0]);
        } catch (error: any) {
            console.error('Error saving steps:', error);
            alert('Error al guardar los pasos: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate weekly average
    const calculateWeeklyAverage = () => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const thisWeekEntries = stepsHistory.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= weekAgo && entryDate <= now;
        });

        if (thisWeekEntries.length === 0) return null;

        const total = thisWeekEntries.reduce((sum, entry) => sum + entry.steps, 0);
        return Math.round(total / thisWeekEntries.length);
    };

    const weeklyAverage = calculateWeeklyAverage();
    const todayEntry = stepsHistory.find(e => e.date === new Date().toISOString().split('T')[0]);
    const yesterdayEntry = stepsHistory.find(e => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return e.date === yesterday.toISOString().split('T')[0];
    });

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100 animate-pulse">
                <div className="h-6 bg-orange-200 rounded w-1/3 mb-4"></div>
                <div className="h-10 bg-orange-200 rounded w-1/2"></div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100 shadow-sm hover:shadow-md transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl text-white shadow-lg shadow-orange-200">
                            <Footprints className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Pasos Diarios</h3>
                            <p className="text-xs text-slate-500">Registro de actividad</p>
                        </div>
                    </div>
                    {isClientView && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Registrar
                        </button>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Today */}
                    <div className="bg-white/60 rounded-xl p-4 border border-orange-100">
                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1">Hoy</p>
                        <p className="text-2xl font-black text-slate-800">
                            {todayEntry ? todayEntry.steps.toLocaleString() : '-'}
                        </p>
                        <p className="text-xs text-slate-500">pasos</p>
                    </div>

                    {/* Weekly Average */}
                    <div className="bg-white/60 rounded-xl p-4 border border-orange-100">
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Media Semanal</p>
                        <p className="text-2xl font-black text-slate-800">
                            {weeklyAverage ? weeklyAverage.toLocaleString() : '-'}
                        </p>
                        <p className="text-xs text-slate-500">pasos/día</p>
                    </div>
                </div>

                {/* Yesterday comparison */}
                {yesterdayEntry && todayEntry && (
                    <div className="flex items-center gap-2 text-sm mb-4">
                        <TrendingUp className={`w-4 h-4 ${todayEntry.steps >= yesterdayEntry.steps ? 'text-green-500' : 'text-red-500'}`} />
                        <span className={todayEntry.steps >= yesterdayEntry.steps ? 'text-green-600' : 'text-red-600'}>
                            {todayEntry.steps >= yesterdayEntry.steps ? '+' : ''}
                            {(todayEntry.steps - yesterdayEntry.steps).toLocaleString()} vs ayer
                        </span>
                    </div>
                )}

                {/* History Toggle */}
                {stepsHistory.length > 0 && (
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="w-full flex items-center justify-between p-3 bg-white/50 rounded-xl border border-orange-100 hover:bg-white/80 transition-colors"
                    >
                        <span className="text-sm font-medium text-slate-600">
                            Ver historial ({stepsHistory.length} registros)
                        </span>
                        {showHistory ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>
                )}

                {/* History List */}
                {showHistory && stepsHistory.length > 0 && (
                    <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                        {stepsHistory.slice(0, 14).map((entry) => (
                            <div key={entry.id || entry.date} className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-orange-50">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-orange-400" />
                                    <span className="text-sm text-slate-600">
                                        {new Date(entry.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </span>
                                </div>
                                <span className="font-bold text-slate-800">{entry.steps.toLocaleString()} pasos</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {stepsHistory.length === 0 && (
                    <div className="text-center py-4">
                        <Footprints className="w-10 h-10 text-orange-200 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">
                            {isClientView ? 'Registra tus pasos diarios' : 'Sin registros de pasos'}
                        </p>
                    </div>
                )}
            </div>

            {/* Modal for adding steps */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-orange-50 to-amber-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-500 rounded-xl text-white">
                                    <Footprints className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Registrar Pasos</h3>
                                    <p className="text-xs text-slate-500">Añade tus pasos del día</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha</label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Número de pasos</label>
                                <input
                                    type="number"
                                    value={newSteps}
                                    onChange={(e) => setNewSteps(e.target.value)}
                                    placeholder="Ej: 8500"
                                    min="0"
                                    max="100000"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-lg font-semibold"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !newSteps}
                                    className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        'Guardar'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
