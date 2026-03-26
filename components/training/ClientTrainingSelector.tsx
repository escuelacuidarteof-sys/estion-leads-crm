import React, { useState, useEffect } from 'react';
import { Dumbbell, Check, Search, AlertCircle, Pencil } from 'lucide-react';
import { TrainingProgram, User, ClientTrainingAssignment } from '../../types';
import { trainingService } from '../../services/trainingService';

interface ClientTrainingSelectorProps {
    clientId: string;
    clientName?: string;
    currentUser: User;
    onAssigned?: () => void;
    onCustomize?: (assignmentId: string, programName: string, isCustomized: boolean) => void;
}

export function ClientTrainingSelector({
    clientId,
    clientName,
    currentUser,
    onAssigned,
    onCustomize
}: ClientTrainingSelectorProps) {
    const [programs, setPrograms] = useState<TrainingProgram[]>([]);
    const [assignments, setAssignments] = useState<ClientTrainingAssignment[]>([]);
    const [currentAssignment, setCurrentAssignment] = useState<ClientTrainingAssignment | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAssigning, setIsAssigning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [overlapConflicts, setOverlapConflicts] = useState<ClientTrainingAssignment[]>([]);
    const [pendingAssignProgramId, setPendingAssignProgramId] = useState<string | null>(null);
    const [pendingRange, setPendingRange] = useState<{ start_date: string; end_date: string } | null>(null);

    const toStartOfDay = (input: Date | string) => {
        const date = new Date(input);
        date.setHours(0, 0, 0, 0);
        return date;
    };

    const isDateWithinRange = (target: Date, start: string, end?: string) => {
        if (!end) return false;
        const t = toStartOfDay(target).getTime();
        const s = toStartOfDay(start).getTime();
        const e = toStartOfDay(end).getTime();
        return t >= s && t <= e;
    };

    const resolveCurrentAssignment = (allAssignments: ClientTrainingAssignment[]) => {
        const today = new Date();
        return allAssignments
            .filter((assignment) => isDateWithinRange(today, assignment.start_date, assignment.end_date))
            .sort((a, b) => {
                const startDiff = toStartOfDay(b.start_date).getTime() - toStartOfDay(a.start_date).getTime();
                if (startDiff !== 0) return startDiff;
                return new Date(b.assigned_at || 0).getTime() - new Date(a.assigned_at || 0).getTime();
            })[0] || null;
    };

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [allPrograms, allAssignments] = await Promise.all([
                trainingService.getPrograms(),
                trainingService.getClientAssignments(clientId)
            ]);

            setPrograms(allPrograms);
            setAssignments(allAssignments);
            setCurrentAssignment(resolveCurrentAssignment(allAssignments));
        } catch (err: any) {
            console.error('Error loading training data:', err);
            setError(err.message || 'Error al cargar programas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (clientId) loadData();
    }, [clientId]);

    const getProgramName = (programId: string) => {
        return programs.find((p) => p.id === programId)?.name || 'Programa';
    };

    const handleAssign = async (programId: string, allowOverlap = false) => {
        try {
            setIsAssigning(true);
            setError(null);
            await trainingService.assignProgramToClient(clientId, programId, startDate, currentUser.id, { allowOverlap });
            setPendingAssignProgramId(null);
            setPendingRange(null);
            setOverlapConflicts([]);
            await loadData();
            if (onAssigned) onAssigned();
        } catch (err: any) {
            console.error('Error assigning program:', err);
            if (err?.code === 'TRAINING_OVERLAP') {
                setPendingAssignProgramId(programId);
                setOverlapConflicts(err.conflicts || []);
                setPendingRange(err.requestedRange || null);
                return;
            }
            setError(err.message || 'Error al asignar programa');
        } finally {
            setIsAssigning(false);
        }
    };

    const handleRemoveAssignment = async (assignmentId: string) => {
        try {
            setIsAssigning(true);
            await trainingService.removeClientAssignment(clientId, assignmentId);
            await loadData();
            if (onAssigned) onAssigned();
        } catch (err: any) {
            console.error('Error removing assignment:', err);
            setError(err.message || 'Error al quitar asignación');
        } finally {
            setIsAssigning(false);
        }
    };

    const filteredPrograms = programs.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (date: string) => new Date(date).toLocaleDateString('es-ES');
    const today = toStartOfDay(new Date());
    const nextAssignment = assignments
        .filter((assignment) => toStartOfDay(assignment.start_date).getTime() > today.getTime())
        .sort((a, b) => toStartOfDay(a.start_date).getTime() - toStartOfDay(b.start_date).getTime())[0] || null;

    if (loading) return (
        <div className="animate-pulse space-y-3">
            <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
            <div className="h-20 bg-slate-50 rounded-xl w-full"></div>
        </div>
    );

    if (error) return (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            <div>
                <p className="text-sm text-rose-700 font-medium">Error al cargar programas</p>
                <p className="text-[10px] text-rose-500">{error}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            {/* Estado actual */}
            {currentAssignment ? (
                <div className="bg-brand-mint/30 border border-brand-mint rounded-2xl p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-200">
                            <Check className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-brand-green uppercase tracking-wider">Programa Asignado</p>
                            <h4 className="text-brand-dark font-bold">
                                {getProgramName(currentAssignment.program_id)}
                            </h4>
                            <p className="text-[10px] text-brand-green font-medium">
                                {formatDate(currentAssignment.start_date)} - {currentAssignment.end_date ? formatDate(currentAssignment.end_date) : 'Sin fecha de fin'}
                            </p>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">Activo hoy</span>
                </div>
            ) : (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <div>
                        <p className="text-sm text-amber-700 font-medium">
                            {nextAssignment ? 'Sin programa activo hoy' : 'Sin programa asignado'}
                        </p>
                        <p className="text-[10px] text-amber-600 mt-0.5">
                            {nextAssignment
                                ? `Proximo plan: ${getProgramName(nextAssignment.program_id)} desde ${formatDate(nextAssignment.start_date)}.`
                                : 'Selecciona un programa de la lista para asignarselo al cliente.'}
                        </p>
                    </div>
                </div>
            )}

            {pendingAssignProgramId && overlapConflicts.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-rose-800">Se detecto solape de fechas</p>
                            <p className="text-xs text-rose-700">
                                {pendingRange
                                    ? `Nuevo rango: ${formatDate(pendingRange.start_date)} - ${formatDate(pendingRange.end_date)}`
                                    : 'El plan seleccionado se cruza con otro ya programado.'}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {overlapConflicts.map((conflict) => (
                            <div key={conflict.id} className="bg-white/70 border border-rose-100 rounded-xl p-3">
                                <p className="text-sm font-semibold text-rose-900">{getProgramName(conflict.program_id)}</p>
                                <p className="text-xs text-rose-700">
                                    {formatDate(conflict.start_date)} - {conflict.end_date ? formatDate(conflict.end_date) : 'Sin fecha fin'}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setPendingAssignProgramId(null);
                                setPendingRange(null);
                                setOverlapConflicts([]);
                            }}
                            className="flex-1 px-3 py-2 rounded-xl bg-white border border-rose-200 text-rose-700 text-sm font-bold"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => pendingAssignProgramId && handleAssign(pendingAssignProgramId, true)}
                            disabled={isAssigning}
                            className="flex-1 px-3 py-2 rounded-xl bg-rose-600 text-white text-sm font-bold disabled:opacity-60"
                        >
                            Guardar de todas formas
                        </button>
                    </div>
                </div>
            )}

            {/* Fecha de inicio */}
            <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha de inicio</label>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-brand-dark focus:ring-2 focus:ring-brand-green outline-none transition-all"
                />
            </div>

            {/* Buscador */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar programa por nombre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-green outline-none transition-all"
                />
            </div>

            {/* Lista de programas */}
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredPrograms.map(program => {
                    const isCurrent = currentAssignment?.program_id === program.id;
                    return (
                        <button
                            key={program.id}
                            onClick={() => !isCurrent && handleAssign(program.id)}
                            disabled={isAssigning}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${
                                isCurrent
                                    ? 'border-brand-green bg-brand-mint/20 cursor-default'
                                    : 'border-slate-100 bg-white hover:border-brand-mint hover:shadow-sm'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                    isCurrent
                                        ? 'bg-brand-green text-white'
                                        : 'bg-slate-50 text-slate-400 group-hover:bg-brand-mint group-hover:text-brand-green'
                                }`}>
                                    {isCurrent ? <Check className="w-4 h-4" /> : <Dumbbell className="w-4 h-4" />}
                                </div>
                                <div>
                                    <span className="text-sm font-bold text-slate-700">{program.name}</span>
                                    {program.weeks_count && (
                                        <span className="ml-2 text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">
                                            {program.weeks_count} sem.
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}

                {filteredPrograms.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm">
                        No se encontraron programas
                    </div>
                )}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Calendario de planes</p>
                {assignments.length === 0 ? (
                    <p className="text-xs text-slate-400">No hay planes programados.</p>
                ) : (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {assignments.map((assignment) => {
                            const start = toStartOfDay(assignment.start_date);
                            const end = assignment.end_date ? toStartOfDay(assignment.end_date) : start;
                            const status = today.getTime() < start.getTime()
                                ? 'Futuro'
                                : today.getTime() > end.getTime()
                                    ? 'Finalizado'
                                    : 'Activo';

                            const statusClasses = status === 'Activo'
                                ? 'bg-emerald-100 text-emerald-700'
                                : status === 'Futuro'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-slate-100 text-slate-600';

                            return (
                                <div key={assignment.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-700 truncate">{getProgramName(assignment.program_id)}</p>
                                        <p className="text-xs text-slate-500">
                                            {formatDate(assignment.start_date)} - {assignment.end_date ? formatDate(assignment.end_date) : 'Sin fecha fin'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {assignment.is_customized && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-mint text-brand-green">Personalizado</span>
                                        )}
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusClasses}`}>{status}</span>
                                        {onCustomize && (status === 'Activo' || status === 'Futuro') && (
                                            <button
                                                onClick={() => onCustomize(assignment.id, getProgramName(assignment.program_id), !!assignment.is_customized)}
                                                className="text-[10px] font-bold text-brand-green hover:text-brand-dark flex items-center gap-1"
                                                title="Personalizar programa para este cliente"
                                            >
                                                <Pencil className="w-3 h-3" />
                                                Editar
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleRemoveAssignment(assignment.id)}
                                            disabled={isAssigning}
                                            className="text-[10px] font-bold text-rose-500 hover:text-rose-700"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
