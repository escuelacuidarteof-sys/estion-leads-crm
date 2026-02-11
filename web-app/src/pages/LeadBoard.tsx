import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lead, ScoringRule, TeamMember } from '../types/database';
import { calculateScore } from '../lib/scoring';
import LeadModal from '../components/LeadModal';
import { Search, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_LABELS: Record<string, string> = {
    all: 'Todos',
    new: 'Nuevo',
    contacted: 'Contactado',
    appointment_set: 'Cita Agendada',
    show: 'Asistió',
    no_show: 'No Asistió',
    sold: 'Vendido',
    lost: 'Perdido',
    qualified: 'Cualificado',
    unqualified: 'No Cualificado'
};

export default function LeadBoard() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [rules, setRules] = useState<ScoringRule[]>([]);
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

    // Filters
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterCloser, setFilterCloser] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rulesRes, teamRes, leadsRes] = await Promise.all([
                supabase.from('scoring_rules').select('*'),
                supabase.from('team_members').select('*'),
                supabase.from('leads_escuela_cuidarte').select('*').order('created_at', { ascending: false })
            ]);

            setRules(rulesRes.data || []);
            setTeam(teamRes.data || []);
            setLeads(leadsRes.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Compute scores and filter
    const processedLeads = leads
        .map(lead => ({
            ...lead,
            // Recalculate score on frontend to ensure it's up to date with rules
            // (Optionally we could save this back to DB, but realtime calc is fast enough for <1000 leads)
            computedScore: calculateScore(lead, rules)
        }))
        .filter(lead => {
            // Filter by Status (Special case for appointments)
            if (filterStatus === 'appointment_set') {
                const hasAppointment = !!lead.appointment_at;
                const isOngoing = lead.status !== 'sold' && lead.status !== 'lost';
                if (!((lead.status === 'appointment_set' || hasAppointment) && isOngoing)) return false;
            } else if (filterStatus !== 'all' && lead.status !== filterStatus) {
                return false;
            }

            // Filter by Closer
            if (filterCloser !== 'all' && lead.closer_id !== filterCloser) return false;

            // Search by Name/Email
            if (searchTerm && !lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) && !lead.email?.toLowerCase().includes(searchTerm.toLowerCase())) return false;

            return true;
        })
        .sort((a, b) => b.computedScore - a.computedScore); // Sort by highest score first

    const stats = {
        total: processedLeads.length,
        highPriority: processedLeads.filter(l => l.computedScore > 30).length,
        pending: processedLeads.filter(l => l.status === 'new').length,
        sales: processedLeads.filter(l => l.status === 'sold').length
    };

    if (loading) return <div className="p-10 text-center">Cargando Leads...</div>;

    return (
        <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="text-gray-500 text-xs uppercase tracking-wide font-semibold">Total Leads</div>
                    <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="text-red-500 text-xs uppercase tracking-wide font-semibold">Alta Prioridad</div>
                    <div className="text-2xl font-bold text-red-600">{stats.highPriority}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="text-blue-500 text-xs uppercase tracking-wide font-semibold">Pendientes</div>
                    <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="text-green-500 text-xs uppercase tracking-wide font-semibold">Ventas</div>
                    <div className="text-2xl font-bold text-green-600">{stats.sales}</div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
                <div className="flex gap-4">
                    <div className="flex gap-2 bg-white p-1 rounded-lg border shadow-sm">
                        {['all', 'new', 'contacted', 'appointment_set', 'sold', 'unqualified'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterStatus === status ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {STATUS_LABELS[status] || status}
                            </button>
                        ))}
                    </div>

                    <select
                        className="bg-white px-4 py-2 border rounded-lg shadow-sm text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                        value={filterCloser}
                        onChange={e => setFilterCloser(e.target.value)}
                    >
                        <option value="all">Todos los Integrantes</option>
                        {team.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar lead..."
                        className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Puntos</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Nombre / Contacto</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Asignado</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Situación</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Interés</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Fecha Registro</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {processedLeads.map((lead) => (
                            <tr
                                key={lead.id}
                                onClick={() => setSelectedLead(lead)}
                                className="hover:bg-blue-50 cursor-pointer transition-colors"
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${lead.computedScore > 30 ? 'bg-red-100 text-red-700' :
                                        lead.computedScore > 15 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {lead.computedScore}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="font-medium text-gray-900">{lead.name}</div>
                                        {lead.appointment_at && (
                                            <Calendar size={12} className="text-blue-500" />
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400">{lead.phone}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${lead.status === 'new' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                        lead.status === 'contacted' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                            lead.status === 'sold' ? 'bg-green-50 text-green-700 border-green-100' :
                                                lead.status === 'unqualified' ? 'bg-red-50 text-red-700 border-red-100' :
                                                    'bg-gray-50 text-gray-600 border-gray-100'
                                        }`}>
                                        {STATUS_LABELS[lead.status] || lead.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-[11px] font-medium text-gray-600">
                                    {team.find(m => m.id === lead.closer_id)?.name || <span className="text-gray-300 italic">Sin asignar</span>}
                                </td>
                                <td className="px-6 py-4 text-[11px] text-gray-500 max-w-[150px] truncate">
                                    {lead.situation || <span className="text-gray-200">-</span>}
                                </td>
                                <td className="px-6 py-4 text-[11px] text-gray-600">
                                    {lead.interest}
                                </td>
                                <td className="px-6 py-4 text-[10px] text-gray-400 font-medium">
                                    {format(new Date(lead.created_at), 'dd/MM/yyyy', { locale: es })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {processedLeads.length === 0 && (
                    <div className="p-10 text-center text-gray-500">
                        No se encontraron leads con estos filtros.
                    </div>
                )}
            </div>

            {selectedLead && (
                <LeadModal
                    lead={{ ...selectedLead, score: selectedLead.computedScore || 0 }} // Pass computed score
                    onClose={() => setSelectedLead(null)}
                    onUpdate={() => {
                        fetchData();
                        // Optional: Close modal or keep open? keep open usually better if details updated, but simple verify first
                        setSelectedLead(null);
                    }}
                />
            )}
        </div>
    );
}
