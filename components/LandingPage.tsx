import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, Loader2, Lock, Smartphone, User } from 'lucide-react';
import InstallationGuide from './InstallationGuide';

interface LandingPageProps {
  onLogin: (identifier: string, password?: string, roleType?: 'staff' | 'client') => Promise<void>;
  error?: string;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, error: externalError }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const isEmail = identifier.includes('@');

  useEffect(() => {
    if (externalError) {
      setError(externalError);
    }
  }, [externalError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const predictedRole = isEmail ? 'staff' : 'client';
      await onLogin(identifier, password, predictedRole);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6faf6] text-brand-dark px-6 py-12 md:py-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Open+Sans:wght@400;600;700&display=swap');

        :root {
          --brand-green: #6BA06B;
          --brand-mint: #CDE8CD;
          --brand-gold: #D4AF37;
          --brand-dark: #1a2e1a;
        }

        .font-heading { font-family: 'Montserrat', sans-serif; }
        .font-body { font-family: 'Open Sans', sans-serif; }
      `}</style>

      <div className="max-w-3xl mx-auto">
        <header className="mb-8 text-center">
          <img src="/logo.png" alt="Escuela Cuid-Arte" className="w-20 h-20 rounded-2xl mx-auto mb-5 shadow-sm border border-brand-mint/60" />
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-brand-dark tracking-tight">
            Acceso a Zona Alumnos
          </h1>
          <p className="font-body text-slate-600 mt-4 text-lg">
            Entra con tus credenciales y continua tu seguimiento en la plataforma.
          </p>
        </header>

        <section className="bg-white rounded-[2rem] border border-brand-mint/70 shadow-[0_18px_45px_rgba(107,160,107,0.14)] p-7 md:p-10 mb-7">
          <div className="mb-7">
            <h2 className="font-heading text-xl font-bold text-brand-dark mb-4">Instrucciones rapidas</h2>
            <ul className="font-body text-slate-600 space-y-2 text-sm md:text-base">
              <li>1. Introduce tu email o telefono.</li>
              <li>2. Si usas email, te pedira contrasena.</li>
              <li>3. Si olvidaste tu contrasena, usa el enlace de recuperacion.</li>
            </ul>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="font-body text-[11px] uppercase tracking-widest text-slate-500 font-bold ml-1">Email o telefono</label>
              <div className="relative mt-2">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="tu@email.com o telefono"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 font-body font-semibold text-brand-dark placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-mint focus:border-brand-green"
                />
                <User className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {(isEmail || identifier.length > 5) && (
              <div>
                <label className="font-body text-[11px] uppercase tracking-widest text-slate-500 font-bold ml-1">Contrasena</label>
                <div className="relative mt-2">
                  <input
                    type="password"
                    required={isEmail}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 font-body font-semibold text-brand-dark placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-mint focus:border-brand-green"
                  />
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
                {isEmail && (
                  <div className="text-right mt-2">
                    <a href="/#/forgot-password" className="font-body text-sm text-brand-green font-bold hover:underline">
                      He olvidado mi contrasena
                    </a>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-green hover:bg-[#558055] text-white rounded-2xl py-4 font-heading font-bold text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Entrar <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="w-full mt-5 border border-brand-mint bg-brand-mint/25 hover:bg-brand-mint/40 rounded-2xl py-3 font-body text-sm font-bold text-[#3b5d3b] flex items-center justify-center gap-2 transition-colors"
          >
            <Smartphone className="w-4 h-4" />
            Como instalar en mi movil
          </button>
        </section>

        <p className="font-body text-center text-xs text-slate-400 font-semibold uppercase tracking-[0.2em]">
          Escuela Cuid-Arte
        </p>
      </div>

      <InstallationGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
};

export default LandingPage;
