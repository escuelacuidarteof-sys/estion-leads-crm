import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, CheckCircle2, Activity, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';

export const UpdatePasswordPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [hasRecoverySession, setHasRecoverySession] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;

        const initRecovery = async () => {
            // With PKCE flow + hash router, Supabase puts ?code=xxx before the #
            // We need to manually exchange it for a session
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');

            if (code) {
                try {
                    const { error } = await supabase.auth.exchangeCodeForSession(code);
                    if (!isMounted) return;
                    if (error) {
                        setError('El enlace de recuperación ha expirado o no es válido. Por favor, solicita uno nuevo.');
                        setCheckingSession(false);
                        return;
                    }
                    // Clean the code from URL without reload
                    window.history.replaceState({}, '', window.location.pathname + window.location.hash);
                } catch {
                    if (!isMounted) return;
                    setError('Error al validar el enlace. Por favor, solicita uno nuevo.');
                    setCheckingSession(false);
                    return;
                }
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (!isMounted) return;

            if (session) {
                setHasRecoverySession(true);
                setError(null);
            } else {
                setHasRecoverySession(false);
                if (!code) {
                    setError('El enlace de recuperación ha expirado o no es válido. Por favor, solicita uno nuevo.');
                }
            }

            setCheckingSession(false);
        };

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (!isMounted) return;

            if (event === 'PASSWORD_RECOVERY' || session) {
                setHasRecoverySession(true);
                setError(null);
            } else if (!session) {
                setHasRecoverySession(false);
            }

            setCheckingSession(false);
        });

        initRecovery();

        return () => {
            isMounted = false;
            authListener.subscription.unsubscribe();
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!hasRecoverySession) {
            setError('El enlace de recuperación ha expirado o no es válido. Por favor, solicita uno nuevo.');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({ password: password });
            if (error) throw error;
            setSuccess(true);
            setTimeout(() => {
                navigate('/');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Error al actualizar la contraseña.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] bg-[#CDE8CD]/30 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-15%] left-[-10%] w-[40%] h-[40%] bg-[#CDE8CD]/20 rounded-full blur-[100px]"></div>

            <div className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-extrabold text-[#1a2e1a] tracking-tight mb-2 font-['Montserrat']">
                        Nueva Contraseña
                    </h1>
                    <p className="text-[#1a2e1a]/60 font-medium font-['Open_Sans']">Crea una clave de acceso segura</p>
                </div>

                <div className="bg-white rounded-3xl border border-[#CDE8CD] p-8 md:p-10 shadow-lg shadow-[#CDE8CD]/20">
                    {success ? (
                        <div className="text-center py-4 animate-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 bg-[#CDE8CD] text-[#6BA06B] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#CDE8CD]/30 rotate-6">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#1a2e1a] mb-2 font-['Montserrat']">Contraseña actualizada</h2>
                            <p className="text-[#1a2e1a]/60 mb-6 text-sm font-['Open_Sans']">
                                Tu contraseña se ha cambiado correctamente. Redirigiendo al login...
                            </p>
                            <div className="w-full bg-[#CDE8CD]/30 h-1.5 rounded-full overflow-hidden">
                                <div className="h-full bg-[#6BA06B] rounded-full animate-[progress_3s_linear_forwards]"></div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl flex items-start gap-3">
                                    <Activity className="w-5 h-5 shrink-0" />
                                    <p className="font-medium">{error}</p>
                                </div>
                            )}

                            {checkingSession && (
                                <div className="p-4 bg-[#CDE8CD]/20 border border-[#CDE8CD] text-[#1a2e1a]/70 text-sm rounded-2xl flex items-center gap-3">
                                    <Loader2 className="w-5 h-5 animate-spin text-[#6BA06B]" />
                                    <p className="font-medium">Validando enlace de recuperación...</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-[#1a2e1a]/50 uppercase tracking-widest ml-1">
                                    Nueva Contraseña
                                </label>
                                <div className="relative group">
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-[#CDE8CD]/10 border border-[#CDE8CD] text-[#1a2e1a] pl-12 pr-4 py-4 rounded-2xl focus:ring-2 focus:ring-[#6BA06B]/30 focus:border-[#6BA06B] transition-all outline-none font-semibold placeholder:text-[#1a2e1a]/30"
                                        placeholder="Min. 6 caracteres"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <Lock className="absolute left-4 top-4 w-5 h-5 text-[#6BA06B]/50 group-focus-within:text-[#6BA06B] transition-colors" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-[#1a2e1a]/50 uppercase tracking-widest ml-1">
                                    Confirmar Contraseña
                                </label>
                                <div className="relative group">
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-[#CDE8CD]/10 border border-[#CDE8CD] text-[#1a2e1a] pl-12 pr-4 py-4 rounded-2xl focus:ring-2 focus:ring-[#6BA06B]/30 focus:border-[#6BA06B] transition-all outline-none font-semibold placeholder:text-[#1a2e1a]/30"
                                        placeholder="Repite la clave"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                    <Lock className="absolute left-4 top-4 w-5 h-5 text-[#6BA06B]/50 group-focus-within:text-[#6BA06B] transition-colors" />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || checkingSession || !hasRecoverySession}
                                className="w-full bg-[#6BA06B] hover:bg-[#5a8f5a] text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-70 shadow-lg shadow-[#6BA06B]/20 active:scale-[0.98]"
                            >
                                {loading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        Actualizar Contraseña
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>

                            {!checkingSession && !hasRecoverySession && (
                                <a href="/#/forgot-password" className="w-full bg-[#CDE8CD]/30 border border-[#CDE8CD] text-[#1a2e1a] font-semibold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 hover:bg-[#CDE8CD]/50">
                                    <ArrowLeft className="w-5 h-5" />
                                    Solicitar nuevo enlace
                                </a>
                            )}
                        </form>
                    )}
                </div>
            </div>
            <p className="mt-12 text-[10px] text-[#1a2e1a]/30 font-mono z-10">
                ACADEMIA DIABETES ONLINE
            </p>
            <style>{`
                @keyframes progress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
            `}</style>
        </div>
    );
};
