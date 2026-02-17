import React from 'react';
import { Activity, Heart, Moon, Utensils, Zap, ThermometerSun, Brain, Wind } from 'lucide-react';
import { MedicalData } from '../../types';

interface SymptomTrackerCardProps {
  medical: MedicalData;
  energyLevel?: number;
  recoveryCapacity?: number;
}

const OTHER_SYMPTOMS = [
  { key: 'symptom_pain', label: 'Dolor', icon: ThermometerSun },
  { key: 'symptom_nausea', label: 'Náuseas', icon: Activity },
  { key: 'symptom_appetite_loss', label: 'Apetito', icon: Utensils },
  { key: 'symptom_sleep_quality', label: 'Sueño', icon: Moon },
  { key: 'symptom_bloating', label: 'Hinchazón', icon: Heart },
  { key: 'symptom_chemo_brain', label: 'Niebla mental', icon: Brain },
  { key: 'symptom_dyspnea', label: 'Disnea', icon: Wind },
] as const;

const getBarColor = (val: number) => {
  if (val <= 2) return 'bg-green-500';
  if (val <= 5) return 'bg-amber-500';
  return 'bg-red-500';
};

const getTextColor = (val: number) => {
  if (val <= 2) return 'text-green-700';
  if (val <= 5) return 'text-amber-700';
  return 'text-red-700';
};

export const SymptomTrackerCard: React.FC<SymptomTrackerCardProps> = ({ medical, energyLevel, recoveryCapacity }) => {
  const fatigueVal = (medical as any)['symptom_fatigue'] ?? null;
  const fatigueIntVal = (medical as any)['symptom_fatigue_interference'] ?? null;
  const hasFatigue = fatigueVal != null;
  const hasOtherSymptoms = OTHER_SYMPTOMS.some(s => (medical as any)[s.key] != null);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-brand-green to-brand-green-dark px-5 py-3 flex items-center gap-2">
        <Activity className="w-5 h-5 text-white" />
        <h3 className="font-bold text-white text-sm">Seguimiento de Síntomas</h3>
      </div>

      <div className="p-5 space-y-5">

        {/* ── FATIGA: protagonista ── */}
        {hasFatigue && (
          <div className={`rounded-xl p-4 ${fatigueVal > 7 ? 'bg-red-50 border border-red-200' : fatigueVal > 4 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className={`w-5 h-5 ${getTextColor(fatigueVal)}`} />
                <span className="text-sm font-bold text-slate-700">Fatiga</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Síntoma principal</span>
              </div>
              <span className={`text-2xl font-black ${getTextColor(fatigueVal)}`}>
                {fatigueVal}<span className="text-xs font-normal text-slate-400">/10</span>
              </span>
            </div>
            {/* Barra de fatiga */}
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getBarColor(fatigueVal)}`}
                style={{ width: `${(fatigueVal / 10) * 100}%` }}
              />
            </div>
            {/* Interferencia */}
            {fatigueIntVal != null && (
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Interferencia en el día a día</span>
                <span className={`font-bold ${getTextColor(fatigueIntVal)}`}>{fatigueIntVal}/10</span>
              </div>
            )}
          </div>
        )}

        {/* ── Energía y Recuperación ── */}
        {(energyLevel != null || recoveryCapacity != null) && (
          <div className="grid grid-cols-2 gap-3">
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

        {/* ── Resto de síntomas ── */}
        {hasOtherSymptoms && (
          <div className="space-y-2">
            {OTHER_SYMPTOMS.map(({ key, label, icon: Icon }) => {
              const val = (medical as any)[key];
              if (val == null) return null;
              const barColor = getBarColor(val);
              const textColor = getTextColor(val);
              return (
                <div key={key} className="flex items-center gap-3">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${textColor}`} />
                  <span className="text-xs text-slate-600 w-20 shrink-0">{label}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${(val / 10) * 100}%` }} />
                  </div>
                  <span className={`text-xs font-bold w-8 text-right ${textColor}`}>{val}/10</span>
                </div>
              );
            })}
          </div>
        )}

        {!hasFatigue && !hasOtherSymptoms && (
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
