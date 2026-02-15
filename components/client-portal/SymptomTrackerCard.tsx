import React from 'react';
import { Activity, Heart, Moon, Utensils, Zap, ThermometerSun } from 'lucide-react';
import { MedicalData } from '../../types';

interface SymptomTrackerCardProps {
  medical: MedicalData;
  energyLevel?: number;
  recoveryCapacity?: number;
}

const SYMPTOMS = [
  { key: 'symptom_fatigue', label: 'Fatiga', icon: Zap },
  { key: 'symptom_pain', label: 'Dolor', icon: ThermometerSun },
  { key: 'symptom_nausea', label: 'Náuseas', icon: Activity },
  { key: 'symptom_appetite_loss', label: 'Apetito', icon: Utensils },
  { key: 'symptom_sleep_quality', label: 'Sueño', icon: Moon },
  { key: 'symptom_bloating', label: 'Hinchazón', icon: Heart },
] as const;

const getColor = (val: number) => {
  if (val <= 2) return { bg: 'bg-green-100', text: 'text-green-700', bar: 'bg-green-500' };
  if (val <= 5) return { bg: 'bg-amber-100', text: 'text-amber-700', bar: 'bg-amber-500' };
  return { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-500' };
};

export const SymptomTrackerCard: React.FC<SymptomTrackerCardProps> = ({ medical, energyLevel, recoveryCapacity }) => {
  const hasSymptoms = SYMPTOMS.some(s => (medical as any)[s.key] != null);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-brand-green to-brand-green-dark px-5 py-3 flex items-center gap-2">
        <Activity className="w-5 h-5 text-white" />
        <h3 className="font-bold text-white text-sm">Seguimiento de Síntomas</h3>
      </div>

      <div className="p-5 space-y-4">
        {/* Energía y Recuperación */}
        {(energyLevel != null || recoveryCapacity != null) && (
          <div className="grid grid-cols-2 gap-3 mb-2">
            {energyLevel != null && (
              <div className={`p-3 rounded-xl text-center ${energyLevel >= 7 ? 'bg-green-50' : energyLevel >= 4 ? 'bg-amber-50' : 'bg-red-50'}`}>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Energía</p>
                <p className={`text-2xl font-black ${energyLevel >= 7 ? 'text-green-600' : energyLevel >= 4 ? 'text-amber-600' : 'text-red-600'}`}>
                  {energyLevel}<span className="text-xs font-normal text-slate-400">/10</span>
                </p>
              </div>
            )}
            {recoveryCapacity != null && (
              <div className={`p-3 rounded-xl text-center ${recoveryCapacity >= 7 ? 'bg-green-50' : recoveryCapacity >= 4 ? 'bg-amber-50' : 'bg-red-50'}`}>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Recuperación</p>
                <p className={`text-2xl font-black ${recoveryCapacity >= 7 ? 'text-green-600' : recoveryCapacity >= 4 ? 'text-amber-600' : 'text-red-600'}`}>
                  {recoveryCapacity}<span className="text-xs font-normal text-slate-400">/10</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Barras de síntomas */}
        {hasSymptoms ? (
          <div className="space-y-3">
            {SYMPTOMS.map(({ key, label, icon: Icon }) => {
              const val = (medical as any)[key];
              if (val == null) return null;
              const colors = getColor(val);
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${colors.bg}`}>
                    <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
                  </div>
                  <span className="text-xs text-slate-600 w-16 shrink-0">{label}</span>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${colors.bar}`}
                      style={{ width: `${(val / 10) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold w-8 text-right ${colors.text}`}>{val}/10</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Sin síntomas registrados todavía</p>
            <p className="text-xs text-slate-300 mt-1">Los datos se actualizarán con los check-ins semanales</p>
          </div>
        )}
      </div>
    </div>
  );
};
