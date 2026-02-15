import React, { useMemo } from 'react';
import { Client, ClientStatus } from '../types';
import { CheckCircle2, AlertCircle, Clock, ChevronRight, User as UserIcon } from 'lucide-react';

interface ReviewsViewProps {
    clients: Client[];
    onNavigateToClient: (client: Client) => void;
}

const ReviewsView: React.FC<ReviewsViewProps> = ({ clients, onNavigateToClient }) => {

    // Logic to categorize clients
    const { pending, reviewed, notSent } = useMemo(() => {
        const activeClients = clients.filter(c => c.status === ClientStatus.ACTIVE);

        const pendingList: Client[] = [];
        const reviewedList: Client[] = [];
        const notSentList: Client[] = [];

        const now = new Date();
        // Start of review week (Friday) - Clients submit Fri-Sun, coaches review Mon-Tue
        // Week runs Friday to Thursday
        const day = now.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
        const daysBackToFriday = (day + 2) % 7; // How many days back to last Friday
        const startOfWeek = new Date(now);
        startOfWeek.setHours(0, 0, 0, 0);
        startOfWeek.setDate(now.getDate() - daysBackToFriday);

        activeClients.forEach(client => {
            // Check if client has a submission
            if (!client.last_checkin_submitted) {
                notSentList.push(client);
                return;
            }

            const checkinDate = new Date(client.last_checkin_submitted);
            const isSubmittedThisWeek = checkinDate >= startOfWeek;

            // Check if review was done this week (for coaches reviewing Mon-Tue)
            const reviewedAt = client.last_checkin_reviewed_at ? new Date(client.last_checkin_reviewed_at) : null;
            const isReviewedThisWeek = reviewedAt && reviewedAt >= startOfWeek;

            // Status check with improved logic
            if (client.last_checkin_status === 'pending_review') {
                if (isSubmittedThisWeek) {
                    pendingList.push(client);
                } else {
                    // Old pending check-in from previous weeks -> Not Sent
                    notSentList.push(client);
                }
            } else if (client.last_checkin_status === 'reviewed') {
                // Show as Reviewed if: submitted this week OR reviewed this week
                // This allows check-ins from last week's Fri-Sun to show as Reviewed
                // when coach reviews them on Mon-Tue of current week
                if (isSubmittedThisWeek || isReviewedThisWeek) {
                    reviewedList.push(client);
                } else {
                    // Client reviewed in past weeks but hasn't sent this week -> Not Sent
                    notSentList.push(client);
                }
            } else {
                // Fallback: If status is undefined but date is this week, assume pending
                if (isSubmittedThisWeek) {
                    pendingList.push(client);
                } else {
                    notSentList.push(client);
                }
            }
        });

        return { pending: pendingList, reviewed: reviewedList, notSent: notSentList };
    }, [clients]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Panel de Revisiones</h2>
                    <p className="text-slate-500">Gestiona el estado de los check-ins semanales de tus clientes activos.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* COLUMN 1: PENDIENTES */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full max-h-[calc(100vh-12rem)]">
                    <div className="p-4 border-b border-slate-100 bg-orange-50/50 rounded-t-2xl flex items-center justify-between sticky top-0">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                <Clock className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-slate-700">Pendientes de Revisión</h3>
                        </div>
                        <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            {pending.length}
                        </span>
                    </div>
                    <div className="p-4 overflow-y-auto space-y-3 flex-1">
                        {pending.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                                <p className="text-sm">¡Todo al día! No hay revisiones pendientes.</p>
                            </div>
                        ) : (
                            pending.map(client => (
                                <div
                                    key={client.id}
                                    onClick={() => onNavigateToClient(client)}
                                    className="p-3 bg-white border border-slate-200 rounded-xl hover:shadow-md hover:border-orange-200 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${client.name}`}
                                            alt={client.name}
                                            className="w-10 h-10 rounded-full bg-slate-100 object-cover"
                                        />
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-800 text-sm truncate group-hover:text-orange-600 transition-colors">{client.name}</p>
                                            <p className="text-xs text-slate-500">Enviado: {new Date(client.last_checkin_submitted!).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button className="text-xs font-bold text-orange-600 flex items-center gap-1 hover:underline">
                                            Revisar ahora <ChevronRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* COLUMN 2: REVISADOS (Esta semana) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full max-h-[calc(100vh-12rem)]">
                    <div className="p-4 border-b border-slate-100 bg-green-50/50 rounded-t-2xl flex items-center justify-between sticky top-0">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-slate-700">Revisados (Esta Semana)</h3>
                        </div>
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            {reviewed.length}
                        </span>
                    </div>
                    <div className="p-4 overflow-y-auto space-y-3 flex-1">
                        {reviewed.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                                <p className="text-sm">Aún no has revisado check-ins esta semana.</p>
                            </div>
                        ) : (
                            reviewed.map(client => (
                                <div
                                    key={client.id}
                                    onClick={() => onNavigateToClient(client)}
                                    className="p-3 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all cursor-pointer opacity-80 hover:opacity-100"
                                >
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${client.name}`}
                                            alt={client.name}
                                            className="w-10 h-10 rounded-full bg-slate-100 object-cover grayscale"
                                        />
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-800 text-sm truncate">{client.name}</p>
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-1">
                                                <CheckCircle2 className="w-3 h-3" /> Revisado
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* COLUMN 3: SIN ENVIAR (Esta semana) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full max-h-[calc(100vh-12rem)]">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl flex items-center justify-between sticky top-0">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-slate-700">Sin Enviar (Esta Semana)</h3>
                        </div>
                        <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full">
                            {notSent.length}
                        </span>
                    </div>
                    <div className="p-4 overflow-y-auto space-y-3 flex-1">
                        {notSent.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                                <p className="text-sm">¡Todos han enviado su check-in!</p>
                            </div>
                        ) : (
                            notSent.map(client => (
                                <div
                                    key={client.id}
                                    onClick={() => onNavigateToClient(client)}
                                    className="p-3 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img
                                                src={`https://ui-avatars.com/api/?name=${client.name}`}
                                                alt={client.name}
                                                className="w-10 h-10 rounded-full bg-slate-100 object-cover opacity-60"
                                            />
                                            <div className="absolute -bottom-1 -right-1 bg-red-50 text-red-500 p-0.5 rounded-full border border-white">
                                                <AlertCircle className="w-3 h-3" />
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-800 text-sm truncate group-hover:text-red-500 transition-colors">{client.name}</p>
                                            <p className="text-xs text-slate-400 italic">Esperando reporte...</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ReviewsView;
