import React, { useState, useEffect } from 'react';
import { Dumbbell, ChevronDown, ChevronUp, Clock, Flame, Calendar, FileText, CheckCircle } from 'lucide-react';
import { trainingService } from '../../services/trainingService';

interface ExerciseDetail {
    name: string;
    sets_completed?: number;
    reps_completed?: string;
    weight_used?: string;
    assessment_data?: Record<string, any>;
    is_completed: boolean;
}

interface EnrichedDayLog {
    id: string;
    client_id: string;
    day_id: string;
    completed_at: string;
    effort_rating?: number;
    notes?: string;
    duration_minutes?: number;
    day_name?: string;
    week_number?: number;
    exerciseDetails?: ExerciseDetail[];
    activityDetails?: {
        title: string;
        type: string;
        data: Record<string, any>;
    }[];
}

interface ClientWorkoutHistoryProps {
    clientId: string;
}

export const ClientWorkoutHistory: React.FC<ClientWorkoutHistoryProps> = ({ clientId }) => {
    const [logs, setLogs] = useState<EnrichedDayLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        loadLogs();
    }, [clientId]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await trainingService.getClientAllDayLogs(clientId);
            setLogs(data);
        } catch (e) {
            console.error('Error loading workout history:', e);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    const rpeLabel = (rpe: number) => {
        if (rpe <= 3) return 'Fácil';
        if (rpe <= 5) return 'Moderado';
        if (rpe <= 7) return 'Intenso';
        return 'Máximo';
    };

    const rpeColor = (rpe: number) => {
        if (rpe <= 3) return 'text-green-600 bg-green-50';
        if (rpe <= 5) return 'text-blue-600 bg-blue-50';
        if (rpe <= 7) return 'text-orange-600 bg-orange-50';
        return 'text-red-600 bg-red-50';
    };

    const formatFieldLabel = (key: string) => key
        .replace(/^_+/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (m) => m.toUpperCase());

    const getStructuredEntries = (data: Record<string, any>) => Object.entries(data || {})
        .filter(([k, v]) => k !== 'completed' && k !== '_structured' && v !== undefined && v !== null && String(v).trim() !== '');

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8 text-slate-400">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-brand-green mr-3"></div>
                Cargando historial...
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="text-center py-8">
                <Dumbbell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Sin entrenamientos completados</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {logs.map(log => {
                const isExpanded = expandedId === log.id;
                const completedExercises = (log.exerciseDetails || []).filter(e => e.is_completed).length;
                const totalExercises = (log.exerciseDetails || []).length;

                return (
                    <div key={log.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                        <button
                            onClick={() => setExpandedId(isExpanded ? null : log.id)}
                            className="w-full px-4 py-3 flex items-center gap-3 text-left"
                        >
                            <div className="w-10 h-10 rounded-xl bg-brand-mint flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="w-5 h-5 text-brand-green" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-800 truncate">
                                        {log.day_name || 'Entrenamiento'}
                                    </span>
                                    {log.week_number && (
                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                            S{log.week_number}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5">
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(log.completed_at)}
                                    </span>
                                    {log.duration_minutes && (
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {log.duration_minutes} min
                                        </span>
                                    )}
                                    {totalExercises > 0 && (
                                        <span className="text-xs text-slate-400">
                                            {completedExercises}/{totalExercises} ej.
                                        </span>
                                    )}
                                </div>
                            </div>
                            {log.effort_rating && (
                                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${rpeColor(log.effort_rating)}`}>
                                    RPE {log.effort_rating}
                                </span>
                            )}
                            {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            )}
                        </button>

                        {isExpanded && (
                            <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
                                {log.notes && (
                                    <div className="flex items-start gap-2 bg-amber-50 p-3 rounded-xl border border-amber-100">
                                        <FileText className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-amber-800">{log.notes}</p>
                                    </div>
                                )}

                                {log.effort_rating && (
                                    <div className="flex items-center gap-2">
                                        <Flame className="w-4 h-4 text-orange-500" />
                                        <span className="text-xs text-slate-600">
                                            Esfuerzo: <strong>{log.effort_rating}/10</strong> — {rpeLabel(log.effort_rating)}
                                        </span>
                                    </div>
                                )}

                                {(log.exerciseDetails || []).length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ejercicios</p>
                                        {log.exerciseDetails!.map((ex, i) => (
                                            <div key={i} className={`flex items-start gap-3 p-2.5 rounded-xl ${ex.is_completed ? 'bg-green-50 border border-green-100' : 'bg-slate-50 border border-slate-100'}`}>
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${ex.is_completed ? 'bg-green-200 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-slate-700 truncate">{ex.name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        {ex.weight_used && (
                                                            <span className="text-[10px] text-slate-500">
                                                                {ex.weight_used.split(',').filter(Boolean).join(' / ')} kg
                                                            </span>
                                                        )}
                                                        {ex.reps_completed && (
                                                            <span className="text-[10px] text-slate-500">
                                                                {ex.reps_completed.split(',').filter(Boolean).join(' / ')} reps
                                                            </span>
                                                        )}
                                                        {ex.sets_completed != null && (
                                                            <span className="text-[10px] text-slate-500">
                                                                {ex.sets_completed} series
                                                            </span>
                                                        )}
                                                    </div>
                                                    {ex.assessment_data && Object.keys(ex.assessment_data).length > 0 && (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
                                                            {Object.entries(ex.assessment_data).map(([k, v]) => (
                                                                <div key={k} className="text-[10px] bg-white border border-sky-100 rounded-md px-2 py-1">
                                                                    <p className="uppercase tracking-wider text-slate-400 font-bold">{formatFieldLabel(k)}</p>
                                                                    <p className="text-slate-700 font-semibold break-words">{String(v)}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {(log.activityDetails || []).some((a) => getStructuredEntries(a.data).length > 0) && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resultados de valoración</p>
                                        {(log.activityDetails || [])
                                            .map((activity, idx) => ({
                                                idx,
                                                title: activity.title,
                                                entries: getStructuredEntries(activity.data)
                                            }))
                                            .filter((item) => item.entries.length > 0)
                                            .map((item) => (
                                                <div key={item.idx} className="p-3 rounded-xl border border-sky-100 bg-sky-50/60">
                                                    <p className="text-xs font-bold text-slate-700 mb-2">{item.title}</p>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {item.entries.map(([key, value]) => (
                                                            <div key={key} className="text-xs bg-white rounded-lg border border-sky-100 px-2.5 py-2">
                                                                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{formatFieldLabel(key)}</p>
                                                                <p className="text-slate-700 font-semibold break-words">{String(value)}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
