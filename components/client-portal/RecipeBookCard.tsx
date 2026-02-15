import React from 'react';
import { Coffee, Sun, Moon, Cookie, Flame } from 'lucide-react';
import { NutritionRecipe, RecipeCategory } from '../../types';

interface RecipeBookCardProps {
  recipe: NutritionRecipe;
  onClick: () => void;
}

const CATEGORY_CONFIG: Record<RecipeCategory, {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.FC<any>;
  label: string;
}> = {
  breakfast: {
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200 hover:border-amber-300',
    icon: Coffee,
    label: 'Desayuno'
  },
  lunch: {
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200 hover:border-orange-300',
    icon: Sun,
    label: 'Comida'
  },
  dinner: {
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200 hover:border-indigo-300',
    icon: Moon,
    label: 'Cena'
  },
  snack: {
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200 hover:border-emerald-300',
    icon: Cookie,
    label: 'Snack'
  }
};

export function RecipeBookCard({ recipe, onClick }: RecipeBookCardProps) {
  const config = CATEGORY_CONFIG[recipe.category] || CATEGORY_CONFIG.snack;
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white rounded-2xl border ${config.borderColor} p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group`}
    >
      {/* Category Icon + Name */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2 group-hover:text-green-700 transition-colors">
            {recipe.name}
          </h3>
          <p className={`text-xs font-medium mt-0.5 ${config.color}`}>{config.label}</p>
        </div>
      </div>

      {/* Macros Bar */}
      <div className="flex flex-wrap gap-1.5">
        {recipe.calories != null && recipe.calories > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-600 rounded-lg text-xs font-semibold">
            <Flame className="w-3 h-3" />
            {recipe.calories} kcal
          </span>
        )}
        {recipe.protein != null && recipe.protein > 0 && (
          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold">
            P: {recipe.protein}g
          </span>
        )}
        {recipe.carbs != null && recipe.carbs > 0 && (
          <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-semibold">
            C: {recipe.carbs}g
          </span>
        )}
        {recipe.fat != null && recipe.fat > 0 && (
          <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-semibold">
            G: {recipe.fat}g
          </span>
        )}
      </div>
    </button>
  );
}
