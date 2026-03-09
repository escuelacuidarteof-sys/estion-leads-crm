import React, { useMemo, useState } from 'react';
import { AlertCircle, Link2, Send, Users, X } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { Client, ClientStatus } from '../types';
import { useToast } from './ToastProvider';

interface CreateAnnouncementProps {
    currentUser: string;
    isAdmin: boolean;
    clients: Client[];
    onClose: () => void;
    onSuccess?: () => void;
    defaultAudience?: 'all_active' | 'my_clients' | 'all_team';
    prefill?: {
        title: string;
        message: string;
        target?: 'all_active' | 'my_clients' | 'all_team';
        telegram?: boolean;
        sentBy?: string;
    };
}

const TELEGRAM_ALLOWED_SENDERS = ['Odile', 'Jesús', 'Jose Pedro'] as const;
const TELEGRAM_BROADCAST_WEBHOOK_FALLBACK = 'https://escuelacuidarte-n8n.pqtiji.easypanel.host/webhook/mensaje_clientes';

export const CreateAnnouncement: React.FC<CreateAnnouncementProps> = ({
    currentUser,
    isAdmin,
    clients,
    onClose,
    onSuccess,
    defaultAudience,
    prefill,
}) => {
    const [title, setTitle] = useState(prefill?.title || '');
    const [message, setMessage] = useState(prefill?.message || '');
    const [link, setLink] = useState('');
    const [telegramWebhookUrl, setTelegramWebhookUrl] = useState<string>(TELEGRAM_BROADCAST_WEBHOOK_FALLBACK);
    const [telegramWebhookEnabled, setTelegramWebhookEnabled] = useState(true);
    const [telegramSender, setTelegramSender] = useState<string>(
        TELEGRAM_ALLOWED_SENDERS.includes(prefill?.sentBy as typeof TELEGRAM_ALLOWED_SENDERS[number])
            ? (prefill?.sentBy as string)
            : 'Odile'
    );
    const [targetAudience, setTargetAudience] = useState<'my_clients' | 'all_active'>(
        prefill?.target === 'my_clients' || defaultAudience === 'my_clients'
            ? 'my_clients'
            : (isAdmin ? 'all_active' : 'my_clients')
    );
    const [isSaving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const toast = useToast();

    React.useEffect(() => {
        const fetchData = async () => {
            const { data: settingsData } = await supabase
                .from('app_settings')
                .select('setting_key, setting_value')
                .in('setting_key', ['n8n_webhook_telegram_broadcast', 'n8n_webhook_telegram_enabled', 'n8n_webhook_enabled']);

            if (settingsData) {
                const webhookUrl = settingsData.find((s: any) => s.setting_key === 'n8n_webhook_telegram_broadcast')?.setting_value;
                const webhookEnabled = settingsData.find((s: any) => s.setting_key === 'n8n_webhook_telegram_enabled')?.setting_value;
                const fallbackEnabled = settingsData.find((s: any) => s.setting_key === 'n8n_webhook_enabled')?.setting_value;

                setTelegramWebhookUrl(webhookUrl || TELEGRAM_BROADCAST_WEBHOOK_FALLBACK);
                setTelegramWebhookEnabled(
                    webhookEnabled === 'true' ||
                    fallbackEnabled === 'true' ||
                    Boolean(webhookUrl)
                );
            }
        };
        fetchData();
    }, []);

    const activeClients = useMemo(() => clients.filter(c => c.status === ClientStatus.ACTIVE), [clients]);

    const targetedClients = useMemo(() => {
        if (targetAudience === 'my_clients') {
            return activeClients.filter(c => c.coach_id === currentUser);
        }
        return activeClients;
    }, [activeClients, currentUser, targetAudience]);

    const validTelegramTargets = useMemo(
        () => targetedClients.filter(c => c.telegram_group_id && c.telegram_group_id.startsWith('-100')),
        [targetedClients]
    );

    const handleSend = async () => {
        if (!title.trim()) {
            const err = 'Añade un titulo o motivo';
            setError(err);
            toast.error(err);
            return;
        }

        if (!message.trim()) {
            const err = 'Escribe el mensaje';
            setError(err);
            toast.error(err);
            return;
        }

        if (!telegramWebhookEnabled || !telegramWebhookUrl) {
            const err = 'El webhook de Telegram esta desactivado o no configurado.';
            setError(err);
            toast.error(err);
            return;
        }

        if (!TELEGRAM_ALLOWED_SENDERS.includes(telegramSender as typeof TELEGRAM_ALLOWED_SENDERS[number])) {
            const err = 'Remitente no permitido';
            setError(err);
            toast.error(err);
            return;
        }

        if (validTelegramTargets.length === 0) {
            const err = 'No hay grupos de Telegram validos para el envio.';
            setError(err);
            toast.error(err);
            return;
        }

        setSaving(true);
        setError('');

        try {
            const payload = {
                title: title.trim(),
                message: message.trim(),
                sent_by: telegramSender,
                link: link.trim() || null,
                source: 'crm_mass_communication',
                sent_at: new Date().toISOString(),
                target_audience: targetAudience,
                target_client_ids: validTelegramTargets.map(c => c.id),
            };

            const response = await fetch(telegramWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`n8n respondio ${response.status}: ${errorText || 'Error desconocido'}`);
            }

            toast.success(`Mensaje enviado por Telegram a ${validTelegramTargets.length} grupos`);
            onSuccess?.();
            onClose();
        } catch (err: any) {
            const errMsg = err?.message || 'No se pudo enviar el mensaje por Telegram';
            setError(errMsg);
            toast.error(errMsg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-gradient-to-r from-sky-600 to-blue-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <Send className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Envio por Telegram</h2>
                                <p className="text-sky-100 text-sm">Solo envia titulo, mensaje, remitente y enlace opcional</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
                    {isAdmin && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Destinatarios</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <button
                                    onClick={() => setTargetAudience('my_clients')}
                                    className={`p-4 rounded-xl border-2 transition-all ${targetAudience === 'my_clients' ? 'border-sky-500 bg-sky-50' : 'border-slate-200 hover:border-sky-200'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Users className={`w-5 h-5 ${targetAudience === 'my_clients' ? 'text-sky-600' : 'text-slate-400'}`} />
                                        <div className="text-left">
                                            <p className="font-bold text-slate-800">Mis clientes</p>
                                            <p className="text-xs text-slate-500">{activeClients.filter(c => c.coach_id === currentUser).length} clientes</p>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setTargetAudience('all_active')}
                                    className={`p-4 rounded-xl border-2 transition-all ${targetAudience === 'all_active' ? 'border-sky-500 bg-sky-50' : 'border-slate-200 hover:border-sky-200'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Users className={`w-5 h-5 ${targetAudience === 'all_active' ? 'text-sky-600' : 'text-slate-400'}`} />
                                        <div className="text-left">
                                            <p className="font-bold text-slate-800">Todos los clientes activos</p>
                                            <p className="text-xs text-slate-500">{activeClients.length} clientes</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Enviar como</label>
                        <select
                            value={telegramSender}
                            onChange={(e) => setTelegramSender(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white"
                        >
                            {TELEGRAM_ALLOWED_SENDERS.map(sender => (
                                <option key={sender} value={sender}>{sender}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Titulo o motivo</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej: Recordatorio semanal"
                            className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Mensaje</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={6}
                            placeholder="Escribe el mensaje para Telegram"
                            className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Enlace (opcional)</label>
                        <div className="relative">
                            <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="url"
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                placeholder="https://..."
                                className="w-full pl-9 pr-3 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                            />
                        </div>
                    </div>

                    <div className="p-3 rounded-xl border border-sky-200 bg-sky-50 text-sky-800 text-sm">
                        Se enviara a <strong>{validTelegramTargets.length}</strong> grupos de Telegram validos.
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-6 py-3 text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 font-medium disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={isSaving}
                        className="px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        <Send className="w-5 h-5" />
                        {isSaving ? 'Enviando...' : 'Enviar por Telegram'}
                    </button>
                </div>
            </div>
        </div>
    );
};
