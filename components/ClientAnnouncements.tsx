import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, Info, AlertCircle, CircleCheck, AlertTriangle, ChevronRight } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface Announcement {
    id: string;
    created_at: string;
    created_by: string;
    title: string;
    message: string;
    announcement_type: 'info' | 'important' | 'warning' | 'success';
    priority: number;
    icon: string;
    color: string;
    action_url: string;
    action_label: string;
    show_as_modal: boolean;
    expires_at: string;
    target_audience: string;
    client_ids?: string[];
    coach_filter?: string;
}

interface ClientAnnouncementsProps {
    clientId: string;
    coachId?: string;
    inline?: boolean;
}

export function ClientAnnouncements({ clientId, coachId, inline = false }: ClientAnnouncementsProps) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [modalAnnouncement, setModalAnnouncement] = useState<Announcement | null>(null);
    const [showFeed, setShowFeed] = useState(false);

    console.log('🔔 ClientAnnouncements component mounted for client:', clientId, 'Coach:', coachId);

    const isRelevantForClient = (announcement: Announcement) => {
        // 1. Global announcements (Admin/System wide)
        if (announcement.target_audience === 'all_active_clients' || announcement.target_audience === 'all_active') {
            return true;
        }

        // 2. "My Clients" announcements - ONLY if created by MY coach
        if (announcement.target_audience === 'my_clients') {
            return coachId && announcement.created_by === coachId;
        }

        // 3. Specific targeted announcements
        if (announcement.client_ids && Array.isArray(announcement.client_ids)) {
            // Note: In Supabase payload, arrays are pure arrays.
            // We need to ensure types match.
            return announcement.client_ids.includes(clientId);
        }
        return false;
    };

    useEffect(() => {
        loadAnnouncements();

        // 🔔 REALTIME SUBSCRIPTION FOR CLIENTS
        const sanitizedId = clientId.replace(/[^\w]/g, '').slice(0, 10);
        const channel = supabase
            .channel(`cl_ann_${sanitizedId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'announcements' },
                (payload) => {
                    const newAnnouncement = payload.new as any; // Cast to any to handle slightly different payload shapes if needed
                    console.log("New announcement received via Realtime (Client):", newAnnouncement);

                    if (isRelevantForClient(newAnnouncement)) {
                        setAnnouncements(prev => [newAnnouncement, ...prev]);

                        // Check if read
                        supabase
                            .from('announcement_reads')
                            .select('announcement_id')
                            .eq('announcement_id', newAnnouncement.id)
                            .eq('client_id', clientId)
                            .maybeSingle()
                            .then(({ data }) => {
                                if (!data) {
                                    setUnreadCount(prev => prev + 1);
                                    // Pop up if modal
                                    if (newAnnouncement.show_as_modal) {
                                        // Play sound
                                        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                                        audio.volume = 0.5;
                                        audio.play().catch(e => console.log("Audio play failed interaction", e));

                                        setModalAnnouncement(newAnnouncement);
                                        setShowModal(true);
                                    }
                                }
                            });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [clientId, coachId]);

    const loadAnnouncements = async () => {
        console.log('🔍 Loading announcements for client:', clientId);

        try {
            // Get announcements targeted to this client
            const { data: allAnnouncements, error } = await supabase
                .from('announcements')
                .select('*')
                .eq('is_active', true)
                .order('published_at', { ascending: false }); // Strict chronological order

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            if (allAnnouncements) {
                // Filter announcements targeted to this client
                const targetedAnnouncements = allAnnouncements.filter(isRelevantForClient);

                // Filter out expired announcements
                const now = new Date();
                const activeAnnouncements = targetedAnnouncements.filter(a =>
                    !a.expires_at || new Date(a.expires_at) > now
                );

                // Get read status
                const { data: reads } = await supabase
                    .from('announcement_reads')
                    .select('announcement_id')
                    .eq('client_id', clientId);

                const readIds = new Set(reads?.map(r => r.announcement_id) || []);
                const unread = activeAnnouncements.filter(a => !readIds.has(a.id));

                setAnnouncements(activeAnnouncements);
                setUnreadCount(unread.length);

                // Show modal for high-priority unread announcements
                const urgentUnread = unread.find(a => a.show_as_modal && a.priority >= 1);

                if (urgentUnread) {
                    setModalAnnouncement(urgentUnread);
                    setShowModal(true);
                }
            }
        } catch (error) {
            console.error('Error loading announcements:', error);
        }
    };

    const markAsRead = async (announcementId: string) => {
        try {
            await supabase
                .from('announcement_reads')
                .upsert({
                    announcement_id: announcementId,
                    client_id: clientId,
                    read_at: new Date().toISOString()
                }, { onConflict: 'announcement_id,client_id' });

            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const dismissModal = () => {
        if (modalAnnouncement) {
            markAsRead(modalAnnouncement.id);
        }
        setShowModal(false);
        setModalAnnouncement(null);
    };

    const getAnnouncementStyle = (announcement: Announcement) => {
        const styles = {
            info: {
                bg: 'bg-blue-50',
                border: 'border-blue-200',
                text: 'text-blue-800',
                icon: <Info className="w-5 h-5" />
            },
            important: {
                bg: 'bg-purple-50',
                border: 'border-purple-200',
                text: 'text-purple-800',
                icon: <Bell className="w-5 h-5" />
            },
            warning: {
                bg: 'bg-yellow-50',
                border: 'border-yellow-200',
                text: 'text-yellow-800',
                icon: <AlertTriangle className="w-5 h-5" />
            },
            success: {
                bg: 'bg-green-50',
                border: 'border-green-200',
                text: 'text-green-800',
                icon: <CircleCheck className="w-5 h-5" />
            }
        };

        return styles[announcement.announcement_type] || styles.info;
    };

    const renderAnnouncementList = () => (
        announcements.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
                <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs">No hay novedades</p>
            </div>
        ) : (
            <div className="divide-y divide-slate-100">
                {announcements.map((announcement) => {
                    const style = getAnnouncementStyle(announcement);
                    return (
                        <div
                            key={announcement.id}
                            className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                            onClick={() => markAsRead(announcement.id)}
                        >
                            <div className="flex gap-3">
                                <div className={`p-2 ${style.bg} rounded-lg ${style.text} shrink-0`}>
                                    {style.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-800 text-sm mb-0.5">
                                        {announcement.title}
                                    </h4>
                                    <p className="text-xs text-slate-600 whitespace-pre-line line-clamp-2">
                                        {announcement.message}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        {new Date(announcement.created_at).toLocaleDateString('es-ES', {
                                            day: 'numeric',
                                            month: 'short',
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )
    );

    if (inline) {
        return (
            <>
                {renderAnnouncementList()}
                {/* Modal for Important Announcements */}
                {showModal && modalAnnouncement && typeof document !== 'undefined' && createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                            {(() => {
                                const style = getAnnouncementStyle(modalAnnouncement);
                                return (
                                    <>
                                        <div className={`p-6 ${style.bg} ${style.text} border-b ${style.border}`}>
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-white/50 rounded-xl">{style.icon}</div>
                                                <div className="flex-1">
                                                    <h3 className="text-xl font-bold mb-1">{modalAnnouncement.title}</h3>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <p className="text-slate-700 whitespace-pre-line leading-relaxed">{modalAnnouncement.message}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                                            <button onClick={dismissModal} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2">
                                                <CircleCheck className="w-5 h-5" /> Entendido
                                            </button>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>,
                    document.body
                )}
            </>
        );
    }

    return (
        <>
            {/* Notification Bell Button */}
            <button
                onClick={() => setShowFeed(!showFeed)}
                className="relative p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all backdrop-blur-sm border border-white/30"
            >
                <Bell className="w-6 h-6 text-white" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Announcements Feed Dropdown */}
            {showFeed && (
                <div className="absolute right-0 top-16 w-96 max-h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in slide-in-from-top-4 duration-200">
                    <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg">Anuncios</h3>
                            <button
                                onClick={() => setShowFeed(false)}
                                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {unreadCount > 0 && (
                            <p className="text-sm text-purple-100 mt-1">
                                {unreadCount} {unreadCount === 1 ? 'nuevo' : 'nuevos'}
                            </p>
                        )}
                    </div>

                    <div className="overflow-y-auto max-h-[500px]">
                        {renderAnnouncementList()}
                    </div>
                </div>
            )}

            {/* Modal for Important Announcements */}
            {showModal && modalAnnouncement && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        {(() => {
                            const style = getAnnouncementStyle(modalAnnouncement);
                            return (
                                <>
                                    <div className={`p-6 ${style.bg} ${style.text} border-b ${style.border}`}>
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-white/50 rounded-xl">
                                                {modalAnnouncement.icon || style.icon}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold mb-1">
                                                    {modalAnnouncement.title}
                                                </h3>
                                                <p className="text-sm opacity-80">
                                                    De: {modalAnnouncement.created_by}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                                            {modalAnnouncement.message}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                                        {modalAnnouncement.action_url && (
                                            <button
                                                onClick={() => {
                                                    window.open(modalAnnouncement.action_url, '_blank');
                                                    dismissModal();
                                                }}
                                                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors"
                                            >
                                                {modalAnnouncement.action_label || 'Ver más'}
                                            </button>
                                        )}
                                        <button
                                            onClick={dismissModal}
                                            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-200"
                                        >
                                            <CircleCheck className="w-5 h-5" />
                                            Confirmar Lectura
                                        </button>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
