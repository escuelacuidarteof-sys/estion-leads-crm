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
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 h-48 overflow-y-auto text-[11px] text-slate-600 leading-relaxed shadow-inner">
                        <h5 className="font-bold text-xs text-slate-900 uppercase mb-4 text-center border-b pb-2">DOCUMENTO DE ADHESIÓN AL PROGRAMA · ESCUELA CUIDARTE</h5>

                        <div className="space-y-4 text-justify">
                            <p className="font-bold">Servicio prestado y facturado por NEIKO HEALTH, S.L.</p>

                            <div className="bg-white p-3 border rounded-lg mb-4">
                                <p className="font-bold underline mb-2">REUNIDOS</p>
                                <p><strong>De una parte:</strong> NEIKO HEALTH, S.L., NIF: B22928311, Domicilio social: C/ Princesa 31, 2º puerta 2, 28008 Madrid. Entidad mercantil que presta, gestiona y factura los servicios del programa Escuela CUIDARTE (en adelante, LA EMPRESA).</p>
                                <p className="mt-2"><strong>Y de otra parte:</strong> El/la participante, cuyos datos constan en el presente formulario de inscripción (en adelante, EL/LA PARTICIPANTE).</p>
                            </div>

                            <p>Ambas partes, reconociéndose capacidad legal suficiente para contratar, acuerdan suscribir el presente Contrato de Prestación de Servicios, que se regirá por las siguientes:</p>

                            <p className="font-bold text-slate-900">CLÁUSULAS</p>

                            <div>
                                <p className="font-bold">1. OBJETO DEL CONTRATO</p>
                                <p>El presente contrato tiene por objeto regular la participación voluntaria del/la participante en el programa Escuela CUIDARTE, consistente en un servicio integral de acompañamiento personalizado en nutrición, ejercicio físico y bienestar, desarrollado en modalidad online, y prestado y facturado por LA EMPRESA.</p>
                            </div>

                            <div>
                                <p className="font-bold">2. NATURALEZA DEL SERVICIO</p>
                                <p>El/la participante ha sido informado, reconoce y acepta que: La Escuela CUIDARTE es un programa de educación, formación, acompañamiento y apoyo en hábitos de vida saludable. NO constituye un acto médico, psicológico ni terapéutico. NO realiza ni sustituye diagnósticos, tratamientos médicos, quirúrgicos o farmacológicos prescritos por profesionales sanitarios.</p>
                            </div>

                            <div>
                                <p className="font-bold">3. NO SUSTITUCIÓN DEL TRATAMIENTO MÉDICO</p>
                                <p>El programa NO sustituye en ningún caso a la atención médica, quirúrgica, farmacológica u oncológica indicada por su equipo sanitario. Debe mantener sus controles médicos habituales durante toda su participación en el programa.</p>
                            </div>

                            <div>
                                <p className="font-bold">4. AUSENCIA DE SERVICIO DE URGENCIAS</p>
                                <p>La Escuela CUIDARTE NO es un servicio de urgencias. Ante cualquier empeoramiento clínico, síntoma grave o urgencia, deberá acudir a los servicios sanitarios correspondientes.</p>
                            </div>

                            <div>
                                <p className="font-bold">5. NO GARANTÍA DE RESULTADOS NI CURACIÓN</p>
                                <p>El programa no garantiza resultados médicos, clínicos ni terapéuticos. Los posibles beneficios que se obtengan dependen de múltiples factores individuales ajenos al control del programa.</p>
                            </div>

                            <div>
                                <p className="font-bold">6. PARTICIPACIÓN VOLUNTARIA Y AUTORRESPONSABILIDAD</p>
                                <p>El/la participante acepta que su participación es voluntaria y bajo su propia responsabilidad. La aplicación de las recomendaciones recibidas es una decisión personal.</p>
                            </div>

                            <div>
                                <p className="font-bold">7. DESCRIPCIÓN DEL PROGRAMA Y CONTENIDOS</p>
                                <ul className="list-disc ml-5 space-y-1">
                                    <li><strong>Acompañamiento nutricional personalizado:</strong> Plan individualizado y seguimiento diario vía plataforma.</li>
                                    <li><strong>Entrenamientos personalizados:</strong> Envío semanal adaptado a sus capacidades.</li>
                                    <li><strong>Formación en autocuidado:</strong> Acceso a clases formativas semanales online.</li>
                                    <li><strong>Resolución de dudas:</strong> Espacio de contacto vía email para consultas del programa.</li>
                                </ul>
                            </div>

                            <div>
                                <p className="font-bold">8. ACCESO AL PROGRAMA</p>
                                <p>Se realiza a través de plataforma privada. LA EMPRESA facilitará las credenciales (usuario y contraseña) tras la aceptación de este contrato.</p>
                            </div>

                            <div className="bg-emerald-50 p-3 border border-emerald-100 rounded-lg">
                                <p className="font-bold text-emerald-900">10. PRECIO DEL PROGRAMA</p>
                                <p className="text-emerald-800 font-medium">El precio del programa es de QUINIENTOS EUROS (500,00 €) trimestrales, más el IVA correspondiente (21%). El pago del primer trimestre deberá realizarse en el plazo máximo de dos días naturales desde la aceptación.</p>
                            </div>

                            <div>
                                <p className="font-bold">11. DURACIÓN Y BAJA</p>
                                <p>Duración mínima de tres meses. Renovable automáticamente por períodos iguales. El/la participante podrá abandonar el programa en cualquier momento, pero no tendrá derecho a devolución proporcional si lo hace antes de finalizar el trimestre en curso.</p>
                            </div>

                            <div>
                                <p className="font-bold">13. CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS</p>
                                <p>Sus datos se tratarán conforme al RGPD (UE) 2016/679. Se utilizarán exclusivamente para la gestión y seguimiento del programa.</p>
                            </div>

                            <div>
                                <p className="font-bold">14. LEGISLACIÓN Y JURISDICCIÓN</p>
                                <p>El contrato se rige por la legislación española. Ambas partes se someten a los Tribunales de Madrid.</p>
                            </div>

                            <div className="pt-4 border-t border-slate-200 mt-6 font-bold text-slate-800">
                                <p>Firmado por EL/LA PARTICIPANTE: {formData.firstName} {formData.surname}</p>
                                <p>DNI: {formData.idNumber || '---'}</p>
                                <p>Fecha: {new Date().toLocaleDateString('es-ES')}</p>
                            </div>
                        </div>
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
