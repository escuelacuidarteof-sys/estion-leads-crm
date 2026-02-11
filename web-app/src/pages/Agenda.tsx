import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lead } from '../types/database';
import { format, isToday, isTomorrow, endOfTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, Phone, MessageSquare } from 'lucide-react';
import LeadModal from '../components/LeadModal';

export default function Agenda() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('leads_escuela_cuidarte')
                .select('*')
                .not('appointment_at', 'is', null)
                .order('appointment_at', { ascending: true });

            setLeads(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const todayLeads = leads.filter(l => l.appointment_at && isToday(new Date(l.appointment_at)));
    const tomorrowLeads = leads.filter(l => l.appointment_at && isTomorrow(new Date(l.appointment_at)));
    const futureLeads = leads.filter(l => l.appointment_at && new Date(l.appointment_at) > endOfTomorrow());

    if (loading) return <div className="p-10 text-center text-gray-500">Cargando Agenda...</div>;

    const LeadCard = ({ lead }: { lead: Lead }) => (
        <div
            onClick={() => setSelectedLead(lead)}
            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex justify-between items-center group"
        >
            <div className="flex gap-4 items-center">
                <div className="bg-blue-50 p-3 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Clock size={20} />
                </div>
                <div>
                    <div className="font-bold text-gray-900">{format(new Date(lead.appointment_at!), 'HH:mm')} - {lead.name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                        <Phone size={12} /> {lead.phone}
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold text-gray-400">{lead.status}</span>
                    </div>
                </div>
            </div>
            <div className="flex gap-2">
                <a
                    href={`https://wa.me/${lead.phone?.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all"
                >
                    <MessageSquare size={18} />
                </a>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
                    <CalendarIcon size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Agenda de Llamadas</h1>
                    <p className="text-sm text-gray-500">Seguimiento de citas programadas</p>
                </div>
            </header>

            <section>
                <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    Hoy <span className="text-[10px] bg-blue-100 px-2 py-0.5 rounded ml-2">{format(new Date(), 'dd MMMM', { locale: es })}</span>
                </h2>
                <div className="grid gap-3">
                    {todayLeads.length === 0 ? (
                        <p className="text-gray-400 italic text-sm p-4 bg-gray-50 rounded-lg border border-dashed">No hay llamadas para hoy.</p>
                    ) : todayLeads.map(l => <LeadCard key={l.id} lead={l} />)}
                </div>
            </section>

            <section>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Mañana</h2>
                <div className="grid gap-3">
                    {tomorrowLeads.length === 0 ? (
                        <p className="text-gray-400 italic text-sm p-4 bg-gray-50 rounded-lg border border-dashed text-opacity-70">No hay llamadas para mañana.</p>
                    ) : tomorrowLeads.map(l => <LeadCard key={l.id} lead={l} />)}
                </div>
            </section>

            {futureLeads.length > 0 && (
                <section>
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Próximamente</h2>
                    <div className="grid gap-3">
                        {futureLeads.map(l => <LeadCard key={l.id} lead={l} />)}
                    </div>
                </section>
            )}

            {selectedLead && (
                <LeadModal
                    lead={selectedLead}
                    onClose={() => setSelectedLead(null)}
                    onUpdate={fetchData}
                />
            )}
        </div>
    );
}
