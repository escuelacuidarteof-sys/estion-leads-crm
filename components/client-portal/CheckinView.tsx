
import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Save, Scale, HelpCircle, Heart, Zap, Moon, Leaf, MessageSquare, Star } from 'lucide-react';
import { mockDb } from '../../services/mockSupabase';
import { Client } from '../../types';
import { supabase } from '../../services/supabaseClient';

interface CheckinViewProps {
    client: Client;
    onBack: () => void;
}

const SliderField = ({
    label,
    field,
    value,
    onChange,
    lowLabel = '0 (Nada)',
    highLabel = '10 (Máximo)',
    icon: Icon,
    accentColor = 'emerald',
}: {
    label: string;
    field: string;
    value: number;
    onChange: (field: string, value: number) => void;
    lowLabel?: string;
    highLabel?: string;
    icon?: React.ElementType;
    accentColor?: string;
}) => {
    const colorMap: Record<string, string> = {
        emerald: 'accent-emerald-500',
        amber: 'accent-amber-500',
        blue: 'accent-blue-500',
        rose: 'accent-rose-500',
    };
    const textColorMap: Record<string, string> = {
        emerald: value <= 3 ? 'text-emerald-600' : value <= 6 ? 'text-amber-500' : 'text-red-500',
        amber: value <= 3 ? 'text-emerald-600' : value <= 6 ? 'text-amber-500' : 'text-red-500',
        blue: 'text-blue-600',
        rose: 'text-rose-600',
    };
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                {Icon && <Icon className="w-4 h-4 text-slate-500 shrink-0" />}
                <label className="text-sm font-bold text-slate-700">{label}</label>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1">
                <span>{lowLabel}</span>
                <span>{highLabel}</span>
            </div>
            <input
                type="range"
                min="0"
                max="10"
                step="1"
                className={`w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer ${colorMap[accentColor] ?? 'accent-emerald-500'}`}
                value={value}
                onChange={e => onChange(field, parseInt(e.target.value))}
            />
            <div className="flex justify-center">
                <span className={`text-2xl font-black ${textColorMap[accentColor] ?? 'text-emerald-600'}`}>
                    {value}<span className="text-xs font-normal text-slate-400">/10</span>
                </span>
            </div>
        </div>
    );
};

