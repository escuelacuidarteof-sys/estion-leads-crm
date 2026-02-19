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
    ClipboardList
} from 'lucide-react';
import { TrainingProgram, ProgramDay, ProgramActivity } from '../../types';

interface ProgramDesignerProps {
    program: TrainingProgram | null;
    onSave: (program: Partial<TrainingProgram>) => Promise<void>;
    onClose: () => void;
}

export function ProgramDesigner({ program, onSave, onClose }: ProgramDesignerProps) {
    const [name, setName] = useState(program?.name || '');
    const [weeksCount, setWeeksCount] = useState(program?.weeks_count || 4);
    const [days, setDays] = useState<ProgramDay[]>(program?.days || []);

    const addWeek = () => {
        setWeeksCount(prev => prev + 1);
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'workout': return Layout;
            case 'metrics': return User;
            case 'photo': return Camera;
            case 'form': return ClipboardList;
            default: return Calendar;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'workout': return 'bg-orange-500';
            case 'metrics': return 'bg-sky-500';
            case 'photo': return 'bg-cyan-500';
            case 'form': return 'bg-teal-600';
            default: return 'bg-pink-500';
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
                        onClick={addWeek}
                        className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Añadir Semana
                    </button>
                    <button
                        className="px-8 py-2.5 bg-brand-green text-white font-black rounded-xl shadow-lg shadow-brand-green/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        Guardar programa
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
                                            {/* Example Activities as per Image 3 */}
                                            {absoluteDay === 1 || absoluteDay === 2 || absoluteDay === 3 || absoluteDay === 8 || absoluteDay === 9 || absoluteDay === 10 ? (
                                                <div className="px-3 py-2 bg-pink-500 text-white rounded-lg text-[10px] font-bold flex items-center justify-between cursor-pointer hover:brightness-110 shadow-sm transition-all">
                                                    <span className="truncate">Caminar</span>
                                                    <MoreHorizontal className="w-3 h-3 shrink-0" />
                                                </div>
                                            ) : null}

                                            {absoluteDay === 1 || absoluteDay === 8 ? (
                                                <div className="px-3 py-2 bg-orange-500 text-white rounded-lg text-[10px] font-bold flex items-center justify-between cursor-pointer hover:brightness-110 shadow-sm transition-all">
                                                    <span className="truncate">Torso Gimnasio</span>
                                                    <MoreHorizontal className="w-3 h-3 shrink-0" />
                                                </div>
                                            ) : null}

                                            {absoluteDay === 3 || absoluteDay === 10 ? (
                                                <div className="px-3 py-2 bg-orange-500 text-white rounded-lg text-[10px] font-bold flex items-center justify-between cursor-pointer hover:brightness-110 shadow-sm transition-all">
                                                    <span className="truncate">Pierna - Gimnasio</span>
                                                    <MoreHorizontal className="w-3 h-3 shrink-0" />
                                                </div>
                                            ) : null}

                                            {dayNum === 5 ? (
                                                <>
                                                    <div className="px-3 py-2 bg-sky-500 text-white rounded-lg text-[10px] font-bold flex items-center justify-between cursor-pointer hover:brightness-110 shadow-sm transition-all">
                                                        <span className="truncate">Métricas personales</span>
                                                        <MoreHorizontal className="w-3 h-3 shrink-0" />
                                                    </div>
                                                    <div className="px-3 py-2 bg-sky-500 text-white rounded-lg text-[10px] font-bold flex items-center justify-between cursor-pointer hover:brightness-110 shadow-sm transition-all">
                                                        <span className="truncate">Foto de progreso</span>
                                                        <MoreHorizontal className="w-3 h-3 shrink-0" />
                                                    </div>
                                                    <div className="px-3 py-2 bg-teal-600 text-white rounded-lg text-[10px] font-bold flex items-center justify-between cursor-pointer hover:brightness-110 shadow-sm transition-all">
                                                        <span className="truncate">Formulario programado</span>
                                                        <MoreHorizontal className="w-3 h-3 shrink-0" />
                                                    </div>
                                                </>
                                            ) : null}

                                            <button className="absolute bottom-2 right-2 w-7 h-7 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-brand-mint/20 hover:text-brand-green hover:border-brand-mint transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100">
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
        </div>
    );
}
