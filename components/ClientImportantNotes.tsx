import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { FileText, Calendar, AlertTriangle, MessageCircle, ChevronDown, ChevronUp, Pencil, Trash2, Save, X } from 'lucide-react';

interface WellnessNote {
    id: string;
    log_date: string;
    notes: string;
    mood?: string;
    energy_level?: number;
    sleep_quality?: number;
}

interface ClientImportantNotesProps {
    clientId: string;
    clientName?: string;
    onSendFeedback?: (note: WellnessNote) => void;
}

const MOODS: Record<string, { emoji: string; label: string }> = {
    'great': { emoji: '😊', label: 'Genial' },
    'good': { emoji: '🙂', label: 'Bien' },
    'neutral': { emoji: '😐', label: 'Normal' },
    'low': { emoji: '😕', label: 'Bajo' },
    'bad': { emoji: '😢', label: 'Mal' }
};

export function ClientImportantNotes({ clientId, clientName, onSendFeedback }: ClientImportantNotesProps) {
    const [notes, setNotes] = useState<WellnessNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(true);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState('');
    const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
    const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

    useEffect(() => {
        loadNotes();
    }, [clientId]);

    const loadNotes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('wellness_logs')
                .select('id, log_date, notes, mood, energy_level, sleep_quality')
                .eq('client_id', clientId)
                .not('notes', 'is', null)
                .neq('notes', '')
                .order('log_date', { ascending: false })
                .limit(20);

            if (error) throw error;
            setNotes(data || []);
        } catch (error) {
            console.error('Error loading client notes:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (dateStr === today.toISOString().split('T')[0]) {
            return 'Hoy';
        } else if (dateStr === yesterday.toISOString().split('T')[0]) {
            return 'Ayer';
        }
        return date.toLocaleDateString('es-ES', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    };

    const getUrgencyLevel = (note: WellnessNote) => {
        // Determine urgency based on keywords and mood
        const text = note.notes.toLowerCase();
        const urgentKeywords = ['hospital', 'urgencia', 'emergencia', 'bajón', 'hipoglucemia', 'desmayo', 'caída', 'lesión', 'dolor fuerte', 'vomit'];
        const warningKeywords = ['mal', 'dolor', 'mareo', 'golpe', 'no puedo', 'problema', 'preocup'];

        if (urgentKeywords.some(kw => text.includes(kw)) || note.mood === 'bad') {
            return 'urgent';
        }
        if (warningKeywords.some(kw => text.includes(kw)) || note.mood === 'low') {
            return 'warning';
        }
        return 'normal';
    };

    const startEditingNote = (note: WellnessNote) => {
        setEditingNoteId(note.id);
        setEditingText(note.notes || '');
    };

    const cancelEditing = () => {
        setEditingNoteId(null);
        setEditingText('');
    };

    const saveNote = async (noteId: string) => {
        const trimmedText = editingText.trim();
        if (!trimmedText) {
            alert('La nota no puede quedar vacia.');
            return;
        }

        setSavingNoteId(noteId);
        try {
            const { error } = await supabase
                .from('wellness_logs')
                .update({ notes: trimmedText })
                .eq('id', noteId)
                .eq('client_id', clientId);

            if (error) throw error;

            setNotes(prev => prev.map(n => n.id === noteId ? { ...n, notes: trimmedText } : n));
            cancelEditing();
        } catch (error) {
            console.error('Error updating note:', error);
            alert('No se pudo actualizar la nota. Intenta de nuevo.');
        } finally {
            setSavingNoteId(null);
        }
    };

    const deleteNote = async (noteId: string) => {
        const confirmed = window.confirm('¿Seguro que quieres eliminar esta nota? Esta accion no se puede deshacer.');
        if (!confirmed) return;

        setDeletingNoteId(noteId);
        try {
            const { error } = await supabase
                .from('wellness_logs')
                .update({ notes: null })
                .eq('id', noteId)
                .eq('client_id', clientId);

            if (error) throw error;

            setNotes(prev => prev.filter(n => n.id !== noteId));
            if (editingNoteId === noteId) {
                cancelEditing();
            }
        } catch (error) {
            console.error('Error deleting note:', error);
            alert('No se pudo eliminar la nota. Intenta de nuevo.');
        } finally {
            setDeletingNoteId(null);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="animate-pulse flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
                    <div className="flex-1">
                        <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        );
    }

    const recentNotes = notes.filter(n => {
        const noteDate = new Date(n.log_date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return noteDate >= weekAgo;
    });

    const hasRecentNotes = recentNotes.length > 0;

    return (
        <div className={`rounded-xl border shadow-sm transition-all ${hasRecentNotes ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-black/5 transition-colors rounded-t-xl"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${hasRecentNotes ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <FileText className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <h3 className={`font-bold ${hasRecentNotes ? 'text-rose-800' : 'text-slate-800'}`}>
                            Notas Importantes del Cliente
                        </h3>
                        <p className="text-sm text-slate-500">
                            {notes.length > 0
                                ? `${notes.length} nota${notes.length > 1 ? 's' : ''} registrada${notes.length > 1 ? 's' : ''}`
                                : 'Sin notas registradas'
                            }
                            {recentNotes.length > 0 && (
                                <span className="ml-2 px-2 py-0.5 bg-rose-500 text-white text-xs font-bold rounded-full">
                                    {recentNotes.length} esta semana
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                {notes.length > 0 && (
                    isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
            </button>

            {/* Content */}
            {isExpanded && notes.length > 0 && (
                <div className="border-t border-rose-100 p-4 space-y-3 max-h-96 overflow-y-auto">
                    {notes.map((note) => {
                        const urgency = getUrgencyLevel(note);
                        const moodInfo = note.mood ? MOODS[note.mood] : null;

                        return (
                            <div
                                key={note.id}
                                className={`p-4 rounded-xl border transition-all hover:shadow-md ${urgency === 'urgent'
                                        ? 'bg-red-50 border-red-200'
                                        : urgency === 'warning'
                                            ? 'bg-amber-50 border-amber-200'
                                            : 'bg-white border-slate-200'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        <span className={`text-sm font-bold ${urgency === 'urgent' ? 'text-red-700' :
                                                urgency === 'warning' ? 'text-amber-700' :
                                                    'text-slate-700'
                                            }`}>
                                            {formatDate(note.log_date)}
                                        </span>
                                        {urgency === 'urgent' && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                                                <AlertTriangle className="w-3 h-3" /> Urgente
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {moodInfo && (
                                            <span className="text-lg" title={moodInfo.label}>
                                                {moodInfo.emoji}
                                            </span>
                                        )}
                                        {note.energy_level && (
                                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                                Energía: {note.energy_level}/5
                                            </span>
                                        )}
                                        <button
                                            onClick={() => startEditingNote(note)}
                                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
                                            title="Editar nota"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => deleteNote(note.id)}
                                            disabled={deletingNoteId === note.id}
                                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Eliminar nota"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {editingNoteId === note.id ? (
                                    <div className="space-y-2">
                                        <textarea
                                            value={editingText}
                                            onChange={(e) => setEditingText(e.target.value)}
                                            className="w-full min-h-[90px] p-3 rounded-lg border border-indigo-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        />
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => saveNote(note.id)}
                                                disabled={savingNoteId === note.id}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60"
                                            >
                                                <Save className="w-3.5 h-3.5" />
                                                {savingNoteId === note.id ? 'Guardando...' : 'Guardar'}
                                            </button>
                                            <button
                                                onClick={cancelEditing}
                                                disabled={savingNoteId === note.id}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                                        {note.notes}
                                    </p>
                                )}

                                {onSendFeedback && (
                                    <button
                                        onClick={() => onSendFeedback(note)}
                                        className="mt-3 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        Responder por Telegram
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Empty State */}
            {isExpanded && notes.length === 0 && (
                <div className="border-t border-slate-100 p-8 text-center">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Sin notas importantes</p>
                    <p className="text-sm text-slate-400 mt-1">
                        Cuando {clientName || 'el cliente'} registre algo importante, aparecerá aquí.
                    </p>
                </div>
            )}
        </div>
    );
}

export default ClientImportantNotes;
