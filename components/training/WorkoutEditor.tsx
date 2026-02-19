import React, { useState } from 'react';
import {
    X,
    Plus,
    Trash2,
    Save,
    Copy,
    ChevronUp,
    ChevronDown,
    Settings2,
    MoreVertical,
    Activity,
    Calculator
} from 'lucide-react';
import { Workout, WorkoutBlock, WorkoutExercise, Exercise } from '../../types';
import { ExerciseLibrary } from './ExerciseLibrary';
import { ExerciseEditor } from './ExerciseEditor';

interface WorkoutEditorProps {
    workout: Workout | null;
    onSave: (workout: Partial<Workout>) => Promise<void>;
    onClose: () => void;
    availableExercises: Exercise[];
}

export function WorkoutEditor({ workout, onSave, onClose, availableExercises }: WorkoutEditorProps) {
    const [name, setName] = useState(workout?.name || '');
    const [blocks, setBlocks] = useState<WorkoutBlock[]>(workout?.blocks || [
        { id: '1', workout_id: '', name: 'Calentamiento', position: 0, exercises: [] },
        { id: '2', workout_id: '', name: 'Parte Principal', position: 1, exercises: [] },
        { id: '3', workout_id: '', name: 'Finisher', position: 2, exercises: [] }
    ]);
    const [selectedBlockId, setSelectedBlockId] = useState<string>('2');
    const [isCreatingExercise, setIsCreatingExercise] = useState(false);
    const [saving, setSaving] = useState(false);

    const addExerciseToBlock = (exercise: Exercise) => {
        setBlocks(prev => prev.map(block => {
            if (block.id === selectedBlockId) {
                const newExercise: WorkoutExercise = {
                    id: Math.random().toString(),
                    block_id: block.id,
                    exercise_id: exercise.id,
                    exercise: exercise,
                    sets: 3,
                    reps: '12',
                    rest_seconds: 60,
                    position: block.exercises.length
                };
                return { ...block, exercises: [...block.exercises, newExercise] };
            }
            return block;
        }));
    };

    const updateExercise = (blockId: string, exerciseId: string, changes: Partial<WorkoutExercise>) => {
        setBlocks(prev => prev.map(block => {
            if (block.id === blockId) {
                return {
                    ...block,
                    exercises: block.exercises.map(ex => ex.id === exerciseId ? { ...ex, ...changes } : ex)
                };
            }
            return block;
        }));
    };

    const removeExercise = (blockId: string, exerciseId: string) => {
        setBlocks(prev => prev.map(block => {
            if (block.id === blockId) {
                return {
                    ...block,
                    exercises: block.exercises.filter(ex => ex.id !== exerciseId)
                };
            }
            return block;
        }));
    };

    const handleSave = async () => {
        if (!name.trim()) return;
        try {
            setSaving(true);
            await onSave({ name, blocks });
            onClose();
        } catch (error) {
            console.error('Error saving workout:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-100 flex z-50 overflow-hidden animate-fade-in">
            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
                {/* Header */}
                <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-4 flex-1">
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                        <div className="flex flex-col">
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Nombre del Workout (ej: Full Body Kettlebell)"
                                className="bg-transparent border-none text-lg font-black text-slate-800 placeholder:text-slate-300 focus:ring-0 p-0"
                            />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Editor de Workout • Normal</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                            <Calculator className="w-4 h-4" /> Calcular RM
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || !name.trim()}
                            className="flex items-center gap-2 px-6 py-1.5 bg-brand-green text-white font-black rounded-xl shadow-lg shadow-brand-green/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Guardando...' : 'Guardar workout'}
                        </button>
                    </div>
                </div>

                {/* Builder Area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {blocks.map(block => (
                        <div
                            key={block.id}
                            className={`space-y-4 transition-all ${selectedBlockId === block.id ? 'ring-2 ring-brand-mint/20 rounded-2xl p-4 bg-white -m-4' : ''}`}
                            onClick={() => setSelectedBlockId(block.id)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                        <Activity className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <h3 className="font-black text-slate-800 uppercase tracking-wide">{block.name}</h3>
                                </div>
                                <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Exercises List */}
                            <div className="space-y-3">
                                {block.exercises.length === 0 ? (
                                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50">
                                        <p className="text-sm text-slate-400 font-medium">No hay ejercicios en este bloque. Selecciona uno de la librería.</p>
                                    </div>
                                ) : (
                                    <div className="bg-slate-800 rounded-2xl overflow-hidden shadow-xl">
                                        {/* Table Header */}
                                        <div className="grid grid-cols-[1fr,60px,120px,80px,2fr,40px] gap-4 px-6 py-2 bg-slate-900/50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                                            <span>Ejercicio</span>
                                            <span className="text-center">Series</span>
                                            <span className="text-center">Objetivo</span>
                                            <span className="text-center">Descanso</span>
                                            <span>Instrucciones adicionales</span>
                                            <span></span>
                                        </div>

                                        {block.exercises.map((item, index) => (
                                            <div
                                                key={item.id}
                                                className="grid grid-cols-[1fr,60px,120px,80px,2fr,40px] gap-4 px-6 py-4 items-center hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 rounded-lg bg-white/10 shrink-0 overflow-hidden">
                                                        {item.exercise?.media_url ? (
                                                            <img src={item.exercise.media_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center"><Activity className="w-4 h-4 text-white/20" /></div>
                                                        )}
                                                    </div>
                                                    <span className="text-white font-bold text-sm truncate">{item.exercise?.name}</span>
                                                </div>

                                                <div className="flex justify-center">
                                                    <input
                                                        type="number"
                                                        value={item.sets}
                                                        onChange={(e) => updateExercise(block.id, item.id, { sets: parseInt(e.target.value) || 0 })}
                                                        className="w-10 bg-white/5 border border-white/10 rounded-lg text-white text-center text-sm p-1"
                                                    />
                                                </div>

                                                <div className="flex justify-center">
                                                    <input
                                                        type="text"
                                                        value={item.reps}
                                                        onChange={(e) => updateExercise(block.id, item.id, { reps: e.target.value })}
                                                        className="w-24 bg-white/5 border border-white/10 rounded-lg text-white text-center text-sm p-1"
                                                    />
                                                </div>

                                                <div className="flex justify-center">
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={item.rest_seconds}
                                                            onChange={(e) => updateExercise(block.id, item.id, { rest_seconds: parseInt(e.target.value) || 0 })}
                                                            className="w-16 bg-white/5 border border-white/10 rounded-lg text-white text-center text-sm p-1 pr-4"
                                                        />
                                                        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-white/30 uppercase font-bold">s</span>
                                                    </div>
                                                </div>

                                                <input
                                                    type="text"
                                                    value={item.notes || ''}
                                                    onChange={(e) => updateExercise(block.id, item.id, { notes: e.target.value })}
                                                    placeholder="No hay instrucciones"
                                                    className="bg-transparent border-none text-white/50 text-xs placeholder:text-white/10 focus:ring-0 italic"
                                                />

                                                <button
                                                    onClick={() => removeExercise(block.id, item.id)}
                                                    className="p-2 text-white/20 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Sidebar - Library */}
            <ExerciseLibrary
                exercises={availableExercises}
                onAddExercise={addExerciseToBlock}
                onCreateNew={() => setIsCreatingExercise(true)}
                onPreview={(ex) => console.log('Preview', ex)}
            />

            {/* New Exercise Modal */}
            {isCreatingExercise && (
                <ExerciseEditor
                    exercise={null}
                    onSave={async (ex) => {
                        console.log('Save new exercise', ex);
                        // In a real app, this would be a Supabase call and then updating state
                    }}
                    onClose={() => setIsCreatingExercise(false)}
                />
            )}
        </div>
    );
}
