import React from 'react';
import { Lead } from '../../types';
import { Calendar, MessageCircle, Smartphone, Star } from 'lucide-react';

interface LeadCardProps {
    lead: Lead;
    onClick: (lead: Lead) => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onClick }) => {

    const getOrigenColor = (origen?: string) => {
        if (!origen) return 'bg-slate-100 text-slate-600 border-slate-200';
        const s = origen.toLowerCase();
        if (s.includes('instagram')) return 'bg-pink-100 text-pink-700 border-pink-200';
        if (s.includes('libros')) return 'bg-purple-100 text-purple-700 border-purple-200';
        if (s.includes('recomend')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        return 'bg-slate-100 text-slate-700 border-slate-200';
    };

    const daysSinceCreation = Math.floor((new Date().getTime() - new Date(lead.created_at).getTime()) / (1000 * 3600 * 24));

    return (
        <div
            onClick={() => onClick(lead)}
            className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.98]"
        >
            <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getOrigenColor(lead.origen)}`}>
                    {lead.origen || 'Sin origen'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {daysSinceCreation === 0 ? 'Hoy' : `${daysSinceCreation}d`}
                </span>
            </div>

            <h4 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-blue-600 transition-colors">
                {lead.name || 'Sin nombre'}
            </h4>

            {/* Score / compromiso */}
            {(lead.nivel_compromiso != null && lead.nivel_compromiso > 0) && (
                <div className="flex items-center gap-1 mb-1">
                    <Star className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] font-bold text-amber-600">{lead.nivel_compromiso}/10</span>
                    {lead.disponibilidad && (
                        <span className="text-[10px] text-slate-400 ml-1">- {lead.disponibilidad}</span>
                    )}
                </div>
            )}

            {/* Preocupacion principal - contexto rapido para closer */}
            {lead.preocupacion_principal && (
                <p className="text-[10px] text-slate-500 mb-2 line-clamp-2 italic">
                    "{lead.preocupacion_principal}"
                </p>
            )}

            {/* Appointment */}
            {lead.appointment_at && (
                <div className="flex items-center gap-1 text-[10px] text-purple-600 font-bold mb-1">
                    <Calendar className="w-3 h-3" /> Cita: {new Date(lead.appointment_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </div>
            )}

            {/* Quick actions */}
            <div className="flex gap-2 mt-2">
                {lead.phone && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://wa.me/${lead.phone!.replace(/\+/g, '').replace(/\s/g, '')}`, '_blank');
                        }}
                        className="p-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors"
                        title="Abrir WhatsApp"
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                )}
                {lead.email && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(`mailto:${lead.email}`, '_blank');
                        }}
                        className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                        title="Enviar email"
                    >
                        <Smartphone className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {lead.last_contacted_at && (
                <p className="text-[10px] text-slate-400 mt-2 border-t border-slate-50 pt-1 italic">
                    Contactado: {new Date(lead.last_contacted_at).toLocaleDateString('es-ES')}
                </p>
            )}
        </div>
    );
};

export default LeadCard;
