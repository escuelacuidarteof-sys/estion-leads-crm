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

        </div>
    );
}
