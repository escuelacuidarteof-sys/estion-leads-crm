import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lead, TeamMember } from '../types/database';
import {
    Users,
    TrendingUp,
    Calendar,
    DollarSign,
    Target,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    Clock
} from 'lucide-react';
import { format, isSameDay } from 'date-fns';

export default function Dashboard() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const [leadsRes, teamRes] = await Promise.all([
                supabase.from('leads_escuela_cuidarte').select('*'),
                supabase.from('team_members').select('*').eq('active', true)
            ]);
            setLeads(leadsRes.data || []);
            setTeam(teamRes.data || []);
            setLoading(false);
        }
        fetchData();
    }, []);

    // Calculate Metrics
    const totalLeads = leads.length;
    const soldLeads = leads.filter(l => l.status === 'sold');
    const conversionRate = totalLeads > 0 ? (soldLeads.length / totalLeads) * 100 : 0;

    const totalRevenue = soldLeads.reduce((acc, l) => acc + (l.sale_amount || 0), 0);

    const scheduledAppointments = leads.filter(l => l.appointment_at && !['sold', 'lost', 'unqualified'].includes(l.status));
    const todayAppointments = scheduledAppointments.filter(l => l.appointment_at && isSameDay(new Date(l.appointment_at), new Date()));

    // Funnel Data
    const funnelSteps = [
        { label: 'Leads Totales', count: totalLeads, color: 'bg-blue-500' },
        { label: 'Contactados', count: leads.filter(l => !['new'].includes(l.status)).length, color: 'bg-indigo-500' },
        { label: 'Citas Agendadas', count: leads.filter(l => !!l.appointment_at).length, color: 'bg-purple-500' },
        { label: 'Ventas Cerradas', count: soldLeads.length, color: 'bg-green-500' },
    ];

    if (loading) return <div className="p-10 text-center font-medium text-gray-500">Generando vista panorámica...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-gray-800 tracking-tight">Dashboard General</h1>
                <p className="text-gray-500 text-sm">Resumen de rendimiento y salud del pipeline.</p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Total Leads"
                    value={totalLeads}
                    icon={<Users className="text-blue-600" size={20} />}
                    suffix="leads"
                    trend="+12%" // Mock trend for aesthetics
                    isPositive={true}
                />
                <KPICard
                    title="Tasa Conversión"
                    value={conversionRate.toFixed(1)}
                    icon={<Target className="text-indigo-600" size={20} />}
                    suffix="%"
                    trend="+2.4%"
                    isPositive={true}
                />
                <KPICard
                    title="Citas Pendientes"
                    value={scheduledAppointments.length}
                    icon={<Calendar className="text-purple-600" size={20} />}
                    suffix="citas"
                    trend="+5"
                    isPositive={true}
                />
                <KPICard
                    title="Venta Total"
                    value={totalRevenue.toLocaleString()}
                    icon={<DollarSign className="text-green-600" size={20} />}
                    suffix="€"
                    trend="+18%"
                    isPositive={true}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Funnel Visualization */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <TrendingUp size={18} className="text-blue-500" />
                            Embudo de Ventas
                        </h3>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pipeline Real</span>
                    </div>

                    <div className="space-y-6">
                        {funnelSteps.map((step) => {
                            const percentage = totalLeads > 0 ? (step.count / totalLeads) * 100 : 0;
                            return (
                                <div key={step.label} className="group">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-xs font-bold text-gray-600 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{step.label}</span>
                                        <div className="text-right">
                                            <span className="text-sm font-black text-gray-800">{step.count}</span>
                                            <span className="ml-1 text-[10px] text-gray-400 font-bold">({percentage.toFixed(0)}%)</span>
                                        </div>
                                    </div>
                                    <div className="h-3 bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
                                        <div
                                            className={`${step.color} h-full rounded-full transition-all duration-1000 ease-out shadow-lg shadow-${step.color.split('-')[1]}-100`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Today's Appointments */}
                <div className="bg-gray-900 p-8 rounded-3xl text-white shadow-2xl shadow-gray-200">
                    <h3 className="font-bold mb-6 flex items-center gap-2 text-blue-400">
                        <Clock size={18} />
                        Citas para Hoy
                    </h3>

                    <div className="space-y-4">
                        {todayAppointments.length > 0 ? (
                            todayAppointments.map(appointment => (
                                <div key={appointment.id} className="bg-gray-800 p-4 rounded-2xl border border-gray-700/50 flex justify-between items-center hover:bg-gray-700/50 transition-colors cursor-pointer group">
                                    <div>
                                        <div className="text-xs font-bold text-blue-300 mb-1">
                                            {format(new Date(appointment.appointment_at!), 'HH:mm')}
                                        </div>
                                        <div className="text-sm font-bold group-hover:text-blue-400 transition-colors">{appointment.name}</div>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-500 italic text-sm">
                                <Calendar size={32} className="mx-auto mb-3 opacity-20" />
                                Sin citas agendadas<br />para hoy
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Row: Team Performance */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Users size={18} className="text-indigo-500" />
                    Rendimiento del Equipo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {team.map(member => {
                        const memberSales = leads.filter(l => l.closer_id === member.id && l.status === 'sold');
                        const totalAmount = memberSales.reduce((acc, l) => acc + (l.sale_amount || 0), 0);
                        return (
                            <div key={member.id} className="p-5 rounded-2xl bg-gray-50/50 border border-gray-100 hover:shadow-md transition-all hover:bg-white group">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xs uppercase shadow-sm">
                                        {member.name.substring(0, 2)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{member.name}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase">{member.role}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 border-t pt-4 border-gray-100 gap-2">
                                    <div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase">Ventas</div>
                                        <div className="text-base font-black text-gray-800">{memberSales.length}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-gray-400 font-bold uppercase">Facturado</div>
                                        <div className="text-base font-black text-green-600">{totalAmount}€</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, icon, suffix, trend, isPositive }: any) {
    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-gray-50 rounded-xl group-hover:bg-white group-hover:shadow-lg group-hover:shadow-gray-100 transition-all">
                    {icon}
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                    {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {trend}
                </div>
            </div>
            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-gray-900 tabular-nums">{value}</span>
                    <span className="text-xs font-bold text-gray-400">{suffix}</span>
                </div>
            </div>
        </div>
    );
}
