import React, { useState } from 'react';
import { Stethoscope, Thermometer, Upload, FileText, Loader2, CheckCircle2, ShieldAlert, AlertTriangle } from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';

interface Props {
    formData: any;
    updateField: (field: string, value: any) => void;
    toggleArrayField: (field: string, value: string) => void;
}

export function MedicalDataStep({ formData, updateField, toggleArrayField }: Props) {
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            alert('El archivo es demasiado grande (máximo 10MB)');
            return;
        }
        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `onboarding-docs/${Date.now()}_${fileName}`;
            const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);
            updateField('labResultsFile', publicUrl);
        } catch (error: any) {
            console.error('Upload error:', error);
            alert('Error al subir el archivo: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

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
                <p className="text-slate-600">Esta información técnica nos permite crear un plan 100% seguro para tu situación específica.</p>
            </div>

            {/* Situación Oncológica */}
            <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700">Situación oncológica actual *</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                        { id: 'activo', label: 'En tratamiento activo' },
                        { id: 'finalizado', label: 'Finalizado (Seguimiento)' },
                        { id: 'supervivencia', label: 'Seguimiento oncológico' }
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

            {/* Tipo de tumor */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de cáncer / Localización del tumor *</label>
                <input
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none"
                    value={formData.tumorType || ''}
                    onChange={(e) => updateField('tumorType', e.target.value)}
                    placeholder="Ej: Cáncer de mama HER2+, adenocarcinoma de colon estadio II, linfoma..."
                />
                <p className="text-[11px] text-slate-400 mt-1">Nos ayuda a adaptar el ejercicio a las restricciones específicas de tu diagnóstico.</p>
            </div>

            {/* Tratamientos */}
            <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700">Tratamiento actual o reciente (marca todos los que apliquen) *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {treatmentsList.map(t => (
                        <label key={t} className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.treatments?.includes(t)}
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

            {/* ── FACTORES DE SEGURIDAD PARA EL EJERCICIO ── */}
            <div className="p-5 bg-red-50 border-2 border-red-200 rounded-2xl space-y-5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-xl">
                        <ShieldAlert className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-red-900">Factores de seguridad para el ejercicio</h4>
                        <p className="text-xs text-red-700">Esta información es clave para que el plan de ejercicio sea 100% seguro. Si no estás segura de algún término, consúltalo con tu médico.</p>
                    </div>
                </div>

                {/* Neuropatía */}
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Neuropatía periférica</label>
                    <p className="text-[11px] text-slate-500">Hormigueo, entumecimiento o debilidad en manos y pies. Frecuente con algunos quimioterápicos (Taxol, Vincristina, etc.)</p>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { val: 'ninguna', label: 'Sin neuropatía' },
                            { val: 'leve', label: 'Leve (hormigueo ocasional)' },
                            { val: 'moderada_severa', label: 'Moderada/severa (afecta al equilibrio o agarre)' }
                        ].map(opt => (
                            <label key={opt.val} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-all ${formData.peripheralNeuropathy === opt.val ? 'bg-red-100 border-red-500 font-bold text-red-900' : 'bg-white border-slate-200 text-slate-600 hover:border-red-200'}`}>
                                <input type="radio" name="peripheralNeuropathy" value={opt.val} checked={formData.peripheralNeuropathy === opt.val} onChange={(e) => updateField('peripheralNeuropathy', e.target.value)} className="hidden" />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Linfedema */}
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Linfedema</label>
                    <p className="text-[11px] text-slate-500">Hinchazón crónica en brazo o pierna. Frecuente tras cirugía axilar (cáncer de mama) o ganglios pélvicos. Limita el tipo de ejercicio que podemos prescribir.</p>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { val: 'ninguno', label: 'Ninguno' },
                            { val: 'miembro_superior', label: 'Brazo / Mano (miembro superior)' },
                            { val: 'miembro_inferior', label: 'Pierna / Pie (miembro inferior)' },
                            { val: 'bilateral', label: 'Ambos' }
                        ].map(opt => (
                            <label key={opt.val} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-all ${formData.lymphedema === opt.val ? 'bg-red-100 border-red-500 font-bold text-red-900' : 'bg-white border-slate-200 text-slate-600 hover:border-red-200'}`}>
                                <input type="radio" name="lymphedema" value={opt.val} checked={formData.lymphedema === opt.val} onChange={(e) => updateField('lymphedema', e.target.value)} className="hidden" />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Acceso venoso */}
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Acceso venoso permanente</label>
                    <p className="text-[11px] text-slate-500">El Port-a-cath y el PICC limitan algunos ejercicios de hombro y pecho para proteger el dispositivo.</p>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { val: 'ninguno', label: 'Ninguno' },
                            { val: 'port_a_cath', label: 'Port-a-cath (reservorio subcutáneo)' },
                            { val: 'picc', label: 'PICC (catéter periférico central)' }
                        ].map(opt => (
                            <label key={opt.val} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-all ${formData.venousAccess === opt.val ? 'bg-red-100 border-red-500 font-bold text-red-900' : 'bg-white border-slate-200 text-slate-600 hover:border-red-200'}`}>
                                <input type="radio" name="venousAccess" value={opt.val} checked={formData.venousAccess === opt.val} onChange={(e) => updateField('venousAccess', e.target.value)} className="hidden" />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Riesgo óseo */}
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" /> Riesgo óseo
                    </label>
                    <p className="text-[11px] text-slate-500">Las metástasis óseas condicionan completamente el tipo de ejercicio con cargas. Fundamental para tu seguridad.</p>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { val: 'ninguno', label: 'Sin riesgo conocido' },
                            { val: 'osteoporosis', label: 'Osteoporosis (por tratamiento o previa)' },
                            { val: 'metastasis_oseas', label: 'Metástasis óseas' }
                        ].map(opt => (
                            <label key={opt.val} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-all ${formData.boneRisk === opt.val ? (opt.val === 'metastasis_oseas' ? 'bg-red-200 border-red-600 font-bold text-red-900' : 'bg-red-100 border-red-500 font-bold text-red-900') : 'bg-white border-slate-200 text-slate-600 hover:border-red-200'}`}>
                                <input type="radio" name="boneRisk" value={opt.val} checked={formData.boneRisk === opt.val} onChange={(e) => updateField('boneRisk', e.target.value)} className="hidden" />
                                {opt.label}
                            </label>
                        ))}
                    </div>
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
                                checked={formData.healthConditions?.includes(c)}
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
                        placeholder="Ej: Tamoxifeno 20mg, Letrozol 2.5mg, Corticoides, Antiemético..."
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
                    placeholder="Ej: No puedo levantar el brazo derecho por la cirugía, linfedema en brazo izquierdo, dolor lumbar..."
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
                    placeholder="Hemoglobina, ferritina, vitamina D, leucocitos, plaquetas... (Si no lo sabes, pon 'no lo sé')"
                    rows={2}
                />
            </div>

            <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700">
                    Opcional: Sube tu última analítica o informe médico
                </label>
                <div className={`relative border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-4 ${formData.labResultsFile ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                    {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                            <p className="text-sm font-medium text-slate-600">Subiendo documento...</p>
                        </div>
                    ) : formData.labResultsFile ? (
                        <div className="flex flex-col items-center gap-2 text-center">
                            <div className="p-3 bg-emerald-100 rounded-full">
                                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            </div>
                            <p className="text-sm font-bold text-emerald-900">¡Documento subido correctamente!</p>
                            <button onClick={() => updateField('labResultsFile', '')} className="text-xs text-red-500 font-bold hover:underline">
                                Cambiar archivo
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="p-4 bg-white rounded-2xl shadow-sm">
                                <Upload className="w-8 h-8 text-emerald-600" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-slate-700">Pulsa para seleccionar o arrastra aquí</p>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">PDF, JPG o PNG (Máx 10MB)</p>
                            </div>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
