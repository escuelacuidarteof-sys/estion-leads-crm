import React, { useState, useMemo } from 'react';
import {
    Plus, Copy, Trash2, Calendar, Layout, User, Camera,
    ClipboardList, X, Search, ChevronRight, ChevronDown,
    ChevronUp, Info, AlertTriangle, Save, RotateCcw,
    MousePointer2, Sparkles, Filter, Check, ArrowRight,
    Search as SearchIcon, Dumbbell
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
    const [days, setDays] = useState<ProgramDay[]>(() => {
        const rawDays = program?.days || [];
        return rawDays.map(d => {
            // If it's old data where day_number was absolute (e.g. 15 for week 3)
            // or if week_number is missing, recalculate.
            const weekNum = d.week_number || Math.floor((d.day_number - 1) / 7) + 1;
            const dayNum = ((d.day_number - 1) % 7) + 1;
            return {
                ...d,
                week_number: weekNum,
                day_number: dayNum
            };
        });
    });
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const [selectedDay, setSelectedDay] = useState<{ week: number, day: number } | null>(null);
    const [editingActivity, setEditingActivity] = useState<{ dayNumber: number, activity: ProgramActivity } | null>(null);

    const filteredWorkouts = useMemo(() =>
        availableWorkouts.filter(w =>
            w.name.toLowerCase().includes(searchTerm.toLowerCase())
        ), [availableWorkouts, searchTerm]
    );

    const handleSave = async () => {
        if (!name.trim()) {
            setSaveError('Nombre del programa obligatorio');
            return;
        }
        try {
            setSaving(true);
            setSaveError('');

            // Trim days that exceed the current weeksCount
            const validDays = days
                .filter(d => d.week_number <= weeksCount)
                .map(d => ({
                    ...d,
                    activities: d.activities.map(a => ({
                        ...a,
                        // Map 'walking' to 'custom' for DB compatibility if needed
                        type: a.type === 'walking' ? 'custom' : a.type
                    }))
                }));

            await onSave({
                ...program,
                id: program?.id || '',
                name: name.trim(),
                description,
                weeks_count: weeksCount,
                days: validDays
            });
            setHasChanges(false);
        } catch (error) {
            setSaveError('Error al guardar. Revisa los datos.');
            console.error('Error saving program:', error);
            setSaving(false);
        }
    };

    const addActivityToDay = (weekIndex: number, dayIndex: number, type: ProgramActivity['type'], workoutId?: string) => {
        const weekNum = weekIndex + 1;
        const dayNumInWeek = dayIndex + 1;
        const absoluteDay = (weekIndex * 7) + dayNumInWeek;
        const dayKey = `day-${absoluteDay}`;

        setDays(prev => {
            const existingDay = prev.find(d => d.week_number === weekNum && d.day_number === dayNumInWeek);
            const workout = workoutId ? availableWorkouts.find(w => w.id === workoutId) : undefined;

            const newActivity: ProgramActivity = {
                id: `act-${Math.random().toString(36).substr(2, 9)}`,
                day_id: dayKey,
                type,
                activity_id: workoutId,
                workout_id: workoutId,
                workout,
                title: workout ? workout.name :
                    type === 'walking' ? 'Caminar' :
                        type === 'metrics' ? 'Métricas' :
                            type === 'photo' ? 'Fotos' :
                                type === 'form' ? 'Check-in' :
                                    type === 'custom' ? 'Tarea Especial' : type,
                position: existingDay ? existingDay.activities.length : 0
            };

            if (existingDay) {
                return prev.map(d => (d.week_number === weekNum && d.day_number === dayNumInWeek)
                    ? { ...d, activities: [...d.activities, newActivity] }
                    : d
                );
            } else {
                return [...prev, {
                    id: `temp-${dayKey}`,
                    program_id: program?.id || '',
                    week_number: weekNum,
                    day_number: dayNumInWeek,
                    activities: [newActivity]
                }];
            }
        });
        setHasChanges(true);
    };

    const updateActivity = (dayNumber: number, activityId: string, updates: Partial<ProgramActivity>) => {
        // Find by week and day relative to dayNumber (absolute)
        const weekNum = Math.floor((dayNumber - 1) / 7) + 1;
        const dayInWeek = (dayNumber - 1) % 7 + 1;

        setDays(prev => prev.map(d => (d.week_number === weekNum && d.day_number === dayInWeek)
            ? {
                ...d,
                activities: d.activities.map(a => a.id === activityId ? { ...a, ...updates } : a)
            }
            : d
        ));
        setEditingActivity(null);
        setHasChanges(true);
    };

    const clearDay = (absoluteDay: number) => {
        const weekNum = Math.floor((absoluteDay - 1) / 7) + 1;
        const dayInWeek = (absoluteDay - 1) % 7 + 1;
        setDays(prev => prev.filter(d => !(d.week_number === weekNum && d.day_number === dayInWeek)));
    };

    const removeActivity = (dayNumber: number, activityId: string) => {
        const weekNum = Math.floor((dayNumber - 1) / 7) + 1;
        const dayInWeek = (dayNumber - 1) % 7 + 1;
        setDays(prev => prev.map(d => (d.week_number === weekNum && d.day_number === dayInWeek)
            ? { ...d, activities: d.activities.filter(a => a.id !== activityId) }
            : d
        ));
    };

    const removeWeek = (weekIndex: number) => {
        const weekNum = weekIndex + 1;

        setDays(prev => {
            // Remove days of the target week
            const filtered = prev.filter(d => d.week_number !== weekNum);

            // Re-index subsequent weeks
            return filtered.map(d => {
                if (d.week_number > weekNum) {
                    return {
                        ...d,
                        week_number: d.week_number - 1
                    };
                }
                return d;
            });
        });

        // Update selection if needed
        if (selectedDay) {
            if (selectedDay.week === weekIndex) {
                setSelectedDay(null);
            } else if (selectedDay.week > weekIndex) {
                setSelectedDay(prev => prev ? { ...prev, week: prev.week - 1 } : null);
            }
        }

        setWeeksCount(prev => Math.max(1, prev - 1));
        setHasChanges(true);
    };

    const copyWeek = (sourceWeekIndex: number) => {
        const sourceWeekNum = sourceWeekIndex + 1;
        const sourceDays = days.filter(d => d.week_number === sourceWeekNum);

        const newWeekNum = weeksCount + 1;
        const newDays = sourceDays.map(d => ({
            ...d,
            id: `temp-w${newWeekNum}-d${d.day_number}-${Math.random().toString(36).substr(2, 5)}`,
            week_number: newWeekNum,
            day_number: d.day_number,
            activities: d.activities.map(a => ({
                ...a,
                id: `act-${Math.random().toString(36).substr(2, 9)}`,
            }))
        }));

        setWeeksCount(prev => prev + 1);
        setDays(prev => [...prev, ...newDays]);
        setHasChanges(true);
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'workout': return 'from-orange-500 to-amber-600';
            case 'metrics': return 'from-sky-500 to-blue-600';
            case 'photo': return 'from-cyan-500 to-cyan-600';
            case 'form': return 'from-teal-500 to-teal-600';
            case 'walking': return 'from-pink-500 to-rose-600';
            case 'custom': return 'from-violet-500 to-purple-600';
            default: return 'from-slate-500 to-slate-600';
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'workout': return Layout;
            case 'metrics': return User;
            case 'photo': return Camera;
            case 'form': return ClipboardList;
            case 'walking': return ChevronRight;
            case 'custom': return Sparkles;
            default: return Calendar;
        }
    };

    const weekHeaderDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    return (
        <div className="fixed inset-0 flex flex-col h-screen bg-slate-50 overflow-hidden animate-fade-in z-[60]">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-brand-mint/20 rounded-2xl flex items-center justify-center shadow-inner">
                        <Calendar className="w-6 h-6 text-brand-green" />
                    </div>
                    <div className="flex flex-col">
                        <input
                            type="text"
                            value={name}
                            onChange={e => { setName(e.target.value); setHasChanges(true); }}
                            placeholder="Nombre del Programa..."
                            className="text-2xl font-black text-slate-800 bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-200 w-full max-w-xl"
                        />
                        <div className="flex items-center gap-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Diseñador de Planificación • {weeksCount} Semanas</p>
                            {hasChanges && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black rounded-md uppercase tracking-wider animate-pulse">Sin guardar</span>}
                            {saveError && <span className="text-red-500 text-[10px] font-black uppercase animate-pulse">! {saveError}</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => { setWeeksCount(prev => Math.max(1, prev - 1)); setHasChanges(true); }}
                            disabled={weeksCount <= 1}
                            className="p-2 hover:bg-white rounded-lg transition-all disabled:opacity-30"
                        >
                            <ChevronDown className="w-4 h-4 text-slate-600" />
                        </button>
                        <span className="px-3 flex items-center font-black text-slate-700 text-sm">{weeksCount} s</span>
                        <button
                            onClick={() => { setWeeksCount(prev => prev + 1); setHasChanges(true); }}
                            className="p-2 hover:bg-white rounded-lg transition-all"
                        >
                            <ChevronUp className="w-4 h-4 text-slate-600" />
                        </button>
                    </div>

                    <div className="h-8 w-[1px] bg-slate-200" />

                    <button
                        onClick={onClose}
                        className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors group"
                    >
                        <X className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-3 bg-brand-green text-white font-black rounded-xl shadow-lg shadow-brand-green/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Guardando...' : 'Guardar Programa'}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: The Grid */}
                <div className="flex-1 overflow-auto p-12 space-y-16 custom-scrollbar pb-40">
                    {Array.from({ length: weeksCount }).map((_, weekIndex) => (
                        <div key={`week-${weekIndex}-${weeksCount}`} className="space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-800 text-white rounded-xl flex items-center justify-center font-black">
                                        {weekIndex + 1}
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Semana {weekIndex + 1}</h3>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); copyWeek(weekIndex); }}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-white hover:border-brand-green hover:text-brand-green hover:scale-105 active:scale-95 transition-all text-xs shadow-sm group"
                                    >
                                        <Copy className="w-3.5 h-3.5 text-brand-green" /> Duplicar
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm('¿Eliminar esta semana y todas sus actividades?')) {
                                                removeWeek(weekIndex);
                                            }
                                        }}
                                        className="flex items-center justify-center w-9 h-9 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-100 hover:scale-105 active:scale-95 transition-all rounded-xl shadow-sm"
                                        title="Eliminar semana"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-7 gap-5">
                                {weekHeaderDays.map((dayName, dayIndex) => {
                                    const dayNumInWeek = dayIndex + 1;
                                    const absoluteDay = (weekIndex * 7) + dayNumInWeek;
                                    const dayData = days.find(d => d.week_number === (weekIndex + 1) && d.day_number === dayNumInWeek);
                                    const isSelected = selectedDay?.week === weekIndex && selectedDay?.day === dayIndex;

                                    return (
                                        <div
                                            key={dayIndex}
                                            className={`flex flex-col gap-3 min-h-[220px] transition-all duration-300 ${isSelected ? 'scale-[1.02]' : ''}`}
                                        >
                                            <div className="flex items-center justify-between px-2">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-brand-green' : 'text-slate-400'}`}>
                                                    {dayName}
                                                </span>
                                                <span className="text-[10px] font-black text-slate-300">Día {absoluteDay}</span>
                                            </div>

                                            <div
                                                onClick={() => setSelectedDay({ week: weekIndex, day: dayIndex })}
                                                className={`flex-1 bg-white border-2 rounded-3xl p-3 space-y-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${isSelected ? 'border-brand-green ring-4 ring-brand-green/5' : 'border-slate-100 hover:border-brand-mint'
                                                    }`}
                                            >
                                                {!dayData || dayData.activities.length === 0 ? (
                                                    <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-200">
                                                        <Plus className="w-5 h-5 opacity-40" />
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {dayData.activities.map(activity => {
                                                            const Icon = getActivityIcon(activity.type);
                                                            return (
                                                                <div
                                                                    key={activity.id}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingActivity({ dayNumber: absoluteDay, activity });
                                                                    }}
                                                                    className={`px-3 py-2 bg-gradient-to-br ${getActivityColor(activity.type)} text-white rounded-xl flex items-center justify-between group/act relative shadow-sm animate-scale-in hover:scale-[1.02] cursor-pointer transition-transform`}
                                                                >
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        <Icon className="w-3.5 h-3.5 opacity-80 shrink-0" />
                                                                        <span className="text-[10px] font-black truncate leading-tight">
                                                                            {activity.title}
                                                                        </span>
                                                                    </div>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            removeActivity(absoluteDay, activity.id);
                                                                        }}
                                                                        className="p-1 hover:bg-black/10 rounded-md transition-colors opacity-0 group-hover/act:opacity-100"
                                                                    >
                                                                        <Trash2 className="w-3 h-3 text-white" />
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {dayData && dayData.activities.length > 0 && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); clearDay(absoluteDay); }}
                                                        className="absolute -top-2 -right-2 w-7 h-7 bg-white text-slate-400 hover:text-red-500 rounded-full border border-slate-100 shadow-lg flex items-center justify-center z-10"
                                                    >
                                                        <RotateCcw className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Add Week Button at bottom */}
                    <div className="flex justify-center pt-8">
                        <button
                            onClick={() => {
                                setWeeksCount(prev => prev + 1);
                                setHasChanges(true);
                            }}
                            className="group flex flex-col items-center gap-3 p-8 border-2 border-dashed border-slate-200 rounded-[40px] hover:border-brand-green hover:bg-brand-green/5 transition-all w-full max-w-sm"
                        >
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                <Plus className="w-6 h-6 text-brand-green" />
                            </div>
                            <span className="text-sm font-black text-slate-400 group-hover:text-brand-green uppercase tracking-widest">Añadir Semana {weeksCount + 1}</span>
                        </button>
                    </div>
                </div>

                {/* Right Panel: The Sidebar Library */}
                <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-xl z-20">
                    <div className="p-8 border-b border-slate-100">
                        <h4 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-brand-green" />
                            Biblioteca
                        </h4>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Selecciona un día y añade</p>
                    </div>

                    <div className="flex-1 overflow-auto p-6 space-y-10 custom-scrollbar">
                        <section className="space-y-4">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Acciones Rápidas</h5>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { type: 'walking', label: 'Caminar', icon: ChevronRight, color: 'hover:bg-pink-50 text-pink-500' },
                                    { type: 'metrics', label: 'Métricas', icon: User, color: 'hover:bg-sky-50 text-sky-500' },
                                    { type: 'photo', label: 'Fotos', icon: Camera, color: 'hover:bg-cyan-50 text-cyan-500' },
                                    { type: 'form', label: 'Check-in', icon: ClipboardList, color: 'hover:bg-teal-50 text-teal-600' },
                                    { type: 'custom', label: 'Especial', icon: Sparkles, color: 'hover:bg-violet-50 text-violet-600' }
                                ].map(act => (
                                    <button
                                        key={act.type}
                                        disabled={!selectedDay}
                                        onClick={() => selectedDay && addActivityToDay(selectedDay.week, selectedDay.day, act.type as any)}
                                        className={`p-4 rounded-2xl border border-slate-100 transition-all text-left flex flex-col gap-2 ${act.color} disabled:opacity-30 disabled:grayscale`}
                                    >
                                        <act.icon className="w-6 h-6 mb-1" />
                                        <p className="font-black text-xs text-slate-700">{act.label}</p>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Tus Workouts</h5>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar workout..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-xs focus:ring-2 focus:ring-brand-mint transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                {filteredWorkouts.map(workout => (
                                    <button
                                        key={workout.id}
                                        disabled={!selectedDay}
                                        onClick={() => selectedDay && addActivityToDay(selectedDay.week, selectedDay.day, 'workout', workout.id)}
                                        className="w-full p-4 rounded-2xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50 transition-all flex items-center gap-4 text-left group disabled:opacity-30"
                                    >
                                        <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center shrink-0">
                                            <Dumbbell className="w-5 h-5 text-orange-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-black text-slate-700 text-xs truncate">{workout.name}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mt-1">
                                                {workout.blocks?.length || 0} Bloques
                                            </p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-brand-green opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </section>
                    </div>

                    {selectedDay ? (
                        <div className="p-8 bg-brand-green/5 border-t border-brand-mint flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md ring-2 ring-brand-green text-brand-green font-black text-[10px]">
                                    D{(selectedDay.week * 7) + (selectedDay.day + 1)}
                                </div>
                                <p className="text-xs font-black text-slate-700 uppercase">Editando Día {(selectedDay.week * 7) + (selectedDay.day + 1)}</p>
                            </div>
                            <button onClick={() => setSelectedDay(null)} className="p-2 hover:bg-white rounded-lg transition-all text-slate-400">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center gap-4 animate-pulse">
                            <MousePointer2 className="w-5 h-5 text-slate-300" />
                            <p className="text-[10px] font-black text-slate-400 uppercase leading-tight">Selecciona un día para añadir planificación</p>
                        </div>
                    )}
                </aside>
            </div>

            {/* Editing Activity Modal */}
            {editingActivity && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                        <div className={`p-8 bg-gradient-to-br ${getActivityColor(editingActivity.activity.type)} text-white relative`}>
                            <button
                                onClick={() => setEditingActivity(null)}
                                className="absolute top-6 right-6 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                    {React.createElement(getActivityIcon(editingActivity.activity.type), { className: "w-6 h-6" })}
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black">Editar Actividad</h4>
                                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest">{editingActivity.activity.type} • Día {editingActivity.dayNumber}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título de la actividad</label>
                                <input
                                    type="text"
                                    value={editingActivity.activity.title || ''}
                                    onChange={(e) => setEditingActivity({
                                        ...editingActivity,
                                        activity: { ...editingActivity.activity, title: e.target.value }
                                    })}
                                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-brand-mint transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción / Notas</label>
                                <textarea
                                    value={editingActivity.activity.description || ''}
                                    onChange={(e) => setEditingActivity({
                                        ...editingActivity,
                                        activity: { ...editingActivity.activity, description: e.target.value }
                                    })}
                                    rows={4}
                                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-brand-mint transition-all resize-none"
                                    placeholder="Añade instrucciones específicas..."
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    onClick={() => setEditingActivity(null)}
                                    className="flex-1 py-4 text-slate-400 font-black uppercase text-xs hover:text-slate-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => updateActivity(editingActivity.dayNumber, editingActivity.activity.id, {
                                        title: editingActivity.activity.title,
                                        description: editingActivity.activity.description
                                    })}
                                    className="flex-[2] py-4 bg-slate-800 text-white font-black rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all uppercase text-xs tracking-widest"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
