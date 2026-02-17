import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, User as UserType } from '../../types';
import { leadsService } from '../../services/leadsService';
import { useToast } from '../ToastProvider';
import { X, Save, User, Smartphone, Mail, Calendar, Trash2, Clock, Info, Target, Star, Heart, Euro, ArrowRightCircle } from 'lucide-react';

interface LeadDetailModalProps {
    lead: Partial<Lead> | null;
    currentUser: UserType;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    onConvertToSale?: (lead: Partial<Lead>) => void;
}

const LEAD_STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
    { value: 'new', label: 'Nuevo', color: 'bg-blue-500' },
    { value: 'contacted', label: 'Contactado', color: 'bg-amber-500' },
    { value: 'appointment_set', label: 'Agendado', color: 'bg-purple-500' },
    { value: 'show', label: 'Show', color: 'bg-emerald-500' },
    { value: 'no_show', label: 'No Show', color: 'bg-orange-500' },
    { value: 'sold', label: 'Vendido', color: 'bg-green-500' },
    { value: 'lost', label: 'Perdido', color: 'bg-slate-500' },
    { value: 'unqualified', label: 'No Cualificado', color: 'bg-gray-500' },
];

const CALL_OUTCOME_OPTIONS = [
    { value: '', label: 'Sin resultado' },
    { value: 'interested', label: 'Interesado' },
    { value: 'needs_followup', label: 'Necesita seguimiento' },
    { value: 'not_interested', label: 'No interesado' },
    { value: 'no_answer', label: 'No contesta' },
    { value: 'wrong_number', label: 'Numero incorrecto' },
    { value: 'sold', label: 'Venta cerrada' },
];

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ lead, currentUser, isOpen, onClose, onSave, onConvertToSale }) => {
    const { toast } = useToast();
    const [formData, setFormData] = useState<Partial<Lead>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (lead && lead.id) {
            setFormData(lead);
        } else {
            setFormData({
                name: '',
                email: '',
                phone: '',
                status: 'new',
                origen: 'Instagram',
                notes: '',
                appointment_at: '',
                call_outcome: '',
                sale_amount: undefined,
            });
        }
    }, [lead, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Only send editable fields to avoid overwriting read-only data
            const editableFields: Partial<Lead> = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                status: formData.status,
                origen: formData.origen,
                notes: formData.notes,
                appointment_at: formData.appointment_at || null as any,
                call_outcome: formData.call_outcome || null as any,
                sale_amount: formData.sale_amount || null as any,
                last_contacted_at: formData.last_contacted_at || null as any,
            };

            if (formData.id) {
                await leadsService.updateLead(formData.id, editableFields);
                toast.success('Lead actualizado');
            } else {
                await leadsService.createLead(editableFields);
                toast.success('Lead creado');
            }
            onSave();
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error('Error al guardar el lead');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!formData.id || !window.confirm('Seguro que quieres eliminar este lead?')) return;
        try {
            await leadsService.deleteLead(formData.id);
            toast.success('Lead eliminado');
            onSave();
            onClose();
        } catch {
            toast.error('Error al eliminar');
        }
    };

    const isEditing = !!formData.id;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">

                {/* HEAD */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Target className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                {isEditing ? 'Detalle del Lead' : 'Nuevo Lead'}
                            </h2>
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                                {isEditing ? `ID: ${formData.id!.substring(0, 8)}` : 'Crear nuevo prospecto'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    <form id="lead-form" onSubmit={handleSubmit} className="space-y-5">

                        {/* Status Bar */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Info className="w-3 h-3" /> Estado del Pipeline
                            </label>
                            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl">
                                {LEAD_STATUS_OPTIONS.map(opt => (
                                    <button
                                        type="button"
                                        key={opt.value}
                                        onClick={() => setFormData(prev => ({ ...prev, status: opt.value }))}
                                        className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all border ${formData.status === opt.value
                                            ? `${opt.color} text-white border-transparent shadow-sm scale-105`
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre completo</label>
                                <div className="relative">
                                    <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                    <input
                                        required
                                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                        placeholder="Ej. Ana Garcia Lopez"
                                        value={formData.name || ''}
                                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Telefono (WhatsApp)</label>
                                    <div className="relative">
                                        <Smartphone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                        <input
                                            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                            placeholder="+34 600..."
                                            value={formData.phone || ''}
                                            onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</label>
                                    <div className="relative">
                                        <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                        <input
                                            type="email"
                                            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                            placeholder="correo@ejemplo.com"
                                            value={formData.email || ''}
                                            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contexto del lead (read-only si existe) */}
                        {isEditing && (formData.situation || formData.interest || formData.preocupacion_principal || formData.nivel_compromiso) && (
                            <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 space-y-3">
                                <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                    <Heart className="w-3 h-3" /> Contexto del prospecto (formulario)
                                </label>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    {formData.situation && (
                                        <div>
                                            <span className="text-slate-400 font-bold">Situacion:</span>
                                            <p className="text-slate-700">{formData.situation}</p>
                                        </div>
                                    )}
                                    {formData.interest && (
                                        <div>
                                            <span className="text-slate-400 font-bold">Interes:</span>
                                            <p className="text-slate-700">{formData.interest}</p>
                                        </div>
                                    )}
                                    {formData.situacion && (
                                        <div>
                                            <span className="text-slate-400 font-bold">Situacion medica:</span>
                                            <p className="text-slate-700">{formData.situacion}</p>
                                        </div>
                                    )}
                                    {formData.tipo_cancer && (
                                        <div>
                                            <span className="text-slate-400 font-bold">Tipo:</span>
                                            <p className="text-slate-700">{formData.tipo_cancer} {formData.estadio ? `(estadio ${formData.estadio})` : ''}</p>
                                        </div>
                                    )}
                                    {formData.disponibilidad && (
                                        <div>
                                            <span className="text-slate-400 font-bold">Disponibilidad:</span>
                                            <p className="text-slate-700">{formData.disponibilidad}</p>
                                        </div>
                                    )}
                                    {formData.nivel_compromiso != null && formData.nivel_compromiso > 0 && (
                                        <div className="flex items-center gap-2">
                                            <Star className="w-3.5 h-3.5 text-amber-500" />
                                            <span className="text-slate-400 font-bold">Compromiso:</span>
                                            <span className="text-amber-700 font-bold">{formData.nivel_compromiso}/10</span>
                                        </div>
                                    )}
                                    {formData.age && (
                                        <div>
                                            <span className="text-slate-400 font-bold">Edad:</span>
                                            <p className="text-slate-700">{formData.age} ({formData.sex || '-'})</p>
                                        </div>
                                    )}
                                    {formData.actividad_fisica && (
                                        <div>
                                            <span className="text-slate-400 font-bold">Act. fisica:</span>
                                            <p className="text-slate-700">{formData.actividad_fisica}</p>
                                        </div>
                                    )}
                                </div>
                                {formData.preocupacion_principal && (
                                    <div className="mt-2 p-2 bg-white rounded-lg border border-amber-100">
                                        <span className="text-[10px] text-amber-600 font-bold uppercase">Preocupacion principal:</span>
                                        <p className="text-sm text-slate-700 italic">"{formData.preocupacion_principal}"</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Closer / Cita / Venta */}
                        <div className="bg-blue-50/30 p-4 rounded-2xl border border-blue-100/50 space-y-4">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="w-3 h-3" /> Gestion de venta
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cita</label>
                                    <div className="relative">
                                        <Calendar className="w-4 h-4 absolute left-3 top-3 text-blue-400" />
                                        <input
                                            type="datetime-local"
                                            className="w-full pl-9 pr-3 py-2.5 bg-white border border-blue-100 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                            value={formData.appointment_at ? formData.appointment_at.slice(0, 16) : ''}
                                            onChange={e => setFormData(prev => ({ ...prev, appointment_at: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ultimo contacto</label>
                                    <div className="relative">
                                        <Clock className="w-4 h-4 absolute left-3 top-3 text-blue-400" />
                                        <input
                                            type="datetime-local"
                                            className="w-full pl-9 pr-3 py-2.5 bg-white border border-blue-100 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                            value={formData.last_contacted_at ? formData.last_contacted_at.slice(0, 16) : ''}
                                            onChange={e => setFormData(prev => ({ ...prev, last_contacted_at: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resultado llamada</label>
                                    <select
                                        className="w-full px-3 py-2.5 bg-white border border-blue-100 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                        value={formData.call_outcome || ''}
                                        onChange={e => setFormData(prev => ({ ...prev, call_outcome: e.target.value }))}
                                    >
                                        {CALL_OUTCOME_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Importe venta</label>
                                    <div className="relative">
                                        <Euro className="w-4 h-4 absolute left-3 top-3 text-green-500" />
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="w-full pl-9 pr-3 py-2.5 bg-white border border-blue-100 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                            placeholder="0.00"
                                            value={formData.sale_amount || ''}
                                            onChange={e => setFormData(prev => ({ ...prev, sale_amount: parseFloat(e.target.value) || undefined }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Origen */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Origen</label>
                            <select
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                value={formData.origen || ''}
                                onChange={e => setFormData(prev => ({ ...prev, origen: e.target.value }))}
                            >
                                <option value="">Sin especificar</option>
                                <option value="Instagram">Instagram</option>
                                <option value="Formulario">Formulario</option>
                                <option value="WhatsApp">WhatsApp</option>
                                <option value="YouTube">YouTube</option>
                                <option value="TikTok">TikTok</option>
                                <option value="Libros Odile">Libros Odile</option>
                                <option value="Recomendacion">Recomendacion</option>
                                <option value="Otros">Otros</option>
                            </select>
                        </div>

                        {/* Notes */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notas</label>
                            <textarea
                                className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all min-h-[100px] resize-none"
                                placeholder="Notas sobre la conversacion, objetivos, objeciones..."
                                value={formData.notes || ''}
                                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            />
                        </div>

                    </form>
                </div>

                {/* FOOTER */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        {isEditing && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="text-red-500 p-2.5 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
                                title="Eliminar Lead"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                        {isEditing && onConvertToSale && (
                            <button
                                type="button"
                                onClick={() => {
                                    onConvertToSale(formData);
                                    onClose();
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                                title="Convertir este lead en una venta"
                            >
                                <ArrowRightCircle className="w-4 h-4" />
                                Convertir a Venta
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="lead-form"
                            disabled={isSaving}
                            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeadDetailModal;
