import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, CheckCircle, Clock, Save, ArrowLeft, Dumbbell, Calendar, Info, Target, Zap, Activity } from 'lucide-react';
import { Workout, WorkoutBlock, WorkoutExercise, ClientDayLog, ClientExerciseLog } from '../../types';
import { trainingService } from '../../services/trainingService';

interface ActiveWorkoutSessionProps {
    workout: Workout;
    clientId: string;
    onClose: () => void;
    onComplete: () => void;
}

// Helper to group exercises by superset_id
function groupWorkoutBlocks(blocks: WorkoutBlock[]) {
    return blocks.map(block => {
        const exercises = block.exercises || [];
        const groups: { type: 'single' | 'superset', id: string, items: typeof exercises }[] = [];

        exercises.forEach(ex => {
            if (ex.superset_id) {
                const existingGroup = groups.find(g => g.type === 'superset' && g.id === ex.superset_id);
                if (existingGroup) {
                    existingGroup.items.push(ex);
                } else {
                    groups.push({ type: 'superset', id: ex.superset_id, items: [ex] });
                }
            } else {
                groups.push({ type: 'single', id: ex.id, items: [ex] });
            }
        });

        return {
            ...block,
            groups
        };
    });
}

export function ActiveWorkoutSession({ workout, clientId, onClose, onComplete }: ActiveWorkoutSessionProps) {
    const [isStarted, setIsStarted] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [secondsElapsed, setSecondsElapsed] = useState(0);
    const [effortRating, setEffortRating] = useState<number>(0);
    const [sessionNotes, setSessionNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [completedSets, setCompletedSets] = useState<Record<string, { weight: number | null, reps: number | null, completed: boolean }[]>>({});

    const groupedBlocks = groupWorkoutBlocks(workout.blocks || []);

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isStarted && !isPaused) {
            interval = setInterval(() => {
                setSecondsElapsed(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isStarted, isPaused]);

    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStart = () => {
        setIsStarted(true);
        setIsPaused(false);
    };

    const handlePauseResume = () => {
        setIsPaused(!isPaused);
    };

    const handleSetUpdate = (exerciseId: string, setIndex: number, field: 'weight' | 'reps' | 'completed', value: any) => {
        setCompletedSets(prev => {
            const currentSets = prev[exerciseId] || [];
            const newSets = [...currentSets];
            if (!newSets[setIndex]) {
                newSets[setIndex] = { weight: null, reps: null, completed: false };
            }
            newSets[setIndex] = { ...newSets[setIndex], [field]: value };
            return { ...prev, [exerciseId]: newSets };
        });
    };

    const handleFinish = async () => {
        if (!clientId) return;

        try {
            setSaving(true);

            const exerciseLogs: Omit<ClientExerciseLog, 'id' | 'created_at'>[] = [];

            Object.entries(completedSets).forEach(([exerciseId, setsData]) => {
                const exercise = workout.blocks?.flatMap(b => b.exercises).find(e => e?.id === exerciseId);
                if (!exercise) return;

                const completedSetsCount = setsData.filter(s => s.completed).length;
                if (completedSetsCount === 0) return; // Skip if no sets completed

                exerciseLogs.push({
                    day_log_id: '', // Will be set in the service
                    workout_exercise_id: exerciseId,
                    exercise_id: exercise.exercise_id || '',
                    completed: true,
                    sets_completed: completedSetsCount,
                    // Basic aggregate or JSON for detailed rep/weight tracking could go here if needed in the future
                    notes: ''
                });
            });

            const dayLogData: Omit<ClientDayLog, 'id' | 'created_at'> = {
                client_id: clientId,
                date: new Date().toISOString().split('T')[0],
                completed: true,
                duration_minutes: Math.ceil(secondsElapsed / 60),
                effort_rating: effortRating > 0 ? effortRating : undefined,
                notes: sessionNotes,
            };

            await trainingService.saveClientDayLog(dayLogData, exerciseLogs);

            onComplete();
        } catch (error) {
            console.error("Error saving workout log:", error);
            alert("Hubo un error al guardar tu entrenamiento. Por favor, intenta de nuevo.");
        } finally {
            setSaving(false);
        }
    };

    if (!isStarted) {
        return (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] animate-in fade-in duration-300 p-4">
                <div className="bg-white rounded-[2rem] max-w-md w-full shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 flex flex-col items-center p-8 text-center border border-white/20">
                    <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center mb-6">
                        <Dumbbell className="w-10 h-10 text-brand-green" />
                    </div>
                    <h2 className="text-2xl font-black text-brand-dark mb-2 tracking-tight">{workout.name}</h2>
                    <p className="text-slate-500 mb-8 whitespace-pre-line">{workout.description || '¿Listo para empezar tu entrenamiento de hoy?'}</p>

                    <div className="flex gap-4 w-full">
                        <button onClick={onClose} className="flex-1 py-3 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
                            Cancelar
                        </button>
                        <button onClick={handleStart} className="flex-[2] py-3 rounded-2xl font-bold text-white bg-brand-green hover:bg-brand-green/90 shadow-lg shadow-brand-mint/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                            <Play className="w-5 h-5 fill-current" />
                            Empezar Ahora
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col z-[100] animate-in fade-in">
            {/* Top Bar - Header & Timer */}
            <div className="bg-white border-b border-slate-100 shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="font-bold text-brand-dark text-base sm:text-lg leading-tight truncate max-w-[150px] sm:max-w-xs">{workout.name}</h2>
                        <div className="flex items-center gap-1.5 text-brand-green font-mono text-sm sm:text-base font-bold bg-brand-mint/20 px-2 py-0.5 rounded-md inline-flex mt-0.5">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(secondsElapsed)}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePauseResume}
                        className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full transition-all shadow-sm ${isPaused ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                    </button>
                    <button
                        onClick={handleFinish}
                        className="h-10 sm:h-12 px-4 sm:px-6 bg-brand-green text-white rounded-full font-bold shadow-md shadow-brand-mint/40 flex items-center gap-2 hover:bg-brand-green/90 active:scale-95 transition-all text-sm sm:text-base"
                    >
                        <Square className="w-4 h-4 fill-current hidden sm:block" />
                        Finalizar
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto px-4 py-6 pb-32">
                {isPaused && (
                    <div className="mb-6 bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center gap-3 text-orange-800">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex justify-center items-center shrink-0">
                            <Pause className="w-5 h-5 fill-current" />
                        </div>
                        <div>
                            <p className="font-bold">Entrenamiento en pausa</p>
                            <p className="text-sm opacity-80">El temporizador está detenido. Toca el botón play para reanudar.</p>
                        </div>
                    </div>
                )}

                <div className="space-y-6 sm:space-y-8">
                    {groupedBlocks.map((block) => (
                        <div key={block.id} className="space-y-4">
                            {block.name && (
                                <h3 className="font-black text-brand-dark/80 uppercase tracking-widest text-xs sm:text-sm pl-2 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-brand-green" />
                                    {block.name}
                                </h3>
                            )}

                            <div className="space-y-4">
                                {block.groups.map((group, groupIdx) => {
                                    if (group.type === 'superset') {
                                        return (
                                            <div key={`super-${group.id}`} className="bg-white rounded-3xl border border-brand-mint/40 p-1 shadow-sm overflow-hidden relative">
                                                <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-brand-gold rounded-l-3xl"></div>
                                                <div className="px-4 py-3 bg-brand-gold/5 flex flex-wrap items-center justify-between border-b border-brand-mint/20 ml-2 rounded-tr-2xl gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <Zap className="w-4 h-4 text-brand-gold fill-brand-gold" />
                                                        <span className="font-bold text-brand-dark text-sm uppercase tracking-wide">Superserie</span>
                                                    </div>
                                                    <span className="text-xs font-semibold text-brand-gold/80 px-2 py-1 bg-white rounded-full border border-brand-gold/20 shadow-sm">{group.items.length} ejercicios sin descanso</span>
                                                </div>
                                                <div className="pl-2 pt-2 pb-2">
                                                    <div className="space-y-3">
                                                        {group.items.map((we, idx) => (
                                                            <div key={we.id} className={`${idx !== group.items.length - 1 ? 'border-b border-slate-100 pb-3' : ''}`}>
                                                                <ExerciseEntry
                                                                    exercise={we}
                                                                    completedSets={completedSets[we.id] || []}
                                                                    onSetUpdate={(setIdx, field, val) => handleSetUpdate(we.id, setIdx, field, val)}
                                                                    isSupersetChild={true}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div key={group.items[0].id} className="bg-white rounded-3xl border border-brand-mint/40 shadow-sm overflow-hidden p-2">
                                                <div className="p-2 sm:p-4">
                                                    <ExerciseEntry
                                                        exercise={group.items[0]}
                                                        completedSets={completedSets[group.items[0].id] || []}
                                                        onSetUpdate={(setIdx, field, val) => handleSetUpdate(group.items[0].id, setIdx, field, val)}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        </div>
                    ))}

                    <div className="pt-6 mt-6 border-t border-slate-200 pb-6">
                        <h3 className="font-bold text-brand-dark mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-brand-green" />
                            Resumen de sesión
                        </h3>
                        <div className="space-y-5">
                            <div className="bg-white p-5 rounded-3xl border border-brand-mint/40 shadow-sm">
                                <label className="block text-sm font-bold text-brand-dark mb-3">¿Qué tan duro fue? (RPE)</label>
                                <div className="flex justify-between items-center gap-1 sm:gap-2">
                                    {[...Array(10)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setEffortRating(i + 1)}
                                            className={`flex-1 aspect-square rounded-xl flex items-center justify-center font-bold text-sm sm:text-base transition-all ${effortRating === i + 1
                                                    ? (i < 3 ? 'bg-green-500 text-white shadow-md scale-110 z-10' : i < 6 ? 'bg-yellow-500 text-white shadow-md scale-110 z-10' : i < 8 ? 'bg-orange-500 text-white shadow-md scale-110 z-10' : 'bg-red-500 text-white shadow-md scale-110 z-10')
                                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex justify-between text-[10px] sm:text-xs font-medium text-slate-400 mt-2 px-1">
                                    <span>Muy fácil</span>
                                    <span>Moderado</span>
                                    <span>Máximo esfuerzo</span>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-3xl border border-brand-mint/40 shadow-sm">
                                <label className="block text-sm font-bold text-brand-dark mb-2">Notas sobre el entrenamiento</label>
                                <textarea
                                    value={sessionNotes}
                                    onChange={(e) => setSessionNotes(e.target.value)}
                                    placeholder="¿Cómo te sentiste? ¿Algún dolor? ¿Rompiste algún récord?"
                                    className="w-full bg-slate-50 border-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {saving && (
                <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[200] flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border-4 border-brand-mint border-t-brand-green rounded-full animate-spin"></div>
                    <p className="mt-4 font-bold text-brand-dark">Guardando entrenamiento...</p>
                </div>
            )}
        </div>
    );
}

// Sub-component for individual exercise entries
function ExerciseEntry({
    exercise,
    completedSets,
    onSetUpdate,
    isSupersetChild = false
}: {
    exercise: WorkoutExercise;
    completedSets: any[];
    onSetUpdate: (idx: number, f: 'weight' | 'reps' | 'completed', v: any) => void;
    isSupersetChild?: boolean;
}) {
    const setsArray = Array.from({ length: exercise.sets || 1 });

    return (
        <div className="flex flex-col gap-3">
            <div className={`flex items-start gap-3 ${isSupersetChild ? 'px-2' : ''}`}>
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-brand-mint/20 border border-brand-mint/30 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                    {/* Thumbnail or icon logic can go back here if needed block.exercise is fully populated. Usually we just have name in we.exercise.name */}
                    <Dumbbell className="w-6 h-6 text-brand-green opacity-50" />
                </div>
                <div className="flex-1 min-w-0 pr-2">
                    <h4 className="font-bold text-brand-dark text-sm sm:text-base leading-tight w-full" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                        {exercise.exercise?.name || 'Ejercicio desconocido'}
                    </h4>

                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2">
                        {exercise.sets > 0 && (
                            <span className="text-[10px] sm:text-xs font-bold text-brand-dark/80 bg-brand-mint/30 px-2 py-0.5 rounded-md border border-brand-mint/50">
                                {exercise.sets} series
                            </span>
                        )}
                        {exercise.reps && (
                            <span className="text-[10px] sm:text-xs font-bold text-brand-dark/80 bg-brand-mint/30 px-2 py-0.5 rounded-md border border-brand-mint/50">
                                {exercise.reps} reps
                            </span>
                        )}
                        {exercise.rest_seconds > 0 && (
                            <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {exercise.rest_seconds}s
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {exercise.notes && (
                <div className={`bg-amber-50 text-amber-800 text-xs sm:text-sm p-3 rounded-xl border border-amber-100 flex items-start gap-2 ${isSupersetChild ? 'mx-2' : ''}`}>
                    <Info className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="leading-snug">{exercise.notes}</p>
                </div>
            )}

            {/* Sets Logging Table */}
            <div className={`mt-2 ${isSupersetChild ? 'px-2' : ''}`}>
                <div className="grid grid-cols-[1fr_2fr_2fr_1fr] md:grid-cols-[1fr_2fr_2fr_1fr] gap-2 mb-2 px-2 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                    <span>Set</span>
                    <span>LBS/KG</span>
                    <span>Reps</span>
                    <span>OK</span>
                </div>

                <div className="space-y-2">
                    {setsArray.map((_, idx) => {
                        const setLog = completedSets[idx] || {};
                        const isDone = !!setLog.completed;

                        return (
                            <div
                                key={idx}
                                className={`grid grid-cols-[1fr_2fr_2fr_1fr] gap-2 items-center p-2 rounded-xl transition-all border ${isDone ? 'bg-brand-green/5 border-brand-green/20 shadow-sm' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}
                            >
                                <div className="text-center font-black text-sm text-slate-400 w-full flex justify-center">{idx + 1}</div>

                                <input
                                    type="number"
                                    placeholder="0"
                                    value={setLog.weight || ''}
                                    onChange={(e) => onSetUpdate(idx, 'weight', e.target.value ? Number(e.target.value) : null)}
                                    // disabled={isDone} // Optionally disable if checked
                                    className={`w-full bg-white border ${isDone ? 'border-brand-green/30 text-brand-dark font-bold' : 'border-slate-200'} rounded-lg py-2 sm:py-2.5 text-center text-sm focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all`}
                                />

                                <input
                                    type="number"
                                    placeholder={exercise.reps?.replace(/\D/g, '') || "0"}
                                    value={setLog.reps || ''}
                                    onChange={(e) => onSetUpdate(idx, 'reps', e.target.value ? Number(e.target.value) : null)}
                                    className={`w-full bg-white border ${isDone ? 'border-brand-green/30 text-brand-dark font-bold' : 'border-slate-200'} rounded-lg py-2 sm:py-2.5 text-center text-sm focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all`}
                                />

                                <div className="flex justify-center w-full">
                                    <button
                                        onClick={() => onSetUpdate(idx, 'completed', !setLog.completed)}
                                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all ${isDone ? 'bg-brand-green text-white shadow-md shadow-brand-mint/40 scale-105' : 'bg-white border-2 border-slate-200 text-slate-300 hover:border-brand-mint hover:text-brand-mint'}`}
                                    >
                                        <CheckCircle className={`w-6 h-6 ${isDone ? 'fill-current' : ''}`} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
