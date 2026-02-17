import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus } from '../../types';
import { leadsService } from '../../services/leadsService';
import LeadCard from './LeadCard';
import LeadDetailModal from './LeadDetailModal';
import { NewSaleForm } from '../NewSaleForm';
import { Plus, Search, RefreshCw, Users, Calendar, TrendingUp, XCircle } from 'lucide-react';
import { useToast } from '../ToastProvider';
import { User as UserType } from '../../types';

const COLUMNS: { id: LeadStatus; label: string; color: string; icon: React.ReactNode }[] = [
    { id: 'new', label: 'Nuevos', color: 'border-t-blue-500', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'contacted', label: 'Contactados', color: 'border-t-amber-500', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'appointment_set', label: 'Agendados', color: 'border-t-purple-500', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'show', label: 'Show', color: 'border-t-emerald-500', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'no_show', label: 'No Show', color: 'border-t-orange-500', icon: <XCircle className="w-3.5 h-3.5" /> },
    { id: 'sold', label: 'Vendidos', color: 'border-t-green-500', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'lost', label: 'Perdidos', color: 'border-t-gray-400', icon: <XCircle className="w-3.5 h-3.5" /> },
    { id: 'unqualified', label: 'No Cualificados', color: 'border-t-slate-400', icon: <XCircle className="w-3.5 h-3.5" /> },
];

interface LeadsKanbanProps {
    currentUser: UserType;
}

const LeadsKanban: React.FC<LeadsKanbanProps> = ({ currentUser }) => {
    const { toast } = useToast();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Partial<Lead> | null>(null);
    const [convertingLead, setConvertingLead] = useState<Partial<Lead> | null>(null);

    const fetchLeads = async () => {
        setIsLoading(true);
        try {
            const data = await leadsService.getLeads();
            setLeads(data);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar leads');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const handleOpenNew = () => {
        setSelectedLead(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (lead: Lead) => {
        setSelectedLead(lead);
        setIsModalOpen(true);
    };

    const handleConvertToSale = (lead: Partial<Lead>) => {
        setConvertingLead(lead);
    };

    const filteredLeads = leads.filter(l => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            (l.name || '').toLowerCase().includes(searchLower) ||
            (l.email || '').toLowerCase().includes(searchLower) ||
            (l.phone || '').includes(searchLower) ||
            (l.origen || '').toLowerCase().includes(searchLower) ||
            (l.preocupacion_principal || '').toLowerCase().includes(searchLower)
        );
    });

    // Stats
    const totalLeads = leads.length;
    const agendados = leads.filter(l => l.status === 'appointment_set' || l.status === 'show').length;
    const vendidos = leads.filter(l => l.status === 'sold').length;
    const conversionRate = totalLeads > 0 ? ((vendidos / totalLeads) * 100).toFixed(1) : '0';

    // If converting a lead, show the NewSaleForm
    if (convertingLead) {
        // Parse the lead name into first/last
        const nameParts = (convertingLead.name || '').trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        return (
            <NewSaleForm
                currentUser={currentUser}
                initialLeadData={{
                    lead_id: convertingLead.id,
                    nombre_lead: convertingLead.name || '',
                    telefono: convertingLead.phone || '',
                    pago: convertingLead.sale_amount ? String(convertingLead.sale_amount) : '',
                }}
                onBack={() => setConvertingLead(null)}
            />
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* TOOLBAR */}
            <div className="p-6 bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Pipeline de Leads</h1>
                        <p className="text-slate-500 text-sm">Gestiona prospectos desde la entrada hasta la venta</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <input
                                className="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none w-64"
                                placeholder="Buscar por nombre, email, origen..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={fetchLeads}
                            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Recargar"
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={handleOpenNew}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-200 transition-all active:scale-95"
                        >
                            <Plus className="w-5 h-5" /> Nuevo Lead
                        </button>
                    </div>
                </div>

                {/* Stats bar */}
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-bold text-blue-700">{totalLeads}</span>
                        <span className="text-xs text-blue-500">Total</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-bold text-purple-700">{agendados}</span>
                        <span className="text-xs text-purple-500">Agendados</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-bold text-green-700">{vendidos}</span>
                        <span className="text-xs text-green-500">Vendidos</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                        <span className="text-sm font-bold text-slate-700">{conversionRate}%</span>
                        <span className="text-xs text-slate-500">Conversion</span>
                    </div>
                </div>
            </div>

            {/* KANBAN BOARD */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                <div className="flex gap-4 h-full min-w-max pb-4">
                    {COLUMNS.map(col => {
                        const colLeads = filteredLeads.filter(l => l.status === col.id);
                        return (
                            <div key={col.id} className="w-72 flex flex-col h-full">
                                <div className={`flex items-center justify-between mb-3 pb-2 border-b-2 ${col.color}`}>
                                    <div className="flex items-center gap-2">
                                        {col.icon}
                                        <h3 className="font-bold text-slate-700 text-sm">{col.label}</h3>
                                    </div>
                                    <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                        {colLeads.length}
                                    </span>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                                    {colLeads.map(lead => (
                                        <LeadCard
                                            key={lead.id}
                                            lead={lead}
                                            onClick={handleOpenEdit}
                                        />
                                    ))}
                                    {colLeads.length === 0 && (
                                        <div className="text-center py-8 text-slate-400 italic text-sm border border-dashed border-slate-200 rounded-lg">
                                            Sin leads
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MODAL */}
            <LeadDetailModal
                lead={selectedLead}
                currentUser={currentUser}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={fetchLeads}
                onConvertToSale={handleConvertToSale}
            />
        </div>
    );
};

export default LeadsKanban;
