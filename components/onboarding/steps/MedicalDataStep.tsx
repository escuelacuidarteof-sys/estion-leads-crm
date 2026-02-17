import React from 'react';
import { Stethoscope, Calendar, Activity, Pill, AlertCircle, Thermometer } from 'lucide-react';

interface Props {
    formData: any;
    updateField: (field: string, value: any) => void;
    toggleArrayField: (field: string, value: string) => void;
}

export function MedicalDataStep({ formData, updateField, toggleArrayField }: Props) {
    const treatmentsList = [
        'Quimioterapia',
        'Radioterapia',
        'Hormonoterapia (ej. Tamoxifeno, Letrozol, etc.)',
        'Inmunoterapia',
        'Cirugía reciente',
        'Ninguno actualmente'
    ];

    const conditionsList = [
        'Diabetes (Tipo 1, Tipo 2, etc.)',
        'Hipertensión',
        'Dislipemia (Colesterol / Triglicéridos)',
        'Hipotiroidismo / Hipertiroidismo',
        'Ovario Poliquístico (SOP)',
        'Sobrepeso / Obesidad',
        'Osteopenia / Osteoporosis',
        'Enfermedades cardiovasculares',
        'Ninguna de las anteriores'
    ];

    const menopauseSymptomsList = [
        'Sofocos',
        'Sequedad vaginal o de mucosas',
        'Niebla mental / Falta de concentración',
        'Dolores articulares',
        'Insomnio'
    ];

    return (
        <div className="space-y-8">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Contexto Oncológico y Clínico</h3>
                <p className="text-slate-600">Bloques 2 y 3: Situación actual y salud metabólica</p>
            </div>

            {/* Situación Oncológica */}
            <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700">Situación oncológica actual *</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                        { id: 'activo', label: 'En tratamiento activo' },
                        { id: 'finalizado', label: 'Finalizado (Seguimiento)' },
                        { id: 'supervivencia', label: 'Supervivencia / Largo plazo' }
                    ].map(status => (
                        <label key={status.id} className={`p-4 border rounded-xl cursor-pointer transition-all ${formData.oncologyStatus === status.id ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200' : 'bg-white border-slate-200 hover:border-emerald-300'}`}>
                            <input
                                type="radio"
                                name="oncologyStatus"
                                value={status.id}
                                checked={formData.oncologyStatus === status.id}
                                onChange={(e) => updateField('oncologyStatus', e.target.value)}
                                className="hidden"
                            />
                            <span className="text-sm font-bold block text-center text-slate-700">{status.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Tratamientos */}
            <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700 font-bold">Tratamiento actual o reciente (marca todos los que apliquen) *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {treatmentsList.map(t => (
                        <label key={t} className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.treatments.includes(t)}
                                onChange={() => toggleArrayField('treatments', t)}
                                className="w-4 h-4 text-emerald-600 rounded"
                            />
                            <span className="text-sm text-slate-600">{t}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Fecha de diagnóstico (mes/año)</label>
                    <input
                        type="month"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none"
                        value={formData.diagnosisDate}
                        onChange={(e) => updateField('diagnosisDate', e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Fecha inicio tratamiento actual</label>
                    <input
                        type="month"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none"
                        value={formData.treatmentStartDate}
                        onChange={(e) => updateField('treatmentStartDate', e.target.value)}
                    />
                </div>
            </div>

            {/* Enfermedades previas */}
            <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700">Otras enfermedades y condiciones *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {conditionsList.map(c => (
                        <label key={c} className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.healthConditions.includes(c)}
                                onChange={() => toggleArrayField('healthConditions', c)}
                                className="w-4 h-4 text-emerald-600 rounded"
                            />
                            <span className="text-sm text-slate-600">{c}</span>
                        </label>
                    ))}
                </div>
                <textarea
                    className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-200 outline-none"
                    placeholder="Especifica otras enfermedades o intervenciones quirúrgicas previas..."
                    value={formData.otherHealthConditions}
                    onChange={(e) => updateField('otherHealthConditions', e.target.value)}
                    rows={2}
                />
            </div>

            {/* Medicación y Alergias */}
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Medicación diaria * (Detallar corticoides, protectores, etc.)</label>
                    <textarea
                        className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-200 outline-none"
                        value={formData.dailyMedication}
                        onChange={(e) => updateField('dailyMedication', e.target.value)}
                        placeholder="Ej: Tamoxifeno 20mg, Corticoides, Protector..."
                        rows={3}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Alergias a medicamentos</label>
                    <input
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none"
                        value={formData.drugAllergies}
                        onChange={(e) => updateField('drugAllergies', e.target.value)}
                        placeholder="Escribe tus alergias o 'Ninguna'"
                    />
                </div>
            </div>

            {/* Limitaciones Ejercicio */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">¿Tienes alguna limitación específica para el ejercicio físico? *</label>
                <textarea
                    className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-200 outline-none"
                    value={formData.exerciseLimitations}
                    onChange={(e) => updateField('exerciseLimitations', e.target.value)}
                    placeholder="Ej: No puedo levantar el brazo derecho por cirugía, linfedema..."
                    rows={2}
                />
            </div>

            {/* BLOQUE 3: Salud Hormonal */}
            <div className="pt-6 border-t">
                <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Thermometer className="w-5 h-5 text-emerald-600" />
                    Salud Hormonal (Solo mujeres)
                </h4>
                <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">Historia Menopáusica</label>
                    <div className="grid grid-cols-1 gap-2">
                        {[
                            'Ciclos menstruales regulares',
                            'Alteraciones en el ciclo',
                            'Menopausia (Natural)',
                            'Menopausia (Inducida por tratamientos)'
                        ].map(opt => (
                            <label key={opt} className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                                <input
                                    type="radio"
                                    name="hormonalStatus"
                                    value={opt}
                                    checked={formData.hormonalStatus === opt}
                                    onChange={(e) => updateField('hormonalStatus', e.target.value)}
                                    className="w-4 h-4 text-emerald-600"
                                />
                                <span className="text-sm text-slate-600">{opt}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {formData.hormonalStatus?.includes('Menopausia') && (
                    <div className="mt-4 space-y-3">
                        <label className="block text-sm font-bold text-slate-700 italic">¿Tienes síntomas actualmente?</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {menopauseSymptomsList.map(s => (
                                <label key={s} className="flex items-center gap-2 text-sm text-slate-600">
                                    <input
                                        type="checkbox"
                                        checked={formData.menopauseSymptoms?.includes(s)}
                                        onChange={() => toggleArrayField('menopauseSymptoms', s)}
                                        className="w-4 h-4 text-emerald-600 rounded"
                                    />
                                    {s}
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Analíticas */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Analíticas recientes (¿Algún valor alterado?)</label>
                <textarea
                    className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-200 outline-none"
                    value={formData.labResultsNotes}
                    onChange={(e) => updateField('labResultsNotes', e.target.value)}
                    placeholder="Glucosa, HbA1c, anemia, colesterol... (Si no lo sabes, pon 'no lo sé')"
                    rows={2}
                />
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-900 italic">
                    Esta información técnica nos ayuda a crear un plan 100% seguro para tu situación oncológica específica.
                </p>
            </div>
        </div>
    );
}
