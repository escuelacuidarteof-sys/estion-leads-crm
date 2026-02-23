import React, { useState, useMemo } from 'react';
import {
    Plus, Copy, Trash2, Calendar, Layout, User, Camera,
    ClipboardList, X, Search, ChevronRight, ChevronDown,
    ChevronUp, Save, RotateCcw,
    Sparkles, Dumbbell, ArrowRight,
    MousePointer2, Footprints, GripVertical
} from 'lucide-react';
import { TrainingProgram, ProgramDay, ProgramActivity, Workout } from '../../types';

interface ProgramDesignerProps {
    program: TrainingProgram | null;
    availableWorkouts: Workout[];
    onSave: (program: Partial<TrainingProgram>) => Promise<void>;
    onClose: () => void;
}

const QUICK_ACTIONS: { type: ProgramActivity['type']; label: string; icon: any; gradient: string; bg: string; }[] = [
    { type: 'workout', label: 'Workout', icon: Dumbbell, gradient: 'from-orange-500 to-amber-600', bg: 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100' },
    { type: 'walking', label: 'Caminar', icon: Footprints, gradient: 'from-pink-500 to-rose-600', bg: 'bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100' },
    { type: 'metrics', label: 'Métricas', icon: User, gradient: 'from-sky-500 to-blue-600', bg: 'bg-sky-50 text-sky-600 border-sky-200 hover:bg-sky-100' },
    { type: 'photo', label: 'Fotos', icon: Camera, gradient: 'from-cyan-500 to-teal-600', bg: 'bg-cyan-50 text-cyan-600 border-cyan-200 hover:bg-cyan-100' },
    { type: 'form', label: 'Check-in', icon: ClipboardList, gradient: 'from-teal-500 to-emerald-600', bg: 'bg-teal-50 text-teal-600 border-teal-200 hover:bg-teal-100' },
    { type: 'custom', label: 'Especial', icon: Sparkles, gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-50 text-violet-600 border-violet-200 hover:bg-violet-100' },
];

const DAY_NAMES = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
const DAY_NAMES_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export function ProgramDesigner({ program, availableWorkouts, onSave, onClose }: ProgramDesignerProps) {
    const [name, setName] = useState(program?.name || '');
    const [description, setDescription] = useState(program?.description || '');
    const [weeksCount, setWeeksCount] = useState(program?.weeks_count || 4);
    const [days, setDays] = useState<ProgramDay[]>(() => {
        const rawDays = program?.days || [];
        return rawDays.map(d => {
            const weekNum = d.week_number || Math.floor((d.day_number - 1) / 7) + 1;
            const dayNum = ((d.day_number - 1) % 7) + 1;
            return { ...d, week_number: weekNum, day_number: dayNum };
        });
    });
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const [selectedDay, setSelectedDay] = useState<{ week: number; day: number } | null>(null);
    const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(() => new Set([0]));
    const [addingToDay, setAddingToDay] = useState<{ week: number; day: number } | null>(null);
    const [editingActivity, setEditingActivity] = useState<{ dayNumber: number; activity: ProgramActivity } | null>(null);

    const filteredWorkouts = useMemo(() =>
        availableWorkouts.filter(w =>
            w.name.toLowerCase().includes(searchTerm.toLowerCase())
        ), [availableWorkouts, searchTerm]
    );

    const toggleWeek = (weekIndex: number) => {
        setExpandedWeeks(prev => {
            const next = new Set(prev);
            if (next.has(weekIndex)) next.delete(weekIndex);
            else next.add(weekIndex);
            return next;
        });
    };

    const getWeekStats = (weekIndex: number) => {
        const weekNum = weekIndex + 1;
        const weekDays = days.filter(d => d.week_number === weekNum);
        const totalActivities = weekDays.reduce((sum, d) => sum + d.activities.length, 0);
        const daysWithContent = weekDays.filter(d => d.activities.length > 0).length;
        return { totalActivities, daysWithContent };
    };

    const handleSave = async () => {
        if (!name.trim()) { setSaveError('Nombre del programa obligatorio'); return; }
        try {
            setSaving(true);
            setSaveError('');
            const validDays = days
                .filter(d => d.week_number <= weeksCount)
                .map(d => ({
                    ...d,
                    activities: d.activities.map(a => ({
                        ...a,
                        type: a.type === 'walking' ? 'custom' as const : a.type
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
        const dayKey = `day-${(weekIndex * 7) + dayNumInWeek}`;

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
        const weekNum = Math.floor((dayNumber - 1) / 7) + 1;
        const dayInWeek = (dayNumber - 1) % 7 + 1;
        setDays(prev => prev.map(d => (d.week_number === weekNum && d.day_number === dayInWeek)
            ? { ...d, activities: d.activities.map(a => a.id === activityId ? { ...a, ...updates } : a) }
            : d
        ));
        setEditingActivity(null);
        setHasChanges(true);
    };

    const clearDay = (weekIndex: number, dayIndex: number) => {
        const weekNum = weekIndex + 1;
        const dayInWeek = dayIndex + 1;
        setDays(prev => prev.filter(d => !(d.week_number === weekNum && d.day_number === dayInWeek)));
        setHasChanges(true);
    };

    const removeActivity = (weekIndex: number, dayIndex: number, activityId: string) => {
        const weekNum = weekIndex + 1;
        const dayInWeek = dayIndex + 1;
        setDays(prev => prev.map(d => (d.week_number === weekNum && d.day_number === dayInWeek)
            ? { ...d, activities: d.activities.filter(a => a.id !== activityId) }
            : d
        ));
        setHasChanges(true);
    };

    const removeWeek = (weekIndex: number) => {
        const weekNum = weekIndex + 1;
        setDays(prev => {
            const filtered = prev.filter(d => d.week_number !== weekNum);
            return filtered.map(d => d.week_number > weekNum ? { ...d, week_number: d.week_number - 1 } : d);
        });
        if (selectedDay?.week === weekIndex) setSelectedDay(null);
        else if (selectedDay && selectedDay.week > weekIndex) setSelectedDay(prev => prev ? { ...prev, week: prev.week - 1 } : null);
        setExpandedWeeks(prev => {
            const next = new Set<number>();
            prev.forEach(w => {
                if (w < weekIndex) next.add(w);
                else if (w > weekIndex) next.add(w - 1);
            });
            return next;
        });
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
            activities: d.activities.map(a => ({
                ...a,
                id: `act-${Math.random().toString(36).substr(2, 9)}`,
            }))
        }));
        setWeeksCount(prev => prev + 1);
        setDays(prev => [...prev, ...newDays]);
        setExpandedWeeks(prev => new Set([...prev, weeksCount]));
        setHasChanges(true);
    };

    const getActivityColor = (type: string) => {
        return QUICK_ACTIONS.find(a => a.type === type)?.gradient || 'from-slate-500 to-slate-600';
    };

    const getActivityIcon = (type: string) => {
        return QUICK_ACTIONS.find(a => a.type === type)?.icon || Calendar;
    };

    return (
        <div className="fixed inset-0 flex flex-col h-screen bg-slate-50 overflow-hidden animate-fade-in z-[9999]">
            {/* ─── HEADER ─── */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                        <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <input
                            type="text"
                            value={name}
                            onChange={e => { setName(e.target.value); setHasChanges(true); }}
                            placeholder="Nombre del Programa..."
                            className="text-xl font-black text-slate-800 bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-300 w-full outline-none"
                        />
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{weeksCount} Semanas</span>
                            {hasChanges && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black rounded-md uppercase animate-pulse">Sin guardar</span>}
                            {saveError && <span className="text-red-500 text-[9px] font-black uppercase animate-pulse">⚠ {saveError}</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Week Count Controls */}
                    <div className="flex bg-slate-100 p-0.5 rounded-lg items-center">
                        <button onClick={() => { setWeeksCount(prev => Math.max(1, prev - 1)); setHasChanges(true); }} disabled={weeksCount <= 1}
                            className="p-1.5 hover:bg-white rounded-md transition-all disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5 text-slate-600" /></button>
                        <span className="px-2 font-black text-slate-700 text-xs tabular-nums">{weeksCount}s</span>
                        <button onClick={() => { setWeeksCount(prev => prev + 1); setHasChanges(true); }}
                            className="p-1.5 hover:bg-white rounded-md transition-all"><ChevronUp className="w-3.5 h-3.5 text-slate-600" /></button>
                    </div>

                    <div className="h-7 w-px bg-slate-200" />

                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                    <button onClick={handleSave} disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-brand-green text-white font-black rounded-xl shadow-lg shadow-brand-green/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 text-sm">
                        <Save className="w-4 h-4" />
                        {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>

            {/* ─── MAIN CONTENT ─── */}
            <div className="flex-1 flex overflow-hidden">
                {/* ─── LEFT: Weeks & Days Grid ─── */}
                <div className="flex-1 overflow-auto p-6 space-y-4 custom-scrollbar pb-32">
                    {Array.from({ length: weeksCount }).map((_, weekIndex) => {
                        const isExpanded = expandedWeeks.has(weekIndex);
                        const stats = getWeekStats(weekIndex);

                        return (
                            <div key={`week-${weekIndex}-${weeksCount}`} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all">
                                {/* Week Header */}
                                <div
                                    onClick={() => toggleWeek(weekIndex)}
                                    className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50/50 transition-colors select-none"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm transition-colors ${isExpanded ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                            {weekIndex + 1}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800">Semana {weekIndex + 1}</h3>
                                            <p className="text-[10px] text-slate-400 font-bold">
                                                {stats.daysWithContent}/7 días • {stats.totalActivities} actividades
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Mini day indicators */}
                                        <div className="flex gap-1 mr-2">
                                            {DAY_NAMES.map((_, dayIdx) => {
                                                const dayData = days.find(d => d.week_number === weekIndex + 1 && d.day_number === dayIdx + 1);
                                                const hasContent = dayData && dayData.activities.length > 0;
                                                return (
                                                    <div key={dayIdx} className={`w-2 h-2 rounded-full transition-colors ${hasContent ? 'bg-brand-green' : 'bg-slate-200'}`} />
                                                );
                                            })}
                                        </div>

                                        <button onClick={(e) => { e.stopPropagation(); copyWeek(weekIndex); }}
                                            className="p-1.5 hover:bg-blue-50 rounded-lg transition-all text-slate-400 hover:text-blue-500" title="Duplicar semana">
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); if (window.confirm('¿Eliminar esta semana?')) removeWeek(weekIndex); }}
                                            className="p-1.5 hover:bg-red-50 rounded-lg transition-all text-slate-400 hover:text-red-500" title="Eliminar semana">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                        <div className={`p-1.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                            <ChevronDown className="w-4 h-4 text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Week Content - Days Grid */}
                                {isExpanded && (
                                    <div className="px-5 pb-5 pt-1 border-t border-slate-100">
                                        <div className="grid grid-cols-7 gap-3">
                                            {DAY_NAMES.map((dayName, dayIndex) => {
                                                const dayNumInWeek = dayIndex + 1;
                                                const dayData = days.find(d => d.week_number === (weekIndex + 1) && d.day_number === dayNumInWeek);
                                                const isSelected = selectedDay?.week === weekIndex && selectedDay?.day === dayIndex;
                                                const isAdding = addingToDay?.week === weekIndex && addingToDay?.day === dayIndex;
                                                const activities = dayData?.activities || [];

                                                return (
                                                    <div key={dayIndex} className="flex flex-col">
                                                        {/* Day Header */}
                                                        <div className="flex items-center justify-between px-1 mb-1.5">
                                                            <span className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? 'text-brand-green' : 'text-slate-400'}`}>
                                                                {dayName}
                                                            </span>
                                                            {activities.length > 0 && (
                                                                <button
                                                                    onClick={() => { if (window.confirm(`¿Limpiar ${DAY_NAMES_FULL[dayIndex]}?`)) clearDay(weekIndex, dayIndex); }}
                                                                    className="p-0.5 hover:bg-red-50 rounded text-slate-300 hover:text-red-400 transition-colors"
                                                                    title="Limpiar día"
                                                                >
                                                                    <RotateCcw className="w-2.5 h-2.5" />
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Day Card */}
                                                        <div
                                                            onClick={() => {
                                                                setSelectedDay({ week: weekIndex, day: dayIndex });
                                                                setAddingToDay(null);
                                                            }}
                                                            className={`flex-1 min-h-[120px] rounded-xl border-2 p-2 transition-all cursor-pointer relative group
                                                                ${isSelected
                                                                    ? 'border-brand-green bg-brand-green/5 ring-2 ring-brand-green/10'
                                                                    : 'border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-white'
                                                                }`}
                                                        >
                                                            {/* Activities */}
                                                            {activities.length > 0 ? (
                                                                <div className="space-y-1.5">
                                                                    {activities.map(activity => {
                                                                        const Icon = getActivityIcon(activity.type);
                                                                        return (
                                                                            <div
                                                                                key={activity.id}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    const absoluteDay = (weekIndex * 7) + dayIndex + 1;
                                                                                    setEditingActivity({ dayNumber: absoluteDay, activity });
                                                                                }}
                                                                                className={`px-2 py-1.5 bg-gradient-to-r ${getActivityColor(activity.type)} text-white rounded-lg flex items-center gap-1.5 group/act shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer`}
                                                                            >
                                                                                <Icon className="w-3 h-3 opacity-80 shrink-0" />
                                                                                <span className="text-[9px] font-bold truncate flex-1 leading-tight">
                                                                                    {activity.title}
                                                                                </span>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        removeActivity(weekIndex, dayIndex, activity.id);
                                                                                    }}
                                                                                    className="p-0.5 hover:bg-black/20 rounded transition-colors opacity-0 group-hover/act:opacity-100 shrink-0"
                                                                                >
                                                                                    <X className="w-2.5 h-2.5" />
                                                                                </button>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <div className="h-full flex items-center justify-center">
                                                                    <div className="text-slate-200 group-hover:text-slate-300 transition-colors">
                                                                        <Plus className="w-4 h-4" />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Inline Add Button */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedDay({ week: weekIndex, day: dayIndex });
                                                                    setAddingToDay(isAdding ? null : { week: weekIndex, day: dayIndex });
                                                                }}
                                                                className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-md transition-all z-10
                                                                    ${isAdding
                                                                        ? 'bg-brand-green border-brand-green text-white scale-110'
                                                                        : 'bg-white border-slate-200 text-slate-400 opacity-0 group-hover:opacity-100 hover:border-brand-green hover:text-brand-green'
                                                                    }`}
                                                            >
                                                                {isAdding ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                                            </button>
                                                        </div>

                                                        {/* Inline Quick Add Dropdown */}
                                                        {isAdding && (
                                                            <div className="mt-3 bg-white rounded-xl border border-slate-200 shadow-xl p-2 space-y-1 animate-scale-in z-30 relative">
                                                                {QUICK_ACTIONS.filter(a => a.type !== 'workout').map(act => (
                                                                    <button
                                                                        key={act.type}
                                                                        onClick={() => {
                                                                            addActivityToDay(weekIndex, dayIndex, act.type);
                                                                            setAddingToDay(null);
                                                                        }}
                                                                        className={`w-full px-2.5 py-1.5 rounded-lg border text-left flex items-center gap-2 transition-all text-xs font-bold ${act.bg}`}
                                                                    >
                                                                        <act.icon className="w-3.5 h-3.5 shrink-0" />
                                                                        {act.label}
                                                                    </button>
                                                                ))}
                                                                <div className="border-t border-slate-100 pt-1 mt-1">
                                                                    <p className="text-[9px] font-black text-slate-400 uppercase px-2 py-1 tracking-wider">Workouts</p>
                                                                    <div className="max-h-32 overflow-auto custom-scrollbar space-y-0.5">
                                                                        {availableWorkouts.length > 0 ? availableWorkouts.map(w => (
                                                                            <button
                                                                                key={w.id}
                                                                                onClick={() => {
                                                                                    addActivityToDay(weekIndex, dayIndex, 'workout', w.id);
                                                                                    setAddingToDay(null);
                                                                                }}
                                                                                className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-orange-50 transition-colors text-[11px] font-bold text-slate-600"
                                                                            >
                                                                                <Dumbbell className="w-3 h-3 text-orange-500 shrink-0" />
                                                                                <span className="truncate">{w.name}</span>
                                                                            </button>
                                                                        )) : (
                                                                            <p className="text-[10px] text-slate-400 px-2 py-1 italic">No hay workouts creados</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Add Week Button */}
                    <button
                        onClick={() => {
                            const newIdx = weeksCount;
                            setWeeksCount(prev => prev + 1);
                            setExpandedWeeks(prev => new Set([...prev, newIdx]));
                            setHasChanges(true);
                        }}
                        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-black text-sm uppercase tracking-wider hover:border-brand-green hover:text-brand-green hover:bg-brand-green/5 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Añadir Semana {weeksCount + 1}
                    </button>
                </div>

                {/* ─── RIGHT: Sidebar Library ─── */}
                <aside className="w-72 bg-white border-l border-slate-200 flex flex-col shadow-lg z-20 shrink-0">
                    {/* Sidebar Header */}
                    <div className="p-5 border-b border-slate-100">
                        <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-brand-green" />
                            Biblioteca
                        </h4>
                        {selectedDay ? (
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-6 h-6 bg-brand-green rounded-md flex items-center justify-center">
                                    <span className="text-[8px] font-black text-white">{DAY_NAMES[selectedDay.day]}</span>
                                </div>
                                <p className="text-[10px] font-bold text-slate-500">
                                    S{selectedDay.week + 1} • {DAY_NAMES_FULL[selectedDay.day]}
                                </p>
                                <button onClick={() => setSelectedDay(null)} className="ml-auto p-1 hover:bg-slate-100 rounded">
                                    <X className="w-3 h-3 text-slate-400" />
                                </button>
                            </div>
                        ) : (
                            <p className="text-[10px] text-slate-400 font-bold mt-1 flex items-center gap-1">
                                <MousePointer2 className="w-3 h-3" /> Selecciona un día
                            </p>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="p-4 border-b border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Acciones Rápidas</p>
                        <div className="grid grid-cols-3 gap-1.5">
                            {QUICK_ACTIONS.filter(a => a.type !== 'workout').map(act => (
                                <button
                                    key={act.type}
                                    disabled={!selectedDay}
                                    onClick={() => selectedDay && addActivityToDay(selectedDay.week, selectedDay.day, act.type)}
                                    className={`p-2.5 rounded-xl border transition-all flex flex-col items-center gap-1.5 disabled:opacity-20 disabled:grayscale ${act.bg}`}
                                >
                                    <act.icon className="w-4 h-4" />
                                    <span className="text-[8px] font-black">{act.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Workouts List */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="px-4 pt-4 pb-2">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                                Workouts ({availableWorkouts.length})
                            </p>
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border-none rounded-lg text-xs focus:ring-2 focus:ring-brand-mint transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto px-4 pb-4 custom-scrollbar space-y-1">
                            {filteredWorkouts.map(workout => (
                                <button
                                    key={workout.id}
                                    disabled={!selectedDay}
                                    onClick={() => selectedDay && addActivityToDay(selectedDay.week, selectedDay.day, 'workout', workout.id)}
                                    className="w-full p-3 rounded-xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50 transition-all flex items-center gap-3 text-left group disabled:opacity-20 disabled:grayscale"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                                        <Dumbbell className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-slate-700 text-xs truncate">{workout.name}</p>
                                        <p className="text-[9px] text-slate-400 font-bold">
                                            {workout.blocks?.length || 0} bloques • {workout.blocks?.reduce((s, b) => s + (b.exercises?.length || 0), 0) || 0} ej.
                                        </p>
                                    </div>
                                    <ArrowRight className="w-3.5 h-3.5 text-brand-green opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                </button>
                            ))}
                            {filteredWorkouts.length === 0 && (
                                <div className="text-center py-8">
                                    <Dumbbell className="w-6 h-6 text-slate-200 mx-auto mb-2" />
                                    <p className="text-[10px] text-slate-400 font-bold">
                                        {availableWorkouts.length === 0 ? 'Crea workouts primero' : 'Sin resultados'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            </div>

            {/* ─── EDITING ACTIVITY MODAL ─── */}
            {editingActivity && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className={`p-6 bg-gradient-to-br ${getActivityColor(editingActivity.activity.type)} text-white relative`}>
                            <button onClick={() => setEditingActivity(null)}
                                className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                                    {React.createElement(getActivityIcon(editingActivity.activity.type), { className: "w-5 h-5" })}
                                </div>
                                <div>
                                    <h4 className="text-lg font-black">Editar Actividad</h4>
                                    <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
                                        {editingActivity.activity.type} • Día {editingActivity.dayNumber}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título</label>
                                <input
                                    type="text"
                                    value={editingActivity.activity.title || ''}
                                    onChange={(e) => setEditingActivity({
                                        ...editingActivity,
                                        activity: { ...editingActivity.activity, title: e.target.value }
                                    })}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-700 text-sm focus:ring-2 focus:ring-brand-mint transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción / Notas</label>
                                <textarea
                                    value={editingActivity.activity.description || ''}
                                    onChange={(e) => setEditingActivity({
                                        ...editingActivity,
                                        activity: { ...editingActivity.activity, description: e.target.value }
                                    })}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-700 text-sm focus:ring-2 focus:ring-brand-mint transition-all resize-none"
                                    placeholder="Instrucciones específicas..."
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button onClick={() => setEditingActivity(null)}
                                    className="flex-1 py-3 text-slate-400 font-black uppercase text-xs hover:text-slate-600 transition-colors">
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => updateActivity(editingActivity.dayNumber, editingActivity.activity.id, {
                                        title: editingActivity.activity.title,
                                        description: editingActivity.activity.description
                                    })}
                                    className="flex-[2] py-3 bg-slate-800 text-white font-black rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all uppercase text-xs tracking-widest"
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
