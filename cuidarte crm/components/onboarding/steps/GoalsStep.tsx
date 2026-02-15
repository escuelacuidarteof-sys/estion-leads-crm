import React from 'react';
import { Target, Video, MessageCircle, Sparkles } from 'lucide-react';

interface Props {
    formData: any;
    updateField: (field: string, value: any) => void;
    coachVideo?: string;
}

export function GoalsStep({ formData, updateField, coachVideo }: Props) {
    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Tus Objetivos y Motivación</h3>
                <p className="text-slate-600">Cuéntanos qué quieres lograr y por qué confías en nosotros</p>
            </div>

            {/* Objetivo 3 meses */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                    <Target className="inline w-4 h-4 mr-1 text-emerald-600" />
                    ¿Qué objetivo te gustaría alcanzar en 3 meses? *
                </label>
                <textarea
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all resize-none"
                    rows={3}
                    value={formData.goal3Months}
                    onChange={(e) => updateField('goal3Months', e.target.value)}
                    placeholder="Ej: Perder 5 kg, controlar mejor mis niveles de glucosa, empezar a hacer ejercicio..."
                    required
                />
            </div>

            {/* Objetivo 6 meses */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                    <Target className="inline w-4 h-4 mr-1 text-teal-600" />
                    ¿Qué objetivo te gustaría alcanzar en 6 meses? *
                </label>
                <textarea
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all resize-none"
                    rows={3}
                    value={formData.goal6Months}
                    onChange={(e) => updateField('goal6Months', e.target.value)}
                    placeholder="Ej: Haber perdido 10 kg, reducir mi HbA1c, tener un hábito de ejercicio..."
                    required
                />
            </div>

            {/* Objetivo 1 año */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                    <Target className="inline w-4 h-4 mr-1 text-blue-600" />
                    ¿Qué objetivo te gustaría alcanzar en 1 año? *
                </label>
                <textarea
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all resize-none"
                    rows={3}
                    value={formData.goal1Year}
                    onChange={(e) => updateField('goal1Year', e.target.value)}
                    placeholder="Ej: Mantener mi peso ideal, tener la diabetes controlada, sentirme lleno de energía..."
                    required
                />
            </div>

            {/* Por qué confías en nosotros */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                    <MessageCircle className="inline w-4 h-4 mr-1 text-purple-600" />
                    ¿Por qué confías en nosotros para ayudarte? *
                </label>
                <textarea
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all resize-none"
                    rows={3}
                    value={formData.whyTrustUs}
                    onChange={(e) => updateField('whyTrustUs', e.target.value)}
                    placeholder="Cuéntanos qué te motivó a unirte a Escuela Cuid-Arte..."
                    required
                />
            </div>

            {/* Comentarios adicionales */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                    Comentarios Adicionales (opcional)
                </label>
                <textarea
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all resize-none"
                    rows={3}
                    value={formData.additionalComments}
                    onChange={(e) => updateField('additionalComments', e.target.value)}
                    placeholder="¿Hay algo más que quieras que sepamos?"
                />
            </div>

            {/* Video del Coach */}
            {coachVideo && (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                    <h4 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                        <Video className="w-5 h-5" />
                        Mensaje de Bienvenida de tu Coach
                    </h4>
                    <div className="aspect-video rounded-lg overflow-hidden bg-black">
                        <iframe
                            src={coachVideo}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            )}

            {/* Mensaje Final de Bienvenida */}
            <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl p-6 border border-emerald-200 text-center">
                <Sparkles className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-emerald-900 mb-2">
                    ¡Ya casi estás dentro!
                </h4>
                <p className="text-emerald-800 mb-4">
                    Al pulsar <strong>"Completar Registro"</strong> crearemos tu cuenta y tendrás acceso inmediato
                    a tu portal personal donde encontrarás:
                </p>
                <ul className="text-left text-emerald-700 space-y-2 max-w-md mx-auto mb-4">
                    <li className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">✓</span>
                        Tu plan nutricional personalizado
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">✓</span>
                        Tu programa de entrenamiento
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">✓</span>
                        Acceso a clases en directo y grabadas
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">✓</span>
                        Seguimiento de tu progreso
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">✓</span>
                        Contacto directo con tu coach
                    </li>
                </ul>
                <p className="text-sm text-emerald-600">
                    Tu coach revisará tus datos y se pondrá en contacto contigo pronto 💚
                </p>
            </div>
        </div>
    );
}
