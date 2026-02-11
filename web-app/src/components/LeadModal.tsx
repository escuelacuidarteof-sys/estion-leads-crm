import { useState, useEffect } from 'react';
import { Lead, TeamMember } from '../types/database';
import { supabase } from '../lib/supabase';
import { X, DollarSign, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
    lead: Lead;
    onClose: () => void;
    onUpdate: () => void;
}

export default function LeadModal({ lead, onClose, onUpdate }: Props) {
    const [formData, setFormData] = useState<Partial<Lead>>({
        status: lead.status,
        notes: lead.notes || '',
        appointment_at: lead.appointment_at || '',
        call_outcome: lead.call_outcome || '',
        sale_amount: lead.sale_amount || 0,
        closer_id: lead.closer_id || ''
    });
    const [loading, setLoading] = useState(false);
    const [interactions, setInteractions] = useState<any[]>([]);
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [newNote, setNewNote] = useState('');

    const fetchInteractions = async () => {
        const { data } = await supabase
            .from('lead_interactions')
            .select('*')
            .eq('lead_id', lead.id)
            .order('created_at', { ascending: false });
        setInteractions(data || []);
    };

    const fetchTeam = async () => {
        const { data } = await supabase.from('team_members').select('*').eq('active', true).order('name', { ascending: true });
        setTeam(data || []);
    };

    useEffect(() => {
        fetchInteractions();
        fetchTeam();
    }, [lead.id]);

    const addInteraction = async (type: string, content: string) => {
        if (!content.trim()) return;
        await supabase.from('lead_interactions').insert({
            lead_id: lead.id,
            type,
            content,
            created_by: 'Setter/Closer'
        });
        setNewNote('');
        fetchInteractions();
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            if (formData.status !== lead.status) {
                await addInteraction('status_change', `Estado cambiado de ${lead.status} a ${formData.status}`);
            }

            const cleanData = {
                ...formData,
                appointment_at: formData.appointment_at || null,
                closer_id: formData.closer_id || null,
                call_outcome: formData.call_outcome || null,
                sale_amount: formData.sale_amount || 0
            };

            const { error } = await supabase
                .from('leads_escuela_cuidarte')
                .update(cleanData)
                .eq('id', lead.id);

            if (error) throw error;
            onUpdate();
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">{lead.name}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X /></button>
                </div>

                <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2">
                    {/* Form Side */}
                    <div className="p-6 overflow-y-auto border-r border-gray-100">
                        <section className="mb-8">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Perfil del Lead</h3>

                            {/* Score and WhatsApp Row */}
                            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 mb-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-black text-blue-800 leading-none">{lead.score || 0}</span>
                                        <span className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter bg-blue-100 px-1.5 py-0.5 rounded">Puntos</span>
                                    </div>
                                    <a
                                        href={`https://wa.me/${lead.phone?.replace(/[^0-9]/g, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-200"
                                    >
                                        <MessageCircle size={14} /> WhatsApp Directo
                                    </a>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Informacion de Contacto */}
                                <div>
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" /> Contacto e Interés
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-gray-400 font-medium uppercase">Teléfono</span>
                                            <p className="text-xs text-gray-900 font-bold">{lead.phone || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-gray-400 font-medium uppercase">Interés</span>
                                            <p className="text-xs text-blue-700 font-bold">{lead.interest || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Datos Clínicos */}
                                <div>
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full" /> Contexto Clínico
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-gray-400 font-medium uppercase">Tipo de Cáncer</span>
                                            <p className="text-xs text-gray-900 font-bold">{lead.tipo_cancer || 'No especificado'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-gray-400 font-medium uppercase">Estadio</span>
                                            <p className="text-xs text-gray-900 font-bold">{lead.estadio || 'No especificado'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-gray-400 font-medium uppercase">¿Pérdida de Peso?</span>
                                            <p className="text-xs text-amber-700 font-bold">{lead.perdida_peso || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-gray-400 font-medium uppercase">Actividad Física</span>
                                            <p className="text-xs text-gray-900 font-medium">{lead.actividad_fisica || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Situación Detallada */}
                                {lead.situation && (
                                    <div>
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" /> Situación Actual
                                        </h4>
                                        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                            <p className="text-xs text-gray-700 leading-relaxed italic">
                                                "{lead.situation}"
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Disponibilidad y Compromiso */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                        <span className="text-[10px] text-gray-400 font-medium uppercase block mb-1">Disponibilidad</span>
                                        <p className="text-[11px] text-gray-900 font-medium">{lead.disponibilidad || 'No especificada'}</p>
                                    </div>
                                    <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                        <span className="text-[10px] text-gray-400 font-medium uppercase block mb-1">Compromiso (1-10)</span>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `${(lead.nivel_compromiso || 0) * 10}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-bold text-blue-700">{lead.nivel_compromiso || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pipeline & Gestión</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Estado Actual</label>
                                    <select
                                        className="w-full border-gray-200 border p-2.5 rounded-xl text-sm bg-white shadow-sm"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                    >
                                        <option value="new">Nuevo ingreso</option>
                                        <option value="contacted">En contacto</option>
                                        <option value="appointment_set">Cita agendada</option>
                                        <option value="show">Asistió sesión</option>
                                        <option value="no_show">No asistió</option>
                                        <option value="sold">VENTA CERRADA ✅</option>
                                        <option value="unqualified">No cualifica ❌</option>
                                        <option value="lost">Lead perdido</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Integrante Asignado</label>
                                    <select
                                        className="w-full border-gray-200 border p-2.5 rounded-xl text-sm bg-white shadow-sm"
                                        value={formData.closer_id || ''}
                                        onChange={e => setFormData({ ...formData, closer_id: e.target.value })}
                                    >
                                        <option value="">Sin asignar</option>
                                        {team.map(member => (
                                            <option key={member.id} value={member.id}>{member.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Programar Cita</label>
                                <input
                                    type="datetime-local"
                                    className="w-full border-gray-200 border p-2.5 rounded-xl text-sm bg-white shadow-sm"
                                    value={formData.appointment_at ? new Date(formData.appointment_at).toISOString().slice(0, 16) : ''}
                                    onChange={e => {
                                        const newDate = e.target.value;
                                        const updates: Partial<Lead> = { appointment_at: newDate };

                                        // Auto-update status to 'appointment_set' if it's currently at a lower stage
                                        if (newDate && ['new', 'contacted'].includes(formData.status || '')) {
                                            updates.status = 'appointment_set';
                                        }

                                        setFormData({ ...formData, ...updates });
                                    }}
                                />
                            </div>

                            {['show', 'sold'].includes(formData.status || '') && (
                                <div className="bg-gray-900 p-6 rounded-2xl text-white space-y-4 shadow-xl">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-blue-400 uppercase">Datos del Cierre</span>
                                        {formData.status === 'sold' && <DollarSign size={20} className="text-green-400" />}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Calificación</label>
                                            <select
                                                className="w-full bg-gray-800 border-none rounded-lg p-2 text-sm"
                                                value={formData.call_outcome || ''}
                                                onChange={e => setFormData({ ...formData, call_outcome: e.target.value })}
                                            >
                                                <option value="">Selecciona...</option>
                                                <option value="qualified">Cualifica</option>
                                                <option value="unqualified">No Cualifica</option>
                                            </select>
                                        </div>
                                        {formData.status === 'sold' && (
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">Importe (€)</label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-gray-800 border-none rounded-lg p-2 text-sm font-bold text-green-400"
                                                    value={formData.sale_amount || 0}
                                                    onChange={e => setFormData({ ...formData, sale_amount: Number(e.target.value) })}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Timeline Side */}
                    <div className="bg-gray-50/50 flex flex-col h-full overflow-hidden">
                        <div className="p-6 flex-1 overflow-y-auto space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Actividad reciente</h3>

                            {interactions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                                    <MessageCircle size={40} className="mb-2 opacity-20" />
                                    <p className="text-sm italic">Sin actividad registrada</p>
                                </div>
                            ) : (
                                interactions.map((item) => (
                                    <div key={item.id} className="relative pl-6 pb-6 border-l border-gray-200 last:pb-0 ml-2">
                                        <div className={`absolute -left-1.5 top-0 w-3 h-3 rounded-full ring-4 ring-gray-50 ${item.type === 'status_change' ? 'bg-amber-500' : 'bg-blue-500'
                                            }`} />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 font-bold mb-1">
                                                {format(new Date(item.created_at), 'dd MMM, HH:mm', { locale: es })}
                                            </span>
                                            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-sm text-gray-700">
                                                {item.content}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-6 bg-white border-t space-y-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Añadir nota o comentario..."
                                    className="w-full pl-4 pr-20 py-3 rounded-xl border-gray-200 border text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                    value={newNote}
                                    onChange={e => setNewNote(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && addInteraction('note', newNote)}
                                />
                                <button
                                    onClick={() => addInteraction('note', newNote)}
                                    className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white px-4 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                                >
                                    Publicar
                                </button>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button onClick={onClose} className="px-5 py-2 text-sm text-gray-500 font-bold hover:text-gray-800 transition-colors">Cancelar</button>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="px-8 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Guardando...' : 'Aplicar Cambios'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
