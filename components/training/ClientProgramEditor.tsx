import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    ArrowLeft, Dumbbell, Footprints, Activity, BarChart3,
    Camera, ClipboardList, Sparkles, X, MoveHorizontal,
    RotateCcw, Loader2, AlertTriangle, Check, ChevronDown
} from 'lucide-react';
import { TrainingProgram, ProgramDay, ProgramActivity, ClientProgramDay } from '../../types';
import { trainingService } from '../../services/trainingService';

interface ClientProgramEditorProps {
    assignmentId: string;
    clientId: string;
    clientName: string;
    programName: string;
    isCustomized: boolean;
    startDate: string; // Assignment start date (YYYY-MM-DD)
    onClose: () => void;
    onSaved?: () => void;
}

const DAY_NAMES = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
const DAY_NAMES_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const ACTIVITY_STYLES: Record<string, { icon: any; bg: string; text: string; border: string }> = {
    workout: { icon: Dumbbell, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    walking: { icon: Footprints, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    metrics: { icon: Activity, bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    photo:   { icon: Camera, bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
    form:    { icon: ClipboardList, bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
    custom:  { icon: Sparkles, bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
};

function getActivityStyle(type: string) {
    return ACTIVITY_STYLES[type] || ACTIVITY_STYLES.custom;
}

// Calculate real calendar date for a program day
function getCalendarDate(startDate: string, weekNumber: number, dayNumber: number): Date {
    const start = new Date(startDate + 'T00:00:00');
    const dayOffset = ((weekNumber - 1) * 7) + (dayNumber - 1);
    const date = new Date(start);
    date.setDate(date.getDate() + dayOffset);
    return date;
}

function formatCalendarDate(date: Date): string {
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function getWeekdayName(date: Date): string {
    return date.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase().replace('.', '');
}

function isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
}

export function ClientProgramEditor({
    assignmentId,
    clientId,
    clientName,
    programName,
    isCustomized: initialCustomized,
    startDate: assignmentStartDate,
    onClose,
    onSaved
}: ClientProgramEditorProps) {
    const [program, setProgram] = useState<TrainingProgram | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [customized, setCustomized] = useState(initialCustomized);
    const [materializing, setMaterializing] = useState(false);
    const [selectedWeek, setSelectedWeek] = useState(1);
    const [moveDropdown, setMoveDropdown] = useState<string | null>(null);
    const [removing, setRemoving] = useState<string | null>(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [expandedActivity, setExpandedActivity] = useState<string | null>(null);

    // Load program data
    const loadProgram = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            let data: TrainingProgram | null = null;
            if (customized) {
                data = await trainingService.getClientProgramData(assignmentId);
            }
            if (!data) {
                // Load template program for preview
                const { data: assignment } = await (await import('../../services/supabaseClient')).supabase
                    .from('client_training_assignments')
                    .select('program_id')
                    .eq('id', assignmentId)
                    .single();
                if (assignment?.program_id) {
                    data = await trainingService.getProgramById(assignment.program_id);
                }
            }
            setProgram(data);
        } catch (err: any) {
            console.error('Error loading program:', err);
            setError(err?.message || 'Error al cargar el programa');
        } finally {
            setLoading(false);
        }
    }, [assignmentId, customized]);

    useEffect(() => {
        loadProgram();
    }, [loadProgram]);

    // Get days for the selected week with real calendar dates
    const weekDays = useMemo(() => {
        if (!program?.days) return [];
        return Array.from({ length: 7 }, (_, idx) => {
            const dayNumber = idx + 1;
            const calendarDate = getCalendarDate(assignmentStartDate, selectedWeek, dayNumber);
            const programDay = program.days.find(
                d => d.week_number === selectedWeek && d.day_number === dayNumber
            ) || null;
            return {
                programDay,
                calendarDate,
                dayNumber,
                weekdayName: getWeekdayName(calendarDate),
                dateLabel: formatCalendarDate(calendarDate),
                today: isToday(calendarDate),
            };
        });
    }, [program, selectedWeek, assignmentStartDate]);

    const totalWeeks = program?.weeks_count || 1;

    // Materialize (create client copy)
    const handleMaterialize = async () => {
        setMaterializing(true);
        setError('');
        try {
            await trainingService.materializeClientProgram(assignmentId);
            setCustomized(true);
            await loadProgram();
            onSaved?.();
        } catch (err: any) {
            console.error('Error materializing:', err);
            setError(err?.message || 'Error al personalizar el programa');
        } finally {
            setMaterializing(false);
        }
    };

    // Move activity to another day
    const handleMoveActivity = async (activityId: string, toDayId: string) => {
        setMoveDropdown(null);
        try {
            await trainingService.moveClientActivity(activityId, toDayId, 0);
            await loadProgram();
            onSaved?.();
        } catch (err: any) {
            console.error('Error moving activity:', err);
            setError(err?.message || 'Error al mover la actividad');
        }
    };

    // Remove activity
    const handleRemoveActivity = async (activityId: string) => {
        setRemoving(activityId);
        try {
            await trainingService.removeClientActivity(activityId);
            await loadProgram();
            onSaved?.();
        } catch (err: any) {
            console.error('Error removing activity:', err);
            setError(err?.message || 'Error al eliminar la actividad');
        } finally {
            setRemoving(null);
        }
    };

    // Reset to template
    const handleReset = async () => {
        setResetting(true);
        setError('');
        try {
            await trainingService.resetClientCustomization(assignmentId);
            setCustomized(false);
            setShowResetConfirm(false);
            await loadProgram();
            onSaved?.();
        } catch (err: any) {
            console.error('Error resetting:', err);
            setError(err?.message || 'Error al restablecer el programa');
        } finally {
            setResetting(false);
        }
    };

    // All days in current week that have an id (for move targets)
    const availableMoveTargets = useMemo(() => {
        return weekDays
            .filter(wd => wd.programDay?.id)
            .map(wd => ({
                id: wd.programDay!.id,
                dayNumber: wd.dayNumber,
                label: `${wd.weekdayName} ${wd.dateLabel}`
            }));
    }, [weekDays]);

    const content = (
        <div className="fixed inset-0 z-50 bg-white flex flex-col" style={{ fontFamily: "'Open Sans', sans-serif" }}>
            {/* Header */}
            <div className="border-b border-gray-100 bg-white px-4 sm:px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={onClose}
                            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-green transition-colors shrink-0"
                        >
                            <ArrowLeft size={18} />
                            <span className="hidden sm:inline">Volver</span>
                        </button>
                        <div className="min-w-0">
                            <h1
                                className="text-lg sm:text-xl font-semibold text-brand-dark truncate"
                                style={{ fontFamily: "'Montserrat', sans-serif" }}
                            >
                                Programa de {clientName}
                            </h1>
                            <p className="text-sm text-gray-500 truncate">{programName}</p>
                        </div>
                    </div>
                    {customized && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-mint text-brand-green border border-brand-green/20 shrink-0">
                            <Check size={12} />
                            Personalizado
                        </span>
                    )}
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div className="bg-red-50 border-b border-red-100 px-4 sm:px-6 py-3">
                    <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm text-red-700">
                        <AlertTriangle size={16} />
                        <span>{error}</span>
                        <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 size={32} className="animate-spin text-brand-green" />
                    </div>
                ) : !program ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <AlertTriangle size={40} className="mb-3 text-gray-300" />
                        <p>No se pudo cargar el programa</p>
                    </div>
                ) : !customized ? (
                    /* STATE 1: Preview mode (read-only) */
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                        <div className="bg-brand-mint/30 border border-brand-green/10 rounded-2xl p-6 sm:p-8 text-center mb-8">
                            <Dumbbell size={40} className="mx-auto mb-4 text-brand-green" />
                            <h2
                                className="text-xl font-semibold text-brand-dark mb-2"
                                style={{ fontFamily: "'Montserrat', sans-serif" }}
                            >
                                Programa plantilla
                            </h2>
                            <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                                Este programa se basa en la plantilla <strong>{programName}</strong>.
                                Para mover o eliminar actividades, primero crea una copia personalizada para {clientName}.
                            </p>
                            <button
                                onClick={handleMaterialize}
                                disabled={materializing}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium text-sm transition-all disabled:opacity-60"
                                style={{ backgroundColor: '#6BA06B' }}
                            >
                                {materializing ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Sparkles size={18} />
                                )}
                                {materializing ? 'Personalizando...' : 'Personalizar programa'}
                            </button>
                        </div>

                        {/* Read-only week/day grid preview */}
                        <WeekSelector
                            totalWeeks={totalWeeks}
                            selectedWeek={selectedWeek}
                            onSelect={setSelectedWeek}
                        />
                        <DayGrid
                            weekDaysData={weekDays}
                            readOnly
                            expandedActivity={expandedActivity}
                            onToggleExpand={setExpandedActivity}
                        />
                    </div>
                ) : (
                    /* STATE 2: Edit mode */
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                        {/* Week selector + reset */}
                        <div className="flex items-center justify-between gap-3 mb-5">
                            <WeekSelector
                                totalWeeks={totalWeeks}
                                selectedWeek={selectedWeek}
                                onSelect={setSelectedWeek}
                            />
                            <button
                                onClick={() => setShowResetConfirm(true)}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                            >
                                <RotateCcw size={14} />
                                <span className="hidden sm:inline">Restablecer</span>
                            </button>
                        </div>

                        <DayGrid
                            weekDaysData={weekDays}
                            readOnly={false}
                            expandedActivity={expandedActivity}
                            onToggleExpand={setExpandedActivity}
                            moveDropdown={moveDropdown}
                            onOpenMove={setMoveDropdown}
                            onMove={handleMoveActivity}
                            onRemove={handleRemoveActivity}
                            removingId={removing}
                            moveTargets={availableMoveTargets}
                        />
                    </div>
                )}
            </div>

            {/* Reset confirmation dialog */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                                <AlertTriangle size={20} className="text-red-500" />
                            </div>
                            <h3
                                className="text-lg font-semibold text-brand-dark"
                                style={{ fontFamily: "'Montserrat', sans-serif" }}
                            >
                                Restablecer programa
                            </h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            Se eliminarán todas las personalizaciones de {clientName} y el programa volverá a la plantilla original.
                            Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowResetConfirm(false)}
                                disabled={resetting}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleReset}
                                disabled={resetting}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-60"
                            >
                                {resetting && <Loader2 size={14} className="animate-spin" />}
                                Restablecer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return createPortal(content, document.body);
}

