import React from 'react';
import { Utensils, Apple, Clock, Scale, ShoppingBag, Brain, AlertCircle } from 'lucide-react';

interface Props {
    formData: any;
    updateField: (field: string, value: any) => void;
    toggleArrayField: (field: string, value: string) => void;
}

export function NutritionStep({ formData, updateField, toggleArrayField }: Props) {
    const dietTypes = ['Omnívora', 'Vegetariana', 'Vegana', 'Pescetariana', 'Otras'];
    const regularFoodsList = ['Carnes', 'Pescados', 'Huevos', 'Lácteos', 'Legumbres', 'Frutos secos', 'Verduras', 'Frutas', 'Fiambres'];
    const psychologyList = [
        'Siento miedo a comer ciertos alimentos (ej. miedo a que "alimenten el tumor")',
        'Siento culpa cuando como algo considerado "no saludable"',
        'Tener un atracón o varios a la semana',
        'Sentir que cuando empiezo a comer no puedo parar',
        'Comer cuando me siento estresado, con ansiedad, miedo o tristeza',
        'Ninguna de las anteriores'
    ];

    const mealSchedules = [
        { key: 'breakfast', label: 'Desayuno' },
        { key: 'midMorning', label: 'Media mañana' },
        { key: 'lunch', label: 'Almuerzo / Comida' },
        { key: 'snack', label: 'Merienda' },
        { key: 'dinner', label: 'Cena' }
    ];

    return (
        <div className="space-y-10">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Bloques 6 y 7 · Nutrición y Psicología</h3>
                <p className="text-slate-600">Comer sin estrés es fundamental. Ayúdanos a entender tu logística real.</p>
            </div>

            {/* Hábitos Básicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Tipo de alimentación Habitual</label>
                    <select
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none"
                        value={formData.dietType}
                        onChange={(e) => updateField('dietType', e.target.value)}
                    >
                        <option value="">Seleccionar...</option>
                        {dietTypes.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Alergias o Intolerancias *</label>
                    <input
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none"
                        value={formData.foodAllergies}
                        onChange={(e) => updateField('foodAllergies', e.target.value)}
                        placeholder="Gluten, lactosa, etc. o 'Ninguna'"
                    />
                </div>
            </div>

            {/* Alimentos Regulares */}
            <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700 font-bold">Consumidos en tu día a día (2 veces/semana o más)</label>
                <div className="flex flex-wrap gap-2">
                    {regularFoodsList.map(food => (
                        <label key={food} className={`px-4 py-2 border rounded-full cursor-pointer transition-all ${formData.regularFoods.includes(food) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'}`}>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={formData.regularFoods.includes(food)}
                                onChange={() => toggleArrayField('regularFoods', food)}
                            />
                            <span className="text-sm font-medium">{food}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Alimentos NO deseados */}
            <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">¿Qué NO te gustaría ver en tu plan dietético? *</label>
                <textarea
                    className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-200 outline-none"
                    value={formData.unwantedFoods}
                    onChange={(e) => updateField('unwantedFoods', e.target.value)}
                    placeholder="Alimentos que no te gusten o te den asco por el tratamiento..."
                    rows={2}
                />
            </div>

            {/* Logística */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">¿Sueles cocinar tú mism@?</label>
                    <select
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white"
                        value={formData.cooksSelf}
                        onChange={(e) => updateField('cooksSelf', e.target.value)}
                    >
                        <option value="">Seleccionar...</option>
                        <option value="si">Sí</option>
                        <option value="no">No</option>
                        <option value="a_veces">A veces</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Comidas al día</label>
                    <input
                        type="number"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white"
                        value={formData.mealsPerDay || ''}
                        onChange={(e) => updateField('mealsPerDay', parseInt(e.target.value))}
                    />
                </div>
            </div>

            {/* Horarios */}
            <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Horarios de comidas (Aprox)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {mealSchedules.map(m => (
                        <div key={m.key}>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{m.label}</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                                placeholder="00:00"
                                value={formData.mealSchedules?.[m.key] || ''}
                                onChange={(e) => updateField('mealSchedules', { ...formData.mealSchedules, [m.key]: e.target.value })}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Raciones y Alcohol */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">Gestión de raciones</label>
                    <div className="space-y-2">
                        <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-emerald-50 transition-all">
                            <input
                                type="radio"
                                name="weighFood"
                                value="exacto"
                                checked={formData.weighFoodPreference === 'exacto'}
                                onChange={(e) => updateField('weighFoodPreference', e.target.value)}
                                className="text-emerald-600 w-4 h-4"
                            />
                            <div className="text-xs">
                                <span className="font-bold block text-slate-700 text-sm">Pesar la comida (Exacto)</span>
                                <span className="text-slate-500">Prefiero ser exacto/a en mis raciones.</span>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-emerald-50 transition-all">
                            <input
                                type="radio"
                                name="weighFood"
                                value="visual"
                                checked={formData.weighFoodPreference === 'visual'}
                                onChange={(e) => updateField('weighFoodPreference', e.target.value)}
                                className="text-emerald-600 w-4 h-4"
                            />
                            <div className="text-xs">
                                <span className="font-bold block text-slate-700 text-sm">Medidas Visuales (Relativo)</span>
                                <span className="text-slate-500">Vasos, platos, puñados. Menos estrés.</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">Hábitos Tóxicos</label>
                    <div className="space-y-2">
                        <select
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg"
                            value={formData.smokingStatus}
                            onChange={(e) => updateField('smokingStatus', e.target.value)}
                        >
                            <option value="">¿Fumas?</option>
                            <option value="no">No fumo</option>
                            <option value="si">Sí, fumo actualmente</option>
                            <option value="dejado">Lo dejé hace poco</option>
                        </select>
                        <input
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg"
                            placeholder="Alcohol a la semana (Ej: Nada, 2 cervezas...)"
                            value={formData.alcoholPerWeek}
                            onChange={(e) => updateField('alcoholPerWeek', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Psicología Alimentaria (Bloque 7) */}
            <div className="pt-8 border-t">
                <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-emerald-600" />
                    Psicología y Relación con la Comida
                </h4>
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700 mb-3">¿Te ha sucedido algo de esto recientemente? *</label>
                    <div className="grid grid-cols-1 gap-2">
                        {psychologyList.map(item => (
                            <label key={item} className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${formData.psychologySituations.includes(item) ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-200 hover:border-emerald-300'}`}>
                                <input
                                    type="checkbox"
                                    checked={formData.psychologySituations.includes(item)}
                                    onChange={() => toggleArrayField('psychologySituations', item)}
                                    className="w-5 h-5 mt-0.5 text-emerald-600"
                                />
                                <span className="text-sm text-slate-700 font-medium leading-tight">{item}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recordatorio 24h */}
            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    RECORDATORIO 24 HORAS: ¿Qué comiste exactamente ayer?
                </label>
                <textarea
                    className="w-full p-4 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-200 outline-none bg-white"
                    placeholder="Detalla desayuno, media mañana, comida, merienda y cena de ayer..."
                    value={formData.last24hMeals}
                    onChange={(e) => updateField('last24hMeals', e.target.value)}
                    rows={4}
                />
            </div>
        </div>
    );
}
