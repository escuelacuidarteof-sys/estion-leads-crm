import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, X, Sparkles } from 'lucide-react';

interface StaffOnboardingTourProps {
  userId: string;
  onComplete: () => void;
}

interface TourStep {
  targetSelector: string;
  title: string;
  content: string;
  emoji: string;
}

const COACH_STEPS: TourStep[] = [
  {
    targetSelector: '[data-tour="today-focus"]',
    title: 'Bienvenido al CRM',
    content: 'Aquí ves lo que tienes pendiente hoy: check-ins, llamadas, alertas y tareas.',
    emoji: '👋',
  },
  {
    targetSelector: '[data-tour="nav-clients"]',
    title: 'Tu cartera de clientes',
    content: 'Aquí están todos tus clientes activos. Haz click en uno para ver su ficha.',
    emoji: '👥',
  },
  {
    targetSelector: '[data-tour="tab-overview"]',
    title: 'Resumen del cliente',
    content: 'Empieza siempre por aquí: ves el estado general, datos clave y la valoración inicial.',
    emoji: '📋',
  },
  {
    targetSelector: '[data-tour="tab-checkins"]',
    title: 'Evolución semanal',
    content: 'Aquí revisas los check-ins semanales y la evolución de peso de tu cliente.',
    emoji: '📈',
  },
  {
    targetSelector: '[data-tour="tab-program"]',
    title: 'Programa y revisiones',
    content: 'Documenta las llamadas, ajusta el plan y revisa los objetivos desde aquí.',
    emoji: '🎯',
  },
  {
    targetSelector: '[data-tour="nav-alerts"]',
    title: 'Alertas de riesgo',
    content: 'Las alertas te avisan si un cliente lleva tiempo sin conectar o tiene riesgo de abandono.',
    emoji: '⚠️',
  },
  {
    targetSelector: '[data-tour="nav-manual"]',
    title: '¿Dudas? Consulta el manual',
    content: 'Aquí encontrarás procedimientos, protocolos y guías para tu trabajo diario.',
    emoji: '📖',
  },
  {
    targetSelector: '[data-tour="sidebar-search"]',
    title: 'Buscador rápido',
    content: 'Usa el buscador del menú para encontrar cualquier sección sin navegar.',
    emoji: '🔍',
  },
];

const STORAGE_KEY = (id: string) => `ec_crm_staff_onboarding_${id}`;

export function hasCompletedStaffOnboarding(userId: string): boolean {
  try { return localStorage.getItem(STORAGE_KEY(userId)) === 'done'; } catch { return false; }
}

export function resetStaffOnboarding(userId: string) {
  try { localStorage.removeItem(STORAGE_KEY(userId)); } catch {}
}

export function StaffOnboardingTour({ userId, onComplete }: StaffOnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const updateRect = useCallback(() => {
    const el = document.querySelector(COACH_STEPS[step]?.targetSelector);
    if (el) setRect(el.getBoundingClientRect());
    else setRect(null);
  }, [step]);

  useEffect(() => {
    updateRect();
    const timer = setTimeout(updateRect, 300);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [updateRect]);

  const finish = () => {
    try { localStorage.setItem(STORAGE_KEY(userId), 'done'); } catch {}
    onComplete();
  };

  const next = () => {
    if (step < COACH_STEPS.length - 1) setStep(step + 1);
    else finish();
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  const current = COACH_STEPS[step];
  if (!current) return null;

  const tooltipStyle: React.CSSProperties = {};
  if (rect) {
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceRight = window.innerWidth - rect.right;
    if (spaceBelow > 200) {
      tooltipStyle.top = rect.bottom + 14;
    } else {
      tooltipStyle.bottom = window.innerHeight - rect.top + 14;
    }
    if (spaceRight > 340) {
      tooltipStyle.left = Math.max(16, rect.left);
    } else {
      tooltipStyle.left = Math.max(16, Math.min(rect.left + rect.width / 2 - 160, window.innerWidth - 336));
    }
  } else {
    tooltipStyle.top = '50%';
    tooltipStyle.left = '50%';
    tooltipStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => {}} />

      {rect && (
        <div
          className="absolute rounded-2xl z-[10000] pointer-events-none transition-all duration-500 ease-out"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.55), 0 0 30px 4px rgba(99, 102, 241, 0.3)',
            border: '3px solid #6366f1',
          }}
        />
      )}

      <div
        className="fixed z-[10001] w-[320px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300"
        style={tooltipStyle}
      >
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{current.emoji}</span>
            <h3 className="font-black text-sm text-white">{current.title}</h3>
          </div>
          <button onClick={finish} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
            <X className="w-4 h-4 text-white/70" />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-slate-600 leading-relaxed">{current.content}</p>

          <div className="flex items-center justify-between mt-5">
            <div className="flex gap-1.5">
              {COACH_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? 'w-6 bg-indigo-500' : i < step ? 'w-1.5 bg-indigo-300' : 'w-1.5 bg-slate-200'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {step > 0 && (
                <button onClick={prev} className="text-xs text-slate-400 hover:text-slate-600 font-semibold px-2 py-1">
                  Atrás
                </button>
              )}
              <button onClick={finish} className="text-xs text-slate-400 hover:text-slate-600 font-semibold px-2 py-1">
                Saltar
              </button>
              <button
                onClick={next}
                className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-md"
              >
                {step < COACH_STEPS.length - 1 ? (
                  <>Siguiente <ChevronRight className="w-3.5 h-3.5" /></>
                ) : (
                  <>¡Listo! <Sparkles className="w-3.5 h-3.5" /></>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-5 py-2 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-medium text-center">
            Paso {step + 1} de {COACH_STEPS.length} · Puedes repetir este tour desde tu perfil
          </p>
        </div>
      </div>
    </div>
  );
}
