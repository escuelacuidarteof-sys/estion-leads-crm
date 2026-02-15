import React, { useState, useEffect } from 'react';
import {
  Activity, ArrowRight, Lock,
  User, Smartphone, Loader2
} from 'lucide-react';
import InstallationGuide from './InstallationGuide';

interface LoginProps {
  onLogin: (identifier: string, password?: string, roleType?: 'staff' | 'client') => Promise<void>;
  onRegisterClick?: () => void;
  error?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegisterClick, error: externalError }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const isEmail = identifier.includes('@');

  useEffect(() => {
    if (externalError) setError(externalError);
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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle background shapes */}
      <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] bg-brand-mint/30 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-15%] left-[-10%] w-[40%] h-[40%] bg-brand-mint/20 rounded-full blur-[100px]"></div>

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="mb-10 text-center">
          <div className="inline-block p-4 bg-brand-mint/30 backdrop-blur-sm rounded-[2.5rem] border border-brand-mint mb-6 shadow-lg">
            <img
              src="/logo.png"
              alt="Escuela Cuid-Arte"
              className="w-20 h-20 rounded-[2rem] object-cover shadow-md"
            />
          </div>
          <h1 className="text-4xl font-heading font-black text-brand-dark tracking-tight mb-2">
            Escuela Cuid-Arte
          </h1>
          <p className="text-brand-green font-medium font-body">Ciencia con calidez</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-brand-mint/50 p-8 md:p-10 shadow-xl">
          <div className="mb-8">
            <h2 className="text-xl font-heading font-bold text-brand-dark text-center">Bienvenida de nuevo</h2>
            <p className="text-gray-500 text-sm text-center mt-1 font-body">Ingresa tus datos para acceder a tu panel</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl flex items-start gap-3">
              <Activity className="w-5 h-5 shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-heading">
                Identificador de Acceso
              </label>
              <div className="relative group">
                <input
                  type="text"
                  required
                  className="w-full bg-brand-mint-light/50 border border-brand-mint text-brand-dark pl-12 pr-4 py-4 rounded-2xl focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-all outline-none font-semibold placeholder:text-gray-400 font-body"
                  placeholder="Email o Telefono"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
                <User className="absolute left-4 top-4 w-5 h-5 text-brand-green/50 group-focus-within:text-brand-green transition-colors" />
              </div>
            </div>

            {isEmail && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-heading">
                  Contrasena
                </label>
                <div className="relative group">
                  <input
                    type="password"
                    required
                    className="w-full bg-brand-mint-light/50 border border-brand-mint text-brand-dark pl-12 pr-4 py-4 rounded-2xl focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-all outline-none font-semibold placeholder:text-gray-400 font-body"
                    placeholder="........"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Lock className="absolute left-4 top-4 w-5 h-5 text-brand-green/50 group-focus-within:text-brand-green transition-colors" />
                </div>
                <div className="flex justify-end px-1">
                  <a href="/#/forgot-password" className="text-xs text-brand-green hover:text-brand-green-dark font-bold">
                    Has olvidado la contrasena?
                  </a>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-heading font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-70 mt-4 shadow-lg shadow-brand-green/20 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Acceder al Portal
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-8 border-t border-brand-mint/50 space-y-4">
            {!isEmail && (
              <p className="text-xs text-gray-400 text-center italic font-body">
                * Si eres alumna y usas telefono, recibiras acceso directo tras la validacion.
              </p>
            )}

            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="w-full text-brand-green hover:text-brand-green-dark font-bold transition-all text-xs flex items-center justify-center gap-2 group border border-brand-mint py-3 rounded-2xl hover:bg-brand-mint-light"
            >
              <Smartphone className="w-4 h-4" />
              Instalar como Aplicacion (App)
            </button>
          </div>
        </div>

        <InstallationGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      </div>

      <p className="mt-12 text-[10px] text-gray-400 font-body z-10">
        v1.0 | Escuela Cuid-Arte
      </p>
    </div>
  );
};

export default Login;
