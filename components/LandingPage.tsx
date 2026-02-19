import React, { useState, useEffect, useRef } from 'react';
import {
    Activity, ArrowRight, Lock, User, Smartphone, Loader2,
    CheckCircle2, Sparkles, Heart, Shield, Users, Database,
    Layout as LayoutIcon, MessageSquare, FileText, ChevronDown,
    Stethoscope, Brain, Apple
} from 'lucide-react';
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
    const [showLogin, setShowLogin] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const loginSectionRef = useRef<HTMLDivElement>(null);

    const isEmail = identifier.includes('@');

    useEffect(() => {
        if (externalError) {
            setError(externalError);
            setShowLogin(true);
            loginSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [externalError]);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const predictedRole = isEmail ? 'staff' : 'client';
            await onLogin(identifier, password, predictedRole);
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    const scrollToLogin = () => {
        setShowLogin(true);
        setTimeout(() => {
            loginSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    return (
        <div className="min-h-screen bg-[#f8faf8] font-body text-brand-dark overflow-x-hidden">
            {/* --- Navegación --- */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-white/80 backdrop-blur-xl shadow-sm py-4' : 'bg-transparent py-6'}`}>
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-mint rounded-xl overflow-hidden shadow-sm">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xl font-heading font-black tracking-tight text-brand-dark hidden md:block">
                            Escuela <span className="text-brand-green">Cuid-Arte</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-6">
                        <button
                            onClick={scrollToLogin}
                            className="px-6 py-2.5 bg-brand-dark text-white rounded-full font-bold text-sm hover:bg-brand-green transition-all shadow-lg active:scale-95"
                        >
                            Acceso Alumnas
                        </button>
                    </div>
                </div>
            </nav>

            {/* --- Hero Section --- */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
                {/* Decoraciones de fondo */}
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-mint/40 rounded-full blur-[120px] -z-10 animate-pulse"></div>
                <div className="absolute bottom-10 left-[-5%] w-[40%] h-[40%] bg-brand-green/10 rounded-full blur-[100px] -z-10"></div>

                <div className="container mx-auto text-center max-w-4xl">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-mint/30 rounded-full text-brand-green font-bold text-xs mb-8 border border-brand-mint animate-fade-in">
                        <Sparkles className="w-3.5 h-3.5" />
                        EL MÉTODO QUE ESTÁ REVOLUCIONANDO LA SALUD
                    </div>

                    <h1 className="text-5xl md:text-7xl font-heading font-black text-brand-dark leading-[1.1] mb-8 tracking-tighter">
                        Ciencia con <span className="text-brand-green italic">calidez</span> para tu bienestar real
                    </h1>

                    <p className="text-lg md:text-xl text-gray-600 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                        Entra en un ecosistema diseñado para transformar tu salud con acompañamiento médico, nutricional y psicológico continuo. Porque los datos importan, pero tú importas más.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={scrollToLogin}
                            className="w-full sm:w-auto px-10 py-5 bg-brand-green text-white rounded-2xl font-black text-lg shadow-xl shadow-brand-green/20 hover:bg-brand-green-dark transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                            Comenzar Transformación
                            <ArrowRight className="w-6 h-6" />
                        </button>
                        <button className="w-full sm:w-auto px-10 py-5 bg-white text-brand-dark border-2 border-brand-mint rounded-2xl font-bold text-lg hover:bg-brand-mint/20 transition-all flex items-center justify-center gap-3">
                            Descubrir el Método
                            <ChevronDown className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="mt-20 relative px-4">
                        <div className="relative z-10 bg-white rounded-[2.5rem] shadow-2xl border border-brand-mint/50 p-4 md:p-6 max-w-5xl mx-auto overflow-hidden">
                            <div className="aspect-video bg-slate-50 rounded-[1.5rem] flex items-center justify-center overflow-hidden border border-slate-100">
                                <img
                                    src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200"
                                    alt="Bienestar"
                                    className="w-full h-full object-cover opacity-80"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/40 to-transparent flex flex-col justify-end p-8 text-left">
                                    <div className="flex items-center gap-4 text-white">
                                        <div className="w-12 h-12 rounded-full bg-brand-green/80 flex items-center justify-center border border-white/20">
                                            <Activity className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold">Panel de Control 2.0</h3>
                                            <p className="text-white/80 text-sm">Monitorización en tiempo real de tu evolución</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Notificaciones flotantes de ejemplo */}
                        <div className="absolute -right-4 top-10 hidden lg:block animate-float" style={{ animationDelay: '0s' }}>
                            <div className="glass p-4 rounded-2xl shadow-xl flex items-center gap-4 hover:scale-105 transition-all">
                                <div className="bg-brand-mint p-2 rounded-xl"><Apple className="text-brand-green w-5 h-5" /></div>
                                <div><p className="text-[10px] text-gray-500 font-bold uppercase">Nutrición</p><p className="text-xs font-black">Plan actualizado ✅</p></div>
                            </div>
                        </div>
                        <div className="absolute -left-4 bottom-20 hidden lg:block animate-float" style={{ animationDelay: '1.5s' }}>
                            <div className="glass p-4 rounded-2xl shadow-xl flex items-center gap-4 hover:scale-105 transition-all">
                                <div className="bg-blue-100 p-2 rounded-xl"><Stethoscope className="text-blue-500 w-5 h-5" /></div>
                                <div><p className="text-[10px] text-gray-500 font-bold uppercase">Médico</p><p className="text-xs font-black">Informe listo</p></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Pilares del Método --- */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-5xl font-heading font-black mb-4">El Método Cuid-Arte</h2>
                    <p className="text-gray-500 mb-16 max-w-xl mx-auto">Un abordaje 360º donde la ciencia se adapta a tu ritmo, y no al revés.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Stethoscope,
                                title: "Supervisión Médica",
                                desc: "Nuestros doctores validan cada paso de tu proceso, asegurando que tu salud sea siempre la prioridad número uno.",
                                color: "bg-cyan-50",
                                iconColor: "text-cyan-600"
                            },
                            {
                                icon: Apple,
                                title: "Nutrición Clínica",
                                desc: "Planes adaptados a tu metabolismo, estilo de vida y objetivos, sin restricciones innecesarias.",
                                color: "bg-emerald-50",
                                iconColor: "text-emerald-600"
                            },
                            {
                                icon: Brain,
                                title: "Bienestar Mental",
                                desc: "Apoyo psicológico para gestionar la relación con la comida, el estrés y la motivación duradera.",
                                color: "bg-purple-50",
                                iconColor: "text-purple-600"
                            }
                        ].map((pilar, i) => (
                            <div key={i} className="group p-10 rounded-[2.5rem] border border-slate-100 hover:border-brand-mint transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 bg-slate-50/30">
                                <div className={`w-20 h-20 ${pilar.color} rounded-[1.5rem] flex items-center justify-center mb-8 mx-auto group-hover:scale-110 transition-transform`}>
                                    <pilar.icon className={`w-10 h-10 ${pilar.iconColor}`} />
                                </div>
                                <h3 className="text-2xl font-black mb-4">{pilar.title}</h3>
                                <p className="text-gray-500 leading-relaxed">{pilar.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Herramientas --- */}
            <section className="py-24 bg-[#f8faf8]">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="flex-1 space-y-8">
                            <div className="inline-block px-4 py-2 bg-brand-green/10 rounded-full text-brand-green font-bold text-xs">TECNOLOGÍA PROPIA</div>
                            <h2 className="text-4xl md:text-6xl font-heading font-black leading-tight">Tu salud, siempre contigo en tu bolsillo</h2>
                            <p className="text-gray-600 text-lg leading-relaxed font-medium">Hemos desarrollado una plataforma exclusiva para que tengas todo lo necesario a un clic de distancia.</p>

                            <ul className="space-y-6">
                                {[
                                    { icon: MessageSquare, text: "Chat directo con tu Equipo Médico y Coaches" },
                                    { icon: FileText, text: "Historial de informes médicos y analíticas" },
                                    { icon: Database, text: "Seguimiento diario de hábitos y métricas" },
                                    { icon: LayoutIcon, text: "Biblioteca de recursos y clases magistrales" }
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-brand-green border border-brand-mint">
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <span className="font-bold text-brand-dark">{item.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="flex-1 relative">
                            <div className="relative bg-brand-dark rounded-[3rem] p-4 shadow-2xl border-8 border-brand-dark/10 overflow-hidden aspect-[9/16] max-w-sm mx-auto">
                                <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center p-8 text-center">
                                    <img src="/logo.png" className="w-24 h-24 rounded-3xl mb-6 shadow-xl" alt="App" />
                                    <div className="w-full h-2 bg-slate-200 rounded-full mb-3"></div>
                                    <div className="w-2/3 h-2 bg-slate-200 rounded-full mb-8"></div>
                                    <div className="grid grid-cols-2 gap-3 w-full">
                                        <div className="h-20 bg-white rounded-2xl shadow-sm border border-slate-100"></div>
                                        <div className="h-20 bg-white rounded-2xl shadow-sm border border-slate-100"></div>
                                        <div className="h-20 bg-white rounded-2xl shadow-sm border border-slate-100"></div>
                                        <div className="h-20 bg-white rounded-2xl shadow-sm border border-slate-100"></div>
                                    </div>
                                </div>
                            </div>
                            {/* Deco */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-mint rounded-full blur-[80px] -z-10 animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Trabajo Diario --- */}
            <section className="py-24 bg-white relative overflow-hidden">
                <div className="container mx-auto px-6">
                    <div className="max-w-3xl mx-auto text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-heading font-black mb-6">Tu día a día en la Escuela</h2>
                        <p className="text-gray-500 text-lg">Un proceso guiado donde nunca estarás sola. Así es como trabajaremos juntas cada semana.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                        {/* Connector line for desktop */}
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-brand-mint/30 -translate-y-12 hidden md:block -z-10"></div>

                        {[
                            {
                                step: "01",
                                title: "Check-in Diario",
                                desc: "Registras tus métricas y sensaciones en la app en menos de 2 minutos.",
                                icon: Smartphone
                            },
                            {
                                step: "02",
                                title: "Feedback Experto",
                                desc: "Tu coach o doctor revisa tus datos y ajusta tu plan según tu evolución.",
                                icon: MessageSquare
                            },
                            {
                                step: "03",
                                title: "Clases y Recursos",
                                desc: "Accedes a contenido exclusivo para entender el 'por qué' de cada cambio.",
                                icon: LayoutIcon
                            },
                            {
                                step: "04",
                                title: "Evolución Real",
                                desc: "Ves resultados tangibles respaldados por ciencia y acompañamiento constante.",
                                icon: Activity
                            }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center text-center group">
                                <div className="w-16 h-16 bg-white border-4 border-brand-mint rounded-2xl flex items-center justify-center text-brand-green font-black text-xl mb-6 shadow-xl group-hover:scale-110 transition-transform relative z-10">
                                    <item.icon className="w-8 h-8" />
                                    <div className="absolute -top-3 -right-3 bg-brand-dark text-white text-[10px] w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">{item.step}</div>
                                </div>
                                <h4 className="text-xl font-black mb-3">{item.title}</h4>
                                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Profesionales --- */}
            <section className="py-24 bg-brand-dark text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-brand-green/20 rounded-full blur-[150px]"></div>
                <div className="container mx-auto px-6 text-center relative z-10">
                    <h2 className="text-3xl md:text-5xl font-heading font-black mb-16">Un equipo de élite a tu servicio</h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                        {[
                            { role: "Coaches", label: "Acompañamiento 24/7", color: "bg-indigo-500" },
                            { role: "Doctores", label: "Medicina de Precisión", color: "bg-cyan-500" },
                            { role: "Psicólogos", label: "Gestión Emocional", color: "bg-purple-500" },
                            { role: "Expertos", label: "Nutrición Clínica", color: "bg-emerald-500" }
                        ].map((item, i) => (
                            <div key={i} className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-all group">
                                <div className={`w-3 h-3 rounded-full ${item.color} mb-4 mx-auto glow`}></div>
                                <h4 className="text-2xl font-black mb-1">{item.role}</h4>
                                <p className="text-white/50 text-xs font-bold uppercase tracking-widest">{item.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-20 p-10 bg-brand-green rounded-[3rem] max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 animate-pulse-glow">
                        <div className="text-left">
                            <h3 className="text-2xl font-black mb-2">¿Preparada para transformar tu vida?</h3>
                            <p className="text-white/80 font-medium italic">Accede a tu portal personalizado y empieza hoy mismo.</p>
                        </div>
                        <button
                            onClick={scrollToLogin}
                            className="px-10 py-5 bg-brand-dark text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all text-lg"
                        >
                            Acceder Ahora
                        </button>
                    </div>
                </div>
            </section>

            {/* --- Login Section --- */}
            <section
                ref={loginSectionRef}
                className={`py-32 px-6 transition-all duration-1000 ${showLogin ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-10'}`}
            >
                <div className="container mx-auto flex flex-col items-center">
                    <div className="w-full max-w-md">
                        <div className="bg-white rounded-[3rem] shadow-2xl border border-brand-mint/50 p-10 md:p-12 relative overflow-hidden">
                            {/* Background decoration in card */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-mint/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                            <div className="mb-10 text-center relative z-10">
                                <div className="inline-block p-4 bg-brand-mint/30 backdrop-blur-sm rounded-3xl border border-brand-mint mb-6 shadow-lg">
                                    <img src="/logo.png" alt="Escuela Cuid-Arte" className="w-16 h-16 rounded-2xl object-cover shadow-md" />
                                </div>
                                <h2 className="text-3xl font-heading font-black text-brand-dark tracking-tight">Acceso Privado</h2>
                                <p className="text-gray-500 font-medium mt-2">Bienvenida a tu espacio de cambio</p>
                            </div>

                            {error && (
                                <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl flex items-start gap-3 animate-shake">
                                    <Activity className="w-5 h-5 shrink-0" />
                                    <p className="font-bold">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Identificador</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-slate-50 border-2 border-slate-100 text-brand-dark pl-12 pr-4 py-4 rounded-2xl focus:ring-4 focus:ring-brand-mint focus:border-brand-green transition-all outline-none font-bold placeholder:text-gray-300"
                                            placeholder="Email o Teléfono"
                                            value={identifier}
                                            onChange={(e) => setIdentifier(e.target.value)}
                                        />
                                        <User className="absolute left-4 top-4.5 w-5 h-5 text-gray-400 group-focus-within:text-brand-green transition-colors" />
                                    </div>
                                </div>

                                {(isEmail || identifier.length > 5) && (
                                    <div className="space-y-2 animate-fade-in">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contraseña</label>
                                        <div className="relative group">
                                            <input
                                                type="password"
                                                required={isEmail}
                                                className="w-full bg-slate-50 border-2 border-slate-100 text-brand-dark pl-12 pr-4 py-4 rounded-2xl focus:ring-4 focus:ring-brand-mint focus:border-brand-green transition-all outline-none font-bold placeholder:text-gray-300"
                                                placeholder="········"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                            <Lock className="absolute left-4 top-4.5 w-5 h-5 text-gray-400 group-focus-within:text-brand-green transition-colors" />
                                        </div>
                                        {isEmail && (
                                            <div className="flex justify-end pt-1">
                                                <a href="/#/forgot-password" title="Recuperar contraseña" className="text-xs text-brand-green font-bold hover:underline">¿Olvidaste tu contraseña?</a>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-brand-dark hover:bg-brand-green text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-70 mt-4 shadow-xl active:scale-[0.98]"
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Acceder al Portal <ArrowRight className="w-5 h-5" /></>}
                                </button>
                            </form>

                            <div className="mt-10 pt-8 border-t border-slate-100 space-y-4">
                                <button
                                    type="button"
                                    onClick={() => setIsGuideOpen(true)}
                                    className="w-full text-brand-green hover:text-brand-green-dark font-black transition-all text-xs flex items-center justify-center gap-2 group border-2 border-brand-mint/30 py-4 rounded-2xl hover:bg-brand-mint/10"
                                >
                                    <Smartphone className="w-4 h-4" />
                                    Instalar como Aplicación móvil
                                </button>
                            </div>
                        </div>

                        <div className="mt-12 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            Escuela Cuid-Arte © 2026 | Ciencia con Calidez
                        </div>
                    </div>
                </div>
            </section>

            <InstallationGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
        </div>
    );
};

export default LandingPage;