export function CheckinView({ client, onBack }: CheckinViewProps) {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [answers, setAnswers] = useState({
        // Step 1 — Síntomas
        fatigue_level: 5,
        digestive_symptoms: 5,
        sleep_quality: 5,
        new_side_effects: '',
        // Step 2 — Alimentación y Ejercicio
        q3_alimentacion: '',
        q4_ejercicio: '',
        // Step 3 — Cierre
        positive_moment: '',
        coach_message: '',
        weekly_rating: 5,
        weight: '',
    });

    const handleChange = (field: string, value: any) => {
        setAnswers(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await mockDb.submitCheckin({
                client_id: client.id,
                responses: {
                    question_1: `Fatiga: ${answers.fatigue_level}/10 | Digestivo: ${answers.digestive_symptoms}/10 | Sueño: ${answers.sleep_quality}/10`,
                    question_2: answers.new_side_effects,
                    question_3: answers.q3_alimentacion,
                    question_4: answers.q4_ejercicio,
                    question_5: answers.positive_moment,
                    question_6: answers.weekly_rating.toString(),
                    weight_log: answers.weight,
                    coach_message: answers.coach_message,
                },
                rating: answers.weekly_rating,
            });

            if (answers.weight) {
                const weightVal = parseFloat(answers.weight);
                if (!isNaN(weightVal)) {
                    await supabase
                        .from('weight_history')
                        .upsert([{
                            client_id: client.id,
                            weight: weightVal,
                            date: new Date().toISOString().split('T')[0],
                            notes: 'Vía Check-in Semanal',
                        }], { onConflict: 'client_id,date' });

                    await supabase
                        .from('clientes')
                        .update({ property_peso_actual: weightVal })
                        .eq('id', client.id);
                }
            }

            setStep(4);
        } catch (error) {
            console.error(error);
            alert('Ocurrió un error al guardar tu reporte. Inténtalo de nuevo.');
            setIsSubmitting(false);
        }
    };

    if (step === 4) {
        return (
            <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-4">¡Reporte Enviado!</h2>
                <p className="text-slate-600 max-w-md mb-8">
                    Tu coach revisará tus síntomas y sensaciones de esta semana. ¡Gracias por dedicar este momento a ti misma!
                </p>
                <button
                    onClick={onBack}
                    className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                >
                    Volver al Inicio
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white pb-24">
                <div className="max-w-3xl mx-auto">
                    <button onClick={onBack} className="flex items-center gap-2 text-emerald-100 hover:text-white transition-colors mb-6">
                        <ArrowLeft className="w-5 h-5" /> Cancelar
                    </button>
                    <h1 className="text-3xl font-bold mb-2">Check-in Semanal</h1>
                    <p className="text-emerald-100 opacity-90">Cuéntanos cómo te has sentido. Solo 5 minutos, y tu coach lo verá enseguida.</p>
                </div>
            </div>

            {/* Form Container */}
            <div className="max-w-3xl mx-auto -mt-16 px-6 pb-20">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">

                    {/* Progress Bar */}
                    <div className="h-2 bg-slate-100 w-full flex">
                        <div className={`h-full bg-emerald-500 transition-all duration-500 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`} />
                    </div>

                    {/* Step 1 — Síntomas de esta semana */}
                    {step === 1 && (
                        <div className="p-8 animate-in slide-in-from-right duration-300">
                            <h3 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-3">
                                <Heart className="w-6 h-6 text-rose-400" /> ¿Cómo te has sentido esta semana?
                            </h3>
                            <p className="text-sm text-slate-500 mb-6">Valora del 0 al 10, donde 0 es lo mejor posible y 10 lo más intenso.</p>

                            <div className="space-y-7">
                                {/* Fatiga — protagonista */}
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                                    <SliderField
                                        label="Fatiga o cansancio general esta semana"
                                        field="fatigue_level"
                                        value={answers.fatigue_level}
                                        onChange={handleChange}
                                        lowLabel="0 (Sin fatiga)"
                                        highLabel="10 (Fatiga extrema)"
                                        icon={Zap}
                                        accentColor="amber"
                                    />
                                </div>

                                <SliderField
                                    label="Síntomas digestivos (náuseas, apetito, digestión)"
                                    field="digestive_symptoms"
                                    value={answers.digestive_symptoms}
                                    onChange={handleChange}
                                    lowLabel="0 (Sin molestias)"
                                    highLabel="10 (Muy intensos)"
                                    icon={Leaf}
                                    accentColor="emerald"
                                />

                                <SliderField
                                    label="Calidad del sueño esta semana"
                                    field="sleep_quality"
                                    value={answers.sleep_quality}
                                    onChange={handleChange}
                                    lowLabel="0 (Muy mal sueño)"
                                    highLabel="10 (Sueño muy bueno)"
                                    icon={Moon}
                                    accentColor="blue"
                                />

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        ¿Ha aparecido algún efecto secundario nuevo o algo diferente esta semana?
                                    </label>
                                    <textarea
                                        value={answers.new_side_effects}
                                        onChange={e => handleChange('new_side_effects', e.target.value)}
                                        className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none h-24 resize-none text-sm"
                                        placeholder="Ej: He notado más hormigueo en los dedos, me ha costado concentrarme, he tenido más náuseas los días de quimio..."
                                    />
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={() => setStep(2)}
                                        className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 flex items-center gap-2"
                                    >
                                        Siguiente <ArrowLeft className="w-4 h-4 rotate-180" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2 — Alimentación y Ejercicio */}
                    {step === 2 && (
                        <div className="p-8 animate-in slide-in-from-right duration-300">
                            <h3 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-3">
                                <Leaf className="w-6 h-6 text-emerald-500" /> Alimentación y Ejercicio
                            </h3>
                            <p className="text-sm text-slate-500 mb-6">Cuéntanos cómo ha ido esta semana con la comida y el movimiento.</p>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">¿Cómo te has sentido con la alimentación?</label>
                                    <textarea
                                        value={answers.q3_alimentacion}
                                        onChange={e => handleChange('q3_alimentacion', e.target.value)}
                                        className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none h-28 resize-none text-sm"
                                        placeholder="¿Has podido comer bien? ¿Tienes apetito? ¿Náuseas con algún alimento? ¿Algún sabor que ya no toleras? ¿Hay algo que te siente especialmente bien?"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">¿Has podido moverte o hacer ejercicio?</label>
                                    <textarea
                                        value={answers.q4_ejercicio}
                                        onChange={e => handleChange('q4_ejercicio', e.target.value)}
                                        className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none h-28 resize-none text-sm"
                                        placeholder="¿Has dado paseos, hecho los ejercicios del plan? ¿Cómo te has sentido durante o después del movimiento? ¿Tienes más o menos energía que la semana pasada?"
                                    />
                                </div>

                                <div className="flex justify-between pt-2">
                                    <button onClick={() => setStep(1)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">
                                        Atrás
                                    </button>
                                    <button
                                        onClick={() => setStep(3)}
                                        className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 flex items-center gap-2"
                                    >
                                        Siguiente <ArrowLeft className="w-4 h-4 rotate-180" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3 — Cierre y Novedades */}
                    {step === 3 && (
                        <div className="p-8 animate-in slide-in-from-right duration-300">
                            <h3 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-3">
                                <Star className="w-6 h-6 text-amber-400" /> Cierre y Novedades
                            </h3>
                            <p className="text-sm text-slate-500 mb-6">Casi hemos terminado. Dos preguntas para cerrar bien tu semana.</p>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        ¿Cuál ha sido tu momento más positivo de esta semana?
                                    </label>
                                    <textarea
                                        value={answers.positive_moment}
                                        onChange={e => handleChange('positive_moment', e.target.value)}
                                        className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none h-24 resize-none text-sm"
                                        placeholder="Ej: He podido dar un paseo largo, he dormido bien una noche, he cocinado algo que me apetecía, me he sentido con fuerzas..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-slate-400" /> ¿Hay algo que quieras contarle a tu coach?
                                    </label>
                                    <textarea
                                        value={answers.coach_message}
                                        onChange={e => handleChange('coach_message', e.target.value)}
                                        className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none h-24 resize-none text-sm"
                                        placeholder="Preguntas, preocupaciones, novedades del tratamiento, algo que quieras comentar en la próxima sesión..."
                                    />
                                </div>

                                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                                    <label className="block text-sm font-bold text-slate-700 mb-3">¿Cómo valoras tu semana en general?</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={answers.weekly_rating}
                                            onChange={e => handleChange('weekly_rating', parseInt(e.target.value))}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                        />
                                        <span className="text-2xl font-black text-emerald-600 w-10 text-center shrink-0">{answers.weekly_rating}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1 mt-1">
                                        <span>1 (Semana muy difícil)</span>
                                        <span>10 (Semana muy buena)</span>
                                    </div>
                                </div>

                                {/* Peso — al final, opcional */}
                                <div className="border border-slate-200 rounded-xl p-4">
                                    <label className="block text-sm font-medium text-slate-500 mb-1 flex items-center gap-2">
                                        <Scale className="w-4 h-4 text-slate-400" /> Peso (opcional)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={answers.weight}
                                        onChange={e => handleChange('weight', e.target.value)}
                                        className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-300 outline-none text-slate-700"
                                        placeholder="Ej: 68.5 kg"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        Solo si quieres registrarlo. El peso puede variar mucho durante el tratamiento y no es el indicador más importante.
                                    </p>
                                </div>

                                <div className="bg-emerald-50 p-4 rounded-xl flex items-start gap-3">
                                    <HelpCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                                    <p className="text-sm text-emerald-800">
                                        Al enviar este reporte, tu coach recibirá una notificación. ¡Gracias por dedicar este tiempo a tu bienestar!
                                    </p>
                                </div>

                                <div className="flex justify-between pt-2">
                                    <button onClick={() => setStep(2)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">
                                        Atrás
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 flex items-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Enviando...' : <><Save className="w-4 h-4" /> Enviar Check-in</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
