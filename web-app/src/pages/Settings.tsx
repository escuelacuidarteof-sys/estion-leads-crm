import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ScoringRule } from '../types/database';
import { Plus, Trash2, Save, AlertCircle } from 'lucide-react';

export default function Settings() {
    const [rules, setRules] = useState<ScoringRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // New rule form state
    const [newRule, setNewRule] = useState<Partial<ScoringRule>>({
        field_name: 'interest',
        value_match: '',
        points: 0
    });

    const fetchRules = async () => {
        const { data } = await supabase.from('scoring_rules').select('*').order('created_at', { ascending: true });
        setRules(data || []);
    };

    const fetchData = async () => {
        setLoading(true);
        await fetchRules();
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddRule = async () => {
        if (!newRule.value_match) return;
        await supabase.from('scoring_rules').insert([{
            field_name: newRule.field_name,
            value_match: newRule.value_match,
            points: Number(newRule.points)
        }]);
        setNewRule({ field_name: 'interest', value_match: '', points: 0 });
        fetchRules();
    };

    const handleDeleteRule = async (id: string) => {
        await supabase.from('scoring_rules').delete().eq('id', id);
        fetchRules();
    };

    const availableFields = [
        { value: 'interest', label: 'Interés' },
        { value: 'situacion', label: 'Situación (Prioridad)' },
        { value: 'disponibilidad', label: 'Disponibilidad' },
        { value: 'perdida_peso', label: 'Pérdida de Peso' },
        { value: 'estadio', label: 'Estadio' },
        { value: 'tipo_cancer', label: 'Tipo de Cáncer' },
        { value: 'downloaded_kit', label: 'Descargó Guía' },
        { value: 'age', label: 'Edad' },
        { value: 'sex', label: 'Sexo' },
        { value: 'country', label: 'País' },
    ];

    if (loading) return <div className="text-center p-10">Cargando reglas...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Save size={20} className="text-blue-600" />
                    Añadir Nueva Regla
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Campo</label>
                        <select
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                            value={newRule.field_name}
                            onChange={(e) => setNewRule({ ...newRule, field_name: e.target.value })}
                        >
                            {availableFields.map(f => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Valor exacto (Coincidencia)</label>
                        <input
                            type="text"
                            placeholder="Ej. Muy interesado/a"
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                            value={newRule.value_match}
                            onChange={(e) => setNewRule({ ...newRule, value_match: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Puntos</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                value={newRule.points}
                                onChange={(e) => setNewRule({ ...newRule, points: Number(e.target.value) })}
                            />
                            <button
                                onClick={handleAddRule}
                                className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2 text-sm">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800">Reglas Activas</h3>
                </div>
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puntos</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {rules.map((rule) => (
                            <tr key={rule.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                    {availableFields.find(f => f.value === rule.field_name)?.label || rule.field_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {rule.value_match}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${rule.points > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {rule.points > 0 ? '+' : ''}{rule.points} pts
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleDeleteRule(rule.id)}
                                        className="text-red-400 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
