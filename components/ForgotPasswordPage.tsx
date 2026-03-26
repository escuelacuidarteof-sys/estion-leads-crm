import React, { useState } from 'react';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, Activity, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);

    const sendResetEmail = async () => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/#/update-password`,
        });

        if (error) {
            if (error.message.includes('rate limit')) {
                throw new Error('Has solicitado demasiados correos. Espera un momento antes de intentarlo de nuevo.');
            }
            console.warn('Reset password error:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await sendResetEmail();
            setSubmitted(true);
        } catch (err: any) {
            setError(err.message || 'Error al enviar el correo.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        setError(null);
        try {
            await sendResetEmail();
            setResent(true);
            setTimeout(() => setResent(false), 4000);
        } catch (err: any) {
            setError(err.message || 'Error al reenviar el correo.');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] bg-[#CDE8CD]/30 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-15%] left-[-10%] w-[40%] h-[40%] bg-[#CDE8CD]/20 rounded-full blur-[100px]"></div>

            <div className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="mb-10 text-center">
                    <a href="/" className="inline-flex items-center text-sm text-[#6BA06B] hover:text-[#1a2e1a] transition-colors mb-6 group font-medium">
                        <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                        Volver al Login
                    </a>
                    <h1 className="text-3xl font-extrabold text-[#1a2e1a] tracking-tight mb-2 font-['Montserrat']">
                        Recuperar Acceso
                    </h1>
                    <p className="text-[#1a2e1a]/60 font-medium font-['Open_Sans']">Restablece tu contraseña de forma segura</p>
                </div>

                <div className="bg-white rounded-3xl border border-[#CDE8CD] p-8 md:p-10 shadow-lg shadow-[#CDE8CD]/20">
                    {submitted ? (
                        <div className="text-center py-4 animate-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 bg-[#CDE8CD] text-[#6BA06B] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#CDE8CD]/30 rotate-6">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#1a2e1a] mb-2 font-['Montserrat']">Comprueba tu correo</h2>
                            <p className="text-[#1a2e1a]/60 mb-6 text-sm font-['Open_Sans']">
                                Si el email <strong className="text-[#1a2e1a]">{email}</strong> está registrado, recibirás un enlace en unos instantes.
                            </p>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl flex items-start gap-2 mb-4">
                                    <Activity className="w-4 h-4 shrink-0 mt-0.5" />
                                    <p className="font-medium">{error}</p>
                                </div>
                            )}

                            <button
                                onClick={handleResend}
                                disabled={resending || resent}
                                className="w-full bg-[#CDE8CD]/40 border border-[#CDE8CD] text-[#1a2e1a] font-semibold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 hover:bg-[#CDE8CD]/60 disabled:opacity-60 mb-3"
                            >
                                {resending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : resent ? (
                                    <>
                                        <CheckCircle2 className="w-5 h-5 text-[#6BA06B]" />
                                        Correo reenviado
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-4 h-4" />
                                        Reenviar correo
                                    </>
                                )}
                            </button>

                            <a href="/" className="w-full bg-white border border-[#CDE8CD] text-[#6BA06B] font-semibold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 hover:bg-[#CDE8CD]/20">
                                <ArrowLeft className="w-5 h-5" />
                                Volver al Inicio
                            </a>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl flex items-start gap-3">
                                    <Activity className="w-5 h-5 shrink-0" />
                                    <p className="font-medium">{error}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-[#1a2e1a]/50 uppercase tracking-widest ml-1">
                                    Email de tu cuenta
                                </label>
                                <div className="relative group">
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-[#CDE8CD]/10 border border-[#CDE8CD] text-[#1a2e1a] pl-12 pr-4 py-4 rounded-2xl focus:ring-2 focus:ring-[#6BA06B]/30 focus:border-[#6BA06B] transition-all outline-none font-semibold placeholder:text-[#1a2e1a]/30"
                                        placeholder="tu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    <Mail className="absolute left-4 top-4 w-5 h-5 text-[#6BA06B]/50 group-focus-within:text-[#6BA06B] transition-colors" />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#6BA06B] hover:bg-[#5a8f5a] text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-70 shadow-lg shadow-[#6BA06B]/20 active:scale-[0.98]"
                            >
                                {loading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        Enviar Instrucciones
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
            <p className="mt-12 text-[10px] text-[#1a2e1a]/30 font-mono z-10">
                ACADEMIA DIABETES ONLINE
            </p>
        </div>
    );
};
