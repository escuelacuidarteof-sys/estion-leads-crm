import React, { useRef, useState, useEffect } from 'react';
import { OnboardingData } from '../OnboardingPage';
import { FileText, PenTool, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';

interface ContractStepProps {
    formData: OnboardingData;
    updateField: (field: keyof OnboardingData, value: any) => void;
    contractDuration: number;
    templateContent?: string;
}

export function ContractStep({ formData, updateField, contractDuration, templateContent }: ContractStepProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    const [accepted, setAccepted] = useState(false);

    // Initialize canvas with high precision
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const resizeCanvas = () => {
                const rect = canvas.getBoundingClientRect();
                const dpr = window.devicePixelRatio || 1;

                // Set the internal resolution
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.scale(dpr, dpr);
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2.5;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                }
            };

            resizeCanvas();
            // Debounced resize and initial stabilization
            const timer = setTimeout(resizeCanvas, 200);
            window.addEventListener('resize', resizeCanvas);

            return () => {
                window.removeEventListener('resize', resizeCanvas);
                clearTimeout(timer);
            };
        }
    }, []);

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        } else {
            // For mouse events, use native offsetX/offsetY which are relative to the content area
            const mouseEvent = e as React.MouseEvent;
            const native = mouseEvent.nativeEvent;

            // If offsetX is available, it's the most precise as it's relative to the element
            if (typeof native.offsetX === 'number') {
                return { x: native.offsetX, y: native.offsetY };
            }

            // Fallback to manual calculation
            return {
                x: mouseEvent.clientX - rect.left,
                y: mouseEvent.clientY - rect.top
            };
        }
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const { x, y } = getCoordinates(e);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');

        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            setIsDrawing(true);
        }

        if (e.cancelable) e.preventDefault();
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            const signatureData = canvas.toDataURL('image/png');
            updateField('signatureImage' as any, signatureData);
            setHasSignature(true);
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const { x, y } = getCoordinates(e);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');

        if (ctx) {
            ctx.lineTo(x, y);
            ctx.stroke();
        }

        if (e.cancelable) e.preventDefault();
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setHasSignature(false);
            updateField('signatureImage' as any, '');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-start gap-3">
                <FileText className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                    <h3 className="text-emerald-900 font-bold text-sm uppercase tracking-wider">Compromiso de Colaboración</h3>
                    <p className="text-emerald-700 text-xs mt-1">Este es el último paso para formalizar tu entrada al programa.</p>
                </div>
            </div>

            {/* Contract Container */}
            <div className="bg-white border border-slate-200 rounded-xl p-8 h-96 overflow-y-auto text-[13px] leading-relaxed text-slate-700 shadow-inner">
                <div className="max-w-none prose prose-slate prose-sm text-justify">
                    <div className="flex justify-center mb-6">
                        <img src="/logo.png" alt="Logo" className="w-24 h-24 object-contain" />
                    </div>

                    {templateContent ? (
                        <div className="whitespace-pre-wrap">
                            {templateContent
                                .replace(/\[DIA\]/g, new Date().getDate().toString())
                                .replace(/\[MES\]/g, new Date().toLocaleString('es-ES', { month: 'long' }).toUpperCase())
                                .replace(/\[AÑO\]/g, new Date().getFullYear().toString())
                                .replace(/\[NOMBRE_CLIENTE\]/g, `${formData.firstName} ${formData.surname}`)
                                .replace(/\[DNI_CLIENTE\]/g, formData.idNumber || '________________')
                                .replace(/\[DOMICILIO_CLIENTE\]/g, formData.address || '__________________________________________')
                                .replace(/\[DURACION_MESES\]/g, contractDuration.toString())
                                .replace(/\[DURACION_DIAS\]/g, (contractDuration * 30).toString())
                            }
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="font-black text-slate-900 text-center uppercase mb-6 underline decoration-emerald-500 decoration-2 underline-offset-4">DOCUMENTO DE ADHESIÓN AL PROGRAMA ESCUELA CUIDARTE</h3>

                            <p className="mb-4">
                                En <strong>Madrid</strong>, a <strong>{new Date().getDate()}</strong> de <strong>{new Date().toLocaleString('es-ES', { month: 'long' }).toUpperCase()}</strong> de {new Date().getFullYear()}.
                            </p>

                            <div className="space-y-4 mb-6">
                                <p>
                                    <strong>De una parte:</strong> <strong className="text-emerald-900">NEIKO HEALTH, S.L.</strong>, con NIF: <strong>B22928311</strong> y domicilio social en <strong>C/ Princesa 31, 2º puerta 2, 28008 Madrid</strong> (en adelante, "LA EMPRESA").
                                </p>
                                <p>
                                    <strong>Y de otra:</strong> <strong>{formData.firstName} {formData.surname}</strong> con DNI <strong>{formData.idNumber || '________________'}</strong> y domicilio
                                    en <strong>{formData.address || '__________________________________________'}</strong> (en adelante, "EL CLIENTE").
                                </p>
                            </div>

                            <p className="font-bold mb-4">INTERVIENEN</p>
                            <p className="mb-4">
                                Ambas partes, en su propio nombre y derecho, aseguran tener
                                y se reconocen mutuamente plena capacidad legal para contratar y obligarse, en
                                especial para este acto y de común acuerdo,
                            </p>

                            <h4 className="font-bold text-slate-900 mb-3">MANIFIESTAN</h4>

                            <div className="space-y-4 mb-6">
                                <p>
                                    <strong>I.</strong> Que, <strong>LA EMPRESA</strong>, presta un servicio denominado
                                    <strong> "ESCUELA CUIDARTE"</strong> por el cual ofrece servicios de coaching, nutrición y acompañamiento en salud.
                                </p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Programa de acompañamiento de {contractDuration} meses de duración.</li>
                                    <li>Acceso a App privada de seguimiento durante la duración del servicio.</li>
                                    <li>Soporte y control semanal de resultados.</li>
                                </ul>

                                <p>
                                    <strong>II.</strong> Que el cliente manifiesta que conoce y acepta los términos del programa, estando interesado en la realización del mismo.
                                </p>
                            </div>

                            <h4 className="font-bold text-slate-900 text-center mb-4">TÉRMINOS Y CONDICIONES</h4>
                            <p className="text-center italic text-[11px] mb-4">(Para ver los términos completos, consulte el documento oficial anexo o espere a que cargue la plantilla)</p>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 italic text-xs text-slate-500">
                    Documento generado electrónicamente para <strong>{formData.firstName} {formData.surname}</strong> el {new Date().toLocaleDateString()}.
                </div>
            </div>

            <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                    <h4 className="text-blue-900 font-bold text-xs uppercase mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Protección de Datos de Salud (RGPD)
                    </h4>
                    <p className="text-[11px] text-blue-800 leading-normal text-justify mb-3">
                        Para poder ofrecerte un servicio personalizado, necesitamos tratar tus datos de categoría especial (glucosa, peso, medicación, etc.). Estos datos serán visibles exclusivamente para tu Coach y el equipo médico de la Academia, y no serán compartidos con terceros sin tu permiso expreso.
                    </p>
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            className="w-5 h-5 text-blue-600 rounded mt-0.5"
                            checked={formData.healthConsent}
                            onChange={(e) => updateField('healthConsent', e.target.checked)}
                        />
                        <span className="text-xs font-bold text-blue-900">Consiento expresamente el tratamiento de mis datos de salud para la ejecución del programa. *</span>
                    </label>
                </div>

                <label className="flex items-center gap-3 cursor-pointer p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                    <input
                        type="checkbox"
                        className="w-5 h-5 text-emerald-600 rounded"
                        checked={formData.contractAccepted}
                        onChange={(e) => updateField('contractAccepted', e.target.checked)}
                    />
                    <span className="text-sm text-slate-700">He leído y acepto los términos del contrato de colaboración.</span>
                </label>

                {formData.contractAccepted && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                <PenTool className="w-4 h-4" />
                                Firma Digital aquí
                            </label>
                            <button
                                onClick={clearSignature}
                                className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 transition-all"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Borrar firma
                            </button>
                        </div>
                        <div className="border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden touch-none h-[200px]">
                            <canvas
                                ref={canvasRef}
                                onMouseDown={startDrawing}
                                onMouseUp={stopDrawing}
                                onMouseOut={stopDrawing}
                                onMouseMove={draw}
                                touch-action="none"
                                onTouchStart={startDrawing}
                                onTouchEnd={stopDrawing}
                                onTouchMove={draw}
                                className="w-full h-full block cursor-crosshair"
                            />
                        </div>
                        {!hasSignature ? (
                            <p className="text-[10px] text-slate-400 text-center">Usa el dedo o el ratón para firmar dentro del recuadro</p>
                        ) : (
                            <div className="flex items-center justify-center gap-2 text-emerald-600 text-xs font-bold bg-emerald-50 py-2 rounded-lg border border-emerald-100">
                                <CheckCircle className="w-4 h-4" />
                                Firma capturada con éxito
                            </div>
                        )}
                    </div>
                )}

                {!formData.contractAccepted && (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <p className="text-amber-700 text-xs italic">Debes marcar la casilla de aceptación para poder firmar el contrato.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
