import React, { useState, useEffect, useRef } from 'react';
import {
    Activity, ArrowRight, Lock, User, Smartphone, Loader2,
    CheckCircle2, Sparkles, Heart, Shield, Users, Database,
    Layout as LayoutIcon, MessageSquare, FileText, ChevronDown,
    Brain, Apple, Award
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
        <div className="min-h-screen bg-[#f8faf8] font-body text-brand-dark overflow-x-hidden selection:bg-brand-green/30">
            {/* Google Fonts - Outfit */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
                
                :root {
                    --brand-mint: #e2f4ea;
                    --brand-green: #2fb47c;
                    --brand-green-dark: #248a5f;
                    --brand-dark: #1a1c1e;
                }

                * { font-family: 'Outfit', sans-serif; }

                @keyframes float {
                    0% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-15px) rotate(2deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }

                @keyframes pulse-glow {
                    0% { box-shadow: 0 0 0 0 rgba(47, 180, 124, 0.4); }
                    70% { box-shadow: 0 0 0 20px rgba(47, 180, 124, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(47, 180, 124, 0); }
                }

                .glass {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }

                .animate-reveal {
                    animation: reveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                @keyframes reveal {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .text-gradient {
                    background: linear-gradient(135deg, var(--brand-dark) 0%, #4a5568 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
            `}</style>
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
                            className="px-8 py-3 bg-brand-dark text-white rounded-full font-bold text-sm hover:bg-brand-green hover:shadow-lg hover:shadow-brand-green/20 transition-all active:scale-95 border border-white/10"
                        >
                            Acceso Privado
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

                    <h1 className="text-6xl md:text-[5.5rem] font-black text-gradient leading-[0.95] mb-8 tracking-tighter animate-reveal">
                        Tu salud merece <br />
                        <span className="text-brand-green italic relative inline-block">
                            ciencia con alma
                            <svg className="absolute -bottom-4 left-0 w-full h-4 text-brand-mint/60 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 Q 25 0 50 5 T 100 5" stroke="currentColor" strokeWidth="8" fill="transparent" strokeLinecap="round" />
                            </svg>
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-500 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                        El primer programa oncológico <span className="text-brand-dark font-black">personalizado</span> que une medicina de vanguardia con un seguimiento humano constante.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <button
                            onClick={scrollToLogin}
                            className="group w-full sm:w-auto px-12 py-6 bg-brand-green text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-brand-green/30 hover:bg-brand-green-dark hover:-translate-y-1 transition-all flex items-center justify-center gap-4 active:scale-[0.98]"
                        >
                            Empezar mi camino
                            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <div className="mt-20 relative px-4 max-w-5xl mx-auto">
                        {/* Decorative background cards for depth */}
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[90%] h-full bg-white/40 rounded-[2.5rem] -z-10 border border-brand-mint/20 transform rotate-1 scale-105 blur-[2px]"></div>
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[95%] h-full bg-white/60 rounded-[2.5rem] -z-10 border border-brand-mint/30 transform -rotate-1 scale-102"></div>

                        <div className="relative z-10 bg-white rounded-[2.5rem] shadow-2xl border border-brand-mint/50 p-4 md:p-6 overflow-hidden transform transition-all duration-700 hover:shadow-brand-green/10">
                            <div
                                onClick={scrollToLogin}
                                className="aspect-video bg-slate-50 rounded-[1.5rem] flex items-center justify-center overflow-hidden border border-slate-100 relative group cursor-pointer"
                            >
                                <img
                                    src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200"
                                    alt="Bienestar"
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                />
                                {/* Play Button Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 shadow-2xl transform transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-green/20">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                                            <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-brand-green border-b-[10px] border-b-transparent ml-1"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/60 via-transparent to-transparent flex flex-col justify-end p-8 text-left">
                                    <div className="flex items-center gap-4 text-white">
                                        <div className="w-12 h-12 rounded-full bg-brand-green/80 flex items-center justify-center border border-white/20 shadow-lg">
                                            <Activity className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black">Panel de Control 2.0</h3>
                                            <p className="text-white/80 text-sm font-medium">Monitorización en tiempo real de tu evolución</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notificaciones flotantes con mejor visibilidad y z-index */}
                        <div className="absolute -right-8 top-10 hidden lg:block animate-float z-20" style={{ animationDelay: '0s' }}>
                            <div className="glass p-5 rounded-2xl shadow-xl flex items-center gap-4 hover:scale-110 transition-all border border-white/50">
                                <div className="bg-brand-mint p-2.5 rounded-xl shadow-inner"><Apple className="text-brand-green w-6 h-6" /></div>
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Nutrición</p>
                                    <p className="text-sm font-black text-brand-dark">Plan actualizado ✅</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -left-8 bottom-20 hidden lg:block animate-float z-20" style={{ animationDelay: '1.5s' }}>
                            <div className="glass p-5 rounded-2xl shadow-xl flex items-center gap-4 hover:scale-110 transition-all border border-white/50">
                                <div className="bg-orange-100 p-2.5 rounded-xl shadow-inner"><Brain className="text-orange-500 w-6 h-6" /></div>
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Mente</p>
                                    <p className="text-sm font-black text-brand-dark">Gestión emocional</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- El Camino A to Z --- */}
            <section className="py-32 bg-white relative overflow-hidden">
                <div className="container mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-gradient">Tu transformación de la A a la Z</h2>
                        <p className="text-lg text-gray-500 font-medium">Un proceso estructurado para que sepas exactamente qué esperar en cada etapa.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                        {/* Line connector hidden on mobile */}
                        <div className="absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-brand-mint/50 hidden md:block -z-0"></div>

                        {[
                            {
                                step: "A",
                                title: "Diagnóstico 360",
                                desc: "Revisamos tu historial médico, hábitos y estado emocional para entender tu punto de partida único.",
                                color: "bg-brand-mint text-brand-green"
                            },
                            {
                                step: "B",
                                title: "Plan Maestro",
                                desc: "Diseñamos tu hoja de ruta personalizada: nutrición anti-inflamatoria, movilidad y gestión del estrés.",
                                color: "bg-brand-green text-white"
                            },
                            {
                                step: "C",
                                title: "Acción Diaria",
                                desc: "Acompañamiento constante a través de nuestra app. Registro de progresos y contacto con tu coach.",
                                color: "bg-brand-dark text-white"
                            },
                            {
                                step: "D",
                                title: "Mantenimiento",
                                desc: "Consolidamos los hábitos adquiridos para garantizar un bienestar sostenible a largo plazo.",
                                color: "bg-slate-100 text-brand-dark"
                            }
                        ].map((item, i) => (
                            <div key={i} className="relative z-10 p-8 rounded-[2.5rem] bg-white border border-slate-50 hover:border-brand-mint transition-all group hover:shadow-2xl">
                                <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center text-2xl font-black mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-current/10`}>
                                    {item.step}
                                </div>
                                <h3 className="text-xl font-black mb-4">{item.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed font-medium">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Herramientas & Mockup --- */}
            <section className="py-24 bg-[#f8faf8] relative">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="flex-1 space-y-8">
                            <div className="inline-block px-4 py-2 bg-brand-green/10 rounded-full text-brand-green font-bold text-xs uppercase tracking-widest">Tecnología de Vanguardia</div>
                            <h2 className="text-4xl md:text-6xl font-black leading-tight tracking-tighter">Tu salud, siempre contigo en tu bolsillo</h2>
                            <p className="text-gray-600 text-lg leading-relaxed font-medium italic">Hemos desarrollado una plataforma exclusiva para que el apoyo no termine al salir de consulta.</p>

                            <ul className="space-y-6">
                                {[
                                    { icon: MessageSquare, text: "Chat directo con tu Equipo de Coaches", desc: "Resolución de dudas en tiempo real." },
                                    { icon: FileText, text: "Tu plan clínico digitalizado", desc: "Actualización semanal según tu evolución." },
                                    { icon: Activity, text: "Seguimiento de constantes vitales", desc: "Integración con dispositivos inteligentes." }
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-4 group">
                                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-brand-green border border-brand-mint shrink-0 group-hover:scale-110 transition-transform">
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-black text-brand-dark">{item.text}</p>
                                            <p className="text-sm text-gray-500 font-medium">{item.desc}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex-1 relative">
                            {/* Apple Watch / Floating element decoration */}
                            <div className="absolute -left-12 -bottom-8 glass p-6 rounded-[2rem] shadow-2xl border border-white/50 z-20 animate-float hidden lg:block">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-brand-green/10 flex items-center justify-center">
                                        <Heart className="text-brand-green fill-brand-green animate-pulse" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase">Frecuencia Cardiaca</p>
                                        <p className="text-lg font-black italic">72 BPM</p>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Mockup */}
                            <div className="relative bg-[#1a1c1e] rounded-[3.5rem] p-4 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-[12px] border-gray-900 aspect-[9/18.5] max-w-[320px] mx-auto overflow-hidden">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-gray-900 rounded-b-2xl z-30"></div>
                                <div className="absolute inset-0 bg-[#f8faf8] flex flex-col pt-6 overflow-hidden">
                                    <div className="px-5 py-6 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-md">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-brand-mint rotate-6 shadow-sm overflow-hidden border border-brand-green/20">
                                                <img src="/logo.png" className="w-full h-full object-cover" alt="App Logo" />
                                            </div>
                                            <div>
                                                <span className="text-[9px] text-gray-400 font-black block">HOLA,</span>
                                                <span className="text-sm font-black text-brand-dark block">Elena Rubio ✨</span>
                                            </div>
                                        </div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-brand-green glow"></div>
                                    </div>

                                    <div className="p-4 space-y-4 overflow-y-auto no-scrollbar">
                                        <div className="bg-brand-dark p-6 rounded-[2rem] text-white relative group">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-green/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                                            <p className="text-[9px] font-black uppercase text-brand-green mb-1">Semana 12/24</p>
                                            <h4 className="text-xl font-black mb-4">Tu Evolución</h4>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-bold">Objetivo Metabólico</span>
                                                <span className="text-[10px] font-black">74%</span>
                                            </div>
                                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-brand-green" style={{ width: '74%' }}></div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:border-brand-mint transition-colors">
                                                <div className="w-8 h-8 rounded-xl bg-brand-mint flex items-center justify-center mb-3">
                                                    <Apple className="w-4 h-4 text-brand-green" />
                                                </div>
                                                <p className="text-[9px] font-black uppercase text-gray-400">Nutrición</p>
                                                <p className="text-xs font-black">Plan P-2</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:border-brand-mint transition-colors">
                                                <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
                                                    <Brain className="w-4 h-4 text-orange-500" />
                                                </div>
                                                <p className="text-[9px] font-black uppercase text-gray-400">Mente</p>
                                                <p className="text-xs font-black">Meditación</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto bg-white border-t border-gray-100 flex justify-around py-5">
                                        {[LayoutIcon, Activity, MessageSquare, User].map((Icon, i) => (
                                            <Icon key={i} className={`w-5 h-5 ${i === 0 ? 'text-brand-green' : 'text-gray-300'}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Equipo de Soporte Premium --- */}
            <section className="py-32 bg-brand-dark text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-brand-green/10 via-transparent to-transparent"></div>

                <div className="container mx-auto px-6 relative z-10 text-center">
                    <div className="max-w-3xl mx-auto mb-20">
                        <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">Un equipo clínico dedicado <br /><span className="text-brand-green italic">únicamente a ti</span></h2>
                        <p className="text-white/60 text-lg font-medium">No eres un número de expediente. Eres el centro de nuestro ecosistema multidisciplinar.</p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                        {[
                            { role: "Coaches Expertos", icon: Users, label: "Seguimiento diario y motivación constante", color: "from-blue-500/20 to-blue-500/5" },
                            { role: "Nutrición Clínica", icon: Apple, label: "Planes anti-inflamatorios personalizados", color: "from-emerald-500/20 to-emerald-500/5" },
                            { role: "Soporte Psicológico", icon: Heart, label: "Gestión emocional y resiliencia", color: "from-rose-500/20 to-rose-500/5" },
                            { role: "Visión Médica", icon: Shield, label: "Dra. Odile Fernández y equipo clínico", color: "from-brand-green/20 to-brand-green/5" }
                        ].map((item, i) => (
                            <div key={i} className={`p-8 rounded-[3rem] bg-gradient-to-br ${item.color} border border-white/10 hover:border-white/20 transition-all group hover:-translate-y-2`}>
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                                    <item.icon className="w-8 h-8 text-white" />
                                </div>
                                <h4 className="text-2xl font-black mb-2 italic">{item.role}</h4>
                                <p className="text-white/50 text-xs font-bold uppercase tracking-widest">{item.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-28 p-12 bg-gradient-to-r from-brand-green to-brand-green-dark rounded-[4rem] text-left relative group overflow-hidden shadow-2xl shadow-brand-green/20">
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                            <div className="max-w-xl">
                                <h3 className="text-4xl font-black mb-4">¿Preparada para transformar tu vida?</h3>
                                <p className="text-white/80 text-lg font-semibold italic">El acceso a la Escuela es por invitación para garantizar la máxima calidad de atención a cada alumna.</p>
                            </div>
                            <button
                                onClick={scrollToLogin}
                                className="px-14 py-7 bg-brand-dark text-white rounded-[2rem] font-black text-xl shadow-2xl hover:bg-black transition-all flex items-center gap-4 group/btn"
                            >
                                Acceso Privado
                                <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />
                            </button>
                        </div>
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
                        <div className="bg-white rounded-[3.5rem] shadow-[0_50px_100px_rgba(47,180,124,0.1)] border border-brand-mint/50 p-10 md:p-14 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-mint/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                            <div className="mb-12 text-center relative z-10">
                                <div className="inline-block p-1 bg-gradient-to-br from-brand-mint to-brand-green/20 rounded-3xl mb-8 shadow-inner">
                                    <div className="p-5 bg-white rounded-2xl shadow-lg border border-brand-mint/50">
                                        <img src="/logo.png" alt="Escuela Cuid-Arte" className="w-16 h-16 rounded-xl object-cover" />
                                    </div>
                                </div>
                                <h2 className="text-4xl font-black text-brand-dark tracking-tighter">Portal de Bienvenida</h2>
                                <p className="text-gray-500 font-semibold mt-3 italic">"Tu cambio de vida empieza en esta pantalla"</p>
                            </div>

                            {error && (
                                <div className="mb-8 p-5 bg-red-50 border border-red-100 text-red-700 text-sm rounded-[1.5rem] flex items-start gap-4 animate-shake">
                                    <Activity className="w-5 h-5 shrink-0" />
                                    <p className="font-bold">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Identificador Privado</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-slate-50 border-2 border-slate-100 text-brand-dark pl-14 pr-6 py-5 rounded-2xl focus:ring-4 focus:ring-brand-mint focus:border-brand-green transition-all outline-none font-bold placeholder:text-gray-300"
                                            placeholder="Email o Teléfono"
                                            value={identifier}
                                            onChange={(e) => setIdentifier(e.target.value)}
                                        />
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-brand-green transition-colors" />
                                    </div>
                                </div>

                                {(isEmail || identifier.length > 5) && (
                                    <div className="space-y-3 animate-fade-in">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contraseña de Acceso</label>
                                        <div className="relative group">
                                            <input
                                                type="password"
                                                required={isEmail}
                                                className="w-full bg-slate-50 border-2 border-slate-100 text-brand-dark pl-14 pr-6 py-5 rounded-2xl focus:ring-4 focus:ring-brand-mint focus:border-brand-green transition-all outline-none font-bold placeholder:text-gray-300"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-brand-green transition-colors" />
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
                                    className="w-full bg-brand-dark hover:bg-brand-green text-white font-black py-6 rounded-2xl transition-all flex items-center justify-center gap-4 disabled:opacity-70 mt-6 shadow-xl active:scale-[0.98] text-lg"
                                >
                                    {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <>Acceder a Cuid-Arte <ArrowRight className="w-6 h-6" /></>}
                                </button>
                            </form>

                            <div className="mt-12 pt-8 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsGuideOpen(true)}
                                    className="w-full text-brand-green hover:text-brand-green-dark font-black transition-all text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 group border-2 border-brand-mint/40 py-5 rounded-2xl hover:bg-brand-mint/20"
                                >
                                    <Smartphone className="w-5 h-5" />
                                    Instalar en mi móvil
                                </button>
                            </div>
                        </div>

                        <div className="mt-16 text-center text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                            Escuela Cuid-Arte © 2026 | Ciencia con Calidez Humana
                        </div>
                    </div>
                </div>
            </section>

            <InstallationGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
        </div>
    );
};

export default LandingPage;
