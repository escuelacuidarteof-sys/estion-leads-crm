import React from 'react';
import { Ruler, TrendingUp, AlertCircle, Info, Activity } from 'lucide-react';

interface Props {
    formData: any;
    updateField: (field: string, value: any) => void;
}

export function MeasurementsStep({ formData, updateField }: Props) {
    return (
        <div className="space-y-8">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Bloque 5 · Masa Muscular y Composición</h3>
                <p className="text-slate-600">En oncología, preservar el músculo es tan importante como el número en la báscula. Estas medidas nos ayudan a protegerte mejor.</p>
            </div>

            {/* ── BLOQUE PRINCIPAL: CIRCUNFERENCIAS ── */}
            <div className="p-6 bg-emerald-50 border-2 border-emerald-200 rounded-2xl">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                        <Activity className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-emerald-900">Medidas de masa muscular</h4>
                        <p className="text-sm text-emerald-700">¡Estas son las que más nos importan!</p>
                    </div>
                </div>
                <p className="text-sm text-emerald-800 mb-5">
                    Durante el tratamiento es habitual perder músculo aunque el peso se mantenga (sarcopenia). El perímetro del brazo es el indicador más fácil de medir en casa para detectarlo a tiempo. Solo rellena lo que puedas, no es obligatorio hacerlo todo.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-emerald-700 uppercase mb-2 flex items-center gap-1">
                            <span>💪</span> Brazo (cm) — Indicador de músculo
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            className="w-full px-4 py-3 border border-emerald-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-300 outline-none"
                            value={formData.armCircumference || ''}
                            onChange={(e) => updateField('armCircumference', parseFloat(e.target.value))}
                            placeholder="Ej: 28.5"
                        />
                        <p className="text-[10px] text-emerald-600 mt-1">A mitad del brazo relajado</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-emerald-700 uppercase mb-2 flex items-center gap-1">
                            <span>🎯</span> Barriga (cm)
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            className="w-full px-4 py-3 border border-emerald-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-300 outline-none"
                            value={formData.waistCircumference || ''}
                            onChange={(e) => updateField('waistCircumference', parseFloat(e.target.value))}
                            placeholder="Ej: 88"
                        />
                        <p className="text-[10px] text-emerald-600 mt-1">A la altura del ombligo</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-emerald-700 uppercase mb-2 flex items-center gap-1">
                            <span>🦵</span> Muslo (cm)
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            className="w-full px-4 py-3 border border-emerald-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-300 outline-none"
                            value={formData.thighCircumference || ''}
                            onChange={(e) => updateField('thighCircumference', parseFloat(e.target.value))}
                            placeholder="Ej: 52"
                        />
                        <p className="text-[10px] text-emerald-600 mt-1">A la mitad del muslo</p>
                    </div>
                </div>
            </div>

            {/* ── DATOS DE PESO (contextuales, secundarios) ── */}
            <div className="space-y-4 pt-2">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Datos de peso (contextuales)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            Peso actual (kg)
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none"
                            value={formData.currentWeight || ''}
                            onChange={(e) => updateField('currentWeight', parseFloat(e.target.value))}
                            placeholder="Ej: 70.5"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Puede variar mucho durante el tratamiento</p>
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
                            placeholder="Peso antes del tratamiento"
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
                            <option value="mantenimiento">Me mantengo más o menos</option>
                            <option value="ganancia_tratamiento">He ganado peso por medicación o inactividad</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ── PÉRDIDA SIGNIFICATIVA DE PESO ── */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-3 w-full">
                    <p className="text-sm font-bold text-red-800">Indicador clínico importante</p>
                    <label className="block text-sm text-red-700">
                        ¿Has perdido más del 5% de tu peso corporal en los últimos 3 meses sin quererlo?
                        <span className="block text-[11px] text-red-500 mt-0.5">Ej: si pesabas 70 kg, perder más de 3.5 kg sin intentarlo</span>
                    </label>
                    <div className="flex gap-4">
                        {[{ val: true, label: 'Sí, creo que sí' }, { val: false, label: 'No' }].map(opt => (
                            <label key={String(opt.val)} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${formData.significantWeightLoss === opt.val ? 'bg-red-100 border-red-500 font-bold text-red-900' : 'bg-white border-slate-200 text-slate-600'}`}>
                                <input
                                    type="radio"
                                    name="significantWeightLoss"
                                    checked={formData.significantWeightLoss === opt.val}
                                    onChange={() => updateField('significantWeightLoss', opt.val)}
                                    className="hidden"
                                />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── OBJETIVO CORPORAL ── */}
            <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700">¿Qué te gustaría recuperar o mantener en tu cuerpo?</label>
                <textarea
                    className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-200 outline-none"
                    value={formData.bodyEvolutionGoal}
                    onChange={(e) => updateField('bodyEvolutionGoal', e.target.value)}
                    placeholder="Ej: Mantener la fuerza para seguir siendo independiente, recuperar masa muscular que he perdido con la quimio, sentirme ágil y con energía..."
                    rows={3}
                />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-900">
                    <strong>¿Por qué medimos el brazo?</strong> La circunferencia de brazo medio es el indicador más fiable de masa muscular que se puede medir en casa. Durante el tratamiento, el número de la báscula puede mantenerse (o subir por retención de líquidos) pero el músculo se puede estar perdiendo sin que nos demos cuenta.
                </p>
            </div>
        </div>
    );
}
