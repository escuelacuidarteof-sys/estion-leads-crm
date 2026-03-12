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
    Speaker,
    ExternalLink,
    Loader2
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface Meditation {
    id: string;
    title: string;
    description: string;
    duration: string;
    audioUrl: string; // Direct MP3 or Vocaroo link
    type: 'audio' | 'video';
    coverImage?: string;
    category: string;
}

interface MeditationViewProps {
    client: any;
    onBack: () => void;
}

const FALLBACK_MEDITATIONS: Meditation[] = [
    {
        id: '1',
        title: 'Tu Guía de Claridad',
        description: 'Una meditación guiada diseñada para calmar la mente y encontrar foco en los momentos de mayor ruido mental. Ideal para empezar el día o antes de dormir.',
        duration: '06:21',
        audioUrl: '/audio/claridad.mp3',
        type: 'audio',
        category: 'Claridad',
        coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop'
    }
];

const VIDEO_HINTS = ['youtube.com', 'youtu.be', 'vimeo.com'];

const inferMaterialType = (url: string, dbType: string): 'audio' | 'video' => {
    const lowerUrl = (url || '').toLowerCase();
    if (dbType === 'video') return 'video';
    if (dbType === 'audio') return 'audio';
    if (VIDEO_HINTS.some(h => lowerUrl.includes(h))) return 'video';
    return 'audio';
};

const inferDurationFromTags = (tags: string[] | null | undefined): string => {
    const list = Array.isArray(tags) ? tags : [];
    const durationTag = list.find(t => t.toLowerCase().startsWith('duracion:') || t.toLowerCase().startsWith('duración:'));
    if (!durationTag) return 'Variable';
    return durationTag.split(':').slice(1).join(':').trim() || 'Variable';
};

const inferCategory = (category: string | null | undefined, tags: string[] | null | undefined): string => {
    if (category && category.toLowerCase() !== 'meditacion') return category;
    const list = Array.isArray(tags) ? tags : [];
    const categoryTag = list.find(t => t.toLowerCase().startsWith('categoria:') || t.toLowerCase().startsWith('categoría:'));
    if (categoryTag) return categoryTag.split(':').slice(1).join(':').trim() || 'Meditación';
    return 'Meditación';
};

