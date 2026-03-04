import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Plus, Pill, Zap, Droplets, Shield, Scissors, Stethoscope,
  ClipboardList, ScanLine, TestTube, CalendarCheck, FileText, Calendar,
  X, ChevronDown, ChevronUp, Clock, MapPin, MessageSquare, Activity,
  Frown, Flame, Brain, Heart, Moon, Hand, UtensilsCrossed, AlertCircle,
  CheckCircle2, BarChart3, Paperclip, Upload, Trash2, Eye, FileImage, File
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { TreatmentSession, TreatmentSymptomLog, OncologyReview, TreatmentType, ReviewType, ReviewAttachment } from '../../types';

// ─── Constants ─────────────────────────────────────────────────

const TREATMENT_META: Record<TreatmentType, { icon: React.FC<any>; label: string; color: string; bgColor: string; gradient: string }> = {
  chemotherapy: { icon: Pill, label: 'Quimioterapia', color: 'text-purple-600', bgColor: 'bg-purple-50', gradient: 'from-purple-500 to-purple-600' },
  radiotherapy: { icon: Zap, label: 'Radioterapia', color: 'text-amber-600', bgColor: 'bg-amber-50', gradient: 'from-amber-500 to-orange-500' },
  hormonotherapy: { icon: Droplets, label: 'Hormonoterapia', color: 'text-emerald-600', bgColor: 'bg-emerald-50', gradient: 'from-emerald-500 to-teal-500' },
  immunotherapy: { icon: Shield, label: 'Inmunoterapia', color: 'text-blue-600', bgColor: 'bg-blue-50', gradient: 'from-blue-500 to-cyan-500' },
  surgery: { icon: Scissors, label: 'Cirugía', color: 'text-red-600', bgColor: 'bg-red-50', gradient: 'from-red-500 to-rose-500' },
  other: { icon: Stethoscope, label: 'Otro', color: 'text-slate-600', bgColor: 'bg-slate-50', gradient: 'from-slate-500 to-slate-600' },
};

