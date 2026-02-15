import React from 'react';
import { X, Flame, Coffee, Sun, Moon, Cookie, UtensilsCrossed, ListChecks, MessageSquare } from 'lucide-react';
import { NutritionRecipe, RecipeCategory, ClientNutritionOverride } from '../../types';

interface RecipeDetailModalProps {
  recipe: NutritionRecipe & { override?: ClientNutritionOverride };
  onClose: () => void;
}

const CATEGORY_META: Record<RecipeCategory, { icon: React.FC<any>; label: string; gradient: string }> = {
  breakfast: { icon: Coffee, label: 'Desayuno', gradient: 'from-amber-500 to-orange-400' },
  lunch: { icon: Sun, label: 'Comida', gradient: 'from-orange-500 to-red-400' },
  dinner: { icon: Moon, label: 'Cena', gradient: 'from-indigo-500 to-purple-500' },
  snack: { icon: Cookie, label: 'Snack', gradient: 'from-emerald-500 to-teal-400' }
};

export function RecipeDetailModal({ recipe, onClose }: RecipeDetailModalProps) {
  const meta = CATEGORY_META[recipe.category] || CATEGORY_META.snack;
  const Icon = meta.icon;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 bg-gradient-to-r ${meta.gradient} text-white relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Icon className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold opacity-90">{meta.label}</span>
          </div>
          <h2 className="text-2xl font-black leading-tight">{recipe.name}</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Macros */}
          <div className="flex flex-wrap gap-3">
            {recipe.calories != null && recipe.calories > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-xl">
                <Flame className="w-4 h-4 text-orange-500" />
                <div>
                  <p className="text-xs text-orange-400 font-medium">Calorías</p>
                  <p className="text-lg font-black text-orange-600">{recipe.calories}</p>
                </div>
              </div>
            )}
            {recipe.protein != null && recipe.protein > 0 && (
              <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-xs text-blue-400 font-medium">Proteína</p>
                <p className="text-lg font-black text-blue-600">{recipe.protein}g</p>
              </div>
            )}
            {recipe.carbs != null && recipe.carbs > 0 && (
              <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs text-amber-400 font-medium">Carbos</p>
                <p className="text-lg font-black text-amber-600">{recipe.carbs}g</p>
              </div>
            )}
            {recipe.fat != null && recipe.fat > 0 && (
              <div className="px-4 py-2 bg-purple-50 border border-purple-200 rounded-xl">
                <p className="text-xs text-purple-400 font-medium">Grasa</p>
                <p className="text-lg font-black text-purple-600">{recipe.fat}g</p>
              </div>
            )}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ingredients */}
            {recipe.ingredients && recipe.ingredients.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
                  <ListChecks className="w-4 h-4 text-green-500" />
                  Ingredientes
                </h3>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                      <span className="font-medium">{ing.name}</span>
                      {ing.quantity > 0 && (
                        <span className="text-slate-400 ml-auto text-xs whitespace-nowrap">
                          {ing.quantity} {ing.unit}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preparation */}
            {recipe.preparation && (
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
                  <UtensilsCrossed className="w-4 h-4 text-indigo-500" />
                  Preparación
                </h3>
                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {recipe.preparation}
                </p>
              </div>
            )}
          </div>

          {/* Override Note */}
          {recipe.override?.notes && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <p className="text-sm font-bold text-blue-700">Nota de tu coach</p>
              </div>
              <p className="text-sm text-blue-600">{recipe.override.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
