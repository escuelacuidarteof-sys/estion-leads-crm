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

                    <h1 className="text-6xl md:text-8xl font-black text-gradient leading-[1.05] mb-8 tracking-tighter animate-reveal">
                        Ciencia con <span className="text-brand-green italic relative inline-block">calidez<div className="absolute -bottom-2 left-0 w-full h-2 bg-brand-mint/60 -z-10 rounded-full"></div></span> para tu vida
                    </h1>

                    <p className="text-lg md:text-xl text-gray-600 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                        Un programa de acompañamiento integral basado en evidencia, bajo la dirección científica de la <span className="text-brand-green font-bold text-nowrap">Dra. Odile Fernández</span>. Nutrición, entrenamiento y hábitos diseñados para tu bienestar real.
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

            {/* --- Pilares del Método --- */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-5xl font-heading font-black mb-4">El Método Cuid-Arte</h2>
                    <p className="text-gray-500 mb-16 max-w-xl mx-auto">Un abordaje 360º donde la ciencia se adapta a tu ritmo, y no al revés.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            {[
                                {
                                    icon: Award,
                                    title: "Aval Científico",
                                    desc: "Bajo la visión de la Dra. Odile Fernández, integramos el estilo de vida como el aliado perfecto a tu tratamiento oncológico.",
                                    color: "bg-cyan-50",
                                    iconColor: "text-cyan-600"
                                },
                                {
                                    icon: Apple,
                                    title: "Nutrición Clínica",
                                    desc: "Planes adaptados a tu metabolismo y objetivos, enfocados en la desinflamación y el bienestar celular.",
                                    color: "bg-emerald-50",
                                    iconColor: "text-emerald-600"
                                },
                                {
                                    icon: Activity,
                                    title: "Entrenamiento",
                                    desc: "Ejercicio de fuerza y movilidad adaptado a cada fase de tu proceso para mantener tu vitalidad.",
                                    color: "bg-blue-50",
                                    iconColor: "text-blue-600"
                                },
                                {
                                    icon: Brain,
                                    title: "Psicología",
                                    desc: "Gestión emocional y herramientas para afrontar el día a día con resiliencia y calma.",
                                    color: "bg-purple-50",
                                    iconColor: "text-purple-600"
                                }
                            ].map((pilar, i) => (
                                <div key={i} className="group p-8 rounded-[2.5rem] border border-slate-100 hover:border-brand-mint transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 bg-slate-50/30">
                                    <div className={`w-16 h-16 ${pilar.color} rounded-[1.5rem] flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform`}>
                                        <pilar.icon className={`w-8 h-8 ${pilar.iconColor}`} />
                                    </div>
                                    <h3 className="text-xl font-black mb-4">{pilar.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">{pilar.desc}</p>
                                </div>
                            ))}
                        </div>
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
                                    { icon: MessageSquare, text: "Chat directo con tu Equipo de Coaches y Psicólogos" },
                                    { icon: FileText, text: "Acceso a tu planificación de nutrición y ejercicio" },
                                    { icon: Database, text: "Seguimiento diario de hábitos y bienestar" },
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
                                {/* Mini portal replica */}
                                <div className="absolute inset-0 bg-[#f8faf8] flex flex-col overflow-hidden" style={{ fontSize: '9px' }}>
                                    {/* Status bar */}
                                    <div className="bg-white px-3 py-1 flex justify-between items-center border-b border-slate-100">
                                        <span className="font-bold text-slate-500" style={{ fontSize: '7px' }}>9:41</span>
                                        <div className="flex gap-0.5 items-center">
                                            <div className="w-1 h-1 rounded-full bg-brand-green"></div>
                                            <div className="w-1 h-1 rounded-full bg-brand-green opacity-70"></div>
                                            <div className="w-1 h-1 rounded-full bg-brand-green opacity-40"></div>
                                        </div>
                                    </div>
                                    {/* App header */}
                                    <div className="bg-white px-3 py-2 flex items-center justify-between border-b border-slate-100 shadow-sm">
                                        <div>
                                            <p className="text-slate-400" style={{ fontSize: '6px' }}>Buenos días,</p>
                                            <p className="font-black text-brand-dark" style={{ fontSize: '10px' }}>María García ✨</p>
                                        </div>
                                        <img src="/logo.png" className="w-7 h-7 rounded-xl object-cover" alt="Logo" />
                                    </div>
                                    {/* Nav tabs */}
                                    <div className="bg-white flex border-b border-slate-100">
                                        {[
                                            { icon: '🏠', label: 'Inicio', active: true },
                                            { icon: '🥗', label: 'Nutrición', active: false },
                                            { icon: '📚', label: 'Clases', active: false },
                                            { icon: '📋', label: 'Revisiones', active: false },
                                            { icon: '💬', label: 'Chat', active: false },
                                        ].map((tab, i) => (
                                            <div key={i} className={`flex flex-col items-center px-2 py-1.5 flex-1 ${tab.active ? 'border-b-2 border-brand-green' : ''}`}>
                                                <span style={{ fontSize: '11px' }}>{tab.icon}</span>
                                                <span className={tab.active ? 'text-brand-green font-bold' : 'text-slate-400'} style={{ fontSize: '5px' }}>{tab.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Content */}
                                    <div className="flex-1 overflow-hidden p-1.5 space-y-1.5">
                                        {/* Metric cards */}
                                        <div className="grid grid-cols-2 gap-1.5">
                                            <div className="bg-white rounded-xl p-2 border border-slate-100 shadow-sm">
                                                <p className="text-slate-400 font-bold uppercase" style={{ fontSize: '5px' }}>Peso Actual</p>
                                                <p className="font-black text-brand-dark leading-none mt-0.5" style={{ fontSize: '14px' }}>72.4 <span className="text-slate-400 font-medium" style={{ fontSize: '7px' }}>kg</span></p>
                                                <p className="text-brand-green font-bold mt-0.5" style={{ fontSize: '5px' }}>▼ −0.8 esta semana</p>
                                            </div>
                                            <div className="bg-white rounded-xl p-2 border border-slate-100 shadow-sm">
                                                <p className="text-slate-400 font-bold uppercase" style={{ fontSize: '5px' }}>Objetivo</p>
                                                <p className="font-black text-brand-dark leading-none mt-0.5" style={{ fontSize: '14px' }}>65 <span className="text-slate-400 font-medium" style={{ fontSize: '7px' }}>kg</span></p>
                                                <p className="text-slate-400 mt-0.5" style={{ fontSize: '5px' }}>7.4 kg restantes</p>
                                            </div>
                                        </div>
                                        {/* Progress bar */}
                                        <div className="bg-white rounded-xl p-2 border border-slate-100 shadow-sm">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="text-slate-500 font-bold" style={{ fontSize: '6px' }}>Progreso hacia objetivo</p>
                                                <p className="text-brand-green font-black" style={{ fontSize: '7px' }}>68%</p>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-brand-green rounded-full" style={{ width: '68%' }}></div>
                                            </div>
                                            <p className="text-slate-400 mt-0.5" style={{ fontSize: '5px' }}>Semana 8 de 16 · En seguimiento activo</p>
                                        </div>
                                        {/* Mini bar chart */}
                                        <div className="bg-white rounded-xl p-2 border border-slate-100 shadow-sm">
                                            <p className="text-slate-500 font-bold mb-1" style={{ fontSize: '6px' }}>EVOLUCIÓN 4 SEMANAS</p>
                                            <div className="flex items-end gap-0.5 h-8">
                                                {[{ w: 74.2, l: 'S1' }, { w: 73.6, l: 'S2' }, { w: 73.0, l: 'S3' }, { w: 72.4, l: 'S4' }].map(({ w, l }, i) => (
                                                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                                                        <div
                                                            className={`w-full rounded-t-sm ${i === 3 ? 'bg-brand-green' : 'bg-brand-mint'}`}
                                                            style={{ height: `${((w - 70) / 6) * 100}%` }}
                                                        ></div>
                                                        <span className="text-slate-300" style={{ fontSize: '5px' }}>{l}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Quick actions */}
                                        <div className="grid grid-cols-3 gap-1">
                                            <div className="bg-brand-green text-white rounded-xl p-1.5 text-center">
                                                <div style={{ fontSize: '12px' }}>📝</div>
                                                <p className="font-black" style={{ fontSize: '5px' }}>Check-in</p>
                                            </div>
                                            <div className="bg-brand-mint rounded-xl p-1.5 text-center">
                                                <div style={{ fontSize: '12px' }}>🥗</div>
                                                <p className="font-black text-brand-dark" style={{ fontSize: '5px' }}>Mi Plan</p>
                                            </div>
                                            <div className="bg-white border border-slate-100 rounded-xl p-1.5 text-center">
                                                <div style={{ fontSize: '12px' }}>📹</div>
                                                <p className="font-black text-slate-500" style={{ fontSize: '5px' }}>Clases</p>
                                            </div>
                                        </div>
                                        {/* Coach card */}
                                        <div className="bg-white rounded-xl p-2 border border-brand-mint shadow-sm flex items-center gap-1.5">
                                            <div className="w-6 h-6 rounded-full bg-brand-mint flex items-center justify-center flex-shrink-0" style={{ fontSize: '11px' }}>👤</div>
                                            <div className="min-w-0">
                                                <p className="font-black text-brand-dark" style={{ fontSize: '6px' }}>Tu coach · Hoy 17:00h</p>
                                                <p className="text-slate-400" style={{ fontSize: '5px' }}>Revisión de hábitos programada</p>
                                            </div>
                                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-green flex-shrink-0"></div>
                                        </div>
                                    </div>
                                    {/* Bottom nav */}
                                    <div className="bg-white border-t border-slate-100 flex justify-around py-1.5">
                                        {['🏠', '📊', '💬', '👤'].map((icon, i) => (
                                            <div key={i} className={i === 0 ? 'opacity-100' : 'opacity-30'} style={{ fontSize: '14px' }}>{icon}</div>
                                        ))}
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
                            { role: "Psicólogos", label: "Gestión Emocional", color: "bg-purple-500" },
                            { role: "Nutricionistas", label: "Nutrición Clínica", color: "bg-emerald-500" },
                            { role: "Expertos", label: "Hábitos y Estilo de Vida", color: "bg-orange-500" }
                        ].map((item, i) => (
                            <div key={i} className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-all group">
                                <div className={`w-3 h-3 rounded-full ${item.color} mb-4 mx-auto glow`}></div>
                                <h4 className="text-2xl font-black mb-1">{item.role}</h4>
                                <p className="text-white/50 text-xs font-bold uppercase tracking-widest">{item.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-20 p-12 bg-gradient-to-br from-brand-green to-brand-green-dark rounded-[4rem] max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl shadow-brand-green/20 relative group overflow-hidden">
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="text-left relative z-10">
                            <h3 className="text-3xl font-black mb-3">¿Preparada para transformar tu vida?</h3>
                            <p className="text-white/90 text-lg font-medium opacity-90 max-w-md">Accede a tu portal personalizado y empieza tu camino de bienestar hoy mismo.</p>
                        </div>
                        <button
                            onClick={scrollToLogin}
                            className="px-12 py-6 bg-brand-dark text-white rounded-2xl font-black shadow-2xl hover:bg-black hover:scale-105 transition-all text-xl flex items-center gap-3 active:scale-95 flex-shrink-0"
                        >
                            Acceder Ahora
                            <ArrowRight className="w-6 h-6" />
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
                                <div className="inline-block p-1 bg-gradient-to-br from-brand-mint to-brand-green/20 rounded-3xl mb-6 shadow-inner">
                                    <div className="p-4 bg-white rounded-2xl shadow-lg border border-brand-mint/50">
                                        <img src="/logo.png" alt="Escuela Cuid-Arte" className="w-16 h-16 rounded-xl object-cover" />
                                    </div>
                                </div>
                                <h2 className="text-4xl font-black text-brand-dark tracking-tight">Acceso Privado</h2>
                                <p className="text-gray-500 font-semibold mt-2">Bienvenida a tu espacio de cambio personal</p>
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
