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
import { trainingService } from '../../services/trainingService';

type TrainingView = 'overview' | 'exercises' | 'workouts' | 'programs';

export function TrainingManagement() {
    const [activeView, setActiveView] = useState<TrainingView>('overview');
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [programs, setPrograms] = useState<TrainingProgram[]>([]);
    const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
    const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
    const [isCreatingExercise, setIsCreatingExercise] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [exData, wData, pData] = await Promise.all([
                trainingService.getExercises(),
                trainingService.getWorkouts(),
                trainingService.getPrograms()
            ]);
            setExercises(exData);
            setWorkouts(wData);
            setPrograms(pData);
        } catch (error) {
            console.error('Error fetching training data:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    const handleSaveExercise = async (exercise: Partial<Exercise>) => {
        try {
            if (exercise.id) {
                await trainingService.updateExercise(exercise.id, exercise);
            } else {
                await trainingService.createExercise(exercise);
            }
            await fetchData();
            setIsCreatingExercise(false);
        } catch (error) {
            console.error('Error saving exercise:', error);
        }
    };

    const handleSaveWorkout = async (workout: Partial<Workout>) => {
        try {
            await trainingService.saveWorkout(workout);
            await fetchData();
            setSelectedWorkout(null);
        } catch (error) {
            console.error('Error saving workout:', error);
        }
    };

    const handleSaveProgram = async (program: Partial<TrainingProgram>) => {
        try {
            await trainingService.saveProgram(program);
            await fetchData();
            setSelectedProgram(null);
        } catch (error) {
            console.error('Error saving program:', error);
        }
    };

    // Stats for the overview
    const stats = [
        { label: 'Ejercicios', count: exercises.length, icon: Dumbbell, color: 'bg-brand-mint/20 text-brand-green' },
        { label: 'Workouts', count: workouts.length, icon: Layout, color: 'bg-orange-100 text-orange-600' },
        { label: 'Programas', count: programs.length, icon: Calendar, color: 'bg-sky-100 text-sky-600' },
    ];

    if (selectedWorkout) {
        return (
            <WorkoutEditor
                workout={selectedWorkout}
                availableExercises={exercises}
                onSave={handleSaveWorkout}
                onSaveExercise={handleSaveExercise}
                onClose={() => setSelectedWorkout(null)}
            />
        );
    }

    if (selectedProgram) {
        return (
            <ProgramDesigner
                program={selectedProgram}
                availableWorkouts={workouts}
                onSave={handleSaveProgram}
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
                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Crear Workout
                    </button>
                    <button
                        onClick={() => setSelectedProgram({ id: '', name: '', weeks_count: 4, days: [] } as any)}
                        className="px-6 py-2.5 bg-brand-green text-white font-black rounded-xl shadow-lg shadow-brand-green/20 hover:scale-105 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Crear Programa
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

            {/* Content Lists */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeView === 'overview' && programs.slice(0, 3).map(program => (
                        <div
                            key={program.id}
                            className="bg-white rounded-3xl border border-slate-100 overflow-hidden group cursor-pointer hover:shadow-xl hover:shadow-slate-200/50 transition-all"
                            onClick={() => setSelectedProgram(program)}
                        >
                            <div className="aspect-video bg-slate-200 relative">
                                <img src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute bottom-4 left-4">
                                    <span className="px-2 py-1 bg-brand-mint text-brand-green text-[10px] font-black rounded uppercase mb-2 inline-block">Planificación</span>
                                    <h5 className="text-white font-black text-lg leading-tight">{program.name}</h5>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase mb-4">
                                    <span>{program.weeks_count} Semanas</span>
                                </div>
                                <button className="w-full py-3 bg-slate-50 text-slate-600 font-black rounded-2xl group-hover:bg-brand-green group-hover:text-white transition-all flex items-center justify-center gap-2">
                                    Editar Planificación <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {activeView === 'exercises' && (
                        <div className="col-span-full">
                            <ExerciseLibrary
                                exercises={exercises}
                                onAddExercise={() => { }} // Not in adding mode here
                                onCreateNew={() => setIsCreatingExercise(true)}
                                onPreview={() => { }}
                            />
                        </div>
                    )}

                    {activeView === 'workouts' && workouts.map(workout => (
                        <div
                            key={workout.id}
                            className="bg-white p-6 rounded-3xl border border-slate-100 hover:shadow-xl transition-all cursor-pointer group"
                            onClick={() => setSelectedWorkout(workout)}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                                    <Layout className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{workout.blocks?.length || 0} Bloques</span>
                            </div>
                            <h4 className="text-xl font-black text-slate-800 mb-2">{workout.name}</h4>
                            <p className="text-sm text-slate-500 mb-6 line-clamp-2">{workout.description || 'Sin descripción'}</p>
                            <button className="w-full py-3 bg-slate-50 text-slate-600 font-black rounded-2xl group-hover:bg-brand-green group-hover:text-white transition-all flex items-center justify-center gap-2">
                                Abrir Editor <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    {activeView === 'programs' && programs.map(program => (
                        <div
                            key={program.id}
                            className="bg-white rounded-3xl border border-slate-100 overflow-hidden group cursor-pointer hover:shadow-xl hover:shadow-slate-200/50 transition-all"
                            onClick={() => setSelectedProgram(program)}
                        >
                            <div className="aspect-video bg-slate-200 relative">
                                <img src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute bottom-4 left-4">
                                    <h5 className="text-white font-black text-lg leading-tight">{program.name}</h5>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase mb-4">
                                    <span>{program.weeks_count} Semanas</span>
                                </div>
                                <button className="w-full py-3 bg-slate-50 text-slate-600 font-black rounded-2xl group-hover:bg-brand-green group-hover:text-white transition-all flex items-center justify-center gap-2">
                                    Editar Planificación <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isCreatingExercise && (
                <ExerciseEditor
                    exercise={null}
                    onSave={handleSaveExercise}
                    onClose={() => setIsCreatingExercise(false)}
                />
            )}
        </div>
    );
}