/* ─────────── Sub-components ─────────── */

function WeekSelector({
    totalWeeks,
    selectedWeek,
    onSelect
}: {
    totalWeeks: number;
    selectedWeek: number;
    onSelect: (w: number) => void;
}) {
    const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);

    return (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-1 min-w-0">
            <span className="text-xs font-medium text-gray-400 mr-1 shrink-0">Semana:</span>
            {weeks.map(w => (
                <button
                    key={w}
                    onClick={() => onSelect(w)}
                    className={`
                        min-w-[36px] h-9 rounded-lg text-sm font-medium transition-all shrink-0
                        ${w === selectedWeek
                            ? 'bg-brand-green text-white shadow-sm'
                            : 'bg-gray-50 text-gray-500 hover:bg-brand-mint hover:text-brand-green'
                        }
                    `}
                >
                    {w}
                </button>
            ))}
        </div>
    );
}

interface WeekDayData {
    programDay: ProgramDay | null;
    calendarDate: Date;
    dayNumber: number;
    weekdayName: string;
    dateLabel: string;
    today: boolean;
}

function DayGrid({
    weekDaysData,
    readOnly,
    expandedActivity,
    onToggleExpand,
    moveDropdown,
    onOpenMove,
    onMove,
    onRemove,
    removingId,
    moveTargets,
}: {
    weekDaysData: WeekDayData[];
    readOnly: boolean;
    expandedActivity: string | null;
    onToggleExpand: (id: string | null) => void;
    moveDropdown?: string | null;
    onOpenMove?: (id: string | null) => void;
    onMove?: (activityId: string, toDayId: string) => void;
    onRemove?: (activityId: string) => void;
    removingId?: string | null;
    moveTargets?: { id: string; dayNumber: number; label: string }[];
}) {
    return (
        <>
            {/* Desktop: horizontal grid */}
            <div className="hidden md:grid grid-cols-7 gap-3">
                {weekDaysData.map((wd, idx) => {
                    const day = wd.programDay;
                    const activities = day?.activities || [];
                    const isEmpty = activities.length === 0;

                    return (
                        <div key={idx} className="flex flex-col">
                            <div className={`text-center mb-2 ${wd.today ? 'bg-brand-green text-white rounded-xl py-1.5 px-1' : ''}`}>
                                <div className={`text-xs font-semibold uppercase tracking-wider ${wd.today ? 'text-white' : 'text-gray-400'}`}>
                                    {wd.weekdayName}
                                </div>
                                <div className={`text-sm font-bold ${wd.today ? 'text-white' : 'text-gray-600'}`}>
                                    {wd.dateLabel}
                                </div>
                            </div>
                            <div className={`
                                flex-1 rounded-2xl border p-2.5 min-h-[140px] transition-colors
                                ${wd.today ? 'border-brand-green/30 bg-brand-mint/10' : isEmpty ? 'bg-gray-50/50 border-gray-100' : 'bg-white border-gray-150 shadow-sm'}
                            `}>
                                {isEmpty ? (
                                    <div className="flex items-center justify-center h-full text-xs text-gray-300">
                                        Descanso
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {activities.map(act => (
                                            <ActivityCard
                                                key={act.id}
                                                activity={act}
                                                readOnly={readOnly}
                                                compact
                                                expanded={expandedActivity === act.id}
                                                onToggleExpand={() => onToggleExpand(expandedActivity === act.id ? null : act.id)}
                                                showMoveDropdown={moveDropdown === act.id}
                                                onOpenMove={() => onOpenMove?.(moveDropdown === act.id ? null : act.id)}
                                                onMove={(toDayId) => onMove?.(act.id, toDayId)}
                                                onRemove={() => onRemove?.(act.id)}
                                                isRemoving={removingId === act.id}
                                                moveTargets={moveTargets?.filter(t => t.id !== day?.id)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Mobile: vertical list */}
            <div className="md:hidden flex flex-col gap-3">
                {weekDaysData.map((wd, idx) => {
                    const day = wd.programDay;
                    const activities = day?.activities || [];
                    const isEmpty = activities.length === 0;

                    return (
                        <div key={idx} className={`
                            rounded-2xl border p-3 transition-colors
                            ${wd.today ? 'border-brand-green/30 bg-brand-mint/10' : isEmpty ? 'bg-gray-50/50 border-gray-100' : 'bg-white border-gray-150 shadow-sm'}
                        `}>
                            <div className={`flex items-center gap-2 mb-2 ${wd.today ? 'text-brand-green' : 'text-gray-400'}`}>
                                <span className="text-xs font-semibold uppercase tracking-wider">{wd.weekdayName}</span>
                                <span className={`text-sm font-bold ${wd.today ? 'text-brand-green' : 'text-gray-600'}`}>{wd.dateLabel}</span>
                                {wd.today && <span className="text-[10px] font-bold bg-brand-green text-white px-2 py-0.5 rounded-full">Hoy</span>}
                            </div>
                            {isEmpty ? (
                                <div className="text-xs text-gray-300 py-2">Descanso</div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {activities.map(act => (
                                        <ActivityCard
                                            key={act.id}
                                            activity={act}
                                            readOnly={readOnly}
                                            compact={false}
                                            expanded={expandedActivity === act.id}
                                            onToggleExpand={() => onToggleExpand(expandedActivity === act.id ? null : act.id)}
                                            showMoveDropdown={moveDropdown === act.id}
                                            onOpenMove={() => onOpenMove?.(moveDropdown === act.id ? null : act.id)}
                                            onMove={(toDayId) => onMove?.(act.id, toDayId)}
                                            onRemove={() => onRemove?.(act.id)}
                                            isRemoving={removingId === act.id}
                                            moveTargets={moveTargets?.filter(t => t.id !== day?.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
}

function ActivityCard({
    activity,
    readOnly,
    compact,
    expanded,
    onToggleExpand,
    showMoveDropdown,
    onOpenMove,
    onMove,
    onRemove,
    isRemoving,
    moveTargets,
}: {
    activity: ProgramActivity;
    readOnly: boolean;
    compact: boolean;
    expanded: boolean;
    onToggleExpand: () => void;
    showMoveDropdown?: boolean;
    onOpenMove?: () => void;
    onMove?: (toDayId: string) => void;
    onRemove?: () => void;
    isRemoving?: boolean;
    moveTargets?: { id: string; dayNumber: number; label: string }[];
}) {
    const style = getActivityStyle(activity.type);
    const Icon = style.icon;
    const label = activity.title || activity.type;

    return (
        <div className="relative">
            <div
                className={`
                    ${style.bg} ${style.border} border rounded-xl transition-all
                    ${compact ? 'p-2' : 'p-3'}
                    ${activity.type === 'workout' ? 'cursor-pointer' : ''}
                `}
                onClick={activity.type === 'workout' ? onToggleExpand : undefined}
            >
                <div className="flex items-center gap-2">
                    <Icon size={compact ? 14 : 16} className={style.text} />
                    <span className={`${style.text} text-xs font-medium truncate flex-1`}>
                        {label}
                    </span>
                    {!readOnly && (
                        <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                            <button
                                onClick={onOpenMove}
                                className="p-1 rounded-md hover:bg-white/60 text-gray-400 hover:text-brand-green transition-colors"
                                title="Mover a otro día"
                            >
                                <MoveHorizontal size={12} />
                            </button>
                            <button
                                onClick={onRemove}
                                disabled={isRemoving}
                                className="p-1 rounded-md hover:bg-white/60 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                                title="Eliminar"
                            >
                                {isRemoving ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                            </button>
                        </div>
                    )}
                </div>

                {/* Description if present and not compact */}
                {!compact && activity.description && (
                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{activity.description}</p>
                )}

                {/* Expanded workout info */}
                {expanded && activity.type === 'workout' && (
                    <div className="mt-2 pt-2 border-t border-amber-100">
                        <p className="text-[11px] text-gray-500">
                            {activity.description || 'Haz clic para ver los ejercicios en el editor de workout.'}
                        </p>
                        {activity.workout_id && (
                            <span className="inline-block mt-1 text-[10px] text-amber-500 font-mono">
                                ID: {activity.workout_id.slice(0, 8)}...
                            </span>
                        )}
                    </div>
                )}

                {/* Expand indicator for workouts */}
                {activity.type === 'workout' && compact && (
                    <ChevronDown
                        size={10}
                        className={`mx-auto mt-1 text-amber-300 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    />
                )}
            </div>

            {/* Move dropdown */}
            {showMoveDropdown && moveTargets && moveTargets.length > 0 && (
                <div className="absolute z-10 top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[140px]">
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Mover a
                    </div>
                    {moveTargets.map(t => (
                        <button
                            key={t.id}
                            onClick={() => onMove?.(t.id)}
                            className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-brand-mint/40 hover:text-brand-green transition-colors"
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
