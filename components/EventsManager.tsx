import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { PortalEvent, User } from '../types';
import {
    Calendar, Plus, Edit, Trash2, X, Clock, User as UserIcon,
    MapPin, ExternalLink, Eye, EyeOff, Search, Filter
} from 'lucide-react';
import { useToast } from './ToastProvider';

interface EventsManagerProps {
    currentUser: User;
}

const CATEGORY_OPTIONS = [
    'Clase', 'Taller', 'Webinar', 'Comunidad', 'Nutrición',
    'Entrenamiento', 'Mindset', 'Médico', 'General'
];

const CATEGORY_COLORS: Record<string, string> = {
    clase: '#6BA06B',
    taller: '#D4AF37',
    webinar: '#7c3aed',
    comunidad: '#3b82f6',
    nutrición: '#f59e0b',
    entrenamiento: '#10b981',
    mindset: '#8b5cf6',
    médico: '#ef4444',
    general: '#64748b',
};

function getCategoryColor(category: string, custom?: string): string {
    if (custom) return custom;
    return CATEGORY_COLORS[category.toLowerCase()] || CATEGORY_COLORS.general;
}

const emptyEvent: Partial<PortalEvent> = {
    title: '',
    description: '',
    event_date: new Date().toISOString().split('T')[0],
    event_time: '',
    end_time: '',
    category: 'General',
    category_color: '',
    location: '',
    url: '',
    speaker: '',
    is_visible: true,
};

