import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, X, Sparkles } from 'lucide-react';

interface OnboardingTourProps {
  clientId: string;
  onComplete: () => void;
}

interface TourStep {
  targetId: string;
  title: string;
  content: string;
  emoji: string;
}

const STEPS: TourStep[] = [
  { targetId: 'tab-home', title: 'Inicio', content: 'Tu resumen semanal, tareas del día y accesos rápidos', emoji: '🏠' },
  { targetId: 'tab-health', title: 'Mi Salud', content: 'Registra tu bienestar diario, peso, medicación, hidratación y síntomas', emoji: '💚' },
  { targetId: 'tab-program', title: 'Programa', content: 'Tu plan de nutrición, entrenamiento, clases y materiales', emoji: '📋' },
  { targetId: 'tab-treatment', title: 'Tratamiento', content: 'Seguimiento de sesiones de quimio/radio, revisiones oncológicas y síntomas post-tratamiento', emoji: '💊' },
  { targetId: 'tab-consultas', title: 'Consultas', content: 'Envía preguntas a la doctora y consulta tus informes médicos', emoji: '🩺' },
  { targetId: 'notification-bell', title: 'Notificaciones', content: 'Aquí verás respuestas de tu coach, recordatorios y citas próximas', emoji: '🔔' },
];

const STORAGE_KEY = (id: string) => `ec_crm_onboarding_${id}`;

export function hasCompletedOnboarding(clientId: string): boolean {
  try { return localStorage.getItem(STORAGE_KEY(clientId)) === 'done'; } catch { return false; }
}

export function resetOnboarding(clientId: string) {
  try { localStorage.removeItem(STORAGE_KEY(clientId)); } catch {}
}

export function OnboardingTour({ clientId, onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const updateRect = useCallback(() => {
    const el = document.getElementById(STEPS[step]?.targetId);
    if (el) setRect(el.getBoundingClientRect());
    else setRect(null);
  }, [step]);

  useEffect(() => {
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [updateRect]);

  const finish = () => {
    try { localStorage.setItem(STORAGE_KEY(clientId), 'done'); } catch {}
    onComplete();
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else finish();
  };

  const skip = () => finish();

  const current = STEPS[step];
  if (!current) return null;

  // Tooltip position: above or below target
  const tooltipStyle: React.CSSProperties = {};
  if (rect) {
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow > 180) {
      tooltipStyle.top = rect.bottom + 12;
    } else {
      tooltipStyle.bottom = window.innerHeight - rect.top + 12;
    }
    tooltipStyle.left = Math.max(16, Math.min(rect.left + rect.width / 2 - 150, window.innerWidth - 316));
  }

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Dark overlay with cutout */}
      <div className="absolute inset-0 bg-black/60" onClick={skip} />

      {/* Spotlight */}
      {rect && (
        <div
          className="absolute border-[3px] border-brand-gold rounded-2xl z-[61] pointer-events-none transition-all duration-300"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
          }}
        />
      )}

      {/* Tooltip */}
      <div className="fixed z-[62] w-[300px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-5 transition-all duration-300" style={tooltipStyle}>
        <div className="flex items-start gap-3 mb-3">
          <span className="text-3xl">{current.emoji}</span>
          <div>
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">{current.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{current.content}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          {/* Step dots */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-brand-green' : i < step ? 'bg-brand-mint' : 'bg-slate-200 dark:bg-slate-700'}`} />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={skip} className="text-xs text-slate-400 hover:text-slate-600 font-semibold px-2 py-1">
              Saltar
            </button>
            <button onClick={next} className="flex items-center gap-1 px-4 py-2 bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold rounded-xl transition-colors">
              {step < STEPS.length - 1 ? (
                <>Siguiente <ChevronRight className="w-3.5 h-3.5" /></>
              ) : (
                <>¡Entendido! <Sparkles className="w-3.5 h-3.5" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
