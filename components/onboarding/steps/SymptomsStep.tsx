import React from 'react';
import { Thermometer, Zap, Activity, Moon, Sun, Wind, Coffee, Droplets, Brain, Wind as LungIcon } from 'lucide-react';

interface Props {
    formData: any;
    updateField: (field: string, value: any) => void;
}

export function SymptomsStep({ formData, updateField }: Props) {

    const digestiveSymptoms = [
        { key: 'symptom_nausea', label: 'Náuseas', icon: Wind },
        { key: 'symptom_vomiting', label: 'Vómitos', icon: Droplets },
        { key: 'symptom_diarrhea', label: 'Diarrea', icon: Droplets },
        { key: 'symptom_constipation', label: 'Estreñimiento', icon: Activity },
        { key: 'symptom_appetite_loss', label: 'Falta de apetito / Saciedad precoz', icon: Coffee },
        { key: 'symptom_taste_alteration', label: 'Sabor metálico o llagas en la boca', icon: Activity },
        { key: 'symptom_bloating', label: 'Hinchazón o molestias digestivas', icon: Activity },
    ];

    const restSymptoms = [
        { key: 'symptom_pain', label: 'Dolor físico', icon: Thermometer },
        { key: 'symptom_sleep_quality', label: 'Calidad del sueño (10 = Muy buena)', icon: Moon },
        { key: 'stress_level', label: 'Nivel de estrés diario percibido', icon: Activity },
        { key: 'recovery_capacity', label: 'Capacidad de recuperación (10 = Muy buena)', icon: Sun },
    ];

    const neurologicalSymptoms = [
        { key: 'symptom_chemo_brain', label: 'Niebla mental / Dificultad para concentrarse', icon: Brain },
        { key: 'symptom_dyspnea', label: 'Disnea / Sensación de ahogo al hacer esfuerzo', icon: LungIcon },
    ];

    const ScaleSlider = ({ item }: { item: { key: string; label: string; icon: React.ElementType } }) => {
        const val = formData[item.key] || 0;
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4 text-slate-500 shrink-0" />
                    <label className="text-sm font-bold text-slate-700">{item.label}</label>
                </div>
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1">
                        <span>0 (Nada)</span>
                        <span>10 (Máximo)</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="10"
                        step="1"
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        value={val}
                        onChange={(e) => updateField(item.key, parseInt(e.target.value))}
                    />
                    <div className="flex justify-center">
                        <span className={`text-lg font-bold ${val > 7 ? 'text-red-500' : val > 4 ? 'text-amber-500' : 'text-emerald-600'}`}>
                            {val}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    const fatigueVal = formData['symptom_fatigue'] || 0;
    const fatigueIntVal = formData['symptom_fatigue_interference'] || 0;

    return (
        <div className="space-y-8">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Síntomas y Descanso</h3>
                <p className="text-slate-600">Valora cómo te has sentido en la última semana (0 nada — 10 muy intenso)</p>
            </div>

            {/* ── BLOQUE PROTAGONISTA: FATIGA ── */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 space-y-5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-xl">
                        <Zap className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-amber-900">Fatiga</h4>
                        <p className="text-xs text-amber-700">El síntoma más frecuente en oncología. Nos ayuda a calibrar tu plan de ejercicio.</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Fatiga o cansancio general esta semana</label>
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1">
                        <span>0 (Sin fatiga)</span>
                        <span>10 (Fatiga extrema)</span>
                    </div>
                    <input
                        type="range" min="0" max="10" step="1"
                        className="w-full h-3 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                        value={fatigueVal}
                        onChange={(e) => updateField('symptom_fatigue', parseInt(e.target.value))}
                    />
                    <div className="flex justify-center">
                        <span className={`text-3xl font-black ${fatigueVal > 7 ? 'text-red-500' : fatigueVal > 4 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {fatigueVal}<span className="text-sm font-normal text-slate-400">/10</span>
                        </span>
                    </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-amber-200">
                    <label className="text-sm font-bold text-slate-700">¿En qué medida interfiere la fatiga en tu día a día?</label>
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1">
                        <span>0 (No interfiere)</span>
                        <span>10 (Impide todo)</span>
                    </div>
                    <input
                        type="range" min="0" max="10" step="1"
                        className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                        value={fatigueIntVal}
                        onChange={(e) => updateField('symptom_fatigue_interference', parseInt(e.target.value))}
                    />
                    <div className="flex justify-center">
                        <span className={`text-lg font-bold ${fatigueIntVal > 7 ? 'text-red-500' : fatigueIntVal > 4 ? 'text-amber-500' : 'text-emerald-600'}`}>
                            {fatigueIntVal}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── SÍNTOMAS DIGESTIVOS ── */}
            <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="text-base">🫃</span> Síntomas Digestivos
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {digestiveSymptoms.map(item => (
                        <ScaleSlider key={item.key} item={item} />
                    ))}
                </div>
            </div>

            {/* ── DOLOR, DESCANSO Y BIENESTAR ── */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="text-base">🌙</span> Dolor, Descanso y Bienestar
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {restSymptoms.map(item => (
                        <ScaleSlider key={item.key} item={item} />
                    ))}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <Moon className="w-4 h-4 text-slate-500" /> Horas de sueño promedio al día
                        </label>
                        <input
                            type="number"
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none"
                            value={formData.sleep_hours || ''}
                            onChange={(e) => updateField('sleep_hours', parseFloat(e.target.value))}
                            placeholder="Ej: 7.5"
                        />
                    </div>
                </div>
            </div>

            {/* ── SÍNTOMAS NEUROLÓGICOS (NUEVOS) ── */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="text-base">🧠</span> Síntomas Neurológicos
                </h4>
                <p className="text-xs text-slate-500 -mt-2">Síntomas frecuentes durante o después del tratamiento. Es habitual no haber preguntado antes por ellos.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {neurologicalSymptoms.map(item => (
                        <ScaleSlider key={item.key} item={item} />
                    ))}
                </div>
            </div>
        </div>
    );
}
