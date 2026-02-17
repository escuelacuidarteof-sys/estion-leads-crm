import React from 'react';
import { Heart, Clock, Clipboard, Scale, Stethoscope } from 'lucide-react';

export function WelcomeStep() {
    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <div className="mb-6">
                    <img
                        src="https://i.postimg.cc/Kj6R2R75/LOGODRA.png"
                        alt="Logo Cuidarte"
                        className="h-24 mx-auto drop-shadow-sm"
                    />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">¡Bienvenido/a a tu nueva etapa!</h2>
                <p className="text-slate-600">Este es el Formulario Integral Cuidarte · Valoración Inicial</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                    <Clipboard className="w-5 h-5" />
                    Objetivo de esta valoración:
                </h3>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                    Conocer al detalle tu estado de salud, tratamientos, metabolismo y rutinas para adaptar de forma segura, realista y
                    ultra-personalizada tu plan de alimentación y entrenamiento.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm">
                        <Clock className="w-5 h-5 text-emerald-600 mt-0.5" />
                        <div>
                            <p className="font-bold text-slate-900 text-sm">15-20 minutos</p>
                            <p className="text-xs text-slate-500">de tiempo sin interrupciones</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm">
                        <Stethoscope className="w-5 h-5 text-emerald-600 mt-0.5" />
                        <div>
                            <p className="font-bold text-slate-900 text-sm">Contexto Clínico</p>
                            <p className="text-xs text-slate-500">Tratamientos, medicación y dudas</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900 italic">
                    <strong>Nota:</strong> Este formulario no sustituye la atención médica. Cuanto más detalladas sean tus respuestas,
                    mejor podremos ayudarte. No hay respuestas correctas, solo queremos saber cómo estás hoy.
                </p>
            </div>
        </div>
    );
}