const EventsManager: React.FC<EventsManagerProps> = ({ currentUser }) => {
    const [events, setEvents] = useState<PortalEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentEvent, setCurrentEvent] = useState<Partial<PortalEvent>>({});
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const toast = useToast();

    useEffect(() => { fetchEvents(); }, []);

    const fetchEvents = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('portal_events')
            .select('*')
            .order('event_date', { ascending: false });
        if (error) {
            console.error('Error fetching events:', error);
            toast.error('Error al cargar eventos');
        }
        setEvents(data || []);
        setIsLoading(false);
    };

    const handleCreateNew = () => {
        setCurrentEvent({
            ...emptyEvent,
            speaker: currentUser.name || '',
        });
        setIsEditing(true);
    };

    const handleEdit = (evt: PortalEvent) => {
        setCurrentEvent({ ...evt });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!currentEvent.title || !currentEvent.event_date) {
            toast.error('Título y Fecha son obligatorios');
            return;
        }
        setIsSaving(true);
        try {
            const payload: any = {
                title: currentEvent.title,
                description: currentEvent.description || null,
                event_date: currentEvent.event_date,
                event_time: currentEvent.event_time || null,
                end_time: currentEvent.end_time || null,
                category: currentEvent.category || 'General',
                category_color: currentEvent.category_color || null,
                location: currentEvent.location || null,
                url: currentEvent.url || null,
                speaker: currentEvent.speaker || null,
                is_visible: currentEvent.is_visible ?? true,
                updated_at: new Date().toISOString(),
            };

            if (currentEvent.id) {
                const { error } = await supabase
                    .from('portal_events')
                    .update(payload)
                    .eq('id', currentEvent.id);
                if (error) throw error;
                toast.success('Evento actualizado');
            } else {
                payload.created_by = currentUser.id;
                const { error } = await supabase
                    .from('portal_events')
                    .insert([payload]);
                if (error) throw error;
                toast.success('Evento creado');
            }
            setIsEditing(false);
            fetchEvents();
        } catch (e: any) {
            console.error(e);
            toast.error(`Error al guardar: ${e.message || 'Desconocido'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            const { error } = await supabase
                .from('portal_events')
                .delete()
                .eq('id', deleteId);
            if (error) throw error;
            toast.success('Evento eliminado');
            fetchEvents();
        } catch (e: any) {
            console.error(e);
            toast.error(`Error al eliminar: ${e.message || 'Desconocido'}`);
        } finally {
            setDeleteId(null);
        }
    };

    const toggleVisibility = async (evt: PortalEvent) => {
        const { error } = await supabase
            .from('portal_events')
            .update({ is_visible: !evt.is_visible, updated_at: new Date().toISOString() })
            .eq('id', evt.id);
        if (error) {
            toast.error('Error al cambiar visibilidad');
        } else {
            toast.success(evt.is_visible ? 'Evento oculto' : 'Evento visible');
            fetchEvents();
        }
    };

    const today = new Date().toISOString().split('T')[0];

    const filtered = useMemo(() => {
        let result = events;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(e =>
                e.title.toLowerCase().includes(q) ||
                (e.speaker || '').toLowerCase().includes(q) ||
                (e.description || '').toLowerCase().includes(q)
            );
        }
        if (filterCategory) {
            result = result.filter(e => e.category === filterCategory);
        }
        return result;
    }, [events, searchQuery, filterCategory]);

    const upcomingEvents = filtered.filter(e => e.event_date >= today);
    const pastEvents = filtered.filter(e => e.event_date < today);

    // Unique categories from existing events
    const existingCategories = useMemo(() => {
        const cats = new Set(events.map(e => e.category));
        CATEGORY_OPTIONS.forEach(c => cats.add(c));
        return [...cats].sort();
    }, [events]);

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestión de Eventos</h1>
                    <p className="text-slate-500">Crea y gestiona eventos del calendario del portal.</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="bg-brand-green text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-green/90 flex items-center gap-2 shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Nuevo Evento
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Buscar por título, speaker..."
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-green/40 outline-none text-sm"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                        className="pl-9 pr-8 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-green/40 outline-none bg-white text-sm appearance-none"
                    >
                        <option value="">Todas las categorías</option>
                        {existingCategories.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-16">
                    <div className="w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* Upcoming */}
                    <div className="mb-10">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-brand-green" /> Próximos Eventos ({upcomingEvents.length})
                        </h2>
                        {upcomingEvents.length === 0 ? (
                            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400">
                                No hay eventos programados próximamente.
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {upcomingEvents.map(evt => (
                                    <EventCard key={evt.id} evt={evt} onEdit={handleEdit} onDelete={setDeleteId} onToggleVisibility={toggleVisibility} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Past */}
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-slate-400" /> Eventos Pasados ({pastEvents.length})
                        </h2>
                        {pastEvents.length === 0 ? (
                            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400">
                                No hay eventos pasados.
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {pastEvents.map(evt => (
                                    <EventCard key={evt.id} evt={evt} onEdit={handleEdit} onDelete={setDeleteId} onToggleVisibility={toggleVisibility} isPast />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* EDIT/CREATE MODAL */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">
                                {currentEvent.id ? 'Editar Evento' : 'Nuevo Evento'}
                            </h3>
                            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título *</label>
                                <input
                                    type="text"
                                    value={currentEvent.title || ''}
                                    onChange={e => setCurrentEvent({ ...currentEvent, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-green/40 outline-none"
                                    placeholder="Ej: Taller de Nutrición Oncológica"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción</label>
                                <textarea
                                    value={currentEvent.description || ''}
                                    onChange={e => setCurrentEvent({ ...currentEvent, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-green/40 outline-none h-20"
                                    placeholder="Breve descripción del evento..."
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha *</label>
                                    <input
                                        type="date"
                                        value={currentEvent.event_date || ''}
                                        onChange={e => setCurrentEvent({ ...currentEvent, event_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-green/40 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hora inicio</label>
                                    <input
                                        type="time"
                                        value={currentEvent.event_time || ''}
                                        onChange={e => setCurrentEvent({ ...currentEvent, event_time: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-green/40 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hora fin</label>
                                    <input
                                        type="time"
                                        value={currentEvent.end_time || ''}
                                        onChange={e => setCurrentEvent({ ...currentEvent, end_time: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-green/40 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoría</label>
                                    <select
                                        value={currentEvent.category || 'General'}
                                        onChange={e => setCurrentEvent({ ...currentEvent, category: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-green/40 outline-none bg-white"
                                    >
                                        {existingCategories.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Speaker</label>
                                    <input
                                        type="text"
                                        value={currentEvent.speaker || ''}
                                        onChange={e => setCurrentEvent({ ...currentEvent, speaker: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-green/40 outline-none"
                                        placeholder="Ej: Jesús, Helena..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ubicación</label>
                                <input
                                    type="text"
                                    value={currentEvent.location || ''}
                                    onChange={e => setCurrentEvent({ ...currentEvent, location: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-green/40 outline-none"
                                    placeholder="Ej: Online, Sala 1..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">URL (enlace Meet/Zoom/Youtube)</label>
                                <input
                                    type="text"
                                    value={currentEvent.url || ''}
                                    onChange={e => setCurrentEvent({ ...currentEvent, url: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-green/40 outline-none font-mono text-sm"
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Color personalizado</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={currentEvent.category_color || getCategoryColor(currentEvent.category || 'General')}
                                            onChange={e => setCurrentEvent({ ...currentEvent, category_color: e.target.value })}
                                            className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                                        />
                                        <span className="text-xs text-slate-400">Opcional, deja vacío para color automático</span>
                                        {currentEvent.category_color && (
                                            <button
                                                onClick={() => setCurrentEvent({ ...currentEvent, category_color: '' })}
                                                className="text-xs text-red-500 hover:underline"
                                            >
                                                Quitar
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-end pb-1">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={currentEvent.is_visible ?? true}
                                            onChange={e => setCurrentEvent({ ...currentEvent, is_visible: e.target.checked })}
                                            className="w-4 h-4 text-brand-green rounded"
                                        />
                                        <span className="font-medium text-slate-700 text-sm">Visible para clientes</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium">
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-6 py-2 bg-brand-green text-white rounded-lg font-medium hover:bg-brand-green/90 shadow-sm disabled:opacity-50"
                            >
                                {isSaving ? 'Guardando...' : 'Guardar Evento'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">¿Eliminar Evento?</h3>
                            <p className="text-slate-500 text-sm mb-6">Esta acción no se puede deshacer. El evento desaparecerá del calendario de los clientes.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteId(null)}
                                    className="flex-1 py-2.5 text-slate-700 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-2.5 text-white font-bold bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-lg shadow-red-200"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const EventCard: React.FC<{
    evt: PortalEvent;
    onEdit: (e: PortalEvent) => void;
    onDelete: (id: string) => void;
    onToggleVisibility: (e: PortalEvent) => void;
    isPast?: boolean;
}> = ({ evt, onEdit, onDelete, onToggleVisibility, isPast }) => {
    const color = getCategoryColor(evt.category, evt.category_color || undefined);

    return (
        <div className={`p-4 rounded-xl border flex items-center justify-between group transition-all ${isPast ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 hover:border-brand-green/30 hover:shadow-sm'} ${!evt.is_visible ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-4 min-w-0">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: color + '20' }}
                >
                    <Calendar className="w-5 h-5" style={{ color }} />
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="font-bold text-slate-800 truncate">{evt.title}</h3>
                        {!evt.is_visible && (
                            <span className="text-[9px] font-bold uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Oculto</span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(evt.event_date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {evt.event_time && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {evt.event_time.slice(0, 5)}{evt.end_time ? ` - ${evt.end_time.slice(0, 5)}` : ''}
                            </span>
                        )}
                        {evt.speaker && (
                            <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {evt.speaker}</span>
                        )}
                        {evt.location && (
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {evt.location}</span>
                        )}
                        <span
                            className="px-2 py-0.5 rounded text-[10px] uppercase font-bold"
                            style={{ backgroundColor: color + '20', color }}
                        >
                            {evt.category}
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                {evt.url && (
                    <a href={evt.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600" title="Abrir enlace">
                        <ExternalLink className="w-4 h-4" />
                    </a>
                )}
                <button onClick={() => onToggleVisibility(evt)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-amber-600" title={evt.is_visible ? 'Ocultar' : 'Mostrar'}>
                    {evt.is_visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => onEdit(evt)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-brand-green" title="Editar">
                    <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(evt.id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default EventsManager;
