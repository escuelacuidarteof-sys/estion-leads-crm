import React, { useState } from 'react';
import { Target, Heart, ShieldCheck, Signature, FileText, AlertCircle } from 'lucide-react';
import SignaturePad from 'react-signature-canvas';

interface Props {
    formData: any;
    updateField: (field: string, value: any) => void;
    contractTemplate?: any;
}

export function GoalsStep({ formData, updateField, contractTemplate }: Props) {
    const [sigPad, setSigPad] = useState<any>(null);

    const clearSignature = () => {
        sigPad.clear();
        updateField('signatureImage', '');
    };

    const saveSignature = () => {
        if (sigPad) {
            updateField('signatureImage', sigPad.toDataURL());
        }
    };

    return (
        <div className="space-y-10">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Bloque 9 · Objetivos y Prioridades</h3>
                <p className="text-slate-600">Para terminar, ayúdanos a visualizar dónde quieres llegar y formalicemos tu alta.</p>
            </div>

            {/* Objetivos Detallados */}
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">¿Cuál es tu principal prioridad o preocupación AHORA MISMO? *</label>
                    <textarea
                        className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-200 outline-none"
                        value={formData.mainPriority}
                        onChange={(e) => updateField('mainPriority', e.target.value)}
                        placeholder="Ej: Reducir náuseas, no perder peso, tener energía para el próximo ciclo..."
                        rows={3}
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">¿Cómo te gustaría sentirte en tu día a día gracias a este programa?</label>
                    <textarea
                        className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-200 outline-none"
                        value={formData.desiredFeeling}
                        onChange={(e) => updateField('desiredFeeling', e.target.value)}
                        placeholder="Ej: Poder dar paseos largos, levantarme con menos fatiga, sentirme fuerte..."
                        rows={3}
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">¿Hay algún "hito" médico o personal a corto plazo? (Operación, viaje...)</label>
                    <input
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none"
                        value={formData.shortTermMilestone}
                        onChange={(e) => updateField('shortTermMilestone', e.target.value)}
                        placeholder="Ej: Me operan el mes que viene, tengo un viaje familiar..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">¿Por qué has decidido confiar en Escuela Cuidarte?</label>
                    <textarea
                        className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-200 outline-none"
                        value={formData.whyTrustUs}
                        onChange={(e) => updateField('whyTrustUs', e.target.value)}
                        placeholder="Tu motivo principal para empezar hoy"
                        rows={2}
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">¿Hay algo más que te preocupe o te dé miedo?</label>
                    <textarea
                        className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-200 outline-none"
                        value={formData.additionalConcerns}
                        onChange={(e) => updateField('additionalConcerns', e.target.value)}
                        placeholder="Cualquier cosa que quieras que sepamos al crear tu plan"
                        rows={2}
                    />
                </div>
            </div>

            {/* CONTRATO Y LEGAL */}
            <div className="pt-10 border-t space-y-8">
                <div className="flex items-center gap-3">
                    < ShieldCheck className="w-8 h-8 text-emerald-600" />
                    <div>
                        <h4 className="text-xl font-bold text-slate-900">Legal y Aceptación</h4>
                        <p className="text-sm text-slate-600">Revisa tu contrato de servicio y firma para finalizar.</p>
                    </div>
                </div>

                {/* Contrato Mockup/Viewer */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 h-64 overflow-y-auto text-xs text-slate-600 space-y-4">
                    <h5 className="font-bold text-sm text-slate-900 uppercase">Contrato de Prestación de Servicios · Escuela Cuidarte</h5>
                    <p>Por la presente, el cliente acepta las condiciones de servicio de Escuela Cuidarte...</p>
                    {contractTemplate?.content ? (
                        <div dangerouslySetInnerHTML={{ __html: contractTemplate.content }} />
                    ) : (
                        <p>Cargando condiciones específicas...</p>
                    )}
                    <p className="italic mt-4">Al firmar a continuación, aceptas que tus datos sean tratados conforme al RGPD para la gestión de tu salud y asesoramiento.</p>
                </div>

                {/* Checks Legales */}
                <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer p-4 border rounded-xl hover:bg-emerald-50 transition-all">
                        <input
                            type="checkbox"
                            className="w-5 h-5 mt-0.5 text-emerald-600"
                            checked={formData.contractAccepted}
                            onChange={(e) => updateField('contractAccepted', e.target.checked)}
                        />
                        <span className="text-sm text-slate-700 font-medium">He leído y acepto el contrato de prestación de servicios.</span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer p-4 border rounded-xl hover:bg-emerald-50 transition-all">
                        <input
                            type="checkbox"
                            className="w-5 h-5 mt-0.5 text-emerald-600"
                            checked={formData.healthConsent}
                            onChange={(e) => updateField('healthConsent', e.target.checked)}
                        />
                        <span className="text-sm text-slate-700 font-medium">Doy mi consentimiento para el tratamiento de mis datos de salud con fines de seguimiento médico y nutricional.</span>
                    </label>
                </div>

                {/* Firma Digital */}
                <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Signature className="w-5 h-5 text-emerald-600" />
                        Firma aquí (con el ratón o el dedo)
                    </label>
                    <div className="border-2 border-slate-200 rounded-xl bg-white overflow-hidden">
                        <SignaturePad
                            ref={(ref) => setSigPad(ref)}
                            canvasProps={{
                                className: "w-full h-48 cursor-crosshair"
                            }}
                            onEnd={saveSignature}
                        />
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={clearSignature}
                            className="text-xs font-bold text-red-500 hover:text-red-600 p-2"
                        >
                            Borrar firma
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-emerald-600 p-6 rounded-2xl text-white flex gap-4 items-center">
                <Target className="w-10 h-10 opacity-50" />
                <div>
                    <h5 className="font-bold text-lg">¡Casi hemos terminado!</h5>
                    <p className="text-emerald-100 text-sm">Al pulsar en "Finalizar y Entrar", tu cuenta se activará y tu coach recibirá toda esta información de inmediato.</p>
                </div>
            </div>
        </div>
    );
}
