import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Ruler, Plus, TrendingDown, TrendingUp, X, Minus } from 'lucide-react';

interface Measurement {
    id: string;
    abdominal_cm: number | null;
    arm_cm: number | null;
    thigh_cm: number | null;
    hip_cm: number | null;
    chest_cm: number | null;
    measured_at: string;
}

interface BodyMeasurementsCardProps {
    clientId: string;
    initialAbdominal?: number;
    initialArm?: number;
    initialThigh?: number;
}

export function BodyMeasurementsCard({ clientId, initialAbdominal, initialArm, initialThigh }: BodyMeasurementsCardProps) {
    const [history, setHistory] = useState<Measurement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [abdominal, setAbdominal] = useState('');
    const [arm, setArm] = useState('');
    const [thigh, setThigh] = useState('');
    const [hip, setHip] = useState('');
    const [chest, setChest] = useState('');

    useEffect(() => {
        loadHistory();
    }, [clientId]);

    const loadHistory = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('body_measurements')
            .select('*')
            .eq('client_id', clientId)
            .order('measured_at', { ascending: false })
            .limit(20);
        if (data) setHistory(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!abdominal && !arm && !thigh && !hip && !chest) return;

        setIsSubmitting(true);
        try {
            const today = new Date().toISOString().split('T')[0];

            const { error } = await supabase
                .from('body_measurements')
                .upsert({
                    client_id: clientId,
                    measured_at: today,
                    abdominal_cm: abdominal ? parseFloat(abdominal) : null,
                    arm_cm: arm ? parseFloat(arm) : null,
                    thigh_cm: thigh ? parseFloat(thigh) : null,
                    hip_cm: hip ? parseFloat(hip) : null,
                    chest_cm: chest ? parseFloat(chest) : null
                }, { onConflict: 'client_id,measured_at' });

            if (error) throw error;

            loadHistory();
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            console.error('Error saving measurements:', error);
            alert('Error al guardar las medidas');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setAbdominal('');
        setArm('');
        setThigh('');
        setHip('');
        setChest('');
    };

    // Get latest and calculate differences
    const latest = history[0];
    const oldest = history.length > 1 ? history[history.length - 1] : null;

    const calculateDiff = (current: number | null | undefined, initial: number | null | undefined) => {
        if (current == null || initial == null) return null;
        return current - initial;
    };

    const MeasurementStat = ({ label, current, initial, icon }: { label: string; current: number | null | undefined; initial: number | null | undefined; icon: string }) => {
        const diff = calculateDiff(current, initial);
        const hasDiff = diff !== null && diff !== 0;

        return (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                    <span className="text-xl">{icon}</span>
                    <div>
                        <p className="text-xs text-slate-400 font-medium uppercase">{label}</p>
                        <p className="text-lg font-bold text-slate-900">
                            {current ?? '--'} <span className="text-xs text-slate-400 font-normal">cm</span>
                        </p>
                    </div>
                </div>
                {hasDiff && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${diff! < 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                        {diff! < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                        {Math.abs(diff!).toFixed(1)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-violet-200">
                            <Ruler className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Medidas</h3>
                            <p className="text-sm text-slate-500">Evolución corporal</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center hover:bg-violet-100 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {/* Measurements List */}
                <div className="space-y-3">
                    <MeasurementStat
                        label="Abdomen"
                        current={latest?.abdominal_cm}
                        initial={oldest?.abdominal_cm || initialAbdominal}
                        icon="🎯"
                    />
                    <MeasurementStat
                        label="Brazo"
                        current={latest?.arm_cm}
                        initial={oldest?.arm_cm || initialArm}
                        icon="💪"
                    />
                    <MeasurementStat
                        label="Muslo"
                        current={latest?.thigh_cm}
                        initial={oldest?.thigh_cm || initialThigh}
                        icon="🦵"
                    />
                    {latest?.hip_cm && (
                        <MeasurementStat
                            label="Cadera"
                            current={latest?.hip_cm}
                            initial={oldest?.hip_cm}
                            icon="🍑"
                        />
                    )}
                </div>

                {/* Last Update */}
                {latest && (
                    <p className="mt-4 text-xs text-slate-400 text-center">
                        Última actualización: {new Date(latest.measured_at).toLocaleDateString('es-ES')}
                    </p>
                )}

                {!latest && (
                    <div className="py-8 text-center text-slate-400 text-sm">
                        Registra tus medidas para ver la evolución
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-slate-900">Registrar Medidas</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <p className="text-sm text-slate-500 mb-4">
                                Registra los perímetros que desees. No es necesario completar todos.
                            </p>

                            {/* Input Fields */}
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        🎯 Perímetro Abdominal (cm)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="Ej: 95.5"
                                        className="w-full py-3 px-4 border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                                        value={abdominal}
                                        onChange={e => setAbdominal(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        💪 Perímetro Brazo (cm)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="Ej: 32"
                                        className="w-full py-3 px-4 border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                                        value={arm}
                                        onChange={e => setArm(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        🦵 Perímetro Muslo (cm)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="Ej: 55"
                                        className="w-full py-3 px-4 border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                                        value={thigh}
                                        onChange={e => setThigh(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        🍑 Perímetro Cadera (cm)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="Ej: 100"
                                        className="w-full py-3 px-4 border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                                        value={hip}
                                        onChange={e => setHip(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        👕 Perímetro Pecho (cm)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="Ej: 95"
                                        className="w-full py-3 px-4 border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                                        value={chest}
                                        onChange={e => setChest(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="space-y-3">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || (!abdominal && !arm && !thigh && !hip && !chest)}
                                    className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-2xl shadow-lg shadow-violet-200 hover:shadow-xl disabled:opacity-50 transition-all active:scale-95"
                                >
                                    {isSubmitting ? 'Guardando...' : 'Guardar Medidas'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                                    className="w-full py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
