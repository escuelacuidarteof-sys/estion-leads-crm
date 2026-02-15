import React, { useEffect, useState } from 'react';
import {
    ArrowLeft,
    Utensils,
    Coffee,
    Sun,
    Moon,
    Cookie,
    ChevronDown,
    ChevronUp,
    Flame,
    AlertCircle,
    ExternalLink,
    FileText,
    Calendar,
    BookOpen,
    CalendarDays,
    ShoppingCart,
    Download,
    Clock
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { nutritionService } from '../../services/nutritionService';
import { Client, NutritionPlan, NutritionRecipe, RecipeCategory, ClientNutritionOverride } from '../../types';
import { RecipeBookCard } from './RecipeBookCard';
import { RecipeDetailModal } from './RecipeDetailModal';
import { WeeklyPlanner } from './WeeklyPlanner';
import { ShoppingList } from './ShoppingList';
import { NutritionPdfGenerator } from './NutritionPdfGenerator';

interface NutritionViewProps {
    client: Client;
    onBack: () => void;
}

type TabType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
type NutritionSubView = 'recipes' | 'planner' | 'shopping';

const TABS: { id: TabType; label: string; icon: React.FC<any> }[] = [
    { id: 'breakfast', label: 'Desayunos', icon: Coffee },
    { id: 'lunch', label: 'Comidas', icon: Sun },
    { id: 'dinner', label: 'Cenas', icon: Moon },
    { id: 'snack', label: 'Snacks', icon: Cookie }
];

interface RecipeWithOverride extends NutritionRecipe {
    override?: ClientNutritionOverride;
}

export function NutritionView({ client, onBack }: NutritionViewProps) {
    const [plan, setPlan] = useState<NutritionPlan | null>(null);
    const [recipes, setRecipes] = useState<RecipeWithOverride[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('breakfast');
    const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
    const [usingLegacy, setUsingLegacy] = useState(false);
    const [pendingApproval, setPendingApproval] = useState(false);
    const [nutritionView, setNutritionView] = useState<NutritionSubView>('recipes');
    const [selectedRecipeDetail, setSelectedRecipeDetail] = useState<RecipeWithOverride | null>(null);

    // Legacy food plans state (for fallback)
    const [legacyPlans, setLegacyPlans] = useState<any[]>([]);

    useEffect(() => {
        const fetchNutrition = async () => {
            try {
                setLoading(true);

                // First, try to get structured nutrition plan
                const { plan: nutritionPlan, recipes: nutritionRecipes, overrides, pendingApproval: isPending } =
                    await nutritionService.getClientPlanWithRecipes(client.id);

                if (isPending) {
                    setPendingApproval(true);
                    return;
                }

                if (nutritionPlan && (nutritionRecipes.length > 0 || nutritionPlan.intro_content || nutritionPlan.breakfast_content)) {
                    setPlan(nutritionPlan);
                    // Apply overrides to recipes
                    const recipesWithOverrides = nutritionRecipes.map(r => ({
                        ...nutritionService.applyOverride(r, overrides.get(r.id)),
                        override: overrides.get(r.id)
                    }));
                    setRecipes(recipesWithOverrides);
                    setUsingLegacy(false);
                } else {
                    // Fallback to legacy food_plans system
                    setUsingLegacy(true);
                    await fetchLegacyPlans();
                }
            } catch (err) {
                console.error('Error fetching nutrition:', err);
                // Fallback to legacy
                setUsingLegacy(true);
                await fetchLegacyPlans();
            } finally {
                setLoading(false);
            }
        };

        const fetchLegacyPlans = async () => {
            if (!client.nutrition?.assigned_nutrition_type || !client.nutrition?.assigned_calories) {
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('food_plans')
                    .select('*')
                    .eq('type', client.nutrition.assigned_nutrition_type)
                    .order('year', { ascending: false })
                    .order('month_number', { ascending: false })
                    .order('fortnight_number', { ascending: false });

                if (data) {
                    const now = new Date();
                    const currentYear = now.getFullYear();
                    const currentMonth = now.getMonth() + 1;
                    const currentDay = now.getDate();
                    const currentFortnight = currentDay <= 15 ? 1 : 2;

                    const validPlans = data.filter(plan => {
                        // Calories check
                        if (Number(plan.calories) !== Number(client.nutrition.assigned_calories)) {
                            return false;
                        }

                        // Timing check
                        let isReleased = false;
                        if (plan.year < currentYear) isReleased = true;
                        else if (plan.year === currentYear) {
                            if (plan.month_number < currentMonth) isReleased = true;
                            else if (plan.month_number === currentMonth) {
                                isReleased = plan.fortnight_number <= currentFortnight;
                            }
                        }

                        if (plan.year === 2025 || (plan.year === currentYear && plan.month_number === currentMonth)) {
                            isReleased = true;
                        }

                        return isReleased;
                    });

                    setLegacyPlans(validPlans);
                }
            } catch (err) {
                console.error('Error fetching legacy plans:', err);
            }
        };

        fetchNutrition();
    }, [client.id, client.nutrition]);

    const getRecipesByCategory = (category: RecipeCategory): RecipeWithOverride[] => {
        return recipes
            .filter(r => r.category === category)
            .sort((a, b) => a.position - b.position);
    };

    // Per-tab: priorizar recetas estructuradas sobre bloques de texto
    const hasRecipesForTab = (tab: RecipeCategory) => getRecipesByCategory(tab).length > 0;
    const hasBlockContentForTab = (tab: TabType) => !!getBlockContent(tab)?.trim();

    // Plan es de tipo "bloque" si NO tiene recetas estructuradas
    const isBlockPlan = recipes.length === 0 && plan != null && (
        !!plan.breakfast_content?.trim() || !!plan.lunch_content?.trim() ||
        !!plan.dinner_content?.trim() || !!plan.snack_content?.trim() ||
        !!plan.intro_content?.trim()
    );

    const getBlockContent = (tab: TabType) => {
        if (!plan) return '';
        switch (tab) {
            case 'breakfast': return plan.breakfast_content;
            case 'lunch': return plan.lunch_content;
            case 'dinner': return plan.dinner_content;
            case 'snack': return plan.snack_content;
            default: return '';
        }
    };

    const toggleRecipe = (recipeId: string) => {
        setExpandedRecipe(expandedRecipe === recipeId ? null : recipeId);
    };

    // Pending approval view
    if (pendingApproval && !loading) {
        return (
            <div className="min-h-screen bg-gray-50 pb-12">
                <div className="bg-white shadow-sm sticky top-0 z-10">
                    <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Utensils className="w-6 h-6 text-green-600" />
                            Tu Nutrici&oacute;n
                        </h1>
                    </div>
                </div>
                <div className="max-w-4xl mx-auto px-4 py-12">
                    <div className="bg-white p-8 sm:p-12 rounded-2xl text-center border border-amber-200 shadow-sm">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
                            <Clock className="w-8 h-8 text-amber-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-3">Tu plan nutricional est&aacute; siendo preparado</h2>
                        <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                            Tu coach est&aacute; revisando tu perfil para personalizar tu plan de alimentaci&oacute;n.
                            Te notificaremos cuando est&eacute; listo.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Legacy view for backward compatibility
    if (usingLegacy) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const currentFortnight = now.getDate() <= 15 ? 1 : 2;

        const exactCurrentPlan = legacyPlans.find(p =>
            (p.year === currentYear || p.year === currentYear - 1 || p.year === 2025) &&
            p.month_number === currentMonth &&
            p.fortnight_number === currentFortnight
        );

        const historyPlans = legacyPlans.filter(p => p.id !== exactCurrentPlan?.id);

        return (
            <div className="min-h-screen bg-gray-50 pb-12">
                {/* Header */}
                <div className="bg-white shadow-sm sticky top-0 z-10">
                    <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Utensils className="w-6 h-6 text-green-600" />
                            Tu Nutrición
                        </h1>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                    {/* Plan Actual */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-purple-600" />
                            Plan de esta Quincena
                        </h2>

                        {loading ? (
                            <div className="animate-pulse flex space-x-4 p-6 bg-white rounded-xl">
                                <div className="rounded-full bg-slate-200 h-10 w-10"></div>
                                <div className="flex-1 space-y-6 py-1">
                                    <div className="h-2 bg-slate-200 rounded"></div>
                                </div>
                            </div>
                        ) : exactCurrentPlan ? (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase rounded-full tracking-wider">
                                            Vigente
                                        </span>
                                        <span className="text-sm text-gray-500 font-medium">
                                            {exactCurrentPlan.month_label} - {exactCurrentPlan.fortnight_label}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{exactCurrentPlan.name}</h3>
                                    <div className="flex gap-4 text-sm text-gray-600">
                                        <span>🔥 {exactCurrentPlan.calories} kcal</span>
                                        <span>🥗 {exactCurrentPlan.type}</span>
                                    </div>
                                </div>

                                <a
                                    href={exactCurrentPlan.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full md:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 transition-transform hover:scale-105"
                                >
                                    <ExternalLink className="w-5 h-5" />
                                    Abrir Plan
                                </a>
                            </div>
                        ) : (
                            <div className="bg-white p-6 sm:p-8 rounded-2xl text-center border-2 border-dashed border-gray-200">
                                <Utensils className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <h3 className="text-gray-800 font-bold mb-2">No tienes plan para la quincena actual</h3>
                                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                    No hemos encontrado una planificación activa para esta quincena.
                                </p>

                                <div className="bg-gray-50 rounded-xl p-4 text-xs sm:text-sm text-left mx-auto max-w-sm border border-gray-200 text-gray-600">
                                    <p className="font-semibold mb-2 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-orange-500" />
                                        Buscando plan con:
                                    </p>
                                    <ul className="space-y-1 list-disc pl-5">
                                        <li>Tipo: <b>{client.nutrition?.assigned_nutrition_type}</b></li>
                                        <li>Calorías: <b>{client.nutrition?.assigned_calories} kcal</b></li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Historial */}
                    {historyPlans.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-gray-600" />
                                Historial Disponible
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {historyPlans.map((p) => (
                                    <div key={p.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                    {p.month_label}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {p.fortnight_label}
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-gray-800 mb-1">{p.name}</h4>
                                            <p className="text-xs text-gray-500 mb-4">{p.calories} kcal • {p.type}</p>
                                        </div>

                                        <a
                                            href={p.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full py-2 border border-green-600 text-green-600 font-semibold rounded-lg hover:bg-green-50 flex items-center justify-center gap-2 text-sm transition-colors"
                                        >
                                            Ver Plan
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // New structured nutrition view
    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-10 print:hidden">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Utensils className="w-6 h-6 text-green-600" />
                            Tu Plan Nutricional
                        </h1>
                    </div>
                    {plan && !loading && (
                        <div className="flex items-center gap-2">
                            <NutritionPdfGenerator
                                client={client}
                                plan={plan}
                                recipes={recipes}
                                planId={plan.id}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6 print:hidden">
                {loading ? (
                    <div className="space-y-4">
                        <div className="animate-pulse h-24 bg-white rounded-2xl"></div>
                        <div className="animate-pulse h-12 bg-white rounded-xl"></div>
                        <div className="animate-pulse h-64 bg-white rounded-2xl"></div>
                    </div>
                ) : !plan ? (
                    <div className="bg-white p-8 rounded-2xl text-center border-2 border-dashed border-gray-200">
                        <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-800 mb-2">
                            No tienes un plan asignado
                        </h3>
                        <p className="text-gray-500">
                            Tu coach te asignará un plan nutricional personalizado próximamente.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Plan Info */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase rounded-full tracking-wider">
                                    Tu Plan
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h2>
                            {plan.description && (
                                <p className="text-gray-600 mb-3">{plan.description}</p>
                            )}
                            <div className="flex flex-wrap gap-3 text-sm">
                                {plan.target_calories && (
                                    <span className="flex items-center gap-1 px-3 py-1 bg-white rounded-full text-orange-600 font-medium">
                                        <Flame className="w-4 h-4" />
                                        {plan.target_calories} kcal/día
                                    </span>
                                )}
                                {!isBlockPlan && (
                                    <span className="px-3 py-1 bg-white rounded-full text-gray-600">
                                        {recipes.length} recetas
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Instructions Section */}
                        {plan.instructions && (
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-3">
                                    <FileText className="w-5 h-5 text-indigo-500" />
                                    Instrucciones y Recomendaciones
                                </h3>
                                <div className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                                    {plan.instructions}
                                </div>
                            </div>
                        )}

                        {/* Intro Content for Block Plans */}
                        {isBlockPlan && plan.intro_content && (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 shadow-sm">
                                <h3 className="flex items-center gap-2 text-lg font-bold text-emerald-800 mb-3">
                                    <FileText className="w-5 h-5" />
                                    Introducción al Plan
                                </h3>
                                <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                                    {plan.intro_content}
                                </div>
                            </div>
                        )}

                        {/* Sub-Navigation for structured plans with recipes */}
                        {!isBlockPlan && recipes.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="flex border-b border-gray-200">
                                    {([
                                        { id: 'recipes' as NutritionSubView, label: 'Recetas', icon: BookOpen },
                                        { id: 'planner' as NutritionSubView, label: 'Planificador', icon: CalendarDays },
                                        { id: 'shopping' as NutritionSubView, label: 'Lista de la Compra', icon: ShoppingCart }
                                    ]).map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setNutritionView(tab.id)}
                                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-colors ${nutritionView === tab.id
                                                ? 'border-green-600 text-green-600 bg-green-50/50'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            <tab.icon className="w-4 h-4" />
                                            <span className="hidden sm:inline">{tab.label}</span>
                                            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Content based on sub-view */}
                        {!isBlockPlan && recipes.length > 0 && nutritionView === 'planner' ? (
                            <WeeklyPlanner recipes={recipes} planId={plan.id} />
                        ) : !isBlockPlan && recipes.length > 0 && nutritionView === 'shopping' ? (
                            <ShoppingList recipes={recipes} planId={plan.id} />
                        ) : (
                            <>
                                {/* Category Tabs */}
                                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                    <div className="flex overflow-x-auto border-b border-gray-200">
                                        {TABS.map(tab => {
                                            const count = getRecipesByCategory(tab.id).length;
                                            return (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setActiveTab(tab.id)}
                                                    className={`flex-1 min-w-[100px] flex flex-col items-center gap-1 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                                        ? 'border-green-600 text-green-600 bg-green-50/50'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <tab.icon className="w-5 h-5" />
                                                    <span>{tab.label}</span>
                                                    {count > 0 && (
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-gray-100 text-gray-500'
                                                            }`}>
                                                            {count} opciones
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Recipe Content */}
                                <div className="space-y-4">
                                    {hasRecipesForTab(activeTab as RecipeCategory) ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {getRecipesByCategory(activeTab).map((recipe) => (
                                                <RecipeBookCard
                                                    key={recipe.id}
                                                    recipe={recipe}
                                                    onClick={() => setSelectedRecipeDetail(recipe)}
                                                />
                                            ))}
                                        </div>
                                    ) : hasBlockContentForTab(activeTab) ? (
                                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[200px]">
                                            <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-lg">
                                                {getBlockContent(activeTab)}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white p-8 rounded-xl text-center border border-gray-200">
                                            <p className="text-gray-500">
                                                No hay recetas de {TABS.find(t => t.id === activeTab)?.label.toLowerCase()} disponibles.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Recipe Detail Modal */}
                        {selectedRecipeDetail && (
                            <RecipeDetailModal
                                recipe={selectedRecipeDetail}
                                onClose={() => setSelectedRecipeDetail(null)}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* PRINT VIEW (Solo visible al imprimir) */}
            {plan && (
                <div className="hidden print:block bg-white p-8">
                    {/* Print Header */}
                    <div className="flex justify-between items-start border-b-2 border-green-600 pb-6 mb-8">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 mb-2">Escuela Cuid-Arte</h1>
                            <p className="text-slate-500 text-sm">Plan Nutricional Personalizado</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold text-slate-800">{client.firstName} {client.surname}</h2>
                            <p className="text-slate-600 font-medium">{plan.name}</p>
                            {plan.target_calories && (
                                <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                                    {plan.target_calories} kcal / día
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Descripción General */}
                    {plan.description && (
                        <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-sm italic">
                            <strong>Descripción:</strong> {plan.description}
                        </div>
                    )}

                    {/* Instrucciones del Coach */}
                    {plan.instructions && (
                        <div className="mb-8 p-6 bg-white rounded-xl border-2 border-indigo-100 text-slate-800 break-inside-avoid">
                            <h3 className="text-lg font-bold text-indigo-700 mb-3 flex items-center gap-2 uppercase tracking-wider">
                                <FileText className="w-5 h-5" />
                                Instrucciones y Recomendaciones del Coach
                            </h3>
                            <div className="text-sm whitespace-pre-wrap leading-relaxed">
                                {plan.instructions}
                            </div>
                        </div>
                    )}

                    {/* Introducción General (Block Plan) */}
                    {isBlockPlan && plan.intro_content && (
                        <div className="mb-8 p-6 bg-emerald-50 rounded-xl border-2 border-emerald-100 text-slate-800 break-inside-avoid">
                            <h3 className="text-lg font-bold text-emerald-700 mb-3 flex items-center gap-2 uppercase tracking-wider">
                                <Utensils className="w-5 h-5" />
                                Introducción al Plan
                            </h3>
                            <div className="text-sm whitespace-pre-wrap leading-relaxed">
                                {plan.intro_content}
                            </div>
                        </div>
                    )}

                    {/* Print Recipes by Category */}
                    <div className="space-y-8">
                        {isBlockPlan ? (
                            <div className="space-y-8">
                                {TABS.map(tab => {
                                    const content = getBlockContent(tab.id);
                                    if (!content) return null;

                                    return (
                                        <div key={tab.id} className="break-inside-avoid page-break-inside-avoid mb-8">
                                            <h3 className="flex items-center gap-2 text-xl font-bold text-green-800 border-b border-green-200 pb-2 mb-4 uppercase tracking-wide">
                                                <tab.icon className="w-6 h-6" />
                                                {tab.label}
                                            </h3>
                                            <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                                {content}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* PLANIFICADOR SEMANAL (Solo para planes de bloques) */}
                                <div className="break-before-page page-break-before-always mt-8 pt-8 border-t-2 border-dashed border-slate-300">
                                    <div className="text-center mb-8">
                                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-wider mb-2">Planificador Semanal</h2>
                                        <p className="text-slate-500">Organiza tu semana con las opciones que más te gusten</p>
                                    </div>

                                    <div className="border-2 border-slate-800 rounded-lg overflow-hidden">
                                        <div className="grid grid-cols-8 divide-x-2 divide-slate-800 bg-slate-100 border-b-2 border-slate-800">
                                            <div className="p-2 font-bold text-slate-900 text-center text-xs uppercase bg-slate-200">Comida / Día</div>
                                            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => (
                                                <div key={day} className="p-2 font-bold text-slate-900 text-center text-xs uppercase">{day}</div>
                                            ))}
                                        </div>
                                        {['Desayuno', 'Comida', 'Cena', 'Snack'].map((meal, i) => (
                                            <div key={meal} className={`grid grid-cols-8 divide-x-2 divide-slate-800 ${i !== 3 ? 'border-b-2 border-slate-800' : ''}`}>
                                                <div className="p-2 font-bold text-slate-800 text-xs sm:text-sm uppercase bg-slate-50 flex items-center justify-center -rotate-90 sm:rotate-0 h-32 sm:h-auto">
                                                    {meal}
                                                </div>
                                                {[1, 2, 3, 4, 5, 6, 7].map(day => (
                                                    <div key={day} className="h-32 bg-white"></div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Legacy/Recipe Print Loop
                            TABS.map(tab => {
                                const tabRecipes = getRecipesByCategory(tab.id as RecipeCategory);
                                if (tabRecipes.length === 0) return null;

                                return (
                                    <div key={tab.id} className="break-inside-avoid page-break-inside-avoid">
                                        <h3 className="flex items-center gap-2 text-xl font-bold text-green-800 border-b border-green-200 pb-2 mb-4 uppercase tracking-wide">
                                            <tab.icon className="w-6 h-6" />
                                            {tab.label}
                                        </h3>

                                        <div className="grid grid-cols-1 gap-6">
                                            {tabRecipes.map((recipe, index) => (
                                                <div key={recipe.id} className="border border-slate-200 rounded-xl p-5 break-inside-avoid bg-white">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <h4 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                                                            <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs flex items-center justify-center">
                                                                {index + 1}
                                                            </span>
                                                            {recipe.name}
                                                        </h4>
                                                        <div className="flex gap-3 text-xs font-medium text-slate-500">
                                                            {recipe.calories && <span>🔥 {recipe.calories} kcal</span>}
                                                            {recipe.protein && <span>P: {recipe.protein}g</span>}
                                                            {recipe.carbs && <span>C: {recipe.carbs}g</span>}
                                                            {recipe.fat && <span>G: {recipe.fat}g</span>}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-12 gap-6">
                                                        {/* Ingredientes */}
                                                        <div className="col-span-4">
                                                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Ingredientes</p>
                                                            <ul className="text-sm space-y-1">
                                                                {recipe.ingredients.map((ing, i) => (
                                                                    <li key={i} className="text-slate-700 flex items-start gap-1.5">
                                                                        <span className="mt-1.5 w-1 h-1 rounded-full bg-green-500 flex-shrink-0"></span>
                                                                        <span>
                                                                            {ing.name}
                                                                            {ing.quantity > 0 && <span className="text-slate-400 text-xs ml-1">({ing.quantity} {ing.unit})</span>}
                                                                        </span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>

                                                        {/* Preparación */}
                                                        <div className="col-span-8">
                                                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Preparación</p>
                                                            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                                                                {recipe.preparation || 'Sin instrucciones de preparación.'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Override Note */}
                                                    {recipe.override?.notes && (
                                                        <div className="mt-3 pt-3 border-t border-slate-100">
                                                            <p className="text-sm text-blue-700 bg-blue-50 p-2 rounded-lg italic">
                                                                <strong>Nota personalizada:</strong> {recipe.override.notes}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
                        <p>Generado por Escuela Cuid-Arte • {new Date().toLocaleDateString('es-ES')}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
