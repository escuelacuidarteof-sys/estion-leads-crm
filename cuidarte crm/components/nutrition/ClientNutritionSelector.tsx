import React, { useState, useEffect } from 'react';
import {
    Zap,
    Check,
    ChevronRight,
    Search,
    AlertCircle,
    Clock,
    Flame,
    Tag
} from 'lucide-react';
import { NutritionPlan, User, ClientNutritionAssignment } from '../../types';
import { nutritionService } from '../../services/nutritionService';

interface ClientNutritionSelectorProps {
    clientId: string;
    currentUser: User;
    onPlanAssigned?: (planId: string) => void;
    // Sugerencias basadas en el perfil actual
    suggestedCalories?: number;
    suggestedType?: string;
}

export function ClientNutritionSelector({
    clientId,
    currentUser,
    onPlanAssigned,
    suggestedCalories,
    suggestedType
}: ClientNutritionSelectorProps) {
    const [plans, setPlans] = useState<NutritionPlan[]>([]);
    const [currentAssignment, setCurrentAssignment] = useState<ClientNutritionAssignment | null>(null);
    const [autoPlan, setAutoPlan] = useState<NutritionPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Load plans first (this usually works)
                const allPlans = await nutritionService.getPlans({ status: 'published' });
                setPlans(allPlans);

                // Try to load assignment (this might fail due to RLS)
                try {
                    const assignment = await nutritionService.getAssignmentByClient(clientId);
                    setCurrentAssignment(assignment);

                    // If no explicit assignment, look for an automatic plan
                    if (!assignment) {
                        const auto = await nutritionService.getAutoPlanForClient(clientId);
                        setAutoPlan(auto);
                    } else {
                        setAutoPlan(null);
                    }
                } catch (assignmentErr: any) {
                    console.error('Error loading assignment (may need to run fix_nutrition_rls.sql):', assignmentErr);
                    // Don't block the entire UI, just log it
                    setCurrentAssignment(null);

                    // Fallback to auto plan even on error if possible
                    try {
                        const auto = await nutritionService.getAutoPlanForClient(clientId);
                        setAutoPlan(auto);
                    } catch (e) {
                        console.error('Error loading auto plan:', e);
                    }
                }
            } catch (err: any) {
                console.error('Error loading nutrition data:', err);
                setError(err.message || 'Error al cargar planes');
            } finally {
                setLoading(false);
            }
        };
        if (clientId) loadData();
    }, [clientId]);

    const handleAssign = async (planId: string) => {
        try {
            setIsAssigning(true);
            setError(null);
            await nutritionService.assignPlanToClient(clientId, planId, currentUser.id);
            const newAssignment = await nutritionService.getAssignmentByClient(clientId);
            setCurrentAssignment(newAssignment);
            if (onPlanAssigned) onPlanAssigned(planId);
        } catch (err) {
            console.error('Error assigning plan:', err);
        } finally {
            setIsAssigning(false);
        }
    };

    const handleUnassign = async () => {
        try {
            setIsAssigning(true);
            await nutritionService.unassignClient(clientId);
            setCurrentAssignment(null);
            if (onPlanAssigned) onPlanAssigned('');
        } catch (err) {
            console.error('Error unassigning plan:', err);
        } finally {
            setIsAssigning(false);
        }
    };

    const filteredPlans = plans.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Sorting: Suggested plans first
    const sortedPlans = [...filteredPlans].sort((a, b) => {
        const aMatch = (suggestedCalories && a.target_calories === suggestedCalories) || (suggestedType && a.tags?.includes(suggestedType.toLowerCase()));
        const bMatch = (suggestedCalories && b.target_calories === suggestedCalories) || (suggestedType && b.tags?.includes(suggestedType.toLowerCase()));
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return 0;
    });

    if (loading) return <div className="animate-pulse space-y-3">
        <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
        <div className="h-20 bg-slate-50 rounded-xl w-full"></div>
    </div>;

    if (error) return (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            <div>
                <p className="text-sm text-rose-700 font-medium">Error al cargar planes</p>
                <p className="text-[10px] text-rose-500">{error}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            {currentAssignment ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                            <Check className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Plan Asignado Manualmente</p>
                            <h4 className="text-slate-800 font-bold">{currentAssignment.plan_name}</h4>
                            <p className="text-[10px] text-emerald-600 font-medium">Desde el {new Date(currentAssignment.assigned_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleUnassign}
                        disabled={isAssigning}
                        className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                        Quitar asignación
                    </button>
                </div>
            ) : autoPlan ? (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Asignación Automática</p>
                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-black rounded uppercase">Activo</span>
                            </div>
                            <h4 className="text-slate-800 font-bold">{autoPlan.name}</h4>
                            <p className="text-[10px] text-blue-600 font-medium">Basado en tipo de dieta y calorías</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <div>
                        <p className="text-sm text-amber-700 font-medium">Sin plan asignado</p>
                        <p className="text-[10px] text-amber-600 mt-0.5">No se encontró un plan manual ni automático para este perfil.</p>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar plan por nombre o kcal..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>

                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {sortedPlans.map(plan => {
                        const isSuggested = (suggestedCalories && plan.target_calories === suggestedCalories) || (suggestedType && plan.tags?.includes(suggestedType.toLowerCase()));
                        const isCurrent = currentAssignment?.plan_id === plan.id;

                        return (
                            <button
                                key={plan.id}
                                onClick={() => !isCurrent && handleAssign(plan.id)}
                                disabled={isAssigning || isCurrent}
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${isCurrent
                                    ? 'border-emerald-500 bg-emerald-50/30'
                                    : isSuggested
                                        ? 'border-blue-200 bg-white hover:border-blue-400 hover:shadow-md'
                                        : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isCurrent ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'
                                        }`}>
                                        {isCurrent ? <Check className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-slate-700">{plan.name}</span>
                                            {isSuggested && (
                                                <span className="text-[8px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded uppercase">Recomendado</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                                <Flame className="w-3 h-3 text-orange-400" />
                                                {plan.target_calories} kcal
                                            </div>
                                            {plan.tags && plan.tags.length > 0 && (
                                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                                    <Tag className="w-3 h-3" />
                                                    {plan.tags.slice(0, 2).join(', ')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {!isCurrent && <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />}
                            </button>
                        );
                    })}

                    {sortedPlans.length === 0 && (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            No se encontraron planes que coincidan.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