export function MeditationView({ client, onBack }: MeditationViewProps) {
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [meditations, setMeditations] = useState<Meditation[]>(FALLBACK_MEDITATIONS);
    const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
    const [currentMeditation, setCurrentMeditation] = useState<Meditation | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState('0:00');
    const [volume, setVolume] = useState(1);
    const [showVolume, setShowVolume] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const filteredMeditations = selectedCategory === 'Todos'
        ? meditations
        : meditations.filter(m => m.category === selectedCategory);

    const availableCategories = ['Todos', ...Array.from(new Set(meditations.map(m => m.category).filter(Boolean)))];

    useEffect(() => {
        const loadMeditations = async () => {
            setIsLoadingLibrary(true);
            try {
                const { data, error } = await supabase
                    .from('materials_library')
                    .select('id,title,description,type,url,category,tags,is_active,sort_order,created_at')
                    .eq('is_active', true)
                    .eq('category', 'meditacion')
                    .in('type', ['audio', 'video', 'link'])
                    .order('sort_order', { ascending: true })
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const mapped: Meditation[] = (data || [])
                    .filter((item: any) => !!item.url)
                    .map((item: any) => ({
                        id: item.id,
                        title: item.title || 'Sesión de meditación',
                        description: item.description || 'Sesión guiada para acompañarte en tu proceso.',
                        duration: inferDurationFromTags(item.tags),
                        audioUrl: item.url,
                        type: inferMaterialType(item.url, item.type),
                        category: inferCategory(item.category, item.tags),
                        coverImage: inferMaterialType(item.url, item.type) === 'video'
                            ? 'https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?q=80&w=1000&auto=format&fit=crop'
                            : 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop'
                    }));

                setMeditations(mapped.length > 0 ? mapped : FALLBACK_MEDITATIONS);
            } catch (err) {
                console.error('Error loading meditation library:', err);
                setMeditations(FALLBACK_MEDITATIONS);
            } finally {
                setIsLoadingLibrary(false);
            }
        };

        loadMeditations();
    }, []);

    const handlePlayMeditation = (meditation: Meditation) => {
        if (meditation.type === 'video') {
            window.open(meditation.audioUrl, '_blank', 'noopener,noreferrer');
            return;
        }
        if (currentMeditation?.id === meditation.id) {
            setIsPlaying(!isPlaying);
        } else {
            setCurrentMeditation(meditation);
            setIsPlaying(true);
            setProgress(0);
            setCurrentTime('0:00');
        }
    };

    useEffect(() => {
        if (audioRef.current) {
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

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

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
        <div className="min-h-screen bg-[#FDFBF7] animate-in fade-in duration-500 pb-40">
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
                    <div className="w-10 h-10 rounded-full bg-brand-mint/30 flex items-center justify-center relative overflow-hidden group">
                        <Headphones className="w-5 h-5 text-brand-green relative z-10" />
                        <div className={`absolute inset-0 bg-brand-green/20 transition-transform duration-[2000ms] ${isPlaying ? 'scale-[3] opacity-100' : 'scale-0 opacity-0'}`} />
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Hero Section */}
                <div className="relative rounded-[3rem] overflow-hidden bg-brand-dark shadow-2xl mb-12 aspect-[16/9] md:aspect-[21/9] group cursor-pointer"
                     onClick={() => filteredMeditations[0] && handlePlayMeditation(filteredMeditations[0])}>
                    <img 
                        src="https://images.unsplash.com/photo-1508672019048-805c876b67e2?q=80&w=2000&auto=format&fit=crop" 
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-[10s] ease-linear"
                        alt="Calm background"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/20 to-transparent" />
                    
                    <div className="relative h-full flex flex-col justify-end p-8 md:p-12">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 bg-brand-gold/20 text-brand-gold border border-brand-gold/30 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                                Destacado
                            </span>
                            <span className="text-white/60 text-xs flex items-center gap-1 font-medium">
                                 <Clock className="w-3 h-3" /> {filteredMeditations[0]?.duration || 'Variable'}
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-heading font-black text-white mb-4">
                            Encuentra tu centro
                        </h2>
                        <p className="text-white/80 text-sm md:text-lg max-w-xl mb-8 leading-relaxed font-medium">
                             Biblioteca de audios y videos para calmar la mente, descansar mejor y recuperar foco.
                        </p>
                        
                        <div className="flex items-center gap-4">
                            <button 
                                className="bg-brand-green hover:bg-brand-green/90 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all hover:scale-105 shadow-xl shadow-brand-green/20"
                            >
                                <Play className="w-5 h-5 fill-current" />
                                Escuchar Sesión Guía
                            </button>
                            
                            {isPlaying && currentMeditation?.id === '1' && (
                                <div className="flex gap-1 items-end h-6 w-12">
                                    {[0.4, 0.7, 0.5, 0.9, 0.6].map((h, i) => (
                                        <div 
                                            key={i}
                                            className="w-1 bg-brand-mint/60 rounded-full animate-pulse"
                                            style={{ 
                                                height: `${h * 100}%`,
                                                animationDelay: `${i * 0.1}s`,
                                                animationDuration: '1s'
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Categories */}
                <div className="flex gap-3 mb-12 overflow-x-auto pb-2 no-scrollbar">
                     {availableCategories.map((cat) => (
                        <button 
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-6 py-3 rounded-2xl font-black text-sm transition-all whitespace-nowrap ${
                                selectedCategory === cat 
                                ? 'bg-brand-dark text-white ring-4 ring-brand-dark/5 shadow-xl translate-y-[-2px]' 
                                : 'bg-white text-slate-500 border border-slate-100 hover:border-brand-green hover:text-brand-green hover:shadow-lg'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* List Grid */}
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-heading font-black text-brand-dark flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-brand-gold rounded-full" />
                        Tus Sesiones
                    </h3>
                </div>
                
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {isLoadingLibrary ? (
                        <div className="col-span-full py-16 text-center bg-white rounded-[3rem] border border-slate-100">
                            <Loader2 className="w-10 h-10 animate-spin text-brand-green mx-auto mb-3" />
                            <p className="text-slate-500 text-sm font-semibold">Cargando biblioteca de meditación...</p>
                        </div>
                     ) : filteredMeditations.length > 0 ? (
                         filteredMeditations.map((meditation) => (
                            <div 
                                key={meditation.id}
                                onClick={() => handlePlayMeditation(meditation)}
                                className={`group bg-white rounded-[2.5rem] p-6 border transition-all cursor-pointer relative overflow-hidden ${
                                    currentMeditation?.id === meditation.id 
                                    ? 'border-brand-green/30 ring-4 ring-brand-green/5 shadow-2xl' 
                                    : 'border-slate-100 hover:border-brand-mint shadow-sm hover:shadow-2xl'
                                }`}
                            >
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="relative w-28 h-28 rounded-[2rem] overflow-hidden flex-shrink-0 shadow-lg">
                                        <img src={meditation.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={meditation.title} />
                                        <div className={`absolute inset-0 flex items-center justify-center transition-all ${
                                            currentMeditation?.id === meditation.id && isPlaying 
                                            ? 'bg-brand-green/40 opacity-100' 
                                            : 'bg-black/20 opacity-0 group-hover:opacity-100'
                                        }`}>
                                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-brand-green shadow-xl">
                                                {currentMeditation?.id === meditation.id && isPlaying ? (
                                                    <Pause className="w-5 h-5 fill-current" />
                                                ) : (
                                                    <Play className="w-5 h-5 fill-current translate-x-0.5" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="px-2.5 py-0.5 bg-brand-mint text-brand-green rounded-full text-[9px] font-black uppercase tracking-widest">{meditation.category}</span>
                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                                                <Clock className="w-3 h-3" />
                                                {meditation.duration}
                                            </div>
                                        </div>
                                        <h4 className="font-heading font-black text-brand-dark text-lg mb-1 leading-tight group-hover:text-brand-green transition-colors">{meditation.title}</h4>
                                         <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                                             {meditation.description}
                                         </p>
                                         {meditation.type === 'video' && (
                                            <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-indigo-600 font-bold uppercase tracking-wide">
                                                Ver video
                                                <ExternalLink className="w-3 h-3" />
                                            </div>
                                         )}
                                     </div>
                                </div>

                                {currentMeditation?.id === meditation.id && (
                                    <div className="absolute bottom-0 left-0 h-1.5 bg-brand-green/30 w-full">
                                        <div className="h-full bg-brand-green transition-all duration-300" style={{ width: `${progress}%` }} />
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                            <Speaker className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 text-sm font-black italic">Preparando más dosis de calma para ti...</p>
                        </div>
                    )}
                </div>

                {/* Wellness Card */}
                <div className="mt-16 relative rounded-[3rem] p-10 bg-gradient-to-br from-brand-mint/40 to-brand-green/10 border border-brand-mint overflow-hidden">
                    <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/40 rounded-full blur-3xl" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-xl flex-shrink-0">
                            <Speaker className="w-10 h-10 text-brand-green" />
                        </div>
                        <div className="text-center md:text-left">
                            <h5 className="font-heading font-black text-2xl text-brand-dark mb-2">¿Quieres sugerir un tema?</h5>
                            <p className="text-sm text-slate-600 max-w-md leading-relaxed font-medium">
                                Estamos creando contenido personalizado para acompañar tu proceso. Si hay alguna meditación específica que necesites, dínoslo.
                            </p>
                        </div>
                        <button className="md:ml-auto px-8 py-4 bg-brand-dark text-white rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-lg">
                            Contactar con Coach
                        </button>
                    </div>
                </div>
            </div>

            {/* Float Player - THE REAL HERO */}
            {currentMeditation && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl z-50 animate-in slide-in-from-bottom-20 duration-500">
                    <div className="bg-brand-dark/95 backdrop-blur-2xl rounded-[2.5rem] p-4 sm:p-5 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.6)] border border-white/5 relative overflow-hidden">
                        {/* Progress Background */}
                        <div className="absolute top-0 left-0 h-full bg-brand-green/2 transition-all duration-1000" style={{ width: `${progress}%` }} />
                        
                        <div className="flex items-center gap-4 sm:gap-6 relative z-10">
                            {/* Artwork */}
                            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-[1.5rem] overflow-hidden flex-shrink-0 shadow-2xl relative group">
                                <img src={currentMeditation.coverImage} className={`w-full h-full object-cover transition-all duration-[20s] linear ${isPlaying ? 'scale-125 rotate-6' : 'scale-100'}`} alt={currentMeditation.title} />
                                <div className="absolute inset-0 bg-brand-dark/40 flex items-center justify-center">
                                    <Headphones className={`w-6 h-6 text-white/80 ${isPlaying ? 'animate-bounce' : ''}`} />
                                </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="flex gap-0.5 items-center">
                                        {[1, 2, 3].map(i => (
                                            <div 
                                                key={i} 
                                                className={`w-1 bg-brand-gold rounded-full transition-all duration-300 ${isPlaying ? 'h-3 animate-pulse' : 'h-1'}`} 
                                                style={{ animationDelay: `${i * 0.2}s` }}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-[10px] text-brand-mint/60 font-black uppercase tracking-[0.2em]">{currentMeditation.category}</span>
                                </div>
                                <h4 className="text-sm sm:text-xl font-heading font-black text-white truncate leading-tight group-hover:text-brand-green transition-colors">{currentMeditation.title}</h4>
                                
                                {/* Progress Bar */}
                                <div className="mt-4 flex items-center gap-4">
                                    <span className="text-[10px] font-bold text-white/40 tabular-nums w-8">{currentTime}</span>
                                    <div className="flex-1 h-1.5 bg-white/10 rounded-full relative group cursor-pointer group">
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="100" 
                                            value={progress} 
                                            onChange={handleProgressChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        {/* Background track */}
                                        <div className="absolute inset-0 bg-white/5 rounded-full" />
                                        {/* Filled track */}
                                        <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-green to-brand-mint rounded-full shadow-[0_0_15px_rgba(107,160,107,0.8)] transition-all duration-300" style={{ width: `${progress}%` }}>
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full scale-0 group-hover:scale-100 transition-transform shadow-2xl" />
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-white/40 tabular-nums w-8">{currentMeditation.duration}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 sm:gap-6 ml-2">
                                {/* Volume Control */}
                                <div className="hidden sm:flex items-center gap-2 relative">
                                    {showVolume && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 p-3 bg-brand-dark border border-white/10 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 h-32 flex flex-col items-center">
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="1" 
                                                step="0.01"
                                                value={volume}
                                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                                className="w-24 -rotate-90 origin-center translate-y-8"
                                            />
                                        </div>
                                    )}
                                    <button 
                                        onMouseEnter={() => setShowVolume(true)}
                                        onMouseLeave={() => setShowVolume(false)}
                                        className="text-white/40 hover:text-white transition-colors p-2"
                                    >
                                        <Volume2 className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Main Controls */}
                                <button 
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="w-14 h-14 sm:w-20 sm:h-20 bg-brand-green rounded-[1.5rem] sm:rounded-3xl flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(107,160,107,0.4)]"
                                >
                                    {isPlaying ? <Pause className="w-6 h-6 sm:w-10 sm:h-10 fill-current" /> : <Play className="w-6 h-6 sm:w-10 sm:h-10 fill-current translate-x-1" />}
                                </button>
                                
                                <button 
                                    onClick={() => {
                                        setIsPlaying(false);
                                        setCurrentMeditation(null);
                                    }}
                                    className="p-3 rounded-2xl bg-white/5 text-white/20 hover:text-white/60 hover:bg-white/10 transition-all flex sm:hidden md:flex"
                                    title="Cerrar reproductor"
                                >
                                    <RotateCcw className="w-4 h-4 sm:w-6 sm:h-6" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Audio Engine */}
            <audio 
                ref={audioRef}
                src={currentMeditation?.audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
            />
        </div>
    );
}
