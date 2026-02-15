import React from 'react';
import { Stethoscope, Pill, Activity, AlertCircle } from 'lucide-react';

interface Props {
    formData: any;
    updateField: (field: string, value: any) => void;
    toggleArrayField: (field: string, value: string) => void;
}

export function MedicalDataStep({ formData, updateField, toggleArrayField }: Props) {
    const healthConditionsList = [
        'Cáncer de mama',
        'Cáncer de colon',
        'Cáncer de pulmón',
        'Linfoma',
        'Otro tipo de cáncer',
        'Linfedema',
        'Neuropatía periférica',
        'Sobrepeso',
        'Obesidad',
        'Hipotiroidismo',
        'Ovario poliquístico',
        'Condropatía Rotuliana',
        'Otros'
    ];

    const symptomsList = [
        'Insomnio',
        'Fatiga',
        'Ansiedad',
        'Dolores articulares',
        'Otros'
    ];

    const specialSituationsList = [
        'Menopausia',
        'Embarazo',
        'Lactancia'
    ];

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Datos Médicos</h3>
                <p className="text-slate-600">Información sobre tu salud actual</p>
            </div>

            {/* Enfermedades */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                    Enfermedades y condiciones de salud actuales *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {healthConditionsList.map(condition => (
                        <label key={condition} className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-all">
                            <input
                                type="checkbox"
                                checked={formData.healthConditions.includes(condition)}
                                onChange={() => toggleArrayField('healthConditions', condition)}
                                className="w-4 h-4 text-emerald-600 rounded"
                            />
                            <span className="text-sm">{condition}</span>
                        </label>
                    ))}
                </div>
                {formData.healthConditions.includes('Otros') && (
                    <textarea
                        className="w-full mt-3 px-4 py-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all resize-none"
                        rows={2}
                        value={formData.otherHealthConditions}
                        onChange={(e) => updateField('otherHealthConditions', e.target.value)}
                        placeholder="Especifica otras enfermedades o condiciones..."
                    />
                )}
            </div>

            {/* Medicación */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                    Medicación diaria (incluyendo suplementos) *
                </label>
                <textarea
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all resize-none"
                    rows={4}
                    value={formData.dailyMedication}
                    onChange={(e) => updateField('dailyMedication', e.target.value)}
                    placeholder="Ej: Omeprazol 20mg (mañana), Metformina 850mg (mañana y noche)..."
                />
            </div>

            {/* Tratamientos oncológicos */}
            <div className="space-y-4 p-4 bg-white/50 rounded-xl border border-slate-200">
                <p className="text-sm font-semibold text-slate-700">Tratamientos recibidos o en curso</p>
                <div className="grid grid-cols-2 gap-3">
                    {['Quimioterapia', 'Radioterapia', 'Hormonoterapia', 'Inmunoterapia', 'Cirugía', 'Ninguno actualmente'].map(t => (
                        <label key={t} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={(formData.treatments || []).includes(t)}
                                onChange={(e) => {
                                    const current = formData.treatments || [];
                                    updateField('treatments', e.target.checked ? [...current, t] : current.filter((x: string) => x !== t));
                                }}
                                className="w-4 h-4 rounded border-slate-300 text-brand-green focus:ring-brand-green"
                            />
                            {t}
                        </label>
                    ))}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Fecha inicio tratamiento</label>
                    <input
                        type="date"
                        value={formData.treatmentStartDate || ''}
                        onChange={e => updateField('treatmentStartDate', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-brand-green focus:border-brand-green"
                    />
                </div>
            </div>

            {/* Medicación y peso */}
            <div className="space-y-3 p-4 bg-white/50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={formData.medicationAffectsWeight || false} onChange={e => updateField('medicationAffectsWeight', e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-brand-green focus:ring-brand-green" />
                    <span className="text-sm font-medium text-slate-700">¿Tu medicación afecta a tu peso?</span>
                </label>
                {formData.medicationAffectsWeight && (
                    <textarea
                        value={formData.medicationAffectsWeightDetails || ''}
                        onChange={e => updateField('medicationAffectsWeightDetails', e.target.value)}
                        placeholder="Describe cómo afecta la medicación a tu peso..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-brand-green focus:border-brand-green"
                        rows={2}
                    />
                )}
            </div>

            {/* Limitaciones para ejercicio */}
            <div className="space-y-3 p-4 bg-white/50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={formData.exerciseLimitations || false} onChange={e => updateField('exerciseLimitations', e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-brand-green focus:ring-brand-green" />
                    <span className="text-sm font-medium text-slate-700">¿Tienes limitaciones médicas para el ejercicio?</span>
                </label>
                {formData.exerciseLimitations && (
                    <textarea
                        value={formData.exerciseLimitationsDetails || ''}
                        onChange={e => updateField('exerciseLimitationsDetails', e.target.value)}
                        placeholder="Describe tus limitaciones (ej: linfedema, fatiga post-tratamiento, neuropatía...)"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-brand-green focus:border-brand-green"
                        rows={2}
                    />
                )}
            </div>

            {/* Situaciones especiales */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                    ¿Te encuentras en alguna de estas situaciones?
                </label>
                <div className="flex flex-wrap gap-3">
                    {specialSituationsList.map(situation => (
                        <label key={situation} className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-all">
                            <input
                                type="checkbox"
                                checked={formData.specialSituations.includes(situation)}
                                onChange={() => toggleArrayField('specialSituations', situation)}
                                className="w-4 h-4 text-emerald-600 rounded"
                            />
                            <span className="text-sm">{situation}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Síntomas */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                    Síntomas actuales
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {symptomsList.map(symptom => (
                        <label key={symptom} className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-all">
                            <input
                                type="checkbox"
                                checked={formData.symptoms.includes(symptom)}
                                onChange={() => toggleArrayField('symptoms', symptom)}
                                className="w-4 h-4 text-emerald-600 rounded"
                            />
                            <span className="text-sm">{symptom}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900">
                    <strong>Importante:</strong> Esta información es confidencial y solo será vista por tu coach y equipo médico.
                </p>
            </div>
        </div>
    );
}
