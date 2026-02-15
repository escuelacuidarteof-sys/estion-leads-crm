import React from 'react';
import { Scale, TrendingUp, Ruler } from 'lucide-react';

interface Props {
    formData: any;
    updateField: (field: string, value: any) => void;
}

export function MeasurementsStep({ formData, updateField }: Props) {
    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Medidas Corporales</h3>
                <p className="text-slate-600">Toma estas medidas por la mañana en ayunas</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Peso Actual (kg) *
                    </label>
                    <div className="relative">
                        <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="number"
                            step="0.1"
                            required
                            className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                            value={formData.currentWeight}
                            onChange={(e) => updateField('currentWeight', parseFloat(e.target.value))}
                            placeholder="Ej: 75.5"
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">En ayunas, después de ir al baño</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Peso Objetivo (kg) *
                    </label>
                    <div className="relative">
                        <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="number"
                            step="0.1"
                            required
                            className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                            value={formData.targetWeight}
                            onChange={(e) => updateField('targetWeight', parseFloat(e.target.value))}
                            placeholder="Ej: 68.0"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Altura (m) *
                    </label>
                    <div className="relative">
                        <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="number"
                            step="0.01"
                            required
                            className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                            value={formData.height}
                            onChange={(e) => updateField('height', parseFloat(e.target.value))}
                            placeholder="Ej: 1.75"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Perímetro Brazo (cm) *
                    </label>
                    <input
                        type="number"
                        required
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                        value={formData.armCircumference}
                        onChange={(e) => updateField('armCircumference', parseInt(e.target.value))}
                        placeholder="Ej: 32"
                    />
                    <p className="text-xs text-slate-500 mt-1">A mitad del brazo extendido</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Perímetro Barriga (cm) *
                    </label>
                    <input
                        type="number"
                        required
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                        value={formData.waistCircumference}
                        onChange={(e) => updateField('waistCircumference', parseInt(e.target.value))}
                        placeholder="Ej: 95"
                    />
                    <p className="text-xs text-slate-500 mt-1">A la altura del ombligo</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Perímetro Muslo (cm) *
                    </label>
                    <input
                        type="number"
                        required
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                        value={formData.thighCircumference}
                        onChange={(e) => updateField('thighCircumference', parseInt(e.target.value))}
                        placeholder="Ej: 58"
                    />
                    <p className="text-xs text-slate-500 mt-1">A mitad del muslo</p>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                    <strong>💡 Consejo:</strong> Usa una cinta métrica flexible y mide siempre en el mismo punto para poder hacer un seguimiento preciso.
                </p>
            </div>
        </div>
    );
}
