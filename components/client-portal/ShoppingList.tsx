import React, { useState, useEffect, useMemo } from 'react';
import {
    Fish,
    Drumstick,
    Apple,
    Milk,
    Package,
    Croissant,
    Snowflake,
    HelpCircle,
    Check,
    ShoppingCart,
    CalendarDays,
    RotateCcw,
    Users,
    Minus,
    Plus
} from 'lucide-react';
import { NutritionRecipe, IngredientSection, RecipeIngredient, MealSlot } from '../../types';

interface ShoppingListProps {
    recipes: NutritionRecipe[];
    planId: string;
    plannerGrid?: Record<string, string | null>;
}

interface AggregatedIngredient {
    name: string;
    quantity: number;
    unit: string;
    section: IngredientSection;
}

const SECTION_CONFIG: Record<IngredientSection, { icon: React.FC<any>; color: string; bgColor: string }> = {
    'Pescadería': { icon: Fish, color: 'text-cyan-700', bgColor: 'bg-cyan-50' },
    'Carnicería': { icon: Drumstick, color: 'text-red-700', bgColor: 'bg-red-50' },
    'Frutería': { icon: Apple, color: 'text-green-700', bgColor: 'bg-green-50' },
    'Lácteos': { icon: Milk, color: 'text-blue-700', bgColor: 'bg-blue-50' },
    'Despensa': { icon: Package, color: 'text-amber-700', bgColor: 'bg-amber-50' },
    'Panadería': { icon: Croissant, color: 'text-orange-700', bgColor: 'bg-orange-50' },
    'Congelados': { icon: Snowflake, color: 'text-indigo-700', bgColor: 'bg-indigo-50' },
    'Otros': { icon: HelpCircle, color: 'text-slate-700', bgColor: 'bg-slate-50' }
};

const SECTION_ORDER: IngredientSection[] = [
    'Frutería', 'Carnicería', 'Pescadería', 'Lácteos', 'Panadería', 'Congelados', 'Despensa', 'Otros'
];

function inferSection(ingredientName: string): IngredientSection {
    const name = ingredientName.toLowerCase();

    // Pescadería
    if (/salm[oó]n|at[uú]n|merluza|bacalao|gambas?|langostino|calamar|sepia|pulpo|sardina|anchoa|lubina|dorada|trucha|rape|mejill[oó]n|almeja|pescado|marisco/.test(name)) {
        return 'Pescadería';
    }

    // Carnicería
    if (/pollo|pavo|ternera|cerdo|jamón|jam[oó]n|chorizo|salchich|carne|filete|pechuga|muslo|lomo|costilla|cordero|conejo|hamburguesa/.test(name)) {
        return 'Carnicería';
    }

    // Frutería
    if (/manzana|pl[aá]tano|banana|naranja|lim[oó]n|fresa|ar[aá]ndano|frambuesa|uva|mel[oó]n|sand[ií]a|pi[ñn]a|kiwi|mango|aguacate|tomate|lechuga|espinaca|cebolla|ajo|zanahoria|pimiento|calabac[ií]n|br[oó]coli|coliflor|pepino|berenjena|champi[ñn][oó]n|seta|patata|boniato|fruta|verdura|perejil|cilantro|albahaca|r[uú]cula|acelga|apio|puerro|jud[ií]a verde|remolacha|r[aá]bano|nabo|col |repollo|end[ií]via/.test(name)) {
        return 'Frutería';
    }

    // Lácteos
    if (/leche|yogur|queso|nata|mantequilla|crema|kefir|cuajada|requesón|mozzarella|parmesano|ricotta|cottage|skyr/.test(name)) {
        return 'Lácteos';
    }

    // Panadería
    if (/pan |pan$|tostada|baguette|chapata|integral|centeno|tortilla de trigo|wrap|pita|croissant|bollería|galleta/.test(name)) {
        return 'Panadería';
    }

    // Congelados
    if (/congelad|helado/.test(name)) {
        return 'Congelados';
    }

    return 'Despensa';
}

function getCheckStorageKey(planId: string) {
    return `ec_crm_shopping_${planId}`;
}

