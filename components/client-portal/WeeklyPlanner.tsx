import React, { useState } from 'react';
import {
    Trash2,
    Plus,
    Flame,
    Coffee,
    Sun,
    Moon,
    Cookie,
    X,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    RotateCcw
} from 'lucide-react';
import { NutritionRecipe, RecipeCategory, MealSlot } from '../../types';

interface WeeklyPlannerProps {
    recipes: NutritionRecipe[];
    planId: string;
    grid: Record<string, string | null>;
    onGridChange: (grid: Record<string, string | null>, weekOffset?: number) => void;
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const MEALS: { id: MealSlot; label: string; icon: React.FC<any>; category: RecipeCategory }[] = [
    { id: 'breakfast', label: 'Desayuno', icon: Coffee, category: 'breakfast' },
    { id: 'lunch', label: 'Comida', icon: Sun, category: 'lunch' },
    { id: 'dinner', label: 'Cena', icon: Moon, category: 'dinner' },
    { id: 'snack', label: 'Snack', icon: Cookie, category: 'snack' }
];

type Grid = Record<string, string | null>; // key: "day-meal", value: recipeId

function getStorageKey(planId: string) {
    return `ec_crm_weekly_plan_${planId}`;
}

export function WeeklyPlanner({ recipes, planId, grid, onGridChange }: WeeklyPlannerProps) {
    const [pickerOpen, setPickerOpen] = useState<string | null>(null);
    const [expandedDay, setExpandedDay] = useState<number | null>(null);
    const [weekOffset, setWeekOffset] = useState(0); // 0 = esta semana, 1 = siguiente

    const cellKey = (day: number, meal: MealSlot) => `${day}-${meal}`;
    const weekStorageKey = (offset: number) => `${getStorageKey(planId)}${offset > 0 ? `_w${offset}` : ''}`;

    // Load week grid from localStorage when weekOffset changes
    const getActiveGrid = (): Record<string, string | null> => {
        if (weekOffset === 0) return grid;
        try {
            const saved = localStorage.getItem(weekStorageKey(weekOffset));
            return saved ? JSON.parse(saved) : {};
        } catch { return {}; }
    };

    const [nextWeekGrid, setNextWeekGrid] = useState<Record<string, string | null>>(() => {
        try {
            const saved = localStorage.getItem(weekStorageKey(1));
            return saved ? JSON.parse(saved) : {};
        } catch { return {}; }
    });

    const activeGrid = weekOffset === 0 ? grid : nextWeekGrid;

    const setRecipeForCell = (day: number, meal: MealSlot, recipeId: string | null) => {
        const key = cellKey(day, meal);
        const newGrid = { ...activeGrid };
        if (recipeId) {
            newGrid[key] = recipeId;
        } else {
            delete newGrid[key];
        }
        if (weekOffset === 0) {
            onGridChange(newGrid);
            try { localStorage.setItem(getStorageKey(planId), JSON.stringify(newGrid)); } catch { }
        } else {
            setNextWeekGrid(newGrid);
            try { localStorage.setItem(weekStorageKey(weekOffset), JSON.stringify(newGrid)); } catch { }
        }
        setPickerOpen(null);
    };

    // Week dates
    const getWeekDates = () => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setDate(now.getDate() + mondayOffset + (weekOffset * 7));
        return DAYS.map((_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d;
        });
    };
    const weekDates = getWeekDates();
    const weekLabel = weekOffset === 0 ? 'Esta semana' : 'Semana siguiente';

    const getRecipeForCell = (day: number, meal: MealSlot): NutritionRecipe | undefined => {
        const key = cellKey(day, meal);
        const recipeId = activeGrid[key];
        if (!recipeId) return undefined;
        return recipes.find(r => r.id === recipeId);
    };

    const getRecipesForCategory = (category: RecipeCategory): NutritionRecipe[] => {
        return recipes.filter(r => r.category === category);
    };

