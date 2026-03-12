import React, { useState, useRef, useEffect } from 'react';
import {
    Play,
    Pause,
    RotateCcw,
    Volume2,
    Headphones,
    ArrowLeft,
    Clock,
    Sparkles,
    Heart,
    ChevronRight,
    Speaker
} from 'lucide-react';

interface Meditation {
    id: string;
    title: string;
    description: string;
    duration: string;
    audioUrl: string; // Direct MP3 or Vocaroo link
    type: 'audio' | 'vocaroo';
    coverImage?: string;
    category: 'Relajación' | 'Claridad' | 'Sueño' | 'Enfoque';
}

interface MeditationViewProps {
    client: any;
    onBack: () => void;
}

const INITIAL_MEDITATIONS: Meditation[] = [
    {
        id: '1',
        title: 'Tu Guía de Claridad',
        description: 'Una meditación guiada diseñada para calmar la mente y encontrar foco en los momentos de mayor ruido mental. Ideal para empezar el día o antes de dormir.',
        duration: '10:00',
        audioUrl: 'https://vocaroo.com/embed/19qID0MAr60P?autoplay=0',
        type: 'vocaroo',
        category: 'Claridad',
        coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop'
    }
];

export function MeditationView({ client, onBack }: MeditationViewProps) {
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [currentMeditation, setCurrentMeditation] = useState<Meditation | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState('0:00');
    const [isVocarooModalOpen, setIsVocarooModalOpen] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const filteredMeditations = selectedCategory === 'Todos' 
        ? INITIAL_MEDITATIONS 
        : INITIAL_MEDITATIONS.filter(m => m.category === selectedCategory);

    const handlePlayMeditation = (meditation: Meditation) => {
        if (currentMeditation?.id === meditation.id) {
            if (meditation.type === 'audio') {
                setIsPlaying(!isPlaying);
            } else {
                setIsVocarooModalOpen(true);
            }
        } else {
            setCurrentMeditation(meditation);
            if (meditation.type === 'audio') {
                setIsPlaying(true);
            } else {
                setIsPlaying(false);
                setIsVocarooModalOpen(true);
            }
            setProgress(0);
            setCurrentTime('0:00');
        }
    };

    useEffect(() => {
        if (currentMeditation?.type === 'audio' && audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(err => {
                    console.error("Error playing audio:", err);
                    setIsPlaying(false);
                });
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, currentMeditation]);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const duration = audioRef.current.duration;
            if (duration) {
                setProgress((current / duration) * 100);
                
                const mins = Math.floor(current / 60);
                const secs = Math.floor(current % 60).toString().padStart(2, '0');
                setCurrentTime(`${mins}:${secs}`);
            }
        }
    };

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        setProgress(value);
        if (audioRef.current) {
            const duration = audioRef.current.duration;
            if (duration) {
                audioRef.current.currentTime = (value / 100) * duration;
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] animate-in fade-in duration-500 pb-32">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-6 sticky top-0 z-40">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-500 hover:text-brand-green transition-colors group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold text-sm">Volver</span>
                    </button>
                    <h1 className="text-xl font-heading font-black text-brand-dark flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-brand-gold" />
                        Espacio de Calma
                    </h1>
                    <div className="w-10 h-10 rounded-full bg-brand-mint/30 flex items-center justify-center">
                        <Headphones className="w-5 h-5 text-brand-green" />
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Hero Section - Featured Meditation */}
                <div className="relative rounded-[2.5rem] overflow-hidden bg-brand-dark shadow-2xl mb-12 aspect-[16/9] md:aspect-[21/9]">
                    <img 
                        src="https://images.unsplash.com/photo-1508672019048-805c876b67e2?q=80&w=2000&auto=format&fit=crop" 
                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                        alt="Calm background"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/20 to-transparent" />
                    
                    <div className="relative h-full flex flex-col justify-end p-8 md:p-12">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 bg-brand-gold/20 text-brand-gold border border-brand-gold/30 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                                Destacado
                            </span>
                            <span className="text-white/60 text-xs flex items-center gap-1 font-medium">
                                <Clock className="w-3 h-3" /> 10 mins
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-heading font-black text-white mb-4">
                            Encuentra tu centro
                        </h2>
                        <p className="text-white/80 text-sm md:text-lg max-w-xl mb-8 leading-relaxed">
                            Una colección de sesiones diseñadas para ayudarte a navegar el día con serenidad y presencia.
                        </p>
                        
                        <button 
                            onClick={() => handlePlayMeditation(INITIAL_MEDITATIONS[0])}
                            className="bg-brand-green hover:bg-brand-green/90 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 w-fit transition-all hover:scale-105 shadow-lg shadow-brand-green/20"
                        >
                            <Play className="w-5 h-5 fill-current" />
                            Escuchar Sesión Guía
                        </button>
                    </div>
                </div>

                {/* Categories */}
                <div className="flex gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar">
                    {['Todos', 'Relajación', 'Claridad', 'Sueño'].map((cat) => (
                        <button 
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                                selectedCategory === cat 
                                ? 'bg-brand-dark text-white ring-4 ring-brand-dark/5 shadow-md' 
                                : 'bg-white text-slate-500 border border-slate-200 hover:border-brand-green hover:text-brand-green'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* List Grid */}
                <h3 className="text-xl font-heading font-black text-brand-dark mb-6 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-400" />
                    Tus Sesiones
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredMeditations.length > 0 ? (
                        filteredMeditations.map((meditation) => (
                            <div 
                                key={meditation.id}
                                className="group bg-white rounded-3xl p-5 border border-slate-100 hover:border-brand-mint shadow-sm hover:shadow-xl transition-all flex items-start gap-4"
                            >
                                <div className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
                                    <img src={meditation.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={meditation.title} />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <button 
                                            onClick={() => handlePlayMeditation(meditation)}
                                            className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-brand-green shadow-lg transform scale-50 group-hover:scale-100 transition-all"
                                        >
                                            <Play className="w-4 h-4 fill-current ml-0.5" />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-black text-brand-green uppercase tracking-wider">{meditation.category}</span>
                                        <span className="text-[10px] text-slate-400 font-bold">{meditation.duration}</span>
                                    </div>
                                    <h4 className="font-heading font-black text-brand-dark mb-1 truncate">{meditation.title}</h4>
                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                                        {meditation.description}
                                    </p>
                                    <button 
                                        onClick={() => handlePlayMeditation(meditation)}
                                        className="text-[11px] font-black text-brand-green flex items-center gap-1 hover:underline"
                                    >
                                        Reproducir ahora <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                            <p className="text-slate-400 text-sm font-bold">No hay sesiones en esta categoría aún.</p>
                        </div>
                    )}
                </div>

                {/* Info Text */}
                <div className="mt-12 p-8 bg-brand-mint/20 rounded-[2.5rem] border border-brand-mint/30 text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Speaker className="w-8 h-8 text-brand-green" />
                    </div>
                    <h5 className="font-heading font-black text-brand-dark mb-2">Añadiremos más sesiones pronto</h5>
                    <p className="text-sm text-slate-600 max-w-sm mx-auto">
                        Estamos preparando nuevos audios guiados por nuestro equipo para acompañarte en cada momento de tu proceso.
                    </p>
                </div>
            </div>

            {/* Float Player */}
            {currentMeditation && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl bg-brand-dark/95 backdrop-blur-xl rounded-[2rem] p-4 sm:p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] z-50 animate-in slide-in-from-bottom-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-800">
                            <img src={currentMeditation.coverImage} className="w-full h-full object-cover" alt={currentMeditation.title} />
                        </div>
                        
                        <div className="flex-1 min-w-0 mr-4">
                            <p className="text-xs text-brand-mint/60 font-medium truncate mb-0.5">{currentMeditation.category}</p>
                            <h4 className="text-sm sm:text-lg font-heading font-black text-white truncate">{currentMeditation.title}</h4>
                            
                            {currentMeditation.type === 'audio' ? (
                                <div className="mt-2 flex items-center gap-3">
                                    <div className="flex-1 h-1 bg-white/10 rounded-full relative group cursor-pointer">
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="100" 
                                            value={progress} 
                                            onChange={handleProgressChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="absolute top-0 left-0 h-full bg-brand-green rounded-full shadow-[0_0_10px_rgba(107,160,107,0.5)]" style={{ width: `${progress}%` }} />
                                    </div>
                                    <span className="text-[10px] sm:text-xs font-bold text-white/40 tabular-nums">{currentTime} / {currentMeditation.duration}</span>
                                </div>
                            ) : (
                                <p className="text-[10px] text-brand-gold font-bold uppercase tracking-widest mt-1">Sesión Vocaroo Embed</p>
                            )}
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4">
                            <button 
                                onClick={() => {
                                    if (currentMeditation.type === 'audio') {
                                        setIsPlaying(!isPlaying);
                                    } else {
                                        setIsVocarooModalOpen(true);
                                    }
                                }}
                                className="w-10 h-10 sm:w-14 sm:h-14 bg-brand-green rounded-full flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all shadow-lg"
                            >
                                {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5" />}
                            </button>
                            
                            <button 
                                onClick={() => {
                                    setIsPlaying(false);
                                    setCurrentMeditation(null);
                                }}
                                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Vocaroo Modal - Proper React Implementation */}
            {isVocarooModalOpen && currentMeditation && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg relative shadow-2xl scale-in-center">
                        <button 
                            onClick={() => setIsVocarooModalOpen(false)}
                            className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-brand-mint/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                <Headphones className="w-10 h-10 text-brand-green" />
                            </div>
                            <h3 className="font-heading font-black text-2xl text-brand-dark mb-2">{currentMeditation.title}</h3>
                            <p className="text-sm text-slate-500">{currentMeditation.description}</p>
                        </div>
                        
                        <div className="rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 aspect-video flex items-center justify-center p-4">
                            <iframe 
                                src={currentMeditation.audioUrl.replace('?autoplay=0', '') + '?autoplay=1'} 
                                width="300" 
                                height="60" 
                                frameBorder="0" 
                                scrolling="no"
                                title="Vocaroo player"
                                className="max-w-full"
                            />
                        </div>
                        
                        <p className="text-[10px] text-slate-400 mt-6 text-center font-bold uppercase tracking-widest">
                            Reproducción vía Vocaroo • Cuid-Arte
                        </p>
                        
                        <button
                            onClick={() => setIsVocarooModalOpen(false)}
                            className="w-full mt-8 bg-brand-dark text-white py-4 rounded-2xl font-black hover:bg-brand-dark/90 transition-all shadow-lg"
                        >
                            ENTENDIDO
                        </button>
                    </div>
                </div>
            )}

            {currentMeditation?.type === 'audio' && (
                <audio 
                    ref={audioRef}
                    src={currentMeditation.audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                />
            )}
        </div>
    );
}
