import React, { useState } from 'react';
import {
    Dumbbell,
    Calendar,
    Layout,
    Plus,
    Search,
    Filter,
    ArrowRight
} from 'lucide-react';
import { ExerciseLibrary } from './ExerciseLibrary';
import { WorkoutEditor } from './WorkoutEditor';
import { ProgramDesigner } from './ProgramDesigner';
import { ExerciseEditor } from './ExerciseEditor';
import { Exercise, Workout, TrainingProgram } from '../../types';

type TrainingView = 'overview' | 'exercises' | 'workouts' | 'programs';

export function TrainingManagement() {
    const [activeView, setActiveView] = useState<TrainingView>('overview');
    const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
    const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
    const [isCreatingExercise, setIsCreatingExercise] = useState(false);

    // Stats for the overview
    const stats = [
        { label: 'Ejercicios', count: 550, icon: Dumbbell, color: 'bg-brand-mint/20 text-brand-green' },
        { label: 'Workouts', count: 42, icon: Layout, color: 'bg-orange-100 text-orange-600' },
        { label: 'Programas', count: 12, icon: Calendar, color: 'bg-sky-100 text-sky-600' },
    ];

    if (selectedWorkout) {
        return (
            <WorkoutEditor
                workout={selectedWorkout}
                availableExercises={[]} // Fetch from SB
                onSave={async (w) => console.log('Saving workout', w)}
                onClose={() => setSelectedWorkout(null)}
            />
        );
    }

    if (selectedProgram) {
        return (
            <ProgramDesigner
                program={selectedProgram}
                onSave={async (p) => console.log('Saving program', p)}
                onClose={() => setSelectedProgram(null)}
            />
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">Centro de Entrenamiento</h1>
                    <p className="text-slate-500">Gestiona la librería de ejercicios, sesiones y planificaciones.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsCreatingExercise(true)}
                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Ejercicio
                    </button>
                    <button
                        onClick={() => setSelectedWorkout({ id: '', name: '', blocks: [] } as any)}
                        className="px-6 py-2.5 bg-brand-green text-white font-black rounded-xl shadow-lg shadow-brand-green/20 hover:scale-105 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Crear Workout
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.color}`}>
                            <stat.icon className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{stat.label}</p>
                            <h4 className="text-3xl font-black text-slate-800">{stat.count}</h4>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                {[
                    { id: 'overview', label: 'Dashboard' },
                    { id: 'exercises', label: 'Ejercicios' },
                    { id: 'workouts', label: 'Workouts' },
                    { id: 'programs', label: 'Programas' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveView(tab.id as TrainingView)}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeView === tab.id
                                ? 'bg-white text-brand-green shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Example Program Card */}
                <div
                    className="bg-white rounded-3xl border border-slate-100 overflow-hidden group cursor-pointer hover:shadow-xl hover:shadow-slate-200/50 transition-all"
                    onClick={() => setSelectedProgram({ id: '1', name: 'Programa de Iniciación', weeks_count: 4, days: [] } as any)}
                >
                    <div className="aspect-video bg-slate-200 relative">
                        <img src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-4 left-4">
                            <span className="px-2 py-1 bg-brand-mint text-brand-green text-[10px] font-black rounded uppercase mb-2 inline-block">Fitness</span>
                            <h5 className="text-white font-black text-lg leading-tight">Programa Vitalidad: Cáncer Mama</h5>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase mb-4">
                            <span>12 Semanas</span>
                            <span>24 Workouts</span>
                        </div>
                        <button className="w-full py-3 bg-slate-50 text-slate-600 font-black rounded-2xl group-hover:bg-brand-green group-hover:text-white transition-all flex items-center justify-center gap-2">
                            Editar Planificación <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {isCreatingExercise && (
                <ExerciseEditor
                    exercise={null}
                    onSave={async (ex) => console.log('New exercise', ex)}
                    onClose={() => setIsCreatingExercise(false)}
                />
            )}
        </div>
    );
}
