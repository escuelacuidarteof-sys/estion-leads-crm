import React from 'react';
import { Scale, Ruler, TrendingUp, AlertCircle, Info } from 'lucide-react';

interface Props {
    formData: any;
    updateField: (field: string, value: any) => void;
}

export function MeasurementsStep({ formData, updateField }: Props) {
    return (
        <div className="space-y-8">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Bloque 5 · Antropometría y Composición</h3>
                <p className="text-slate-600">Para adaptar tu plan necesitamos conocer tu punto de partida físico real.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Peso actual (kg) *
                    </label>
                    <div className="relative">
                        <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="number"
                            step="0.1"
                            required
                            className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none"
                            value={formData.currentWeight || ''}
                            onChange={(e) => updateField('currentWeight', parseFloat(e.target.value))}
                            placeholder="Ej: 70.5"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Altura (cm) *
                    </label>
                    <div className="relative">
                        <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="number"
                            required
                            className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none"
                            value={formData.height || ''}
                            onChange={(e) => updateField('height', parseInt(e.target.value))}
                            placeholder="Ej: 165"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Peso habitual hace 3-6 meses (kg)
                    </label>
                    <input
                        type="number"
                        step="0.1"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none"
                        value={formData.habitualWeight6Months || ''}
                        onChange={(e) => updateField('habitualWeight6Months', parseFloat(e.target.value))}
                        placeholder="Peso pre-diagnóstico/tratamiento"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Evolución de tu peso últimamente
                    </label>
                    <select
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none"
                        value={formData.weightEvolutionStatus}
                        onChange={(e) => updateField('weightEvolutionStatus', e.target.value)}
                    >
                        <option value="">Selecciona una opción...</option>
                        <option value="perdida_involuntaria">He perdido peso sin quererlo</option>
                        <option value="mantenimiento">Me mantengo</option>
                        <option value="ganancia_tratamiento">He ganado peso por medicación/inactividad</option>
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700">¿Cómo te gustaría que evolucionara tu cuerpo ahora mismo?</label>
                <textarea
                    className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-200 outline-none"
                    value={formData.bodyEvolutionGoal}
                    onChange={(e) => updateField('bodyEvolutionGoal', e.target.value)}
                    placeholder="Ej: Recuperar masa muscular, gestionar subida por corticoides, sentirme ágil..."
                    rows={3}
                />
            </div>

            <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                    <h4 className="text-lg font-bold text-slate-900">Medidas (Opcionales)</h4>
                </div>
                <p className="text-sm text-slate-600 mb-6">
                    En oncología es común perder músculo aunque el peso se mantenga. Estas medidas nos ayudan mucho a proteger tu masa muscular. ¡Solo si tienes energía para hacerlo!
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Brazo (cm)</label>
                        <input
                            type="number"
                            step="0.1"
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white"
                            value={formData.armCircumference || ''}
                            onChange={(e) => updateField('armCircumference', parseFloat(e.target.value))}
                        />
                        <p className="text-[10px] text-slate-400 mt-1">A mitad del brazo relax</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Barriga (cm)</label>
                        <input
                            type="number"
                            step="0.1"
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white"
                            value={formData.waistCircumference || ''}
                            onChange={(e) => updateField('waistCircumference', parseFloat(e.target.value))}
                        />
                        <p className="text-[10px] text-slate-400 mt-1">A la altura del ombligo</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Muslo (cm)</label>
                        <input
                            type="number"
                            step="0.1"
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white"
                            value={formData.thighCircumference || ''}
                            onChange={(e) => updateField('thighCircumference', parseFloat(e.target.value))}
                        />
                        <p className="text-[10px] text-slate-400 mt-1">A la mitad del muslo</p>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-900">
                    <strong>Consejo:</strong> Pásate y mídete preferiblemente por la mañana, en ayunas y tras ir al baño para mayor precisión.
                </p>
            </div>
        </div>
    );
}
