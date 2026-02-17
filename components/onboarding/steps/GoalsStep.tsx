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
                    <ShieldCheck className="w-8 h-8 text-emerald-600" />
                    <div>
                        <h4 className="text-xl font-bold text-slate-900">Legalidad y Consentimiento</h4>
                        <p className="text-sm text-slate-600">Revisa detenidamente los documentos antes de firmar.</p>
                    </div>
                </div>

                {/* Contrato de Servicios */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <FileText className="w-4 h-4" />
                        1. Contrato de Prestación de Servicios
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 h-64 overflow-y-auto text-[11px] text-slate-600 leading-relaxed shadow-inner">
                        {contractTemplate ? (
                            <div className="whitespace-pre-wrap text-justify">
                                {contractTemplate.content
                                    .replace(/\[NOMBRE_CLIENTE\]/g, `${formData.firstName} ${formData.surname}`)
                                    .replace(/\[DNI_CLIENTE\]/g, formData.idNumber || '---')
                                    .replace(/\[DOMICILIO_CLIENTE\]/g, formData.address || '---')
                                    .replace(/\[DIA\]/g, new Date().getDate().toString())
                                    .replace(/\[MES\]/g, (new Date().getMonth() + 1).toString())
                                    .replace(/\[AÑO\]/g, new Date().getFullYear().toString())
                                }
                                <div className="pt-4 border-t border-slate-200 mt-6 font-bold text-slate-800">
                                    <p>Firmado digitalmente por: {formData.firstName} {formData.surname}</p>
                                    <p>DNI/NIE: {formData.idNumber || '---'}</p>
                                    <p>Fecha de aceptación: {new Date().toLocaleDateString('es-ES')}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 text-justify">
                                <h5 className="font-bold text-xs text-slate-900 uppercase mb-4 text-center border-b pb-2">DOCUMENTO DE ADHESIÓN AL PROGRAMA · ESCUELA CUIDARTE</h5>
                                <p>Cargando términos del contrato...</p>
                            </div>
                        )}
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl hover:bg-emerald-50 transition-all">
                        <input
                            type="checkbox"
                            className="w-5 h-5 text-emerald-600 rounded"
                            checked={formData.contractAccepted}
                            onChange={(e) => updateField('contractAccepted', e.target.checked)}
                        />
                        <span className="text-sm text-slate-800 font-bold">He leído y acepto el Contrato de Servicios</span>
                    </label>
                </div>

                {/* Consentimiento Informado */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <ShieldCheck className="w-4 h-4" />
                        2. Consentimiento Informado y RGPD
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 h-40 overflow-y-auto text-[11px] text-slate-600 leading-relaxed shadow-inner">
                        <h5 className="font-bold text-xs text-slate-900 uppercase mb-3">TRATAMIENTO DE DATOS DE SALUD (RGPD)</h5>
                        <p>De conformidad con el Reglamento General de Protección de Datos (UE) 2016/679, le informamos que:</p>
                        <p className="my-2"><strong>Finalidad:</strong> Sus datos personales y de salud (historia clínica, síntomas, analíticas) serán tratados exclusivamente para la elaboración y seguimiento de su plan integral de salud.</p>
                        <p className="my-2"><strong>Legitimación:</strong> Su consentimiento explícito al marcar esta casilla y firmar este documento.</p>
                        <p className="my-2"><strong>Derechos:</strong> Podrá acceder, rectificar y suprimir sus datos en cualquier momento contactando con Escuela Cuid-Arte.</p>
                        <p className="italic mt-4 text-[10px]">Al aceptar, autoriza expresamente a los profesionales de Escuela Cuid-Arte a tratar la información sensible proporcionada en este formulario.</p>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer p-4 bg-teal-50/50 border border-teal-100 rounded-xl hover:bg-teal-50 transition-all">
                        <input
                            type="checkbox"
                            className="w-5 h-5 text-teal-600 rounded"
                            checked={formData.healthConsent}
                            onChange={(e) => updateField('healthConsent', e.target.checked)}
                        />
                        <span className="text-sm text-slate-800 font-bold">Doy mi consentimiento para el tratamiento de mis datos de salud</span>
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