    const getDayCalories = (day: number): number => {
        return MEALS.reduce((total, meal) => {
            const recipe = getRecipeForCell(day, meal.id);
            return total + (recipe?.calories || 0);
        }, 0);
    };

    const handleClearAll = () => {
        if (Object.keys(activeGrid).length === 0) return;
        if (weekOffset === 0) {
            onGridChange({});
            try { localStorage.setItem(getStorageKey(planId), JSON.stringify({})); } catch { }
        } else {
            setNextWeekGrid({});
            try { localStorage.setItem(weekStorageKey(weekOffset), JSON.stringify({})); } catch { }
        }
    };

    const totalFilledCells = Object.keys(activeGrid).length;

    // Recipe Picker component
    const RecipePicker = ({ day, meal, category }: { day: number; meal: MealSlot; category: RecipeCategory }) => {
        const available = getRecipesForCategory(category);

        return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setPickerOpen(null)}>
                <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase">{DAYS[day]} - {MEALS.find(m => m.id === meal)?.label}</p>
                            <p className="font-bold text-slate-800">Elige una receta</p>
                        </div>
                        <button onClick={() => setPickerOpen(null)} className="p-1.5 hover:bg-slate-100 rounded-full">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto p-2">
                        {available.length === 0 ? (
                            <p className="text-center text-slate-400 py-8 text-sm">No hay recetas de esta categoría</p>
                        ) : (
                            available.map(recipe => (
                                <button
                                    key={recipe.id}
                                    onClick={() => setRecipeForCell(day, meal, recipe.id)}
                                    className="w-full text-left p-3 rounded-xl hover:bg-green-50 transition-colors flex items-center gap-3"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-800 text-sm truncate">{recipe.name}</p>
                                        <div className="flex gap-2 text-xs mt-0.5">
                                            {recipe.calories && (
                                                <span className="text-orange-500 flex items-center gap-0.5">
                                                    <Flame className="w-3 h-3" /> {recipe.calories}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Mobile: accordion view
    const MobileView = () => (
        <div className="space-y-3 sm:hidden">
            {DAYS.map((dayName, dayIdx) => {
                const isExpanded = expandedDay === dayIdx;
                const dayCal = getDayCalories(dayIdx);
                const filledMeals = MEALS.filter(m => getRecipeForCell(dayIdx, m.id)).length;
                const dateStr = weekDates[dayIdx] ? `${weekDates[dayIdx].getDate()}/${weekDates[dayIdx].getMonth() + 1}` : '';

                return (
                    <div key={dayIdx} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <button
                            onClick={() => setExpandedDay(isExpanded ? null : dayIdx)}
                            className="w-full p-4 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-slate-800">{dayName}</span>
                                <span className="text-xs text-slate-400">{dateStr} · {filledMeals}/4</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {dayCal > 0 && (
                                    <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-lg">
                                        {dayCal} kcal
                                    </span>
                                )}
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </div>
                        </button>

                        {isExpanded && (
                            <div className="px-4 pb-4 space-y-2 border-t border-slate-100 pt-3">
                                {MEALS.map(meal => {
                                    const recipe = getRecipeForCell(dayIdx, meal.id);
                                    const Icon = meal.icon;
                                    return (
                                        <div key={meal.id}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Icon className="w-4 h-4 text-slate-400" />
                                                <span className="text-xs font-semibold text-slate-500">{meal.label}</span>
                                            </div>
                                            {recipe ? (
                                                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-medium text-slate-800">{recipe.name}</p>
                                                            {recipe.calories && (
                                                                <p className="text-xs text-orange-500 mt-0.5">{recipe.calories} kcal</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 mt-2 pt-2 border-t border-green-200">
                                                        <button
                                                            onClick={() => setPickerOpen(cellKey(dayIdx, meal.id))}
                                                            className="flex-1 py-1.5 text-xs font-bold text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors flex items-center justify-center gap-1"
                                                        >
                                                            <RotateCcw className="w-3 h-3" />
                                                            Cambiar
                                                        </button>
                                                        <button
                                                            onClick={() => setRecipeForCell(dayIdx, meal.id, null)}
                                                            className="py-1.5 px-3 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                            Quitar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setPickerOpen(cellKey(dayIdx, meal.id))}
                                                    className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm hover:border-green-300 hover:text-green-500 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    Elegir {meal.label.toLowerCase()}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    // Desktop: grid view
    const DesktopView = () => (
        <div className="hidden sm:block overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-left w-20"></th>
                        {DAYS.map((day, idx) => (
                            <th key={idx} className="p-2 text-center">
                                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider hidden lg:inline">{day}</span>
                                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider lg:hidden">{DAYS_SHORT[idx]}</span>
                                {getDayCalories(idx) > 0 && (
                                    <div className="text-[10px] font-semibold text-orange-500 mt-0.5">{getDayCalories(idx)} kcal</div>
                                )}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {MEALS.map(meal => {
                        const Icon = meal.icon;
                        return (
                            <tr key={meal.id} className="border-t border-slate-100">
                                <td className="p-2 align-middle">
                                    <div className="flex items-center gap-1.5">
                                        <Icon className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs font-semibold text-slate-500 hidden md:inline">{meal.label}</span>
                                    </div>
                                </td>
                                {DAYS.map((_, dayIdx) => {
                                    const recipe = getRecipeForCell(dayIdx, meal.id);
                                    const key = cellKey(dayIdx, meal.id);
                                    return (
                                        <td key={dayIdx} className="p-1 align-top">
                                            {recipe ? (
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-2 min-h-[60px] relative">
                                                    <p className="text-xs font-medium text-slate-700 line-clamp-2 pr-5">{recipe.name}</p>
                                                    {recipe.calories && (
                                                        <p className="text-[10px] text-orange-500 mt-0.5 font-semibold">{recipe.calories} kcal</p>
                                                    )}
                                                    <button
                                                        onClick={() => setRecipeForCell(dayIdx, meal.id, null)}
                                                        className="absolute top-1 right-1 p-1 bg-white/80 rounded-full shadow-sm hover:bg-red-50 transition-colors"
                                                    >
                                                        <X className="w-3 h-3 text-red-400" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setPickerOpen(key)}
                                                    className="w-full min-h-[60px] border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center hover:border-green-300 hover:bg-green-50/30 transition-colors"
                                                >
                                                    <Plus className="w-4 h-4 text-slate-300" />
                                                </button>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-slate-800 text-lg">Planificador Semanal</h3>
                    <p className="text-sm text-slate-500">Elige tus recetas para cada día</p>
                </div>
                {totalFilledCells > 0 && (
                    <button
                        onClick={handleClearAll}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Limpiar
                    </button>
                )}
            </div>

            {/* Week selector */}
            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2">
                <button
                    onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
                    disabled={weekOffset === 0}
                    className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-30"
                >
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <div className="text-center">
                    <p className="text-sm font-bold text-slate-700">{weekLabel}</p>
                    <p className="text-[10px] text-slate-400">
                        {weekDates[0]?.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} — {weekDates[6]?.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </p>
                </div>
                <button
                    onClick={() => setWeekOffset(Math.min(1, weekOffset + 1))}
                    disabled={weekOffset >= 1}
                    className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-30"
                >
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
            </div>

            {/* Grid */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <DesktopView />
                <MobileView />
            </div>

            {/* Picker modal */}
            {pickerOpen && (() => {
                const [dayStr, mealStr] = pickerOpen.split('-');
                const dayIdx = parseInt(dayStr);
                const mealObj = MEALS.find(m => m.id === mealStr);
                if (!mealObj) return null;
                return <RecipePicker day={dayIdx} meal={mealObj.id} category={mealObj.category} />;
            })()}
        </div>
    );
}
