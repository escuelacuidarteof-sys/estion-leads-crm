import React, { useEffect, useState } from 'react';
import {
    ArrowLeft,
    Dumbbell,
    Footprints,
    Zap,
    Camera,
    FileText,
    Calendar,
    ChevronDown,
    ChevronUp,
    Play
} from 'lucide-react';
import { Client, ClientTrainingAssignment, TrainingProgram, ProgramDay, ProgramActivity, Workout } from '../../types';
import { trainingService } from '../../services/trainingService';

interface TrainingViewProps {
    client: Client;
    onBack: () => void;
}

type ActivityType = 'workout' | 'walking' | 'metrics' | 'photo' | 'form' | 'custom';

const ACTIVITY_META: Record<ActivityType, { label: string; Icon: React.FC<any> }> = {
    workout: { label: 'Entrenamiento', Icon: Dumbbell },
    walking: { label: 'Caminata', Icon: Footprints },
    metrics: { label: 'Métricas', Icon: Zap },
    photo: { label: 'Foto progreso', Icon: Camera },
    form: { label: 'Formulario', Icon: FileText },
    custom: { label: 'Tarea', Icon: Calendar },
};

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DAY_NAMES_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function extractYoutubeId(url?: string): string | null {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

interface ExerciseRowProps {
    we: {
        id: string;
        sets: number;
        reps: string;
        rest_seconds: number;
        notes?: string;
        exercise?: {
            name: string;
            media_type?: string;
            media_url?: string;
        };
    };
}

function ExerciseRow({ we }: ExerciseRowProps) {
    const exercise = we.exercise;
    const youtubeId = exercise?.media_type === 'youtube' ? extractYoutubeId(exercise.media_url) : null;
    const thumbUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : null;
    const [videoOpen, setVideoOpen] = useState(false);

    return (
        <div className="py-3 border-b border-brand-mint/30 last:border-0">
            <div className="flex items-start gap-3">
                {thumbUrl ? (
                    <button
                        onClick={() => setVideoOpen(v => !v)}
                        className="relative flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden bg-brand-mint/20 group"
                        aria-label={`Ver video de ${exercise?.name}`}
                    >
                        <img
                            src={thumbUrl}
                            alt={exercise?.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                            <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md">
                                {videoOpen
                                    ? <ChevronUp className="w-3 h-3 text-brand-dark" />
                                    : <Play className="w-3 h-3 text-brand-dark fill-brand-dark ml-0.5" />
                                }
                            </div>
                        </div>
                    </button>
                ) : (
                    <div className="flex-shrink-0 w-20 h-14 rounded-xl bg-brand-mint/20 flex items-center justify-center">
                        <Dumbbell className="w-6 h-6 text-brand-green/50" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-brand-dark text-sm leading-tight mb-1.5 truncate">
                        {exercise?.name || 'Ejercicio'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {we.sets > 0 && (
                            <span className="text-[11px] bg-brand-mint/40 text-brand-dark px-2 py-0.5 rounded-full font-semibold">
                                {we.sets} series
                            </span>
                        )}
                        {we.reps && (
                            <span className="text-[11px] bg-brand-mint/40 text-brand-dark px-2 py-0.5 rounded-full font-semibold">
                                {we.reps} reps
                            </span>
                        )}
                        {we.rest_seconds > 0 && (
                            <span className="text-[11px] bg-brand-gold/20 text-brand-dark px-2 py-0.5 rounded-full font-semibold">
                                {we.rest_seconds}s descanso
                            </span>
                        )}
                    </div>
                    {we.notes && (
                        <p className="text-xs text-slate-400 mt-1 italic">{we.notes}</p>
                    )}
                </div>
            </div>
            {videoOpen && youtubeId && (
                <div className="mt-3 rounded-xl overflow-hidden aspect-video w-full">
                    <iframe
                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                        title={exercise?.name}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                    />
                </div>
            )}
        </div>
    );
}

interface WorkoutDetailProps {
    workout: Workout;
}

function WorkoutDetail({ workout }: WorkoutDetailProps) {
    if (!workout.blocks || workout.blocks.length === 0) {
        return (
            <p className="text-sm text-slate-400 italic py-2 text-center">
                Este entrenamiento no tiene ejercicios configurados.
            </p>
        );
    }

    return (
        <div className="space-y-4">
            {workout.blocks.map((block) => (
                <div key={block.id}>
                    {block.name && (
                        <p className="text-xs font-black text-brand-green uppercase tracking-wider mb-2">
                            {block.name}
                        </p>
                    )}
                    <div>
                        {(block.exercises || []).map((we) => (
                            <ExerciseRow key={we.id} we={we} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

interface ActivityCardProps {
    activity: ProgramActivity;
    workout: Workout | null;
    workoutLoading: boolean;
}

function ActivityCard({ activity, workout, workoutLoading }: ActivityCardProps) {
    const [expanded, setExpanded] = useState(true);
    const type = (activity.type || 'custom') as ActivityType;
    const meta = ACTIVITY_META[type] || ACTIVITY_META.custom;
    const { Icon } = meta;

    return (
        <div className="bg-white rounded-2xl border border-brand-mint/40 shadow-sm overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-brand-mint/10 transition-colors"
            >
                <div className="w-10 h-10 rounded-xl bg-brand-mint/30 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-brand-green" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-black text-brand-dark text-sm">
                        {activity.title || meta.label}
                    </p>
                    {activity.description && (
                        <p className="text-xs text-slate-400 truncate">{activity.description}</p>
                    )}
                </div>
                {type === 'workout' && (
                    expanded
                        ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
            </button>

            {expanded && type === 'workout' && (
                <div className="px-4 pb-4 pt-1 border-t border-brand-mint/20">
                    {workoutLoading ? (
                        <div className="space-y-2 animate-pulse">
                            <div className="h-12 bg-brand-mint/20 rounded-xl" />
                            <div className="h-12 bg-brand-mint/20 rounded-xl" />
                        </div>
                    ) : workout ? (
                        <WorkoutDetail workout={workout} />
                    ) : (
                        <p className="text-sm text-slate-400 italic py-2 text-center">
                            No se pudo cargar el entrenamiento.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

interface DayDetailProps {
    day: ProgramDay;
    workout: Workout | null;
    workoutLoading: boolean;
    dayName: string;
}

function DayDetail({ day, workout, workoutLoading, dayName }: DayDetailProps) {
    if (!day.activities || day.activities.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-brand-mint/40 p-6 text-center">
                <Calendar className="w-8 h-8 text-brand-mint mx-auto mb-2" />
                <p className="text-sm text-slate-400">Día de descanso</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-xs font-black text-brand-dark uppercase tracking-wider px-1">
                {dayName} — {day.activities.length} actividad{day.activities.length !== 1 ? 'es' : ''}
            </p>
            {day.activities.map((activity) => {
                const isWorkout = activity.type === 'workout';
                return (
                    <ActivityCard
                        key={activity.id}
                        activity={activity}
                        workout={isWorkout ? workout : null}
                        workoutLoading={isWorkout ? workoutLoading : false}
                    />
                );
            })}
        </div>
    );
}

export function TrainingView({ client, onBack }: TrainingViewProps) {
    const [assignment, setAssignment] = useState<ClientTrainingAssignment | null>(null);
    const [program, setProgram] = useState<TrainingProgram | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedWeek, setSelectedWeek] = useState(1);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
    const [workoutLoading, setWorkoutLoading] = useState(false);

    // Load assignment and program
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const asgn = await trainingService.getClientAssignment(client.id);
                if (!asgn) {
                    setLoading(false);
                    return;
                }
                setAssignment(asgn);

                const prog = await trainingService.getProgramById(asgn.program_id);
                if (!prog) {
                    setLoading(false);
                    return;
                }
                setProgram(prog);

                // Calculate current week from start_date
                const startDate = new Date(asgn.start_date);
                const now = new Date();
                const diffDays = Math.floor((now.getTime() - startDate.getTime()) / 86400000);
                const calculatedWeek = Math.max(1, Math.ceil((diffDays + 1) / 7));
                const clampedWeek = Math.min(calculatedWeek, prog.weeks_count);
                setSelectedWeek(clampedWeek);
            } catch (err) {
                console.error('Error loading training assignment:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [client.id]);

    // Load workout when day/week/program changes
    useEffect(() => {
        if (!program || selectedDay === null) {
            setSelectedWorkout(null);
            return;
        }

        const dayData = getDayData(selectedWeek, selectedDay);
        if (!dayData) {
            setSelectedWorkout(null);
            return;
        }

        const workoutActivity = dayData.activities?.find(
            (a) => a.type === 'workout'
        );

        if (!workoutActivity) {
            setSelectedWorkout(null);
            return;
        }

        const workoutId = workoutActivity.activity_id || workoutActivity.workout_id;
        if (!workoutId) {
            setSelectedWorkout(null);
            return;
        }

        setWorkoutLoading(true);
        trainingService.getWorkoutById(workoutId).then((w) => {
            setSelectedWorkout(w);
            setWorkoutLoading(false);
        }).catch(() => {
            setSelectedWorkout(null);
            setWorkoutLoading(false);
        });
    }, [selectedDay, selectedWeek, program]);

    const getDayData = (week: number, dayNumber: number): ProgramDay | null => {
        if (!program) return null;
        return program.days.find(
            (d) => d.week_number === week && d.day_number === dayNumber
        ) || null;
    };

    const hasDayContent = (week: number, dayNumber: number): boolean => {
        const day = getDayData(week, dayNumber);
        return !!(day && day.activities && day.activities.length > 0);
    };

    // Loading skeleton
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pb-12">
                <div className="bg-white shadow-sm sticky top-0 z-10">
                    <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="h-6 w-40 bg-brand-mint/30 rounded animate-pulse" />
                    </div>
                </div>
                <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
                    <div className="h-12 bg-brand-mint/20 rounded-2xl animate-pulse" />
                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="h-20 bg-brand-mint/20 rounded-xl animate-pulse" />
                        ))}
                    </div>
                    <div className="h-48 bg-brand-mint/20 rounded-2xl animate-pulse" />
                </div>
            </div>
        );
    }

    // Empty state
    if (!assignment || !program) {
        return (
            <div className="min-h-screen bg-gray-50 pb-12">
                <div className="bg-white shadow-sm sticky top-0 z-10">
                    <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <h1 className="text-xl font-bold text-brand-dark flex items-center gap-2">
                            <Dumbbell className="w-6 h-6 text-brand-green" />
                            Mis Entrenamientos
                        </h1>
                    </div>
                </div>
                <div className="max-w-4xl mx-auto px-4 py-12">
                    <div className="bg-white p-8 sm:p-12 rounded-2xl text-center border border-brand-mint/40 shadow-sm">
                        <div className="w-16 h-16 bg-brand-mint/30 rounded-full flex items-center justify-center mx-auto mb-5">
                            <Dumbbell className="w-8 h-8 text-brand-green" />
                        </div>
                        <h2 className="text-xl font-bold text-brand-dark mb-3">
                            Sin programa asignado
                        </h2>
                        <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                            Tu coach te asignará un programa próximamente.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const selectedDayData = selectedDay !== null ? getDayData(selectedWeek, selectedDay) : null;

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-brand-dark flex items-center gap-2">
                            <Dumbbell className="w-6 h-6 text-brand-green" />
                            {program.name}
                        </h1>
                        {program.description && (
                            <p className="text-xs text-slate-400 mt-0.5">{program.description}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
                {/* Week Selector */}
                {program.weeks_count > 1 && (
                    <div>
                        <p className="text-xs font-black text-brand-dark uppercase tracking-wider mb-2 px-1">
                            Semana
                        </p>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {Array.from({ length: program.weeks_count }, (_, i) => i + 1).map((week) => (
                                <button
                                    key={week}
                                    onClick={() => { setSelectedWeek(week); setSelectedDay(null); setSelectedWorkout(null); }}
                                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                        selectedWeek === week
                                            ? 'bg-brand-green text-white shadow-sm'
                                            : 'bg-white border border-brand-mint/40 text-brand-dark hover:bg-brand-mint/20'
                                    }`}
                                >
                                    Sem. {week}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Day Grid */}
                <div>
                    <p className="text-xs font-black text-brand-dark uppercase tracking-wider mb-2 px-1">
                        Días — Semana {selectedWeek}
                    </p>
                    <div className="grid grid-cols-7 gap-1.5">
                        {Array.from({ length: 7 }, (_, i) => i + 1).map((dayNum) => {
                            const hasContent = hasDayContent(selectedWeek, dayNum);
                            const isSelected = selectedDay === dayNum;
                            const dayData = getDayData(selectedWeek, dayNum);
                            const activities = dayData?.activities || [];

                            return (
                                <button
                                    key={dayNum}
                                    onClick={() => hasContent ? setSelectedDay(isSelected ? null : dayNum) : undefined}
                                    disabled={!hasContent}
                                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                                        isSelected
                                            ? 'bg-brand-green text-white shadow-sm'
                                            : hasContent
                                                ? 'bg-white border border-brand-mint text-brand-dark hover:bg-brand-mint/20 active:scale-95'
                                                : 'bg-white border border-gray-100 text-gray-300 opacity-50 cursor-default'
                                    }`}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-wider">
                                        {DAY_NAMES[dayNum - 1]}
                                    </span>
                                    <div className="flex flex-col items-center gap-0.5 min-h-[32px] justify-center">
                                        {hasContent ? (
                                            activities.slice(0, 2).map((act, idx) => {
                                                const type = (act.type || 'custom') as ActivityType;
                                                const { Icon } = ACTIVITY_META[type] || ACTIVITY_META.custom;
                                                return (
                                                    <Icon
                                                        key={idx}
                                                        className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-brand-green'}`}
                                                    />
                                                );
                                            })
                                        ) : (
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Day Detail Panel */}
                {selectedDay !== null && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {selectedDayData ? (
                            <DayDetail
                                day={selectedDayData}
                                workout={selectedWorkout}
                                workoutLoading={workoutLoading}
                                dayName={DAY_NAMES_FULL[selectedDay - 1]}
                            />
                        ) : (
                            <div className="bg-white rounded-2xl border border-brand-mint/40 p-6 text-center">
                                <Calendar className="w-8 h-8 text-brand-mint mx-auto mb-2" />
                                <p className="text-sm text-slate-400">Día de descanso</p>
                            </div>
                        )}
                    </div>
                )}

                {selectedDay === null && (
                    <div className="bg-white rounded-2xl border border-brand-mint/40 p-6 text-center">
                        <Dumbbell className="w-8 h-8 text-brand-mint mx-auto mb-2" />
                        <p className="text-sm text-slate-500 font-medium">
                            Selecciona un día para ver tus actividades
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
