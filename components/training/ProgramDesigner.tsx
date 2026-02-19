import React, { useState } from 'react';
import {
    Plus,
    Settings,
    Copy,
    Trash2,
    ChevronRight,
    Calendar,
    MoreHorizontal,
    Layout,
    User,
    Camera,
    ClipboardList,
    X
} from 'lucide-react';
import { TrainingProgram, ProgramDay, ProgramActivity, Workout } from '../../types';

interface ProgramDesignerProps {
    program: TrainingProgram | null;
    availableWorkouts: Workout[];
    onSave: (program: Partial<TrainingProgram>) => Promise<void>;
    onClose: () => void;
}

export function ProgramDesigner({ program, availableWorkouts, onSave, onClose }: ProgramDesignerProps) {
    const [name, setName] = useState(program?.name || '');
    const [description, setDescription] = useState(program?.description || '');
    const [weeksCount, setWeeksCount] = useState(program?.weeks_count || 4);
    const [days, setDays] = useState<ProgramDay[]>(program?.days || []);
    const [saving, setSaving] = useState(false);
    const [showWorkoutSelector, setShowWorkoutSelector] = useState<{ week: number, day: number } | null>(null);

    const handleSave = async () => {
        if (!name.trim()) return;
        try {
            setSaving(true);
            await onSave({
                ...program,
                name,
                description,
                weeks_count: weeksCount,
                days
            });
        } catch (error) {
            console.error('Error saving program:', error);
        } finally {
            setSaving(false);
        }
    };

    const addActivity = (weekIndex: number, dayIndex: number, type: ProgramActivity['type'], workoutId?: string) => {
        const absoluteDay = (weekIndex * 7) + (dayIndex + 1);
        const dayKey = absoluteDay.toString();

        setDays(prev => {
            const existingDay = prev.find(d => d.day_number === absoluteDay);
            const newActivity: ProgramActivity = {
                id: Math.random().toString(),
                day_id: dayKey,
                type,
                workout_id: workoutId,
                workout: workoutId ? availableWorkouts.find(w => w.id === workoutId) : undefined,
                title: workoutId ? availableWorkouts.find(w => w.id === workoutId)?.name :
                    type === 'walking' ? 'Caminar' :
                        type === 'metrics' ? 'Métricas' :
                            type === 'photo' ? 'Foto' :
                                type === 'form' ? 'Check-in' : type,
                position: existingDay ? existingDay.activities.length : 0
            };

            if (existingDay) {
                return prev.map(d => d.day_number === absoluteDay
                    ? { ...d, activities: [...d.activities, newActivity] }
                    : d
                );
            } else {
                return [...prev, {
                    id: dayKey,
                    program_id: program?.id || '',
                    week_number: weekIndex + 1,
                    day_number: absoluteDay,
                    activities: [newActivity]
                }];
            }
        });
        setShowWorkoutSelector(null);
    };

    const removeActivity = (dayNumber: number, activityId: string) => {
        setDays(prev => prev.map(d => d.day_number === dayNumber
            ? { ...d, activities: d.activities.filter(a => a.id !== activityId) }
            : d
        ));
    };

    const addWeek = () => {
        setWeeksCount(prev => prev + 1);
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'workout': return Layout;
            case 'metrics': return User;
            case 'photo': return Camera;
            case 'form': return ClipboardList;
            case 'walking': return ChevronRight;
            default: return Calendar;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'workout': return 'bg-orange-500';
            case 'metrics': return 'bg-sky-500';
            case 'photo': return 'bg-cyan-500';
            case 'form': return 'bg-teal-600';
            case 'walking': return 'bg-pink-500';
            default: return 'bg-slate-500';
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 animate-fade-in">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 p-6 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-mint/20 rounded-2xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-brand-green" />
                    </div>
                    <div>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Nombre del Programa (ej: Definición 12 semanas)"
                            className="text-2xl font-black text-slate-800 bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-200 w-full max-w-lg"
                        />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Diseñador de Planificación • {weeksCount} Semanas</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                    <button
                        onClick={addWeek}
                        className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Añadir Semana
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !name.trim()}
                        className="px-8 py-2.5 bg-brand-green text-white font-black rounded-xl shadow-lg shadow-brand-green/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {saving ? 'Guardando...' : 'Guardar programa'}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-8 space-y-12 pb-32 custom-scrollbar">
                {Array.from({ length: weeksCount }).map((_, weekIndex) => (
                    <div key={weekIndex} className="space-y-6 animate-fade-in" style={{ animationDelay: `${weekIndex * 100}ms` }}>
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xl font-black text-slate-800">Semana {weekIndex + 1}</h3>
                            <div className="flex gap-2">
                                <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors"><Copy className="w-4 h-4" /></button>
                                <button className="p-2 hover:bg-red-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                            {Array.from({ length: 7 }).map((_, dayIndex) => {
                                const dayNum = dayIndex + 1;
                                const absoluteDay = (weekIndex * 7) + dayNum;

                                return (
                                    <div key={dayIndex} className="flex flex-col gap-2 min-h-[160px]">
                                        <div className="px-3 py-1.5 bg-slate-200/50 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between items-center">
                                            <span>Día {absoluteDay}</span>
                                            {dayNum === 1 && <span className="text-brand-green opacity-50">Lunes</span>}
                                        </div>

                                        <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-2 space-y-2 shadow-sm relative group">
                                            {days.find(d => d.day_number === absoluteDay)?.activities.map(activity => (
                                                <div
                                                    key={activity.id}
                                                    className={`px-3 py-2 ${getActivityColor(activity.type)} text-white rounded-lg text-[10px] font-bold flex items-center justify-between cursor-pointer hover:brightness-110 shadow-sm transition-all group/act`}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="truncate">{activity.title || activity.workout?.name || activity.type}</span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeActivity(absoluteDay, activity.id);
                                                        }}
                                                        className="opacity-0 group-hover/act:opacity-100 p-1 hover:bg-black/10 rounded"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}

                                            <button
                                                onClick={() => setShowWorkoutSelector({ week: weekIndex, day: dayIndex })}
                                                className="absolute bottom-2 right-2 w-7 h-7 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-brand-mint/20 hover:text-brand-green hover:border-brand-mint transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Workout Selector Modal */}
            {showWorkoutSelector && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h4 className="text-xl font-black text-slate-800">Añadir Actividad</h4>
                            <button onClick={() => setShowWorkoutSelector(null)} className="p-2 hover:bg-slate-100 rounded-full">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tipos de Actividad</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => addActivity(showWorkoutSelector.week, showWorkoutSelector.day, 'metrics')}
                                    className="p-4 rounded-2xl border border-slate-100 hover:border-sky-200 hover:bg-sky-50 transition-all text-left"
                                >
                                    <User className="w-6 h-6 text-sky-500 mb-2" />
                                    <p className="font-bold text-slate-700">Métricas</p>
                                </button>
                                <button
                                    onClick={() => addActivity(showWorkoutSelector.week, showWorkoutSelector.day, 'photo')}
                                    className="p-4 rounded-2xl border border-slate-100 hover:border-cyan-200 hover:bg-cyan-50 transition-all text-left"
                                >
                                    <Camera className="w-6 h-6 text-cyan-500 mb-2" />
                                    <p className="font-bold text-slate-700">Fotos</p>
                                </button>
                                <button
                                    onClick={() => addActivity(showWorkoutSelector.week, showWorkoutSelector.day, 'form')}
                                    className="p-4 rounded-2xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50 transition-all text-left"
                                >
                                    <ClipboardList className="w-6 h-6 text-teal-600 mb-2" />
                                    <p className="font-bold text-slate-700">Formulario</p>
                                </button>
                                <button
                                    onClick={() => addActivity(showWorkoutSelector.week, showWorkoutSelector.day, 'walking')}
                                    className="p-4 rounded-2xl border border-slate-100 hover:border-pink-200 hover:bg-pink-50 transition-all text-left"
                                >
                                    <Calendar className="w-6 h-6 text-pink-500 mb-2" />
                                    <p className="font-bold text-slate-700">Caminar</p>
                                </button>
                            </div>

                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest pt-4">Tus Workouts</p>
                            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                                {availableWorkouts.map(workout => (
                                    <button
                                        key={workout.id}
                                        onClick={() => addActivity(showWorkoutSelector.week, showWorkoutSelector.day, 'workout', workout.id)}
                                        className="w-full p-3 rounded-xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50 transition-all flex items-center gap-3 text-left"
                                    >
                                        <Layout className="w-5 h-5 text-orange-500" />
                                        <span className="font-bold text-slate-700 text-sm">{workout.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
