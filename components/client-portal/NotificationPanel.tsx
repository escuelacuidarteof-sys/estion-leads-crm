import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bell, MessageSquare, Stethoscope, Pill, Calendar, ClipboardCheck, CheckCheck, X, ChevronRight } from 'lucide-react';
import { ClientNotification, getClientNotifications, timeAgo, isNotificationRead, markAllRead, pruneReadIds } from '../../services/notificationService';

interface NotificationPanelProps {
  clientId: string;
  onNavigate: (tab: string, view?: string) => void;
}

const ICON_MAP: Record<string, { icon: React.FC<any>; color: string; bg: string; label: string }> = {
  coach_reply:        { icon: MessageSquare,  color: 'text-brand-green',  bg: 'bg-brand-mint/60', label: 'Respuesta coach' },
  doctor_reply:       { icon: Stethoscope,    color: 'text-blue-600',     bg: 'bg-blue-50',       label: 'Respuesta médica' },
  treatment_reminder: { icon: Pill,           color: 'text-purple-600',   bg: 'bg-purple-50',     label: 'Tratamiento' },
  review_reminder:    { icon: Calendar,       color: 'text-indigo-600',   bg: 'bg-indigo-50',     label: 'Revisión' },
  checkin_reminder:   { icon: ClipboardCheck, color: 'text-amber-600',    bg: 'bg-amber-50',      label: 'Check-in' },
  class_reminder:     { icon: Calendar,       color: 'text-teal-600',     bg: 'bg-teal-50',       label: 'Clase' },
};

export function NotificationBell({ clientId, onNavigate }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, [clientId]);

  // Position the portal panel relative to the bell button
  const updatePosition = useCallback(() => {
    if (bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      setPanelPos({
        top: rect.bottom + 8,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    const handleClose = (e: MouseEvent) => {
      const target = e.target as Node;
      if (bellRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClose);
    window.addEventListener('resize', updatePosition);
    return () => {
      document.removeEventListener('mousedown', handleClose);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  const loadNotifications = async () => {
    const notifs = await getClientNotifications(clientId);
    setNotifications(notifs);
    pruneReadIds(clientId, notifs.map(n => n.id));
    setUnreadCount(notifs.filter(n => !isNotificationRead(clientId, n.id)).length);
  };

  const handleMarkAllRead = () => {
    markAllRead(clientId, notifications.map(n => n.id));
    setUnreadCount(0);
  };

  const handleNotifClick = (n: ClientNotification) => {
    const wasUnread = !isNotificationRead(clientId, n.id);
    markAllRead(clientId, [n.id]);
    if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleNavigate = (n: ClientNotification) => {
    handleNotifClick(n);
    if (n.action) onNavigate(n.action.tab, n.action.view);
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={bellRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors relative"
      >
        <Bell className="w-4.5 h-4.5 text-slate-500 dark:text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse min-w-[18px]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && createPortal(
        <div
          ref={panelRef}
          className="fixed w-[calc(100vw-1rem)] sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ top: panelPos.top, right: panelPos.right, zIndex: 9999 }}
        >
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Notificaciones
              {unreadCount > 0 && (
                <span className="ml-2 text-[10px] font-black text-white bg-red-500 px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-[10px] font-semibold text-brand-green hover:underline flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" /> Marcar leídas
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto bg-white dark:bg-slate-900">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Sin notificaciones</p>
              </div>
            ) : (
              notifications.map(n => {
                const isRead = isNotificationRead(clientId, n.id);
                const meta = ICON_MAP[n.type] || ICON_MAP.coach_reply;
                const Icon = meta.icon;
                const hasAction = !!n.action;
                return (
                  <div
                    key={n.id}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors ${!isRead ? 'bg-brand-mint/20' : 'bg-white dark:bg-slate-900'}`}
                  >
                    <div className={`w-9 h-9 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className={`w-4.5 h-4.5 ${meta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${meta.bg} ${meta.color}`}>
                          {meta.label}
                        </span>
                        {!isRead && (
                          <span className="text-[9px] font-bold uppercase text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                            Nuevo
                          </span>
                        )}
                      </div>
                      <p className={`text-sm font-bold leading-snug ${!isRead ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{n.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">{n.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{timeAgo(n.timestamp)}</p>
                        <div className="flex items-center gap-2">
                          {!isRead && (
                            <button
                              onClick={() => handleNotifClick(n)}
                              className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              Leído
                            </button>
                          )}
                          {hasAction && (
                            <button
                              onClick={() => handleNavigate(n)}
                              className="text-[10px] font-bold text-brand-green hover:text-brand-dark flex items-center gap-0.5 bg-brand-mint/40 hover:bg-brand-mint/70 px-2 py-1 rounded-lg transition-colors"
                            >
                              Ver <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
