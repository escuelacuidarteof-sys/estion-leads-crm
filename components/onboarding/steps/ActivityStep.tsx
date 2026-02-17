import React from 'react';
import { Dumbbell, Activity, Clock, Home, Building, AlertCircle, Info } from 'lucide-react';

interface Props {
    formData: any;
    updateField: (field: string, value: any) => void;
    toggleArrayField: (field: string, value: string) => void;
}

export function ActivityStep({ formData, updateField, toggleArrayField }: Props) {
    const stepOptions = ['No los cuento', '< 3.000', '3.000-5.000', '5.000-8.000', '8.000-10.000', '> 10.000'];
    const functionalTestsList = [
        'Me cuesta levantar o cargar una bolsa de la compra (≈ 5 kg)',
        'Me cuesta levantarme de una silla profunda sin usar los brazos para apoyarme',
        'Me cuesta subir un tramo de 10 escaleras sin tener que pararme',
        'He tenido una o más caídas en el último año',
        'Ninguna de las anteriores, me muevo bien y soy independiente'
    ];

    return (
        <div className="space-y-10">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Bloque 8 · Actividad Física y Movimiento</h3>
                <p className="text-slate-600">Queremos saber cómo te mueves para que el ejercicio sea una medicina, no un factor de estrés.</p>
            </div>

            {/* Pasos y Rutina */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">Pasos diarios aproximados</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {stepOptions.map(opt => (
                            <label key={opt} className={`p-2 border rounded-lg text-center cursor-pointer text-xs transition-all ${formData.dailySteps === opt ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                                <input
                                    type="radio"
                                    name="dailySteps"
                                    value={opt}
                                    checked={formData.dailySteps === opt}
                                    onChange={(e) => updateField('dailySteps', e.target.value)}
                                    className="hidden"
                                />
                                {opt}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Tu rutina diaria actual</label>
                    <textarea
                        className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-200 outline-none"
                        placeholder="Ej: Paso 8 horas sentado, estoy de baja descansando en el sofá..."
                        value={formData.dailyRoutineDescription}
                        onChange={(e) => updateField('dailyRoutineDescription', e.target.value)}
                        rows={3}
                    />
                </div>
            </div>

            {/* Disponibilidad */}
            <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Horarios y huecos reales para ejercicio
                </label>
                <textarea
                    className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-200 outline-none"
                    placeholder="Días y horas específicas (Ej: Lunes y Miércoles a las 10:00)"
                    value={formData.exerciseAvailability}
                    onChange={(e) => updateField('exerciseAvailability', e.target.value)}
                    rows={2}
                />
            </div>

            {/* Experiencia y Lugar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">¿Has hecho alguna vez ejercicio de fuerza?</label>
                    <div className="flex gap-4">
                        {['Sí', 'No'].map(opt => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="strengthExp"
                                    value={opt}
                                    checked={formData.hasStrengthTraining === opt}
                                    onChange={(e) => updateField('hasStrengthTraining', e.target.value)}
                                    className="w-4 h-4 text-emerald-600"
                                />
                                <span className="text-sm">{opt}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">¿Dónde harías el ejercicio?</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 p-3 border rounded-xl cursor-pointer hover:bg-emerald-50">
                            <input type="radio" value="Casa" checked={formData.exerciseLocation === 'Casa'} onChange={(e) => updateField('exerciseLocation', e.target.value)} className="hidden" />
                            <Home className={`w-4 h-4 ${formData.exerciseLocation === 'Casa' ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <span className="text-sm">En casa</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 border rounded-xl cursor-pointer hover:bg-emerald-50">
                            <input type="radio" value="Gimnasio" checked={formData.exerciseLocation === 'Gimnasio'} onChange={(e) => updateField('exerciseLocation', e.target.value)} className="hidden" />
                            <Building className={`w-4 h-4 ${formData.exerciseLocation === 'Gimnasio' ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <span className="text-sm">En el gimnasio</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Escala de Fuerza y Test Funcional */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6">
                <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">Valora tu fuerza física actual (0-10)</label>
                    <div className="flex flex-col gap-2">
                        <input
                            type="range"
                            min="0"
                            max="10"
                            step="1"
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                            value={formData.currentStrengthScale || 0}
                            onChange={(e) => updateField('currentStrengthScale', parseInt(e.target.value))}
                        />
                        <div className="flex justify-between text-xs text-slate-400 px-1">
                            <span>Mínima</span>
                            <span className="text-emerald-600 font-bold text-lg">{formData.currentStrengthScale || 0}</span>
                            <span>Máxima</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-600" />
                        Test Funcional rápido
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                        {functionalTestsList.map(test => (
                            <label key={test} className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${formData.functionalTests.includes(test) ? 'bg-emerald-50 border-emerald-500' : 'bg-white hover:bg-slate-100 border-slate-200'}`}>
                                <input
                                    type="checkbox"
                                    checked={formData.functionalTests.includes(test)}
                                    onChange={() => toggleArrayField('functionalTests', test)}
                                    className="w-5 h-5 mt-0.5 text-emerald-600"
                                />
                                <span className="text-sm text-slate-700">{test}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-900 italic">
                    Recuerda: El objetivo no es cansarse, sino fortalecerte. Adaptaremos cada serie a cómo te sientas el día del entrenamiento.
                </p>
            </div>
        </div>
    );
}
