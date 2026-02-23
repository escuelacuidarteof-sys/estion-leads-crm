import React, { useEffect, useState, useRef } from 'react';
import {
    ArrowLeft,
    Dumbbell,
    Footprints,
    Zap,
    Camera,
    FileText,
    Calendar,
    ChevronDown,
    ChevronUp,
    Play,
    CheckCircle,
    Save,
    Upload,
    Loader2,
    Ruler
} from 'lucide-react';
import { Client, ClientTrainingAssignment, TrainingProgram, ProgramDay, ProgramActivity, Workout, ClientActivityLog, ClientDayLog } from '../../types';
import { trainingService } from '../../services/trainingService';
import { supabase } from '../../services/supabaseClient';
import { ActiveWorkoutSession } from './ActiveWorkoutSession';
import { CheckinView } from './CheckinView';

interface TrainingViewProps {
    client: Client;
    onBack: () => void;
}

type ActivityType = 'workout' | 'walking' | 'metrics' | 'photo' | 'form' | 'custom';

const ACTIVITY_META: Record<ActivityType, { label: string; Icon: React.FC<any> }> = {
    workout: { label: 'Entrenamiento', Icon: Dumbbell },
    walking: { label: 'Caminata', Icon: Footprints },
    metrics: { label: 'Métricas', Icon: Zap },
    photo: { label: 'Foto progreso', Icon: Camera },
    form: { label: 'Formulario', Icon: FileText },
    custom: { label: 'Tarea', Icon: Calendar },
};

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DAY_NAMES_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function extractYoutubeId(url?: string): string | null {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

interface ExerciseRowProps {
    we: {
        id: string;
        sets: number;
        reps: string;
        rest_seconds: number;
        notes?: string;
        exercise?: {
            name: string;
            media_type?: string;
            media_url?: string;
        };
    };
}

function ExerciseRow({ we }: ExerciseRowProps) {
    const exercise = we.exercise;
    const youtubeId = exercise?.media_type === 'youtube' ? extractYoutubeId(exercise.media_url) : null;
    const thumbUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : null;
    const [videoOpen, setVideoOpen] = useState(false);

    return (
        <div className="py-3 border-b border-brand-mint/30 last:border-0">
            <div className="flex items-start gap-3">
                {thumbUrl ? (
                    <button
                        onClick={() => setVideoOpen(v => !v)}
                        className="relative flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden bg-brand-mint/20 group"
                        aria-label={`Ver video de ${exercise?.name}`}
                    >
                        <img
                            src={thumbUrl}
                            alt={exercise?.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                            <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md">
                                {videoOpen
                                    ? <ChevronUp className="w-3 h-3 text-brand-dark" />
                                    : <Play className="w-3 h-3 text-brand-dark fill-brand-dark ml-0.5" />
                                }
                            </div>
                        </div>
                    </button>
                ) : (
                    <div className="flex-shrink-0 w-20 h-14 rounded-xl bg-brand-mint/20 flex items-center justify-center">
                        <Dumbbell className="w-6 h-6 text-brand-green/50" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-brand-dark text-sm leading-tight mb-1.5 truncate">
                        {exercise?.name || 'Ejercicio'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {we.sets > 0 && (
                            <span className="text-[11px] bg-brand-mint/40 text-brand-dark px-2 py-0.5 rounded-full font-semibold">
                                {we.sets} series
                            </span>
                        )}
                        {we.reps && (
                            <span className="text-[11px] bg-brand-mint/40 text-brand-dark px-2 py-0.5 rounded-full font-semibold">
                                {we.reps} reps
                            </span>
                        )}
                        {we.rest_seconds > 0 && (
                            <span className="text-[11px] bg-brand-gold/20 text-brand-dark px-2 py-0.5 rounded-full font-semibold">
                                {we.rest_seconds}s descanso
                            </span>
                        )}
                    </div>
                    {we.notes && (
                        <p className="text-xs text-slate-400 mt-1 italic">{we.notes}</p>
                    )}
                </div>
            </div>
            {videoOpen && youtubeId && (
                <div className="mt-3 rounded-xl overflow-hidden aspect-video w-full">
                    <iframe
                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                        title={exercise?.name}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                    />
                </div>
            )}
        </div>
    );
}

interface WorkoutDetailProps {
    workout: Workout;
}

type ExerciseSegment =
    | { type: 'single'; exercise: any }
    | { type: 'superset'; exercises: any[] };

function groupExercises(exercises: any[]): ExerciseSegment[] {
    const groups: ExerciseSegment[] = [];
    let i = 0;
    while (i < exercises.length) {
        const ex = exercises[i];
        if (ex.superset_id) {
            const group: any[] = [ex];
            let j = i + 1;
            while (j < exercises.length && exercises[j].superset_id === ex.superset_id) {
                group.push(exercises[j]);
                j++;
            }
            groups.push({ type: 'superset', exercises: group });
            i = j;
        } else {
            groups.push({ type: 'single', exercise: ex });
            i++;
        }
    }
    return groups;
}

function WorkoutDetail({ workout }: WorkoutDetailProps) {
    if (!workout.blocks || workout.blocks.length === 0) {
        return (
            <p className="text-sm text-slate-400 italic py-2 text-center">
                Este entrenamiento no tiene ejercicios configurados.
            </p>
        );
    }

    return (
        <div className="space-y-4">
            {workout.blocks.map((block) => (
                <div key={block.id}>
                    {block.name && (
                        <p className="text-xs font-black text-brand-green uppercase tracking-wider mb-2">
                            {block.name}
                        </p>
                    )}
                    <div>
                        {groupExercises(block.exercises || []).map((segment, gi) => {
                            if (segment.type === 'single') {
                                return <ExerciseRow key={segment.exercise.id} we={segment.exercise} />;
                            }
                            return (
                                <div key={`ss-${gi}`} className="border border-amber-200 rounded-xl overflow-hidden mb-2">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border-b border-amber-100">
                                        <Zap className="w-3 h-3 text-amber-500" />
                                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Superserie</span>
                                        {segment.exercises[0]?.superset_rounds && (
                                            <span className="text-[10px] font-bold text-amber-500 ml-auto">{segment.exercises[0].superset_rounds} rondas</span>
                                        )}
                                    </div>
                                    {segment.exercises.map((we, idx) => (
                                        <div key={we.id} className={`px-1 ${idx < segment.exercises.length - 1 ? 'border-b border-amber-100' : ''}`}>
                                            <ExerciseRow we={we} />
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

// --- Walking Activity Card ---
function WalkingActivityCard({ activity, existingLog, clientId, dayId, onSaved }: {
    activity: ProgramActivity; existingLog?: ClientActivityLog; clientId: string; dayId: string; onSaved: () => void;
}) {
    const goalSteps = activity.config?.goal_steps || 0;
    const [steps, setSteps] = useState<string>(existingLog?.data?.steps?.toString() || '');
    const [saving, setSaving] = useState(false);
    const saved = !!existingLog;

    const handleSave = async () => {
        if (!steps) return;
        setSaving(true);
        try {
            await trainingService.saveClientActivityLog({
                client_id: clientId, activity_id: activity.id, day_id: dayId,
                completed_at: new Date().toISOString(), data: { steps: Number(steps) }
            });
            onSaved();
        } catch (e) { console.error(e); alert('Error al guardar'); }
        finally { setSaving(false); }
    };

    return (
        <div className={`bg-white rounded-2xl border ${saved ? 'border-brand-green/40' : 'border-brand-mint/40'} shadow-sm overflow-hidden`}>
            <div className="flex items-center gap-3 p-4">
                <div className={`w-10 h-10 rounded-xl ${saved ? 'bg-brand-green/10' : 'bg-pink-50'} flex items-center justify-center flex-shrink-0`}>
                    {saved ? <CheckCircle className="w-5 h-5 text-brand-green" /> : <Footprints className="w-5 h-5 text-pink-500" />}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-black text-brand-dark text-sm">{activity.title || 'Caminata'}</p>
                    {goalSteps > 0 && <p className="text-xs text-slate-400">Meta: {goalSteps.toLocaleString()} pasos</p>}
                </div>
                {saved && <span className="text-xs font-bold text-brand-green bg-brand-green/10 px-2 py-1 rounded-full">Registrado</span>}
            </div>
            <div className="px-4 pb-4 space-y-3">
                {activity.description && <p className="text-xs text-slate-500 italic">{activity.description}</p>}
                <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                        <input type="number" value={steps} onChange={e => setSteps(e.target.value)} placeholder="Pasos realizados"
                            className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold text-brand-dark border border-slate-200 focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all" />
                        {goalSteps > 0 && Number(steps) > 0 && (
                            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold ${Number(steps) >= goalSteps ? 'text-brand-green' : 'text-orange-500'}`}>
                                {Math.round((Number(steps) / goalSteps) * 100)}%
                            </span>
                        )}
                    </div>
                    <button onClick={handleSave} disabled={saving || !steps}
                        className="px-5 py-3 bg-brand-green text-white rounded-xl font-bold text-sm disabled:opacity-40 hover:bg-emerald-600 active:scale-95 transition-all flex items-center gap-1.5">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saved ? 'Actualizar' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Metrics Activity Card ---
function MetricsActivityCard({ activity, existingLog, clientId, dayId, onSaved }: {
    activity: ProgramActivity; existingLog?: ClientActivityLog; clientId: string; dayId: string; onSaved: () => void;
}) {
    const [abdomen, setAbdomen] = useState<string>(existingLog?.data?.abdomen?.toString() || '');
    const [arm, setArm] = useState<string>(existingLog?.data?.arm?.toString() || '');
    const [thigh, setThigh] = useState<string>(existingLog?.data?.thigh?.toString() || '');
    const [saving, setSaving] = useState(false);
    const saved = !!existingLog;

    const handleSave = async () => {
        if (!abdomen && !arm && !thigh) return;
        setSaving(true);
        try {
            await trainingService.saveClientActivityLog({
                client_id: clientId, activity_id: activity.id, day_id: dayId,
                completed_at: new Date().toISOString(),
                data: {
                    abdomen: abdomen ? Number(abdomen) : undefined,
                    arm: arm ? Number(arm) : undefined,
                    thigh: thigh ? Number(thigh) : undefined
                }
            });
            onSaved();
        } catch (e) { console.error(e); alert('Error al guardar'); }
        finally { setSaving(false); }
    };

    const fields = [
        { label: 'Abdomen', value: abdomen, set: setAbdomen, unit: 'cm' },
        { label: 'Brazo', value: arm, set: setArm, unit: 'cm' },
        { label: 'Muslo', value: thigh, set: setThigh, unit: 'cm' },
    ];

    return (
        <div className={`bg-white rounded-2xl border ${saved ? 'border-brand-green/40' : 'border-brand-mint/40'} shadow-sm overflow-hidden`}>
            <div className="flex items-center gap-3 p-4">
                <div className={`w-10 h-10 rounded-xl ${saved ? 'bg-brand-green/10' : 'bg-sky-50'} flex items-center justify-center flex-shrink-0`}>
                    {saved ? <CheckCircle className="w-5 h-5 text-brand-green" /> : <Ruler className="w-5 h-5 text-sky-500" />}
                </div>
                <div className="flex-1"><p className="font-black text-brand-dark text-sm">{activity.title || 'Métricas'}</p></div>
                {saved && <span className="text-xs font-bold text-brand-green bg-brand-green/10 px-2 py-1 rounded-full">Registrado</span>}
            </div>
            <div className="px-4 pb-4 space-y-3">
                {activity.description && <p className="text-xs text-slate-500 italic">{activity.description}</p>}
                <div className="grid grid-cols-3 gap-2">
                    {fields.map(f => (
                        <div key={f.label} className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">{f.label}</label>
                            <div className="relative">
                                <input type="number" value={f.value} onChange={e => f.set(e.target.value)} placeholder="0"
                                    className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-sm font-bold text-brand-dark border border-slate-200 focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none text-center transition-all" />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">{f.unit}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={handleSave} disabled={saving || (!abdomen && !arm && !thigh)}
                    className="w-full py-3 bg-brand-green text-white rounded-xl font-bold text-sm disabled:opacity-40 hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-1.5">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saved ? 'Actualizar medidas' : 'Guardar medidas'}
                </button>
            </div>
        </div>
    );
}

// --- Photo Activity Card ---
function PhotoActivityCard({ activity, existingLog, clientId, dayId, onSaved }: {
    activity: ProgramActivity; existingLog?: ClientActivityLog; clientId: string; dayId: string; onSaved: () => void;
}) {
    const [urls, setUrls] = useState<{ front?: string; profile?: string; back?: string }>(existingLog?.data || {});
    const [uploading, setUploading] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const saved = !!existingLog;
    const frontRef = useRef<HTMLInputElement>(null);
    const profileRef = useRef<HTMLInputElement>(null);
    const backRef = useRef<HTMLInputElement>(null);

    const uploadPhoto = async (file: File, view: 'front' | 'profile' | 'back') => {
        setUploading(view);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `progress-photos/${clientId}/${activity.id}/${view}_${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('client-materials').upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('client-materials').getPublicUrl(fileName);
            setUrls(prev => ({ ...prev, [view]: publicUrl }));
        } catch (e) { console.error(e); alert('Error al subir foto'); }
        finally { setUploading(null); }
    };

    const handleSave = async () => {
        if (!urls.front && !urls.profile && !urls.back) return;
        setSaving(true);
        try {
            await trainingService.saveClientActivityLog({
                client_id: clientId, activity_id: activity.id, day_id: dayId,
                completed_at: new Date().toISOString(), data: urls
            });
            onSaved();
        } catch (e) { console.error(e); alert('Error al guardar'); }
        finally { setSaving(false); }
    };

    const views = [
        { key: 'front' as const, label: 'Frente', ref: frontRef },
        { key: 'profile' as const, label: 'Perfil', ref: profileRef },
        { key: 'back' as const, label: 'Espalda', ref: backRef },
    ];

    return (
        <div className={`bg-white rounded-2xl border ${saved ? 'border-brand-green/40' : 'border-brand-mint/40'} shadow-sm overflow-hidden`}>
            <div className="flex items-center gap-3 p-4">
                <div className={`w-10 h-10 rounded-xl ${saved ? 'bg-brand-green/10' : 'bg-cyan-50'} flex items-center justify-center flex-shrink-0`}>
                    {saved ? <CheckCircle className="w-5 h-5 text-brand-green" /> : <Camera className="w-5 h-5 text-cyan-500" />}
                </div>
                <div className="flex-1"><p className="font-black text-brand-dark text-sm">{activity.title || 'Fotos de progreso'}</p></div>
                {saved && <span className="text-xs font-bold text-brand-green bg-brand-green/10 px-2 py-1 rounded-full">Registrado</span>}
            </div>
            <div className="px-4 pb-4 space-y-3">
                {activity.description && <p className="text-xs text-slate-500 italic">{activity.description}</p>}
                <div className="grid grid-cols-3 gap-2">
                    {views.map(v => (
                        <div key={v.key} className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center block">{v.label}</label>
                            <input type="file" accept="image/*" capture="environment" ref={v.ref} className="hidden"
                                onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f, v.key); }} />
                            {urls[v.key] ? (
                                <button onClick={() => v.ref.current?.click()} className="w-full aspect-[3/4] rounded-xl overflow-hidden border-2 border-brand-green/30 relative group">
                                    <img src={urls[v.key]} alt={v.label} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Camera className="w-5 h-5 text-white" />
                                    </div>
                                </button>
                            ) : (
                                <button onClick={() => v.ref.current?.click()} disabled={uploading === v.key}
                                    className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-mint flex flex-col items-center justify-center gap-1.5 transition-colors bg-slate-50">
                                    {uploading === v.key
                                        ? <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                                        : <Upload className="w-5 h-5 text-slate-300" />}
                                    <span className="text-[10px] text-slate-400 font-bold">{uploading === v.key ? 'Subiendo...' : 'Subir'}</span>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <button onClick={handleSave} disabled={saving || (!urls.front && !urls.profile && !urls.back)}
                    className="w-full py-3 bg-brand-green text-white rounded-xl font-bold text-sm disabled:opacity-40 hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-1.5">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saved ? 'Actualizar fotos' : 'Guardar fotos'}
                </button>
            </div>
        </div>
    );
}

// --- Custom Activity Card (mark as done) ---
function CustomActivityCard({ activity, existingLog, clientId, dayId, onSaved }: {
    activity: ProgramActivity; existingLog?: ClientActivityLog; clientId: string; dayId: string; onSaved: () => void;
}) {
    const [saving, setSaving] = useState(false);
    const saved = !!existingLog;

    const handleComplete = async () => {
        setSaving(true);
        try {
            await trainingService.saveClientActivityLog({
                client_id: clientId, activity_id: activity.id, day_id: dayId,
                completed_at: new Date().toISOString(), data: { completed: true }
            });
            onSaved();
        } catch (e) { console.error(e); alert('Error al guardar'); }
        finally { setSaving(false); }
    };

    return (
        <div className={`bg-white rounded-2xl border ${saved ? 'border-brand-green/40' : 'border-brand-mint/40'} shadow-sm overflow-hidden`}>
            <div className="flex items-center gap-3 p-4">
                <div className={`w-10 h-10 rounded-xl ${saved ? 'bg-brand-green/10' : 'bg-violet-50'} flex items-center justify-center flex-shrink-0`}>
                    {saved ? <CheckCircle className="w-5 h-5 text-brand-green" /> : <Calendar className="w-5 h-5 text-violet-500" />}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-black text-brand-dark text-sm">{activity.title || 'Tarea'}</p>
                    {activity.description && <p className="text-xs text-slate-400">{activity.description}</p>}
                </div>
                {saved ? (
                    <span className="text-xs font-bold text-brand-green bg-brand-green/10 px-2 py-1 rounded-full">Completado</span>
                ) : (
                    <button onClick={handleComplete} disabled={saving}
                        className="px-4 py-2 bg-brand-green text-white rounded-xl font-bold text-xs hover:bg-emerald-600 active:scale-95 transition-all flex items-center gap-1.5">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        Hecho
                    </button>
                )}
            </div>
        </div>
    );
}

// --- Checkin Activity Card (opens CheckinView) ---
function CheckinActivityCard({ activity, onOpenCheckin }: {
    activity: ProgramActivity; onOpenCheckin: () => void;
}) {
    return (
        <div className="bg-white rounded-2xl border border-brand-mint/40 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-teal-500" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-black text-brand-dark text-sm">{activity.title || 'Check-in semanal'}</p>
                    {activity.description && <p className="text-xs text-slate-400">{activity.description}</p>}
                </div>
                <button onClick={onOpenCheckin}
                    className="px-4 py-2 bg-teal-500 text-white rounded-xl font-bold text-xs hover:bg-teal-600 active:scale-95 transition-all flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Abrir
                </button>
            </div>
        </div>
    );
}

// --- Workout Activity Card (existing behavior) ---
interface WorkoutActivityCardProps {
    activity: ProgramActivity;
    workout: Workout | null;
    workoutLoading: boolean;
    dayLog: ClientDayLog | null;
    onStartWorkout?: (w: Workout) => void;
}

function WorkoutActivityCard({ activity, workout, workoutLoading, dayLog, onStartWorkout }: WorkoutActivityCardProps) {
    const [expanded, setExpanded] = useState(true);
    const isCompleted = !!dayLog;

    return (
        <div className={`bg-white rounded-2xl border ${isCompleted ? 'border-brand-green/40' : 'border-brand-mint/40'} shadow-sm overflow-hidden`}>
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-brand-mint/10 transition-colors"
            >
                <div className={`w-10 h-10 rounded-xl ${isCompleted ? 'bg-brand-green/10' : 'bg-brand-mint/30'} flex items-center justify-center flex-shrink-0`}>
                    {isCompleted ? <CheckCircle className="w-5 h-5 text-brand-green" /> : <Dumbbell className="w-5 h-5 text-brand-green" />}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-black text-brand-dark text-sm">{activity.title || 'Entrenamiento'}</p>
                    {isCompleted ? (
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-bold text-brand-green">Completado</span>
                            {dayLog.duration_minutes && <span className="text-[10px] text-slate-400">{dayLog.duration_minutes} min</span>}
                            {dayLog.effort_rating && <span className="text-[10px] text-slate-400">RPE {dayLog.effort_rating}</span>}
                        </div>
                    ) : (
                        activity.description && <p className="text-xs text-slate-400 truncate">{activity.description}</p>
                    )}
                </div>
                {expanded
                    ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
            </button>
            {expanded && (
                <div className="px-4 pb-4 pt-1 border-t border-brand-mint/20">
                    {workoutLoading ? (
                        <div className="space-y-2 animate-pulse">
                            <div className="h-12 bg-brand-mint/20 rounded-xl" />
                            <div className="h-12 bg-brand-mint/20 rounded-xl" />
                        </div>
                    ) : workout ? (
                        <div className="space-y-4">
                            {/* Show past exercise results if completed */}
                            {isCompleted && dayLog.exercises && dayLog.exercises.length > 0 && (
                                <div className="bg-brand-green/5 rounded-xl p-3 space-y-2">
                                    <p className="text-[10px] font-black text-brand-green uppercase tracking-wider">Resultados</p>
                                    {dayLog.exercises.map((exLog) => {
                                        const we = (workout.blocks || []).flatMap(b => b.exercises || []).find(e => e.id === exLog.workout_exercise_id);
                                        return (
                                            <div key={exLog.id} className="flex items-center justify-between text-sm">
                                                <span className="text-brand-dark font-medium truncate flex-1">{we?.exercise?.name || 'Ejercicio'}</span>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
                                                    {exLog.sets_completed && <span>{exLog.sets_completed}×</span>}
                                                    {exLog.weight_used && <span>{exLog.weight_used} kg</span>}
                                                    {exLog.reps_completed && <span>{exLog.reps_completed} reps</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {dayLog.notes && (
                                        <p className="text-xs text-slate-500 italic mt-1 pt-1 border-t border-brand-green/10">{dayLog.notes}</p>
                                    )}
                                </div>
                            )}
                            <WorkoutDetail workout={workout} />
                            <button onClick={(e) => { e.stopPropagation(); onStartWorkout?.(workout); }}
                                className={`w-full py-4 mt-2 rounded-2xl font-black shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg group ${isCompleted
                                    ? 'bg-slate-100 text-slate-600 shadow-none hover:bg-slate-200'
                                    : 'bg-brand-green text-white shadow-brand-green/30 hover:bg-emerald-600'
                                }`}>
                                <Play className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" />
                                {isCompleted ? 'Repetir Entrenamiento' : 'Empezar Entrenamiento'}
                            </button>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 italic py-2 text-center">No se pudo cargar el entrenamiento.</p>
                    )}
                </div>
            )}
        </div>
    );
}

// --- Day Detail (dispatches to type-specific cards) ---
interface DayDetailProps {
    day: ProgramDay;
    workout: Workout | null;
    workoutLoading: boolean;
    dayName: string;
    clientId: string;
    activityLogs: ClientActivityLog[];
    dayLog: ClientDayLog | null;
    onStartWorkout?: (w: Workout) => void;
    onOpenCheckin: () => void;
    onActivitySaved: () => void;
}

function DayDetail({ day, workout, workoutLoading, dayName, clientId, activityLogs, dayLog, onStartWorkout, onOpenCheckin, onActivitySaved }: DayDetailProps) {
    if (!day.activities || day.activities.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-brand-mint/40 p-6 text-center">
                <Calendar className="w-8 h-8 text-brand-mint mx-auto mb-2" />
                <p className="text-sm text-slate-400">Día de descanso</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-xs font-black text-brand-dark uppercase tracking-wider px-1">
                {dayName} — {day.activities.length} actividad{day.activities.length !== 1 ? 'es' : ''}
            </p>
            {day.activities.map((activity) => {
                const log = activityLogs.find(l => l.activity_id === activity.id);
                const type = activity.type || 'custom';

                if (type === 'workout') {
                    return <WorkoutActivityCard key={activity.id} activity={activity} workout={workout} workoutLoading={workoutLoading} dayLog={dayLog} onStartWorkout={onStartWorkout} />;
                }
                if (type === 'walking') {
                    return <WalkingActivityCard key={activity.id} activity={activity} existingLog={log} clientId={clientId} dayId={day.id} onSaved={onActivitySaved} />;
                }
                if (type === 'metrics') {
                    return <MetricsActivityCard key={activity.id} activity={activity} existingLog={log} clientId={clientId} dayId={day.id} onSaved={onActivitySaved} />;
                }
                if (type === 'photo') {
                    return <PhotoActivityCard key={activity.id} activity={activity} existingLog={log} clientId={clientId} dayId={day.id} onSaved={onActivitySaved} />;
                }
                if (type === 'form') {
                    return <CheckinActivityCard key={activity.id} activity={activity} onOpenCheckin={onOpenCheckin} />;
                }
                return <CustomActivityCard key={activity.id} activity={activity} existingLog={log} clientId={clientId} dayId={day.id} onSaved={onActivitySaved} />;
            })}
        </div>
    );
}

export function TrainingView({ client, onBack }: TrainingViewProps) {
    const [assignment, setAssignment] = useState<ClientTrainingAssignment | null>(null);
    const [program, setProgram] = useState<TrainingProgram | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedWeek, setSelectedWeek] = useState(1);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
    const [workoutLoading, setWorkoutLoading] = useState(false);
    const [activeWorkout, setActiveWorkout] = useState<{ workout: Workout; dayId: string } | null>(null);
    const [activityLogs, setActivityLogs] = useState<ClientActivityLog[]>([]);
    const [dayLog, setDayLog] = useState<ClientDayLog | null>(null);
    const [showCheckin, setShowCheckin] = useState(false);

    const loadActivityLogs = async (dayId: string) => {
        try {
            const [logs, log] = await Promise.all([
                trainingService.getClientActivityLogs(client.id, dayId),
                trainingService.getClientDayLog(client.id, dayId)
            ]);
            setActivityLogs(logs);
            setDayLog(log);
        } catch (e) { console.error('Error loading activity logs:', e); }
    };

    // Load assignment and program
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const asgn = await trainingService.getClientAssignment(client.id);
                if (!asgn) {
                    setLoading(false);
                    return;
                }
                setAssignment(asgn);

                const prog = await trainingService.getProgramById(asgn.program_id);
                if (!prog) {
                    setLoading(false);
                    return;
                }
                setProgram(prog);

                // Calculate current week from start_date
                const startDate = new Date(asgn.start_date);
                const now = new Date();
                const diffDays = Math.floor((now.getTime() - startDate.getTime()) / 86400000);
                const calculatedWeek = Math.max(1, Math.ceil((diffDays + 1) / 7));
                const clampedWeek = Math.min(calculatedWeek, prog.weeks_count);
                setSelectedWeek(clampedWeek);
            } catch (err) {
                console.error('Error loading training assignment:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [client.id]);

    // Load workout and activity logs when day/week/program changes
    useEffect(() => {
        if (!program || selectedDay === null) {
            setSelectedWorkout(null);
            setActivityLogs([]);
            setDayLog(null);
            return;
        }

        const dayData = getDayData(selectedWeek, selectedDay);
        if (!dayData) {
            setSelectedWorkout(null);
            setActivityLogs([]);
            return;
        }

        // Load activity logs for the selected day
        loadActivityLogs(dayData.id);

        const workoutActivity = dayData.activities?.find(
            (a) => a.type === 'workout'
        );

        if (!workoutActivity) {
            setSelectedWorkout(null);
            return;
        }

        const workoutId = workoutActivity.activity_id || workoutActivity.workout_id;
        if (!workoutId) {
            setSelectedWorkout(null);
            return;
        }

        setWorkoutLoading(true);
        trainingService.getWorkoutById(workoutId).then((w) => {
            setSelectedWorkout(w);
            setWorkoutLoading(false);
        }).catch(() => {
            setSelectedWorkout(null);
            setWorkoutLoading(false);
        });
    }, [selectedDay, selectedWeek, program]);

    const getDayData = (week: number, dayNumber: number): ProgramDay | null => {
        if (!program) return null;
        return program.days.find(
            (d) => d.week_number === week && d.day_number === dayNumber
        ) || null;
    };

    const hasDayContent = (week: number, dayNumber: number): boolean => {
        const day = getDayData(week, dayNumber);
        return !!(day && day.activities && day.activities.length > 0);
    };

    // Loading skeleton
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pb-12">
                <div className="bg-white shadow-sm sticky top-0 z-10">
                    <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="h-6 w-40 bg-brand-mint/30 rounded animate-pulse" />
                    </div>
                </div>
                <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
                    <div className="h-12 bg-brand-mint/20 rounded-2xl animate-pulse" />
                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="h-20 bg-brand-mint/20 rounded-xl animate-pulse" />
                        ))}
                    </div>
                    <div className="h-48 bg-brand-mint/20 rounded-2xl animate-pulse" />
                </div>
            </div>
        );
    }

    // Empty state
    if (!assignment || !program) {
        return (
            <div className="min-h-screen bg-gray-50 pb-12">
                <div className="bg-white shadow-sm sticky top-0 z-10">
                    <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <h1 className="text-xl font-bold text-brand-dark flex items-center gap-2">
                            <Dumbbell className="w-6 h-6 text-brand-green" />
                            Mis Entrenamientos
                        </h1>
                    </div>
                </div>
                <div className="max-w-4xl mx-auto px-4 py-12">
                    <div className="bg-white p-8 sm:p-12 rounded-2xl text-center border border-brand-mint/40 shadow-sm">
                        <div className="w-16 h-16 bg-brand-mint/30 rounded-full flex items-center justify-center mx-auto mb-5">
                            <Dumbbell className="w-8 h-8 text-brand-green" />
                        </div>
                        <h2 className="text-xl font-bold text-brand-dark mb-3">
                            Sin programa asignado
                        </h2>
                        <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                            Tu coach te asignará un programa próximamente.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const selectedDayData = selectedDay !== null ? getDayData(selectedWeek, selectedDay) : null;

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-brand-dark flex items-center gap-2">
                            <Dumbbell className="w-6 h-6 text-brand-green" />
                            {program.name}
                        </h1>
                        {program.description && (
                            <p className="text-xs text-slate-400 mt-0.5">{program.description}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
                {/* Week Selector */}
                {program.weeks_count > 1 && (
                    <div>
                        <p className="text-xs font-black text-brand-dark uppercase tracking-wider mb-2 px-1">
                            Semana
                        </p>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {Array.from({ length: program.weeks_count }, (_, i) => i + 1).map((week) => (
                                <button
                                    key={week}
                                    onClick={() => { setSelectedWeek(week); setSelectedDay(null); setSelectedWorkout(null); }}
                                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedWeek === week
                                        ? 'bg-brand-green text-white shadow-sm'
                                        : 'bg-white border border-brand-mint/40 text-brand-dark hover:bg-brand-mint/20'
                                        }`}
                                >
                                    Sem. {week}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Day Grid */}
                <div>
                    <p className="text-xs font-black text-brand-dark uppercase tracking-wider mb-2 px-1">
                        Días — Semana {selectedWeek}
                    </p>
                    <div className="grid grid-cols-7 gap-1.5">
                        {Array.from({ length: 7 }, (_, i) => i + 1).map((dayNum) => {
                            const hasContent = hasDayContent(selectedWeek, dayNum);
                            const isSelected = selectedDay === dayNum;
                            const dayData = getDayData(selectedWeek, dayNum);
                            const activities = dayData?.activities || [];

                            return (
                                <button
                                    key={dayNum}
                                    onClick={() => hasContent ? setSelectedDay(isSelected ? null : dayNum) : undefined}
                                    disabled={!hasContent}
                                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${isSelected
                                        ? 'bg-brand-green text-white shadow-sm'
                                        : hasContent
                                            ? 'bg-white border border-brand-mint text-brand-dark hover:bg-brand-mint/20 active:scale-95'
                                            : 'bg-white border border-gray-100 text-gray-300 opacity-50 cursor-default'
                                        }`}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-wider">
                                        {DAY_NAMES[dayNum - 1]}
                                    </span>
                                    <div className="flex flex-col items-center gap-0.5 min-h-[32px] justify-center">
                                        {hasContent ? (
                                            activities.slice(0, 2).map((act, idx) => {
                                                const type = (act.type || 'custom') as ActivityType;
                                                const { Icon } = ACTIVITY_META[type] || ACTIVITY_META.custom;
                                                return (
                                                    <Icon
                                                        key={idx}
                                                        className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-brand-green'}`}
                                                    />
                                                );
                                            })
                                        ) : (
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Day Detail Panel */}
                {selectedDay !== null && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {selectedDayData ? (
                            <DayDetail
                                day={selectedDayData}
                                workout={selectedWorkout}
                                workoutLoading={workoutLoading}
                                dayName={DAY_NAMES_FULL[selectedDay - 1]}
                                clientId={client.id}
                                activityLogs={activityLogs}
                                dayLog={dayLog}
                                onStartWorkout={(workout) => setActiveWorkout({ workout, dayId: selectedDayData!.id })}
                                onOpenCheckin={() => setShowCheckin(true)}
                                onActivitySaved={() => loadActivityLogs(selectedDayData.id)}
                            />
                        ) : (
                            <div className="bg-white rounded-2xl border border-brand-mint/40 p-6 text-center">
                                <Calendar className="w-8 h-8 text-brand-mint mx-auto mb-2" />
                                <p className="text-sm text-slate-400">Día de descanso</p>
                            </div>
                        )}
                    </div>
                )}

                {selectedDay === null && (
                    <div className="bg-white rounded-2xl border border-brand-mint/40 p-6 text-center">
                        <Dumbbell className="w-8 h-8 text-brand-mint mx-auto mb-2" />
                        <p className="text-sm text-slate-500 font-medium">
                            Selecciona un día para ver tus actividades
                        </p>
                    </div>
                )}
            </div>

            {activeWorkout && (
                <ActiveWorkoutSession
                    workout={activeWorkout.workout}
                    clientId={client.id}
                    dayId={activeWorkout.dayId}
                    onClose={() => setActiveWorkout(null)}
                    onComplete={() => {
                        const dayId = activeWorkout.dayId;
                        setActiveWorkout(null);
                        loadActivityLogs(dayId);
                    }}
                />
            )}

            {showCheckin && (
                <div className="fixed inset-0 bg-white z-[100] overflow-y-auto">
                    <CheckinView client={client} onBack={() => setShowCheckin(false)} />
                </div>
            )}
        </div>
    );
}
