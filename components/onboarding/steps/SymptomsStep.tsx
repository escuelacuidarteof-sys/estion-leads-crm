import React from 'react';
import { Thermometer, Zap, Activity, Moon, Sun, Wind, Coffee, Droplets } from 'lucide-react';

interface Props {
    formData: any;
    updateField: (field: string, value: any) => void;
}

export function SymptomsStep({ formData, updateField }: Props) {
    const scales = [
        { key: 'symptom_fatigue', label: 'Fatiga o cansancio general', icon: Zap },
        { key: 'symptom_fatigue_interference', label: '¿En qué medida interfiere en tu día a día?', icon: Activity },
        { key: 'symptom_pain', label: 'Dolor físico', icon: Thermometer },
        { key: 'symptom_nausea', label: 'Náuseas', icon: Wind },
        { key: 'symptom_vomiting', label: 'Vómitos', icon: Droplets },
        { key: 'symptom_diarrhea', label: 'Diarrea', icon: Droplets },
        { key: 'symptom_constipation', label: 'Estreñimiento', icon: Activity },
        { key: 'symptom_appetite_loss', label: 'Falta de apetito / Saciedad precoz', icon: Coffee },
        { key: 'symptom_taste_alteration', label: 'Sabor metálico o llagas en la boca', icon: Activity },
        { key: 'symptom_bloating', label: 'Hinchazón o molestias digestivas', icon: Activity },
        { key: 'symptom_sleep_quality', label: 'Calidad del sueño (10 = Muy buena)', icon: Moon },
        { key: 'stress_level', label: 'Nivel de estrés diario percibido', icon: Activity },
        { key: 'recovery_capacity', label: 'Capacidad de recuperación (10 = Muy buena)', icon: Sun },
    ];

    return (
        <div className="space-y-8">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Síntomas y Descanso</h3>
                <p className="text-slate-600">Valora cómo te has sentido en la última semana (0 nada - 10 muy intenso)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {scales.map((item) => (
                    <div key={item.key} className="space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                            <item.icon className="w-5 h-5 text-emerald-600" />
                            <label className="text-sm font-bold text-slate-700">
                                {item.label}
                            </label>
                        </div>
                        <div className="flex flex-col gap-2">
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
                                value={formData[item.key] || 0}
                                onChange={(e) => updateField(item.key as any, parseInt(e.target.value))}
                            />
                            <div className="flex justify-center">
                                <span className={`text-lg font-bold ${formData[item.key] > 7 ? 'text-red-500' : formData[item.key] > 4 ? 'text-amber-500' : 'text-emerald-600'}`}>
                                    {formData[item.key] || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Horas de sueño promedio al día
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
    );
}
