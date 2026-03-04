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

interface CompareItem {
  id: string;
  foodName: string;
  grams: number;
}

const DEFAULT_NUTRIENTS = ['Calorías', 'Proteína', 'Grasa', 'Carbohidratos', 'Fibra'];
const MAX_COMPARE_ITEMS = 3;

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

function uid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function FoodDatabaseCalculator() {
  const [foods, setFoods] = useState<FoodRow[]>([]);
  const [nutrientKeys, setNutrientKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFoodName, setSelectedFoodName] = useState('');
  const [selectedGrams, setSelectedGrams] = useState(100);

  const [compareItems, setCompareItems] = useState<CompareItem[]>([]);
  const [selectedNutrients, setSelectedNutrients] = useState<string[]>(DEFAULT_NUTRIENTS);

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

        const headers = rows[1].map(v => v.trim());
        const nutrientHeaders = headers.slice(1);

        const parsed: FoodRow[] = rows
          .slice(2)
          .map((row) => {
            const nutrients: NutrientMap = {};
            for (let i = 1; i < headers.length; i++) {
              const key = headers[i] || `Nutriente_${i}`;
              nutrients[key] = parseNumber(row[i] || '');
            }
            return {
              name: (row[0] || '').trim(),
              nutrients,
            };
          })
          .filter(r => r.name);

        if (mounted) {
          setFoods(parsed);
          setNutrientKeys(nutrientHeaders);

          const safeDefaultNutrients = DEFAULT_NUTRIENTS.filter(n => nutrientHeaders.includes(n));
          setSelectedNutrients(safeDefaultNutrients.length > 0 ? safeDefaultNutrients : nutrientHeaders.slice(0, 5));

          if (parsed.length > 0) {
            setSelectedFoodName(parsed[0].name);
          }
          if (parsed.length > 1) {
            setCompareItems([{ id: uid(), foodName: parsed[1].name, grams: 100 }]);
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

  const selectedScaled = useMemo(
    () => (selectedFood ? scaleNutrients(selectedFood.nutrients, selectedGrams) : null),
    [selectedFood, selectedGrams]
  );

  const compareResolved = useMemo(() => {
    return compareItems
      .map(item => {
        const food = foods.find(f => f.name === item.foodName) || null;
        return {
          ...item,
          food,
          scaled: food ? scaleNutrients(food.nutrients, item.grams) : null,
        };
      })
      .filter(item => Boolean(item.food));
  }, [compareItems, foods]);

  const allComparedFoods = useMemo(() => {
    const main = selectedFood
      ? [{ id: 'main', foodName: selectedFood.name, grams: selectedGrams, scaled: selectedScaled }]
      : [];
    return [...main, ...compareResolved.map(i => ({ id: i.id, foodName: i.foodName, grams: i.grams, scaled: i.scaled }))];
  }, [selectedFood, selectedGrams, selectedScaled, compareResolved]);

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

  const toggleNutrient = (key: string) => {
    setSelectedNutrients(prev => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev;
        return prev.filter(k => k !== key);
      }
      return [...prev, key];
    });
  };

  const addCompareItem = () => {
    if (compareItems.length >= MAX_COMPARE_ITEMS) return;
    setCompareItems(prev => [...prev, { id: uid(), foodName: '', grams: 100 }]);
  };

  const updateCompareItem = (id: string, patch: Partial<CompareItem>) => {
    setCompareItems(prev => prev.map(item => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeCompareItem = (id: string) => {
    setCompareItems(prev => prev.filter(item => item.id !== id));
  };

  const addSelectedToMeal = () => {
    if (!selectedFood) return;
    setMealItems(prev => [
      ...prev,
      {
        id: uid(),
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
            <p className="text-sm text-white/90 mt-1">Consulta completa y comparador avanzado ({foods.length} alimentos).</p>
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
              placeholder="Buscar alimento y tocar para seleccionarlo..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-mint"
            />
          </div>
          <div className="text-xs text-slate-500 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 flex items-center justify-between">
            <span>Resultados</span>
            <span className="font-black text-slate-700">{filteredFoods.length}</span>
          </div>
        </div>

        {searchTerm.trim() && (
          <div className="flex flex-wrap gap-2">
            {filteredFoods.slice(0, 8).map(food => (
              <button
                key={food.name}
                onClick={() => setSelectedFoodName(food.name)}
                className="px-2.5 py-1 text-xs rounded-full border border-slate-200 bg-slate-50 hover:bg-brand-mint/40 text-slate-700"
              >
                {food.name}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Alimento principal</label>
            <select
              value={selectedFoodName}
              onChange={(e) => setSelectedFoodName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
            >
              {foods.map(food => (
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
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Comparadores (hasta 4 alimentos total)</label>
              <button
                onClick={addCompareItem}
                disabled={compareItems.length >= MAX_COMPARE_ITEMS}
                className="text-xs font-bold text-brand-green disabled:text-slate-400"
              >
                + Anadir comparador
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {compareItems.length === 0 && (
                <p className="text-xs text-slate-500">Sin comparadores. Puedes anadir hasta 3.</p>
              )}

              {compareItems.map((item, idx) => (
                <div key={item.id} className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Comparador {idx + 1}</span>
                    <button onClick={() => removeCompareItem(item.id)} className="text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <select
                    value={item.foodName}
                    onChange={(e) => updateCompareItem(item.id, { foodName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
                  >
                    <option value="">Selecciona alimento</option>
                    {foods.map(food => (
                      <option key={food.name} value={food.name}>{food.name}</option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      min={1}
                      value={item.grams}
                      onChange={(e) => updateCompareItem(item.id, { grams: Math.max(1, Number(e.target.value) || 100) })}
                      className="w-28 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm"
                    />
                    <span className="text-sm text-slate-500">gramos</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-black text-slate-800">Comparador avanzado</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedNutrients(DEFAULT_NUTRIENTS.filter(n => nutrientKeys.includes(n)))}
              className="text-xs font-bold text-slate-600 hover:text-brand-dark"
            >
              Nutrientes clave
            </button>
            <button
              onClick={() => setSelectedNutrients(nutrientKeys)}
              className="text-xs font-bold text-slate-600 hover:text-brand-dark"
            >
              Seleccionar todo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 max-h-40 overflow-y-auto pr-1">
          {nutrientKeys.map((key) => {
            const active = selectedNutrients.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleNutrient(key)}
                className={`text-left px-2.5 py-2 rounded-lg border text-xs transition-colors ${active ? 'bg-brand-mint/50 border-brand-green text-brand-dark font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
              >
                {key}
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="py-2 pr-3">Nutriente</th>
                {allComparedFoods.map((food) => (
                  <th key={food.id} className="py-2 pr-3">
                    {food.foodName}
                    <span className="block normal-case text-[11px] text-slate-400 font-medium mt-0.5">{food.grams} g</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {selectedNutrients.map((key) => (
                <tr key={key} className="border-b border-slate-100 last:border-0">
                  <td className="py-2.5 pr-3 font-semibold text-slate-700">{key}</td>
                  {allComparedFoods.map((food) => (
                    <td key={`${food.id}-${key}`} className="py-2.5 pr-3 text-slate-800">
                      {food.scaled ? round(food.scaled[key] ?? null) : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <h2 className="text-base font-black text-slate-800">Ficha completa del alimento</h2>
        <p className="text-xs text-slate-500">Consulta todos los valores por 100 g y por la porcion seleccionada.</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="py-2 pr-3">Nutriente</th>
                <th className="py-2 pr-3">Por 100 g</th>
                <th className="py-2">Por {selectedGrams} g</th>
              </tr>
            </thead>
            <tbody>
              {nutrientKeys.map((key) => (
                <tr key={`full-${key}`} className="border-b border-slate-100 last:border-0">
                  <td className="py-2.5 pr-3 font-semibold text-slate-700">{key}</td>
                  <td className="py-2.5 pr-3 text-slate-800">{selectedFood ? round(selectedFood.nutrients[key] ?? null) : '-'}</td>
                  <td className="py-2.5 text-slate-800">{selectedScaled ? round(selectedScaled[key] ?? null) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
