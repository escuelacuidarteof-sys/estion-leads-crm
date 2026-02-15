
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Video, Calendar, MessageSquare, PlayCircle, ExternalLink, AlertCircle, Stethoscope } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { mockDb } from '../../services/mockSupabase';
import { MedicalReview } from '../../types';

// Unified review type for display
interface UnifiedReview {
    id: string;
    date: string;
    type: 'coach' | 'endocrino';
    notes: string;
    video_url?: string;
    original?: any;
}

interface ReviewsViewProps {
    clientId: string;
    onBack: () => void;
    currentWeeklyComments?: string; // To show the comments from the client profile for the latest review
}

export function ReviewsView({ clientId, onBack, currentWeeklyComments }: ReviewsViewProps) {
    const [reviews, setReviews] = useState<UnifiedReview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReviews();
    }, [clientId]);

    const loadReviews = async () => {
        try {
            // Load coach reviews
            const coachReviews = await mockDb.getClientReviews(clientId);

            // Load medical reviews (endocrino)
            const medicalReviews: MedicalReview[] = await mockDb.medical.getByClient(clientId);

            // Convert coach reviews to unified format
            const unifiedCoachReviews: UnifiedReview[] = coachReviews.map(r => ({
                id: r.id,
                date: r.date,
                type: 'coach' as const,
                notes: r.coach_comments || '',
                video_url: r.recording_url,
                original: r
            }));

            // Convert medical reviews to unified format (only reviewed ones with feedback)
            const unifiedMedicalReviews: UnifiedReview[] = medicalReviews
                .filter(r => r.status === 'reviewed' && (r.doctor_notes || r.doctor_video_url) && r.report_type !== 'Informe Médico')
                .map(r => ({
                    id: r.id,
                    date: r.reviewed_at || r.submission_date,
                    type: 'endocrino' as const,
                    notes: r.doctor_notes || '',
                    video_url: r.doctor_video_url,
                    original: r
                }));

            // Combine and sort by date (most recent first)
            const allReviews = [...unifiedCoachReviews, ...unifiedMedicalReviews]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setReviews(allReviews);
        } catch (error) {
            console.error('Error loading reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={onBack}
                    className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium"
                >
                    <ArrowLeft className="w-5 h-5" /> Volver al Dashboard
                </button>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-8 text-white">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                <Video className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Historial de Revisiones</h1>
                                <p className="text-pink-100">Feedback de tu coach y respuestas del endocrino</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p className="text-slate-500">Cargando revisiones...</p>
                            </div>
                        ) : reviews.length === 0 ? (
                            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Video className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700 mb-2">Aún no tienes revisiones</h3>
                                <p className="text-slate-500 max-w-sm mx-auto">
                                    Aquí aparecerán las revisiones de tu coach y las respuestas del endocrino. ¡Mantente atento!
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* LISTA DE REVISIONES */}
                                {reviews.map((review, idx) => {
                                    const isLatest = idx === 0;
                                    const isEndocrino = review.type === 'endocrino';
                                    const isInitialAssessment = isEndocrino && review.original?.report_type === 'Valoración Inicial';
                                    // For coach reviews, use currentWeeklyComments as fallback for latest
                                    const notes = review.notes || (isLatest && !isEndocrino && currentWeeklyComments) || "Sin notas adicionales.";
                                    const hasUrl = !!review.video_url;

                                    // Colors based on review type
                                    const accentColor = isInitialAssessment
                                        ? { border: 'border-indigo-200', shadow: 'shadow-indigo-50', ring: 'ring-indigo-100', gradient: 'from-indigo-500 to-purple-500' }
                                        : isEndocrino
                                        ? { border: 'border-teal-200', shadow: 'shadow-teal-50', ring: 'ring-teal-100', gradient: 'from-teal-500 to-emerald-500' }
                                        : { border: 'border-pink-200', shadow: 'shadow-pink-50', ring: 'ring-pink-100', gradient: 'from-pink-500 to-rose-500' };

                                    return (
                                        <div key={review.id || idx} className={`group relative bg-white rounded-2xl border transition-all duration-300 ${isLatest ? `${accentColor.border} shadow-lg ${accentColor.shadow} ring-1 ${accentColor.ring}` : 'border-slate-200 hover:shadow-md'}`}>
                                            {isLatest && (
                                                <div className={`absolute -top-3 left-6 px-3 py-1 bg-gradient-to-r ${accentColor.gradient} text-white text-xs font-bold uppercase tracking-wide rounded-full shadow-sm`}>
                                                    Última Revisión
                                                </div>
                                            )}

                                            {/* Type badge */}
                                            <div className={`absolute -top-3 right-6 px-3 py-1 ${isInitialAssessment ? 'bg-indigo-100 text-indigo-700' : isEndocrino ? 'bg-teal-100 text-teal-700' : 'bg-pink-100 text-pink-700'} text-xs font-bold uppercase tracking-wide rounded-full flex items-center gap-1`}>
                                                {isEndocrino ? <Stethoscope className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                                                {isInitialAssessment ? 'Valoración Inicial' : isEndocrino ? 'Endocrino' : 'Coach'}
                                            </div>

                                            <div className="p-6 pt-8 flex flex-col sm:flex-row gap-6">
                                                {/* Left: Date & Status */}
                                                <div className="sm:w-48 shrink-0 flex flex-col justify-center border-b sm:border-b-0 sm:border-r border-slate-100 pb-4 sm:pb-0 sm:pr-6">
                                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                                        <Calendar className="w-4 h-4" />
                                                        <span className="text-sm font-medium">{new Date(review.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                                                        {new Date(review.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>

                                                {/* Middle: Notes */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start gap-3 mb-2">
                                                        {isEndocrino ? (
                                                            <Stethoscope className="w-5 h-5 text-teal-500 mt-0.5 shrink-0" />
                                                        ) : (
                                                            <MessageSquare className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                                                        )}
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 text-sm uppercase mb-1">
                                                                {isInitialAssessment ? 'Valoración Inicial del Endocrino' : isEndocrino ? 'Respuesta del Endocrino' : 'Feedback del Coach'}
                                                            </h4>
                                                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                                                                {notes}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right: Action */}
                                                <div className="sm:w-48 shrink-0 flex items-center justify-end">
                                                    {hasUrl ? (
                                                        <a
                                                            href={review.video_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 ${isInitialAssessment ? 'bg-indigo-600 hover:bg-indigo-700' : isEndocrino ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-900 hover:bg-slate-800'} text-white rounded-xl font-bold transition-transform transform active:scale-95 shadow-lg shadow-slate-200`}
                                                        >
                                                            <PlayCircle className="w-5 h-5" />
                                                            <span>Ver Video</span>
                                                        </a>
                                                    ) : (
                                                        <div className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-slate-100 text-slate-400 rounded-xl font-medium cursor-not-allowed">
                                                            <AlertCircle className="w-5 h-5" />
                                                            <span>Sin Video</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