export function ShoppingList({ recipes, planId, plannerGrid }: ShoppingListProps) {
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
    const [servings, setServings] = useState(1);

    // Load checked items from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(getCheckStorageKey(planId));
            if (saved) {
                setCheckedItems(JSON.parse(saved));
            }
        } catch { }
    }, [planId]);

    const saveChecked = (newChecked: Record<string, boolean>) => {
        setCheckedItems(newChecked);
        try {
            localStorage.setItem(getCheckStorageKey(planId), JSON.stringify(newChecked));
        } catch { }
    };

    // Read planner grid from localStorage as fallback
    const localPlannerGrid = useMemo(() => {
        try {
            const saved = localStorage.getItem(`ec_crm_weekly_plan_${planId}`);
            return saved ? JSON.parse(saved) as Record<string, string | null> : null;
        } catch {
            return null;
        }
    }, [planId]);

    const effectivePlannerGrid = plannerGrid && Object.keys(plannerGrid).length > 0
        ? plannerGrid
        : localPlannerGrid;

    // Get selected recipe IDs from planner
    const selectedRecipeIds = useMemo(() => {
        if (!effectivePlannerGrid) return new Set<string>();
        const ids = new Set<string>();
        Object.values(effectivePlannerGrid).forEach(recipeId => {
            if (recipeId) ids.add(recipeId);
        });
        return ids;
    }, [effectivePlannerGrid]);

    // Aggregate ingredients from selected recipes
    const sectionedIngredients = useMemo(() => {
        if (selectedRecipeIds.size === 0) return {};

        const aggregated = new Map<string, AggregatedIngredient>();

        recipes.forEach(recipe => {
            if (!selectedRecipeIds.has(recipe.id)) return;

            // Count how many times this recipe appears in the planner
            const recipeCount = effectivePlannerGrid
                ? Object.values(effectivePlannerGrid).filter(id => id === recipe.id).length
                : 1;

            recipe.ingredients.forEach(ing => {
                const normalizedName = ing.name.trim().toLowerCase();
                const key = `${normalizedName}-${ing.unit}`;
                const section = (ing as any).section || inferSection(ing.name);

                if (aggregated.has(key)) {
                    const existing = aggregated.get(key)!;
                    existing.quantity += (ing.quantity || 0) * recipeCount;
                } else {
                    aggregated.set(key, {
                        name: ing.name.trim(),
                        quantity: (ing.quantity || 0) * recipeCount,
                        unit: ing.unit || '',
                        section: section as IngredientSection
                    });
                }
            });
        });

        // Group by section
        const grouped: Record<string, AggregatedIngredient[]> = {};
        aggregated.forEach(item => {
            if (!grouped[item.section]) grouped[item.section] = [];
            grouped[item.section].push(item);
        });

        // Sort ingredients within each section alphabetically
        Object.values(grouped).forEach(items => items.sort((a, b) => a.name.localeCompare(b.name)));

        return grouped;
    }, [recipes, selectedRecipeIds, effectivePlannerGrid]);

    const toggleItem = (itemKey: string) => {
        const newChecked = { ...checkedItems, [itemKey]: !checkedItems[itemKey] };
        saveChecked(newChecked);
    };

    const handleResetChecks = () => {
        saveChecked({});
    };

    const totalItems = Object.values(sectionedIngredients).reduce((sum, items) => sum + items.length, 0);
    const checkedCount = Object.values(checkedItems).filter(Boolean).length;

    if (selectedRecipeIds.size === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
                <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 mb-2">Primero selecciona recetas en el Planificador</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto">
                    Ve a la pestaña "Planificador" y elige tus recetas para cada día. La lista de la compra se generará automáticamente.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-green-600" />
                        Lista de la Compra
                    </h3>
                    <p className="text-sm text-slate-500">
                        {totalItems} ingredientes de {selectedRecipeIds.size} recetas
                        {checkedCount > 0 && (
                            <span className="ml-2 text-green-600 font-medium">({checkedCount} marcados)</span>
                        )}
                    </p>
                </div>
                {checkedCount > 0 && (
                    <button
                        onClick={handleResetChecks}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Desmarcar
                    </button>
                )}
            </div>

            {/* Servings selector */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-medium text-slate-700">Nº de personas</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setServings(Math.max(1, servings - 1))}
                        disabled={servings <= 1}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-30"
                    >
                        <Minus className="w-4 h-4 text-slate-600" />
                    </button>
                    <span className="w-8 text-center text-lg font-bold text-indigo-600">{servings}</span>
                    <button
                        onClick={() => setServings(Math.min(10, servings + 1))}
                        disabled={servings >= 10}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-30"
                    >
                        <Plus className="w-4 h-4 text-slate-600" />
                    </button>
                </div>
            </div>

            {/* Sections */}
            <div className="space-y-4">
                {SECTION_ORDER.filter(section => sectionedIngredients[section]?.length > 0).map(section => {
                    const config = SECTION_CONFIG[section];
                    const Icon = config.icon;
                    const items = sectionedIngredients[section];

                    return (
                        <div key={section} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            {/* Section Header */}
                            <div className={`px-4 py-3 ${config.bgColor} border-b border-slate-100 flex items-center gap-2`}>
                                <Icon className={`w-5 h-5 ${config.color}`} />
                                <h4 className={`font-bold text-sm ${config.color}`}>{section}</h4>
                                <span className="ml-auto text-xs text-slate-400 font-medium">{items.length} items</span>
                            </div>

                            {/* Items */}
                            <div className="divide-y divide-slate-50">
                                {items.map((item, idx) => {
                                    const itemKey = `${item.name}-${item.unit}`;
                                    const isChecked = !!checkedItems[itemKey];

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => toggleItem(itemKey)}
                                            className={`w-full px-4 py-3 flex items-center gap-3 transition-colors text-left ${isChecked ? 'bg-green-50/50' : 'hover:bg-slate-50'
                                                }`}
                                        >
                                            {/* Checkbox */}
                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isChecked
                                                    ? 'bg-green-500 border-green-500'
                                                    : 'border-slate-300'
                                                }`}>
                                                {isChecked && <Check className="w-3 h-3 text-white" />}
                                            </div>

                                            {/* Name */}
                                            <span className={`flex-1 text-sm font-medium transition-colors ${isChecked ? 'line-through text-slate-400' : 'text-slate-700'
                                                }`}>
                                                {item.name}
                                            </span>

                                            {/* Quantity */}
                                            {item.quantity > 0 && (
                                                <span className={`text-xs font-semibold whitespace-nowrap ${isChecked ? 'text-slate-300' : 'text-slate-500'
                                                    }`}>
                                                    {Math.round(item.quantity * servings * 10) / 10} {item.unit}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
