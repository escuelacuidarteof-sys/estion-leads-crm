/**
 * ClientCard - Mobile-friendly card view for clients
 * Used in ClientList for mobile devices
 */

import React from 'react';
import { Client, ClientStatus, UserRole } from '../types';
import { PlayCircle, PauseCircle, XCircle, ChevronRight, Calendar, User, Droplets, Scale, Heart } from 'lucide-react';

interface ClientCardProps {
    client: Client;
    currentUser: { role: UserRole };
    onSelectClient: (client: Client) => void;
    onUpdateStatus: (clientId: string, status: ClientStatus) => void;
    getStatusColor: (status: ClientStatus) => string;
    getStatusLabel: (status: ClientStatus) => string;
    coachName?: string;
}

const ClientCard: React.FC<ClientCardProps> = ({
    client,
    currentUser,
    onSelectClient,
    onUpdateStatus,
    getStatusColor,
    getStatusLabel,
    coachName
}) => {
    const isInactive = client.status === ClientStatus.INACTIVE || client.status === ClientStatus.DROPOUT;

    return (
        <div
            onClick={() => onSelectClient(client)}
            className={`
        bg-white rounded-xl border-2 border-slate-100 p-4 
        hover:border-blue-300 hover:shadow-lg
        transition-all duration-300 cursor-pointer
        ${isInactive ? 'opacity-60 grayscale-[0.5]' : ''}
      `}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-lg mb-1">
                        {client.name}
                    </h3>
                    <p className="text-sm text-slate-500">{client.email}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
            </div>

            {/* Status Badge */}
            <div className="mb-3">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ring-2 ring-inset ${getStatusColor(client.status)}`}>
                    {getStatusLabel(client.status)}
                </span>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                {/* Coach (solo para Admin) */}
                {currentUser.role === UserRole.ADMIN && (
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-slate-600 truncate">
                            {(!coachName || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(coachName))
                                ? 'Sin asignar'
                                : coachName}
                        </span>
                    </div>
                )}

                {/* Contract End Date */}
                <div className={`flex items-center gap-2 ${currentUser.role !== UserRole.ADMIN ? 'col-span-2' : ''}`}>
                    <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className={`text-sm ${new Date(client.contract_end_date) < new Date() && client.status === ClientStatus.ACTIVE
                        ? 'text-red-600 font-bold'
                        : 'text-slate-600'
                        }`}>
                        {new Date(client.contract_end_date).toLocaleDateString('es-ES')}
                    </span>
                </div>
            </div>

            {/* Health & Tracking Info */}
            <div className="text-xs text-slate-600 mb-3 p-2.5 bg-slate-50 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 truncate max-w-[180px]">
                        {client.medical.diagnosis || client.medical.oncology_status || 'Sin diagnóstico'}
                    </span>
                    {client.energy_level != null && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            client.energy_level >= 7 ? 'bg-green-100 text-green-700' :
                            client.energy_level >= 4 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                        }`}>
                            Energía: {client.energy_level}/10
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {client.current_weight && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500">
                            <Scale className="w-3 h-3" />
                            {client.current_weight}kg{client.target_weight ? ` → ${client.target_weight}` : ''}
                        </span>
                    )}
                    {client.last_checkin_submitted && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                            client.last_checkin_status === 'pending_review' ? 'text-amber-600' : 'text-green-600'
                        }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${client.last_checkin_status === 'pending_review' ? 'bg-amber-400' : 'bg-green-400'}`} />
                            {client.last_checkin_status === 'pending_review' ? 'Pendiente' : new Date(client.last_checkin_submitted).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                    )}
                    {(() => {
                        if (!client.hormonal_status || !client.last_period_start_date || client.hormonal_status === 'menopausica') {
                            if (client.hormonal_status === 'menopausica') return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">Meno</span>;
                            return null;
                        }
                        const cycleLength = client.average_cycle_length || 28;
                        const dayInCycle = (Math.floor((Date.now() - new Date(client.last_period_start_date).getTime()) / (1000 * 60 * 60 * 24)) % cycleLength) + 1;
                        let phaseName = 'Lútea', phaseColor = 'bg-amber-100 text-amber-700';
                        if (dayInCycle <= 5) { phaseName = 'Menstrual'; phaseColor = 'bg-red-100 text-red-700'; }
                        else if (dayInCycle <= Math.floor(cycleLength * 0.46)) { phaseName = 'Folicular'; phaseColor = 'bg-green-100 text-green-700'; }
                        else if (dayInCycle <= Math.floor(cycleLength * 0.57)) { phaseName = 'Ovulación'; phaseColor = 'bg-blue-100 text-blue-700'; }
                        return <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${phaseColor}`}><Droplets className="w-3 h-3" />{phaseName}</span>;
                    })()}
                </div>
            </div>

            {/* Actions */}
            <div
                className="flex items-center gap-2 pt-3 border-t border-slate-100"
                onClick={(e) => e.stopPropagation()}
            >
                {client.status === ClientStatus.ACTIVE && (
                    <>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onUpdateStatus(client.id, ClientStatus.PAUSED);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors text-sm font-medium"
                        >
                            <PauseCircle className="w-4 h-4" />
                            <span>Pausar</span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('¿Deseas dar de baja a este cliente?')) {
                                    onUpdateStatus(client.id, ClientStatus.INACTIVE);
                                }
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium"
                        >
                            <XCircle className="w-4 h-4" />
                            <span>Baja</span>
                        </button>
                    </>
                )}

                {client.status !== ClientStatus.ACTIVE && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStatus(client.id, ClientStatus.ACTIVE);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-sm font-medium"
                    >
                        <PlayCircle className="w-4 h-4" />
                        <span>Reactivar</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default ClientCard;
