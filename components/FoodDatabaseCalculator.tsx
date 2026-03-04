import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, Search, Scale, Plus, Trash2, RefreshCw } from 'lucide-react';

type NutrientMap = Record<string, number | null>;

interface FoodRow {
  name: string;
  nutrients: NutrientMap;
}

interface MealItem {
  id: string;
  foodName: string;
  grams: number;
}

const KEY_NUTRIENTS = [
  'Calorías',
  'Proteína',
  'Grasa',
  'Carbohidratos',
  'Fibra',
  'Sodio (mg)',
  'Potasio (mg)',
  'Calcio (mg)',
  'Hierro (mg)',
  'Vitamina C (mg)',
];

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = '';
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (c === ',' && !quoted) {
      out.push(current);
      current = '';
    } else {
      current += c;
    }
  }

  out.push(current);
  return out;
}

function parseNumber(raw: string): number | null {
  const clean = String(raw || '').trim();
  if (!clean || clean === '-') return null;
  const normalized = clean.replace(/\./g, '').replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function round(value: number | null, decimals = 2): string {
  if (value === null || Number.isNaN(value)) return '-';
  return value.toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

function scaleNutrients(nutrients: NutrientMap, grams: number): NutrientMap {
  const factor = grams / 100;
  const out: NutrientMap = {};
  for (const [key, value] of Object.entries(nutrients)) {
    out[key] = value === null ? null : value * factor;
  }
  return out;
}

export function FoodDatabaseCalculator() {
  const [foods, setFoods] = useState<FoodRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFoodName, setSelectedFoodName] = useState('');
  const [selectedGrams, setSelectedGrams] = useState(100);

  const [compareFoodName, setCompareFoodName] = useState('');
  const [compareGrams, setCompareGrams] = useState(100);

  const [mealItems, setMealItems] = useState<MealItem[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadCsv = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = `${import.meta.env.BASE_URL}data/base-datos-alimentos.csv`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`No se pudo cargar CSV (${response.status})`);
        }

        const text = await response.text();
        const rows = text.split(/\r?\n/).filter(Boolean).map(parseCsvLine);
        if (rows.length < 3) {
          throw new Error('CSV sin contenido suficiente.');
        }

        const nutrientHeaders = rows[1].map(v => v.trim());
        const parsed: FoodRow[] = rows.slice(2).map((row) => {
          const nutrients: NutrientMap = {};
          for (let i = 1; i < nutrientHeaders.length; i++) {
            const key = nutrientHeaders[i] || `Nutriente_${i}`;
            nutrients[key] = parseNumber(row[i] || '');
          }
          return {
            name: (row[0] || '').trim(),
            nutrients,
          };
        }).filter(r => r.name);

        if (mounted) {
          setFoods(parsed);
          if (parsed.length > 0) {
            setSelectedFoodName(parsed[0].name);
            setCompareFoodName(parsed.length > 1 ? parsed[1].name : '');
          }
        }
      } catch (e: any) {
        if (mounted) {
          setError(e?.message || 'Error al cargar base de datos de alimentos.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadCsv();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredFoods = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return foods;
    return foods.filter(f => f.name.toLowerCase().includes(q));
  }, [foods, searchTerm]);

  const selectedFood = useMemo(
    () => foods.find(f => f.name === selectedFoodName) || null,
    [foods, selectedFoodName]
  );
  const compareFood = useMemo(
    () => foods.find(f => f.name === compareFoodName) || null,
    [foods, compareFoodName]
  );

  const selectedScaled = useMemo(
    () => (selectedFood ? scaleNutrients(selectedFood.nutrients, selectedGrams) : null),
    [selectedFood, selectedGrams]
  );
  const compareScaled = useMemo(
    () => (compareFood ? scaleNutrients(compareFood.nutrients, compareGrams) : null),
    [compareFood, compareGrams]
  );

  const mealTotals = useMemo(() => {
    const totals: NutrientMap = {};
    for (const item of mealItems) {
      const food = foods.find(f => f.name === item.foodName);
      if (!food) continue;
      const scaled = scaleNutrients(food.nutrients, item.grams);
      for (const [key, value] of Object.entries(scaled)) {
        if (value === null) continue;
        totals[key] = (totals[key] || 0) + value;
      }
    }
    return totals;
  }, [mealItems, foods]);

  const addSelectedToMeal = () => {
    if (!selectedFood) return;
    setMealItems(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        foodName: selectedFood.name,
        grams: selectedGrams,
      },
    ]);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 flex items-center justify-center gap-3 text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Cargando base de datos de alimentos...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-700">
          <p className="font-bold">No se pudo abrir la calculadora de alimentos</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6">
      <div className="bg-gradient-to-r from-brand-green to-emerald-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-white/20"><Calculator className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-black">Calculadora de Alimentos</h1>
            <p className="text-sm text-white/90 mt-1">Base de datos nutricional interna para coaches y admin ({foods.length} alimentos).</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar alimento..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-mint"
            />
          </div>
          <div className="text-xs text-slate-500 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 flex items-center justify-between">
            <span>Resultados</span>
            <span className="font-black text-slate-700">{filteredFoods.length}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Alimento principal</label>
            <select
              value={selectedFoodName}
              onChange={(e) => setSelectedFoodName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
            >
              {filteredFoods.map(food => (
                <option key={food.name} value={food.name}>{food.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-slate-400" />
              <input
                type="number"
                min={1}
                value={selectedGrams}
                onChange={(e) => setSelectedGrams(Math.max(1, Number(e.target.value) || 100))}
                className="w-32 px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
              <span className="text-sm text-slate-500">gramos</span>
              <button
                onClick={addSelectedToMeal}
                className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-green text-white text-xs font-bold hover:bg-brand-dark transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Anadir al plato
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Comparar con</label>
            <select
              value={compareFoodName}
              onChange={(e) => setCompareFoodName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
            >
              <option value="">Sin comparacion</option>
              {filteredFoods.map(food => (
                <option key={food.name} value={food.name}>{food.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-slate-400" />
              <input
                type="number"
                min={1}
                value={compareGrams}
                onChange={(e) => setCompareGrams(Math.max(1, Number(e.target.value) || 100))}
                className="w-32 px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
              <span className="text-sm text-slate-500">gramos</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <th className="py-2 pr-3">Nutriente</th>
              <th className="py-2 pr-3">{selectedFood?.name || 'Selecciona alimento'}</th>
              <th className="py-2">{compareFood?.name || 'Comparacion'}</th>
            </tr>
          </thead>
          <tbody>
            {KEY_NUTRIENTS.map((key) => (
              <tr key={key} className="border-b border-slate-100 last:border-0">
                <td className="py-2.5 pr-3 font-semibold text-slate-700">{key}</td>
                <td className="py-2.5 pr-3 text-slate-800">{selectedScaled ? round(selectedScaled[key] ?? null) : '-'}</td>
                <td className="py-2.5 text-slate-800">{compareScaled ? round(compareScaled[key] ?? null) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-800">Constructor de plato</h2>
          <button
            onClick={() => setMealItems([])}
            className="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
          >
            Limpiar
          </button>
        </div>

        {mealItems.length === 0 ? (
          <p className="text-sm text-slate-500">Aun no hay alimentos en el plato. Anade uno desde arriba.</p>
        ) : (
          <div className="space-y-2">
            {mealItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-sm border border-slate-200 rounded-xl px-3 py-2">
                <span className="flex-1 text-slate-700">{item.foodName}</span>
                <span className="text-slate-500">{item.grams} g</span>
                <button
                  onClick={() => setMealItems(prev => prev.filter(i => i.id !== item.id))}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
          {[
            { key: 'Calorías', label: 'Kcal' },
            { key: 'Proteína', label: 'Proteina' },
            { key: 'Carbohidratos', label: 'Carbos' },
            { key: 'Grasa', label: 'Grasa' },
            { key: 'Fibra', label: 'Fibra' },
          ].map(item => (
            <div key={item.key} className="rounded-xl bg-slate-50 border border-slate-200 p-3">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</p>
              <p className="text-lg font-black text-slate-800 mt-1">{round(mealTotals[item.key] ?? 0)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