const REVIEW_META: Record<ReviewType, { icon: React.FC<any>; label: string; color: string; bgColor: string }> = {
  routine: { icon: ClipboardList, label: 'Rutina', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  scan: { icon: ScanLine, label: 'Prueba imagen', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  blood_work: { icon: TestTube, label: 'Analítica', color: 'text-red-600', bgColor: 'bg-red-50' },
  follow_up: { icon: CalendarCheck, label: 'Seguimiento', color: 'text-teal-600', bgColor: 'bg-teal-50' },
  other: { icon: FileText, label: 'Otro', color: 'text-slate-600', bgColor: 'bg-slate-50' },
};

const SYMPTOM_LIST = [
  { key: 'fatigue', label: 'Fatiga', icon: Activity },
  { key: 'nausea', label: 'Náuseas', icon: Frown },
  { key: 'vomiting', label: 'Vómitos', icon: Droplets },
  { key: 'pain', label: 'Dolor', icon: Flame },
  { key: 'diarrhea', label: 'Diarrea', icon: AlertCircle },
  { key: 'constipation', label: 'Estreñimiento', icon: AlertCircle },
  { key: 'appetite_loss', label: 'Sin apetito', icon: UtensilsCrossed },
  { key: 'mouth_sores', label: 'Llagas boca', icon: Frown },
  { key: 'skin_issues', label: 'Problemas piel', icon: AlertCircle },
  { key: 'numbness', label: 'Hormigueo', icon: Hand },
  { key: 'brain_fog', label: 'Niebla mental', icon: Brain },
  { key: 'mood', label: 'Estado ánimo', icon: Heart },
  { key: 'sleep_quality', label: 'Calidad sueño', icon: Moon },
];

const FEELING_EMOJIS = [
  { value: 1, emoji: '😣', label: 'Muy mal' },
  { value: 2, emoji: '😔', label: 'Mal' },
  { value: 3, emoji: '😐', label: 'Regular' },
  { value: 4, emoji: '🙂', label: 'Bien' },
  { value: 5, emoji: '😊', label: 'Muy bien' },
];

// ─── Types ─────────────────────────────────────────────────────

type TimelineEvent =
  | { type: 'session'; date: string; data: TreatmentSession }
  | { type: 'review'; date: string; data: OncologyReview }
  | { type: 'symptom'; date: string; data: TreatmentSymptomLog };

type ModalType = 'session' | 'review' | 'symptoms' | null;
type ViewMode = 'timeline' | 'calendar';

interface TreatmentViewProps {
  clientId: string;
  onBack?: () => void;
}

// ─── Component ─────────────────────────────────────────────────

export function TreatmentView({ clientId, onBack }: TreatmentViewProps) {
  const [sessions, setSessions] = useState<TreatmentSession[]>([]);
  const [reviews, setReviews] = useState<OncologyReview[]>([]);
  const [symptoms, setSymptoms] = useState<TreatmentSymptomLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);

  // Session form
  const [sessionForm, setSessionForm] = useState({
    treatment_type: '' as TreatmentType | '',
    session_date: new Date().toISOString().split('T')[0],
    treatment_name: '',
    cycle_number: '',
    total_cycles: '',
    location: '',
    overall_feeling: 0,
    notes: '',
  });

  // Review form
  const [reviewForm, setReviewForm] = useState({
    review_type: '' as ReviewType | '',
    review_date: new Date().toISOString().split('T')[0],
    doctor_name: '',
    location: '',
    summary: '',
    results: '',
    next_review_date: '',
    next_review_notes: '',
    mood_after: 0,
    notes: '',
  });

  // Symptom form
  const [symptomForm, setSymptomForm] = useState({
    session_id: '' as string,
    log_date: new Date().toISOString().split('T')[0],
    notes: '',
    ...Object.fromEntries(SYMPTOM_LIST.map(s => [s.key, 0])),
  });

  // File attachments for review
  const [reviewFiles, setReviewFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const [saving, setSaving] = useState(false);

  // ─── Load Data ───────────────────────────────────────────────

  useEffect(() => { loadAll(); }, [clientId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sessRes, revRes, sympRes] = await Promise.all([
        supabase.from('treatment_sessions').select('*').eq('client_id', clientId).order('session_date', { ascending: false }),
        supabase.from('oncology_reviews').select('*').eq('client_id', clientId).order('review_date', { ascending: false }),
        supabase.from('treatment_symptoms').select('*').eq('client_id', clientId).order('log_date', { ascending: false }),
      ]);
      if (sessRes.data) setSessions(sessRes.data);
      if (revRes.data) setReviews(revRes.data);
      if (sympRes.data) setSymptoms(sympRes.data);
    } catch (e) {
      console.error('Error loading treatment data:', e);
    } finally {
      setLoading(false);
    }
  };

  // ─── Timeline ────────────────────────────────────────────────

  const timeline = useMemo<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [
      ...sessions.map(s => ({ type: 'session' as const, date: s.session_date, data: s })),
      ...reviews.map(r => ({ type: 'review' as const, date: r.review_date, data: r })),
      ...symptoms.filter(s => !s.session_id).map(s => ({ type: 'symptom' as const, date: s.log_date, data: s })),
    ];
    events.sort((a, b) => b.date.localeCompare(a.date));
    return events;
  }, [sessions, reviews, symptoms]);

  // Group by month
  const groupedTimeline = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {};
    for (const evt of timeline) {
      const d = new Date(evt.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(evt);
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [timeline]);

  // ─── Stats ───────────────────────────────────────────────────

  const latestSession = sessions[0];
  const latestCycle = latestSession?.cycle_number && latestSession?.total_cycles
    ? `Ciclo ${latestSession.cycle_number} de ${latestSession.total_cycles}`
    : null;
  const nextReview = reviews.find(r => r.next_review_date && new Date(r.next_review_date) >= new Date());
  const daysSinceLastSession = latestSession
    ? Math.floor((Date.now() - new Date(latestSession.session_date).getTime()) / 86400000)
    : null;

  // ─── Save Handlers ──────────────────────────────────────────

  const saveSession = async () => {
    if (!sessionForm.treatment_type || !sessionForm.session_date) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('treatment_sessions').insert({
        client_id: clientId,
        session_date: sessionForm.session_date,
        treatment_type: sessionForm.treatment_type,
        treatment_name: sessionForm.treatment_name || null,
        cycle_number: sessionForm.cycle_number ? parseInt(sessionForm.cycle_number) : null,
        total_cycles: sessionForm.total_cycles ? parseInt(sessionForm.total_cycles) : null,
        location: sessionForm.location || null,
        overall_feeling: sessionForm.overall_feeling || null,
        notes: sessionForm.notes || null,
      });
      if (error) throw error;
      setActiveModal(null);
      resetSessionForm();
      loadAll();
    } catch (e) {
      console.error('Error saving session:', e);
      alert('Error al guardar la sesión');
    } finally {
      setSaving(false);
    }
  };

  const uploadReviewFiles = async (): Promise<ReviewAttachment[]> => {
    if (reviewFiles.length === 0) return [];
    setUploadingFiles(true);
    const uploaded: ReviewAttachment[] = [];
    try {
      for (const file of reviewFiles) {
        const ext = file.name.split('.').pop() || 'bin';
        const path = `${clientId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from('oncology-attachments').upload(path, file);
        if (error) {
          console.error('Upload error:', error);
          continue;
        }
        const { data: urlData } = supabase.storage.from('oncology-attachments').getPublicUrl(path);
        uploaded.push({
          url: urlData.publicUrl,
          name: file.name,
          type: file.type,
          size: file.size,
        });
      }
    } finally {
      setUploadingFiles(false);
    }
    return uploaded;
  };

  const removeReviewFile = (index: number) => {
    setReviewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleReviewFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setReviewFiles(prev => [...prev, ...newFiles].slice(0, 5)); // Max 5 files
    }
    e.target.value = ''; // Reset input
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return FileImage;
    return File;
  };

  const saveReview = async () => {
    if (!reviewForm.review_type || !reviewForm.review_date) return;
    setSaving(true);
    try {
      // Upload files first
      const attachments = await uploadReviewFiles();

      const { error } = await supabase.from('oncology_reviews').insert({
        client_id: clientId,
        review_date: reviewForm.review_date,
        review_type: reviewForm.review_type,
        doctor_name: reviewForm.doctor_name || null,
        location: reviewForm.location || null,
        summary: reviewForm.summary || null,
        results: reviewForm.results || null,
        next_review_date: reviewForm.next_review_date || null,
        next_review_notes: reviewForm.next_review_notes || null,
        mood_after: reviewForm.mood_after || null,
        notes: reviewForm.notes || null,
        attachments: attachments.length > 0 ? attachments : null,
      });
      if (error) throw error;
      setActiveModal(null);
      resetReviewForm();
      setReviewFiles([]);
      loadAll();
    } catch (e) {
      console.error('Error saving review:', e);
      alert('Error al guardar la revisión');
    } finally {
      setSaving(false);
    }
  };

  const saveSymptoms = async () => {
    if (!symptomForm.log_date) return;
    setSaving(true);
    try {
      const payload: any = {
        client_id: clientId,
        log_date: symptomForm.log_date,
        session_id: symptomForm.session_id || null,
        notes: symptomForm.notes || null,
      };
      for (const s of SYMPTOM_LIST) {
        payload[s.key] = (symptomForm as any)[s.key] || 0;
      }
      const { error } = await supabase.from('treatment_symptoms').insert(payload);
      if (error) throw error;
      setActiveModal(null);
      resetSymptomForm();
      loadAll();
    } catch (e) {
      console.error('Error saving symptoms:', e);
      alert('Error al guardar los síntomas');
    } finally {
      setSaving(false);
    }
  };

  const resetSessionForm = () => setSessionForm({ treatment_type: '', session_date: new Date().toISOString().split('T')[0], treatment_name: '', cycle_number: '', total_cycles: '', location: '', overall_feeling: 0, notes: '' });
  const resetReviewForm = () => { setReviewForm({ review_type: '', review_date: new Date().toISOString().split('T')[0], doctor_name: '', location: '', summary: '', results: '', next_review_date: '', next_review_notes: '', mood_after: 0, notes: '' }); setReviewFiles([]); };
  const resetSymptomForm = () => setSymptomForm({ session_id: '', log_date: new Date().toISOString().split('T')[0], notes: '', ...Object.fromEntries(SYMPTOM_LIST.map(s => [s.key, 0])) });

  // ─── Delete ──────────────────────────────────────────────────

  const deleteSession = async (id: string) => {
    if (!confirm('¿Eliminar esta sesión de tratamiento?')) return;
    await supabase.from('treatment_sessions').delete().eq('id', id);
    loadAll();
  };

  const deleteReview = async (id: string) => {
    if (!confirm('¿Eliminar esta revisión?')) return;
    await supabase.from('oncology_reviews').delete().eq('id', id);
    loadAll();
  };

  const deleteSymptomLog = async (id: string) => {
    if (!confirm('¿Eliminar este registro de síntomas?')) return;
    await supabase.from('treatment_symptoms').delete().eq('id', id);
    loadAll();
  };

  // ─── Calendar helpers ────────────────────────────────────────

  const calendarDays = useMemo(() => {
    const { year, month } = calendarMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0

    const days: { date: string; day: number; isCurrentMonth: boolean; events: TimelineEvent[] }[] = [];

    // Previous month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d.toISOString().split('T')[0], day: d.getDate(), isCurrentMonth: false, events: [] });
    }

    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date: dateStr, day: d, isCurrentMonth: true, events: [] });
    }

    // Fill events
    for (const evt of timeline) {
      const dayEntry = days.find(d => d.date === evt.date);
      if (dayEntry) dayEntry.events.push(evt);
    }

    // Pad to complete weeks
    while (days.length % 7 !== 0) {
      const d = new Date(year, month + 1, days.length - lastDay.getDate() - startOffset + 1);
      days.push({ date: d.toISOString().split('T')[0], day: d.getDate(), isCurrentMonth: false, events: [] });
    }

    return days;
  }, [calendarMonth, timeline]);

  const selectedDayEvents = selectedCalendarDay
    ? timeline.filter(e => e.date === selectedCalendarDay)
    : [];

  // ─── Helpers ─────────────────────────────────────────────────

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const formatMonthYear = (key: string) => {
    const [y, m] = key.split('-').map(Number);
    const d = new Date(y, m - 1);
    return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  const getSymptomColor = (value: number) => {
    if (value <= 3) return 'text-green-600 bg-green-50';
    if (value <= 6) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getSymptomBadges = (symptomData: TreatmentSymptomLog) => {
    return SYMPTOM_LIST
      .filter(s => (symptomData as any)[s.key] > 0)
      .sort((a, b) => ((symptomData as any)[b.key]) - ((symptomData as any)[a.key]))
      .slice(0, 4);
  };

  const getSymptomsForSession = (sessionId: string) => {
    return symptoms.filter(s => s.session_id === sessionId);
  };

  // ─── Render ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 text-white p-6 rounded-3xl mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black">Mi Tratamiento</h1>
              <p className="text-sm text-white/70">Seguimiento oncológico</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {latestCycle && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <p className="text-xs text-white/60 mb-0.5">Progreso</p>
                <p className="text-sm font-bold">{latestCycle}</p>
              </div>
            )}
            {nextReview?.next_review_date && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <p className="text-xs text-white/60 mb-0.5">Próx. revisión</p>
                <p className="text-sm font-bold">{formatDate(nextReview.next_review_date)}</p>
              </div>
            )}
            {daysSinceLastSession !== null && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <p className="text-xs text-white/60 mb-0.5">Última sesión</p>
                <p className="text-sm font-bold">
                  {daysSinceLastSession === 0 ? 'Hoy' : `Hace ${daysSinceLastSession}d`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button onClick={() => { resetSessionForm(); setActiveModal('session'); }} className="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-2xl transition-all hover:shadow-md">
          <div className="p-2 bg-purple-100 rounded-xl"><Pill className="w-5 h-5 text-purple-600" /></div>
          <span className="text-xs font-bold text-purple-700 text-center leading-tight">Sesión de tratamiento</span>
        </button>
        <button onClick={() => { resetReviewForm(); setActiveModal('review'); }} className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl transition-all hover:shadow-md">
          <div className="p-2 bg-blue-100 rounded-xl"><Stethoscope className="w-5 h-5 text-blue-600" /></div>
          <span className="text-xs font-bold text-blue-700 text-center leading-tight">Revisión oncológica</span>
        </button>
        <button onClick={() => { resetSymptomForm(); setActiveModal('symptoms'); }} className="flex flex-col items-center gap-2 p-4 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl transition-all hover:shadow-md">
          <div className="p-2 bg-amber-100 rounded-xl"><BarChart3 className="w-5 h-5 text-amber-600" /></div>
          <span className="text-xs font-bold text-amber-700 text-center leading-tight">Registrar síntomas</span>
        </button>
      </div>

      {/* View Toggle */}
      <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => setViewMode('timeline')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${viewMode === 'timeline' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
        >
          Timeline
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
        >
          Calendario
        </button>
      </div>

      {/* Content */}
      {viewMode === 'timeline' ? renderTimeline() : renderCalendar()}

      {/* Modals */}
      {activeModal === 'session' && renderSessionModal()}
      {activeModal === 'review' && renderReviewModal()}
      {activeModal === 'symptoms' && renderSymptomsModal()}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // TIMELINE VIEW
  // ═══════════════════════════════════════════════════════════════

  function renderTimeline() {
    if (timeline.length === 0) {
      return (
        <div className="text-center py-16 px-6">
          <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Pill className="w-8 h-8 text-purple-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">Aún no hay registros</h3>
          <p className="text-sm text-slate-500 mb-6">
            Empieza registrando tu primera sesión de tratamiento o revisión oncológica
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {groupedTimeline.map(([monthKey, events]) => (
          <div key={monthKey}>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4 px-1">
              {formatMonthYear(monthKey)}
            </h3>
            <div className="space-y-3">
              {events.map(evt => {
                if (evt.type === 'session') return renderSessionCard(evt.data as TreatmentSession);
                if (evt.type === 'review') return renderReviewCard(evt.data as OncologyReview);
                return renderSymptomCard(evt.data as TreatmentSymptomLog);
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderSessionCard(session: TreatmentSession) {
    const meta = TREATMENT_META[session.treatment_type] || TREATMENT_META.other;
    const Icon = meta.icon;
    const isExpanded = expandedId === session.id;
    const sessionSymptoms = getSymptomsForSession(session.id);

    return (
      <div key={session.id} className={`bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all hover:shadow-md ${isExpanded ? 'shadow-md' : ''}`}>
        <button
          className="w-full text-left p-4"
          onClick={() => setExpandedId(isExpanded ? null : session.id)}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl ${meta.bgColor} flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${meta.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${meta.color} uppercase tracking-wide`}>{meta.label}</span>
                <span className="text-xs text-slate-400">{formatDate(session.session_date)}</span>
              </div>
              <h4 className="font-bold text-slate-800 text-sm leading-tight">
                {session.treatment_name || meta.label}
                {session.cycle_number && session.total_cycles && (
                  <span className="text-slate-400 font-medium ml-1">
                    — Ciclo {session.cycle_number}/{session.total_cycles}
                  </span>
                )}
              </h4>
              {/* Feeling + Summary */}
              <div className="flex items-center gap-3 mt-2">
                {session.overall_feeling && (
                  <span className="text-lg">{FEELING_EMOJIS.find(f => f.value === session.overall_feeling)?.emoji}</span>
                )}
                {sessionSymptoms.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {getSymptomBadges(sessionSymptoms[0]).map(s => (
                      <span key={s.key} className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold ${getSymptomColor((sessionSymptoms[0] as any)[s.key])}`}>
                        {s.label} {(sessionSymptoms[0] as any)[s.key]}/10
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-shrink-0 mt-1">
              {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </div>
        </button>

        {isExpanded && (
          <div className="px-4 pb-4 pt-0 border-t border-slate-100">
            <div className="pt-3 space-y-3">
              {session.location && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {session.location}
                </div>
              )}
              {session.notes && (
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5" />
                  <p className="whitespace-pre-wrap">{session.notes}</p>
                </div>
              )}
              {/* Full symptom detail */}
              {sessionSymptoms.map(sym => (
                <div key={sym.id} className="bg-slate-50 rounded-xl p-3 mt-2">
                  <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Síntomas — {formatDate(sym.log_date)}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {SYMPTOM_LIST.filter(s => (sym as any)[s.key] > 0).map(s => (
                      <div key={s.key} className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">{s.label}</span>
                        <span className={`px-2 py-0.5 rounded-lg font-bold ${getSymptomColor((sym as any)[s.key])}`}>
                          {(sym as any)[s.key]}/10
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={(e) => { e.stopPropagation(); resetSymptomForm(); setSymptomForm(prev => ({ ...prev, session_id: session.id })); setActiveModal('symptoms'); }}
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 px-3 py-1.5 bg-purple-50 rounded-lg"
                >
                  + Añadir síntomas
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                  className="text-xs font-bold text-red-500 hover:text-red-600 px-3 py-1.5 bg-red-50 rounded-lg ml-auto"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderReviewCard(review: OncologyReview) {
    const meta = REVIEW_META[review.review_type] || REVIEW_META.other;
    const Icon = meta.icon;
    const isExpanded = expandedId === review.id;

    return (
      <div key={review.id} className={`bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all hover:shadow-md ${isExpanded ? 'shadow-md' : ''}`}>
        <button
          className="w-full text-left p-4"
          onClick={() => setExpandedId(isExpanded ? null : review.id)}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl ${meta.bgColor} flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${meta.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${meta.color} uppercase tracking-wide`}>Revisión — {meta.label}</span>
                <span className="text-xs text-slate-400">{formatDate(review.review_date)}</span>
              </div>
              <h4 className="font-bold text-slate-800 text-sm leading-tight">
                {review.doctor_name ? `Dr/a. ${review.doctor_name}` : meta.label}
              </h4>
              <div className="flex items-center gap-3 mt-2">
                {review.mood_after && (
                  <span className="text-lg">{FEELING_EMOJIS.find(f => f.value === review.mood_after)?.emoji}</span>
                )}
                {review.summary && (
                  <p className="text-xs text-slate-500 line-clamp-1">{review.summary}</p>
                )}
              </div>
              {review.next_review_date && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-teal-600">
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span className="font-semibold">Próxima: {formatDate(review.next_review_date)}</span>
                </div>
              )}
            </div>
            <div className="flex-shrink-0 mt-1">
              {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </div>
        </button>

        {isExpanded && (
          <div className="px-4 pb-4 pt-0 border-t border-slate-100">
            <div className="pt-3 space-y-3">
              {review.location && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {review.location}
                </div>
              )}
              {review.summary && (
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-1 uppercase">Resumen</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{review.summary}</p>
                </div>
              )}
              {review.results && (
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-1 uppercase">Resultados</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{review.results}</p>
                </div>
              )}
              {/* Attachments */}
              {review.attachments && review.attachments.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-2 uppercase flex items-center gap-1.5">
                    <Paperclip className="w-3 h-3" />
                    Documentos adjuntos ({review.attachments.length})
                  </p>
                  <div className="space-y-1.5">
                    {review.attachments.map((att, i) => {
                      const AttIcon = att.type?.startsWith('image/') ? FileImage : File;
                      return (
                        <a
                          key={i}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 p-2.5 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors group"
                        >
                          <div className="p-1.5 bg-indigo-100 group-hover:bg-indigo-200 rounded-lg transition-colors">
                            <AttIcon className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-indigo-700 truncate">{att.name}</p>
                            <p className="text-[10px] text-indigo-400">{formatFileSize(att.size)}</p>
                          </div>
                          <Eye className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
              {review.next_review_notes && (
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-1 uppercase">Notas próxima cita</p>
                  <p className="text-sm text-slate-600">{review.next_review_notes}</p>
                </div>
              )}
              {review.notes && (
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5" />
                  <p className="whitespace-pre-wrap">{review.notes}</p>
                </div>
              )}
              <div className="flex justify-end">
                <button
                  onClick={(e) => { e.stopPropagation(); deleteReview(review.id); }}
                  className="text-xs font-bold text-red-500 hover:text-red-600 px-3 py-1.5 bg-red-50 rounded-lg"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderSymptomCard(symptomLog: TreatmentSymptomLog) {
    const isExpanded = expandedId === symptomLog.id;
    const activeBadges = getSymptomBadges(symptomLog);

    return (
      <div key={symptomLog.id} className={`bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all hover:shadow-md ${isExpanded ? 'shadow-md' : ''}`}>
        <button
          className="w-full text-left p-4"
          onClick={() => setExpandedId(isExpanded ? null : symptomLog.id)}
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">Síntomas</span>
                <span className="text-xs text-slate-400">{formatDate(symptomLog.log_date)}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {activeBadges.map(s => (
                  <span key={s.key} className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold ${getSymptomColor((symptomLog as any)[s.key])}`}>
                    {s.label} {(symptomLog as any)[s.key]}/10
                  </span>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0 mt-1">
              {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </div>
        </button>

        {isExpanded && (
          <div className="px-4 pb-4 pt-0 border-t border-slate-100">
            <div className="pt-3">
              <div className="grid grid-cols-2 gap-2">
                {SYMPTOM_LIST.filter(s => (symptomLog as any)[s.key] > 0).map(s => (
                  <div key={s.key} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{s.label}</span>
                    <span className={`px-2 py-0.5 rounded-lg font-bold ${getSymptomColor((symptomLog as any)[s.key])}`}>
                      {(symptomLog as any)[s.key]}/10
                    </span>
                  </div>
                ))}
              </div>
              {symptomLog.notes && (
                <p className="text-sm text-slate-600 mt-3 whitespace-pre-wrap">{symptomLog.notes}</p>
              )}
              <div className="flex justify-end mt-2">
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSymptomLog(symptomLog.id); }}
                  className="text-xs font-bold text-red-500 hover:text-red-600 px-3 py-1.5 bg-red-50 rounded-lg"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // CALENDAR VIEW
  // ═══════════════════════════════════════════════════════════════

  function renderCalendar() {
    const { year, month } = calendarMonth;
    const monthName = new Date(year, month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const today = new Date().toISOString().split('T')[0];

    return (
      <div>
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCalendarMonth(prev => prev.month === 0 ? { year: prev.year - 1, month: 11 } : { ...prev, month: prev.month - 1 })} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ChevronDown className="w-5 h-5 text-slate-500 rotate-90" />
          </button>
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">{monthName}</h3>
          <button onClick={() => setCalendarMonth(prev => prev.month === 11 ? { year: prev.year + 1, month: 0 } : { ...prev, month: prev.month + 1 })} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ChevronDown className="w-5 h-5 text-slate-500 -rotate-90" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            const isToday = day.date === today;
            const isSelected = day.date === selectedCalendarDay;
            const hasEvents = day.events.length > 0;

            return (
              <button
                key={i}
                onClick={() => setSelectedCalendarDay(day.date === selectedCalendarDay ? null : day.date)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all text-xs
                  ${!day.isCurrentMonth ? 'text-slate-300' : 'text-slate-700'}
                  ${isToday ? 'ring-2 ring-purple-500 font-bold' : ''}
                  ${isSelected ? 'bg-purple-100' : hasEvents ? 'bg-slate-50 hover:bg-slate-100' : 'hover:bg-slate-50'}
                `}
              >
                <span className="font-semibold">{day.day}</span>
                {hasEvents && (
                  <div className="flex gap-0.5 mt-0.5">
                    {day.events.some(e => e.type === 'session') && <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
                    {day.events.some(e => e.type === 'review') && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                    {day.events.some(e => e.type === 'symptom') && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 justify-center">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-purple-500" /> Tratamiento</div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-blue-500" /> Revisión</div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-amber-500" /> Síntomas</div>
        </div>

        {/* Selected Day Events */}
        {selectedCalendarDay && selectedDayEvents.length > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-bold text-slate-700">
              {formatDate(selectedCalendarDay)}
            </h4>
            {selectedDayEvents.map(evt => {
              if (evt.type === 'session') return renderSessionCard(evt.data as TreatmentSession);
              if (evt.type === 'review') return renderReviewCard(evt.data as OncologyReview);
              return renderSymptomCard(evt.data as TreatmentSymptomLog);
            })}
          </div>
        )}

        {selectedCalendarDay && selectedDayEvents.length === 0 && (
          <div className="mt-6 text-center py-6">
            <p className="text-sm text-slate-400">Sin registros este día</p>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // MODALS
  // ═══════════════════════════════════════════════════════════════

  function renderSessionModal() {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50" onClick={() => setActiveModal(null)}>
        <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-3xl sm:rounded-t-3xl relative">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3">
              <Pill className="w-6 h-6" />
              <h2 className="text-lg font-black">Registrar sesión de tratamiento</h2>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Treatment Type */}
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-3">Tipo de tratamiento</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(TREATMENT_META) as [TreatmentType, typeof TREATMENT_META[TreatmentType]][]).map(([key, meta]) => {
                  const Icon = meta.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setSessionForm(prev => ({ ...prev, treatment_type: key }))}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left
                        ${sessionForm.treatment_type === key
                          ? `${meta.bgColor} border-current ${meta.color} shadow-sm`
                          : 'border-slate-200 hover:border-slate-300'
                        }`}
                    >
                      <Icon className={`w-5 h-5 ${sessionForm.treatment_type === key ? meta.color : 'text-slate-400'}`} />
                      <span className={`text-sm font-bold ${sessionForm.treatment_type === key ? meta.color : 'text-slate-600'}`}>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Fecha</label>
              <input
                type="date"
                value={sessionForm.session_date}
                onChange={e => setSessionForm(prev => ({ ...prev, session_date: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none"
              />
            </div>

            {/* Treatment Name */}
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Nombre / Protocolo <span className="text-slate-400 font-normal">(opcional)</span></label>
              <input
                type="text"
                value={sessionForm.treatment_name}
                onChange={e => setSessionForm(prev => ({ ...prev, treatment_name: e.target.value }))}
                placeholder="Ej: Taxol, AC-T, Herceptin..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none"
              />
            </div>

            {/* Cycle */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">Nº Ciclo</label>
                <input
                  type="number"
                  value={sessionForm.cycle_number}
                  onChange={e => setSessionForm(prev => ({ ...prev, cycle_number: e.target.value }))}
                  placeholder="3"
                  min="1"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">Total ciclos</label>
                <input
                  type="number"
                  value={sessionForm.total_cycles}
                  onChange={e => setSessionForm(prev => ({ ...prev, total_cycles: e.target.value }))}
                  placeholder="6"
                  min="1"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Lugar <span className="text-slate-400 font-normal">(opcional)</span></label>
              <input
                type="text"
                value={sessionForm.location}
                onChange={e => setSessionForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Hospital / clínica"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none"
              />
            </div>

            {/* Overall Feeling */}
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-3">¿Cómo te sientes?</label>
              <div className="flex justify-around">
                {FEELING_EMOJIS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setSessionForm(prev => ({ ...prev, overall_feeling: f.value }))}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${sessionForm.overall_feeling === f.value ? 'bg-purple-50 ring-2 ring-purple-300 scale-110' : 'hover:bg-slate-50'
                      }`}
                  >
                    <span className="text-2xl">{f.emoji}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Notas <span className="text-slate-400 font-normal">(opcional)</span></label>
              <textarea
                value={sessionForm.notes}
                onChange={e => setSessionForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="¿Cómo fue la sesión? ¿Algo que quieras recordar?"
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none resize-none"
              />
            </div>

            {/* Submit */}
            <button
              onClick={saveSession}
              disabled={!sessionForm.treatment_type || saving}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-black text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {saving ? 'Guardando...' : 'Guardar sesión'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderReviewModal() {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50" onClick={() => setActiveModal(null)}>
        <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-t-3xl relative">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3">
              <Stethoscope className="w-6 h-6" />
              <h2 className="text-lg font-black">Registrar revisión oncológica</h2>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Review Type */}
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-3">Tipo de revisión</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(REVIEW_META) as [ReviewType, typeof REVIEW_META[ReviewType]][]).map(([key, meta]) => {
                  const Icon = meta.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setReviewForm(prev => ({ ...prev, review_type: key }))}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left
                        ${reviewForm.review_type === key
                          ? `${meta.bgColor} border-current ${meta.color} shadow-sm`
                          : 'border-slate-200 hover:border-slate-300'
                        }`}
                    >
                      <Icon className={`w-5 h-5 ${reviewForm.review_type === key ? meta.color : 'text-slate-400'}`} />
                      <span className={`text-sm font-bold ${reviewForm.review_type === key ? meta.color : 'text-slate-600'}`}>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Fecha de la revisión</label>
              <input
                type="date"
                value={reviewForm.review_date}
                onChange={e => setReviewForm(prev => ({ ...prev, review_date: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none"
              />
            </div>

            {/* Doctor */}
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Doctor/a</label>
              <input
                type="text"
                value={reviewForm.doctor_name}
                onChange={e => setReviewForm(prev => ({ ...prev, doctor_name: e.target.value }))}
                placeholder="Nombre del oncólogo/a"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none"
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Lugar <span className="text-slate-400 font-normal">(opcional)</span></label>
              <input
                type="text"
                value={reviewForm.location}
                onChange={e => setReviewForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Hospital / clínica"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none"
              />
            </div>

            {/* Summary */}
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Resumen de la consulta</label>
              <textarea
                value={reviewForm.summary}
                onChange={e => setReviewForm(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="¿Qué te dijo el doctor/a? Puntos importantes..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none resize-none"
              />
            </div>

            {/* Results */}
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Resultados <span className="text-slate-400 font-normal">(analítica, TAC, etc.)</span></label>
              <textarea
                value={reviewForm.results}
                onChange={e => setReviewForm(prev => ({ ...prev, results: e.target.value }))}
                placeholder="Resultados relevantes..."
                rows={2}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none resize-none"
              />
            </div>

            {/* Attachments Upload */}
            <div>
              <label className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-indigo-500" />
                Adjuntar documentos
                <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <p className="text-xs text-slate-400 mb-3">Fotos de analíticas, informes PDF, resultados de TAC... (máx. 5 archivos)</p>

              {/* File list */}
              {reviewFiles.length > 0 && (
                <div className="space-y-2 mb-3">
                  {reviewFiles.map((file, i) => {
                    const FIcon = getFileIcon(file.type);
                    return (
                      <div key={i} className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="p-1.5 bg-indigo-50 rounded-lg">
                          <FIcon className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-400">{formatFileSize(file.size)}</p>
                        </div>
                        {file.type.startsWith('image/') && (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                          />
                        )}
                        <button
                          onClick={() => removeReviewFile(i)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors group"
                        >
                          <Trash2 className="w-4 h-4 text-slate-300 group-hover:text-red-500 transition-colors" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Upload button */}
              {reviewFiles.length < 5 && (
                <label className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl cursor-pointer transition-all group">
                  <div className="p-2 bg-indigo-100 group-hover:bg-indigo-200 rounded-xl transition-colors">
                    <Upload className="w-5 h-5 text-indigo-500" />
                  </div>
                  <span className="text-xs font-bold text-indigo-600">Pulsa para adjuntar archivo</span>
                  <span className="text-[10px] text-indigo-400">PDF, JPG, PNG • máx. 10 MB</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.heic,.webp"
                    onChange={handleReviewFilesChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Next Review */}
            <div className="bg-teal-50 rounded-xl p-4 border border-teal-200">
              <label className="text-sm font-bold text-teal-700 block mb-3">
                <CalendarCheck className="w-4 h-4 inline mr-1.5" />
                Próxima cita
              </label>
              <input
                type="date"
                value={reviewForm.next_review_date}
                onChange={e => setReviewForm(prev => ({ ...prev, next_review_date: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-teal-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-300 outline-none mb-2"
              />
              <input
                type="text"
                value={reviewForm.next_review_notes}
                onChange={e => setReviewForm(prev => ({ ...prev, next_review_notes: e.target.value }))}
                placeholder="Notas para la próxima cita..."
                className="w-full px-4 py-3 bg-white border border-teal-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-300 outline-none"
              />
            </div>

            {/* Mood After */}
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-3">¿Cómo te sientes tras la revisión?</label>
              <div className="flex justify-around">
                {FEELING_EMOJIS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setReviewForm(prev => ({ ...prev, mood_after: f.value }))}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${reviewForm.mood_after === f.value ? 'bg-blue-50 ring-2 ring-blue-300 scale-110' : 'hover:bg-slate-50'
                      }`}
                  >
                    <span className="text-2xl">{f.emoji}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Notas adicionales</label>
              <textarea
                value={reviewForm.notes}
                onChange={e => setReviewForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Cualquier cosa que quieras recordar..."
                rows={2}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none resize-none"
              />
            </div>

            {/* Submit */}
            <button
              onClick={saveReview}
              disabled={!reviewForm.review_type || saving}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-black text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {saving ? 'Guardando...' : 'Guardar revisión'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderSymptomsModal() {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50" onClick={() => setActiveModal(null)}>
        <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-3xl relative">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6" />
              <h2 className="text-lg font-black">Registrar síntomas</h2>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Link to session */}
            {sessions.length > 0 && (
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">Vincular a sesión <span className="text-slate-400 font-normal">(opcional)</span></label>
                <select
                  value={symptomForm.session_id}
                  onChange={e => setSymptomForm(prev => ({ ...prev, session_id: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-300 outline-none"
                >
                  <option value="">Sin vincular</option>
                  {sessions.slice(0, 10).map(s => {
                    const meta = TREATMENT_META[s.treatment_type] || TREATMENT_META.other;
                    return (
                      <option key={s.id} value={s.id}>
                        {formatDate(s.session_date)} — {meta.label} {s.treatment_name ? `(${s.treatment_name})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Date */}
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Fecha</label>
              <input
                type="date"
                value={symptomForm.log_date}
                onChange={e => setSymptomForm(prev => ({ ...prev, log_date: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-300 outline-none"
              />
            </div>

            {/* Symptom Sliders */}
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-4">Intensidad de síntomas</label>
              <div className="space-y-4">
                {SYMPTOM_LIST.map(s => {
                  const value = (symptomForm as any)[s.key] || 0;
                  const Icon = s.icon;
                  return (
                    <div key={s.key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${value > 0 ? (value <= 3 ? 'text-green-500' : value <= 6 ? 'text-amber-500' : 'text-red-500') : 'text-slate-400'}`} />
                          <span className="text-sm font-medium text-slate-700">{s.label}</span>
                        </div>
                        <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${value === 0 ? 'text-slate-400' : getSymptomColor(value)}`}>
                          {value}/10
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={value}
                        onChange={e => setSymptomForm(prev => ({ ...prev, [s.key]: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Other Symptoms */}
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Otros síntomas</label>
              <input
                type="text"
                value={(symptomForm as any).other_symptoms || ''}
                onChange={e => setSymptomForm(prev => ({ ...prev, other_symptoms: e.target.value }))}
                placeholder="Otros síntomas no listados..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-300 outline-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Notas</label>
              <textarea
                value={symptomForm.notes}
                onChange={e => setSymptomForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="¿Algo más que quieras anotar?"
                rows={2}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-300 outline-none resize-none"
              />
            </div>

            {/* Submit */}
            <button
              onClick={saveSymptoms}
              disabled={saving}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-black text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {saving ? 'Guardando...' : 'Guardar síntomas'}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
