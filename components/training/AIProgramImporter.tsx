import React, { useState } from 'react';
import { Sparkles, X, Loader2, AlertCircle, Copy, Check, Calendar, Dumbbell, Target, Zap, FileText, ChevronRight } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { trainingService } from '../../services/trainingService';
import { TrainingProgram, Workout, ProgramDay, ProgramActivity } from '../../types';

interface AIProgramImporterProps {
    currentUser: any;
    onSuccess: (program: TrainingProgram) => void;
    onClose: () => void;
}

type Step = 'setup' | 'generating' | 'preview';

export function AIProgramImporter({ currentUser, onSuccess, onClose }: AIProgramImporterProps) {
    const [step, setStep] = useState<Step>('setup');
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<any>(null);

    // Configuration
    const [config, setConfig] = useState({
        goal: 'Pérdida de Grasa y Mantenimiento de Masa Muscular',
        level: 'Intermedio',
        equipment: 'Gimnasio completo o Mancuernas y Bancos',
        daysPerWeek: '4',
        weeks: '4',
        notes: 'Priorizar entrenamiento de fuerza con énfasis en glúteo y core. Adaptado para mujer.'
    });

    const generateSystemPrompt = (isAnalysis: boolean) => {
        const base = `Actúa como un experto preparador físico de élite e ingeniero de datos.`;

        const structure = `
        {
          "program": {
            "name": "Nombre descriptivo del programa",
            "description": "Resumen del enfoque del programa",
            "weeks_count": ${parseInt(config.weeks) || 4}
          },
          "days": [
            {
              "week_number": 1,
              "day_number": 1,
              "activity": {
                "type": "workout",
                "title": "Nombre del Entrenamiento (ej: Empuje A)",
                "description": "Enfoque del día",
                "workout_data": {
                  "name": "Nombre del Entrenamiento",
                  "blocks": [
                    {
                      "name": "Calentamiento",
                      "exercises": [
                        {
                          "exercise_name": "Nombre Común del Ejercicio",
                          "sets": 2,
                          "reps": "12-15",
                          "rest_seconds": 60,
                          "notes": "Controlar el tempo"
                        }
                      ]
                    },
                    {
                      "name": "Parte Principal",
                      "exercises": [
                        {
                          "exercise_name": "Sentadilla con Barra",
                          "sets": 4,
                          "reps": "8-10",
                          "rest_seconds": 120,
                          "notes": "RPE 8"
                        }
                      ]
                    }
                  ]
                }
              }
            }
          ]
        }`;

        if (isAnalysis) {
            return `${base} Analiza el texto proporcionado (que contiene una rutina) y conviértelo EXACTAMENTE a este formato JSON: ${structure}. 
            Importante: Si el texto original tiene varios días, inclúyelos todos en el array "days". 
            Si el plan es de varias semanas pero los días se repiten, genera los registros para la semana 1 y menciónalo en la descripción.`;
        }

        return `${base} Genera un programa de entrenamiento profesional COMPLETO basado en:
        - Objetivo: ${config.goal}
        - Nivel: ${config.level}
        - Equipamiento: ${config.equipment}
        - Días por semana: ${config.daysPerWeek}
        - Duración: ${config.weeks} semanas
        - Notas adicionales: ${config.notes}
        
        REQUISITOS:
        1. Diseña entrenamientos variados y efectivos.
        2. Usa nombres de ejercicios estándar.
        3. Para cada día de entrenamiento, genera la estructura "workout_data" completa con bloques y ejercicios.
        4. Si un día es de descanso, pon el tipo de actividad como "custom" y título "Descanso Activo" o similar.
        
        Devuelve SOLO el objeto JSON con esta estructura exacta: ${structure}`;
    };

    const runAI = async (prompt: string) => {
        const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error('API Key de Gemini no configurada');

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let jsonText = response.text();

        // Sanitize JSON
        jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonText);
    }

    const handleDirectGenerate = async () => {
        try {
            setLoading(true);
            setError(null);
            setStep('generating');

            const data = await runAI(generateSystemPrompt(false));
            setPreviewData(data);
            setStep('preview');
        } catch (err: any) {
            console.error('AI error:', err);
            setError(err.message || 'Error al generar con IA');
            setStep('setup');
        } finally {
            setLoading(false);
        }
    };

    const handleManualAnalyze = async () => {
        if (!text.trim()) return;
        try {
            setLoading(true);
            setError(null);

            const data = await runAI(`${generateSystemPrompt(true)}\n\nTexto a analizar:\n${text}`);
            setPreviewData(data);
            setStep('preview');
        } catch (err: any) {
            setError(err.message || 'Error al analizar el texto');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmImport = async () => {
        try {
            setLoading(true);

            // 1. Create the Program
            const program = await trainingService.saveProgram({
                ...previewData.program,
                created_by: currentUser.id
            });

            // 2. Process Days and Workouts
            for (const dayData of previewData.days) {
                let workoutId = undefined;

                if (dayData.activity.type === 'workout' && dayData.activity.workout_data) {
                    // Pre-resolve exercise names to real exercise IDs
                    const resolvedBlocks = [];
                    for (const block of dayData.activity.workout_data.blocks) {
                        const resolvedExercises = [];
                        for (const exData of block.exercises) {
                            const exercise = await trainingService.findOrCreateExercise(exData.exercise_name);
                            resolvedExercises.push({
                                ...exData,
                                exercise_id: exercise.id
                            });
                        }
                        resolvedBlocks.push({
                            ...block,
                            exercises: resolvedExercises
                        });
                    }

                    // Create the workout with resolved IDs
                    const savedWorkout = await trainingService.saveWorkout({
                        ...dayData.activity.workout_data,
                        blocks: resolvedBlocks,
                        created_by: currentUser.id
                    });
                    workoutId = savedWorkout.id;
                }

                // Add day to program
                await trainingService.addProgramDay(program.id, {
                    week_number: dayData.week_number,
                    day_number: dayData.day_number,
                    activities: [{
                        type: dayData.activity.type,
                        title: dayData.activity.title,
                        description: dayData.activity.description,
                        workout_id: workoutId,
                        position: 0
                    }] as any[]
                });
            }

            // Fetch the full program with its days to return it
            const fullProgram = (await trainingService.getPrograms()).find(p => p.id === program.id);

            onSuccess(fullProgram || program);
        } catch (err: any) {
            setError(err.message || 'Error al guardar el programa');
        } finally {
            setLoading(false);
        }
    };

    const getMasterPromptForClipboard = () => {
        return `Eres un preparador físico de élite. Genera un programa de entrenamiento magistral con estas especificaciones:

PARÁMETROS CRÍTICOS:
- Objetivo: ${config.goal}.
- Nivel: ${config.level}.
- Equipamiento disponible: ${config.equipment}.
- Frecuencia: ${config.daysPerWeek} días por semana.
- Duración: ${config.weeks} semanas.

ESTRUCTURA REQUERIDA:
Para cada día de entrenamiento, detalla:
1. Nombre del entrenamiento.
2. Bloques (Calentamiento, Parte Principal, etc.).
3. Ejercicios con Series, Repeticiones, Descanso y Notas Técnicas.

RECOMENDACIONES GENERALES:
- Incluye consejos sobre progresión de cargas y técnica.
- Estilo: Profesional, técnico y motivador.`;
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-white/20">
                {/* Header */}
                <div className="p-8 bg-gradient-to-br from-brand-green via-emerald-600 to-teal-500 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner border border-white/30">
                                <Sparkles className="w-8 h-8 text-yellow-300 animate-pulse" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight">AI Training Architect</h2>
                                <p className="text-emerald-50 font-medium opacity-90">Diseña planificaciones de élite con Gemini</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-all hover:rotate-90">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    {step === 'setup' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in slide-in-from-bottom-4">
                            {/* Configuration */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center font-black">1</div>
                                    <h3 className="text-xl font-bold text-slate-800">Definir Parámetros</h3>
                                </div>
                                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Objetivo</label>
                                            <div className="relative">
                                                <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-green" />
                                                <input
                                                    type="text"
                                                    value={config.goal}
                                                    onChange={e => setConfig(prev => ({ ...prev, goal: e.target.value }))}
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-green transition-all font-bold text-slate-700"
                                                    placeholder="Ej: Fuerza máxima"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nivel</label>
                                            <div className="relative">
                                                <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                                                <select
                                                    value={config.level}
                                                    onChange={e => setConfig(prev => ({ ...prev, level: e.target.value }))}
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-green transition-all font-bold text-slate-700 appearance-none"
                                                >
                                                    <option>Principiante</option>
                                                    <option>Intermedio</option>
                                                    <option>Avanzado</option>
                                                    <option>Atleta Contienda</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Días/Semana</label>
                                            <input
                                                type="number"
                                                value={config.daysPerWeek}
                                                onChange={e => setConfig(prev => ({ ...prev, daysPerWeek: e.target.value }))}
                                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-green transition-all font-bold text-slate-700"
                                                min="1" max="7"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Semanas Totales</label>
                                            <input
                                                type="number"
                                                value={config.weeks}
                                                onChange={e => setConfig(prev => ({ ...prev, weeks: e.target.value }))}
                                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-green transition-all font-bold text-slate-700"
                                                min="1" max="12"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Equipamiento</label>
                                        <input
                                            type="text"
                                            value={config.equipment}
                                            onChange={e => setConfig(prev => ({ ...prev, equipment: e.target.value }))}
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-green transition-all font-medium text-slate-600"
                                            placeholder="Gym, Casa, Bandas..."
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas del Coach</label>
                                        <textarea
                                            value={config.notes}
                                            onChange={e => setConfig(prev => ({ ...prev, notes: e.target.value }))}
                                            className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-green transition-all text-sm h-24 resize-none leading-relaxed text-slate-600 font-medium"
                                            placeholder="Detalla lesiones, preferencias..."
                                        />
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={handleDirectGenerate}
                                            disabled={loading}
                                            className="w-full py-4 bg-gradient-to-r from-brand-green to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl font-black shadow-xl shadow-brand-green/25 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                            GENERAR PROGRAMA CON IA
                                        </button>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(getMasterPromptForClipboard());
                                                alert("Instrucción copiada con éxito 🚀");
                                            }}
                                            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                                        >
                                            <Copy className="w-4 h-4" /> Copiar para Gemini Externo
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Manual Input */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-black">2</div>
                                    <h3 className="text-xl font-bold text-slate-800">Importar Texto</h3>
                                </div>
                                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col h-full min-h-[400px]">
                                    <textarea
                                        value={text}
                                        onChange={e => setText(e.target.value)}
                                        placeholder="Cualquier texto con una rutina, la IA lo convertirá al formato del CRM..."
                                        className="flex-1 w-full p-6 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-sm font-mono leading-relaxed text-slate-600 resize-none mb-4"
                                    />
                                    <button
                                        onClick={handleManualAnalyze}
                                        disabled={!text.trim() || loading}
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                                        ANALIZAR Y PREVISUALIZAR
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'generating' && (
                        <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in-95 duration-500">
                            <div className="relative">
                                <div className="absolute inset-0 bg-brand-green blur-3xl opacity-20 animate-pulse rounded-full" />
                                <Loader2 className="w-24 h-24 text-brand-green animate-spin relative z-10" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-800 mt-8">Planificando...</h3>
                            <p className="text-slate-500 font-medium mt-2">Nuestra IA está diseñando un programa de alta intensidad para ti.</p>
                            <div className="mt-10 flex gap-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-3 h-3 bg-brand-green rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'preview' && previewData && (
                        <div className="animate-in slide-in-from-right-4 duration-500 space-y-8 pb-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setStep('setup')} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                                        <X className="w-6 h-6" />
                                    </button>
                                    <h3 className="text-2xl font-black text-slate-800">Previsualización del Programa</h3>
                                </div>
                                <div className="flex gap-3">
                                    <span className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-black flex items-center gap-2">
                                        <Calendar className="w-4 h-4" /> {previewData.program.weeks_count} Semanas
                                    </span>
                                    <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-black flex items-center gap-2">
                                        <Dumbbell className="w-4 h-4" /> {previewData.days.filter((d: any) => d.activity.type === 'workout').length} Entrenamientos
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left: Program Info */}
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Detalles del Programa</h4>
                                        <p className="text-xl font-black text-slate-800 leading-tight mb-4">{previewData.program.name}</p>
                                        <div className="space-y-4">
                                            <div className="bg-slate-50 p-4 rounded-xl border-l-4 border-brand-green">
                                                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Descripción</p>
                                                <p className="text-sm text-slate-600 font-medium">{previewData.program.description}</p>
                                            </div>
                                            <div className="bg-blue-50/50 p-4 rounded-xl border-l-4 border-blue-500">
                                                <p className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                                    <FileText className="w-3 h-3" /> Metodología IA
                                                </p>
                                                <p className="text-sm text-slate-700 leading-relaxed italic">
                                                    Programa diseñado siguiendo principios de sobrecarga progresiva y periodización ondulatoria.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Days List Preview */}
                                <div className="lg:col-span-2 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                    {previewData.days.map((day: any, idx: number) => (
                                        <div key={idx} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:border-brand-green transition-all group">
                                            <div className="flex gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-lg ${day.activity.type === 'workout' ? 'bg-orange-500' : 'bg-slate-400'}`}>
                                                    {day.day_number}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h5 className="font-bold text-slate-800 text-lg">{day.activity.title}</h5>
                                                        <span className="text-xs font-black text-slate-400 uppercase">Semana {day.week_number} • Día {day.day_number}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <p className="text-sm text-slate-500 line-clamp-1">{day.activity.description || 'Sin descripción'}</p>
                                                        {day.activity.workout_data && (
                                                            <div className="flex gap-2">
                                                                <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-black rounded-lg">
                                                                    {day.activity.workout_data.blocks.length} Bloques
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-green transition-colors self-center" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Sticky Footer */}
                            <div className="sticky bottom-0 bg-slate-50 pt-6 border-t border-slate-200 flex justify-end gap-4">
                                <button
                                    onClick={() => setStep('setup')}
                                    className="px-6 py-3 text-slate-500 font-bold hover:text-slate-800 transition-colors"
                                >
                                    Corregir Parámetros
                                </button>
                                <button
                                    onClick={handleConfirmImport}
                                    disabled={loading}
                                    className="px-12 py-3 bg-gradient-to-r from-brand-green to-emerald-600 text-white rounded-[1.5rem] font-black shadow-xl shadow-brand-green/30 flex items-center gap-3 transition-all active:scale-95"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                    CONFIRMAR Y GUARDAR PROGRAMA
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mx-8 mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 animate-in slide-in-from-top-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-bold">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
