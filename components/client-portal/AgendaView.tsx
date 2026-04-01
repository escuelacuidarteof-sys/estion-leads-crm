import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CalendarDays, List, ChevronLeft, ChevronRight, MapPin, Clock, ExternalLink, User, Video } from 'lucide-react';
import { CalendarItem } from '../../types';
import { getCalendarItems } from '../../services/eventService';

interface AgendaViewProps {
  clientId: string;
}

const SOURCE_LABELS: Record<string, string> = {
  event: 'Evento',
  treatment: 'Tratamiento',
  appointment: 'Cita',
};

const DAY_NAMES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function formatTime(time?: string): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  return `${h}:${m}`;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function AgendaView({ clientId }: AgendaViewProps) {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Date range for current view
  const dateRange = useMemo(() => {
    if (viewMode === 'calendar') {
      const start = `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(calendarMonth.year, calendarMonth.month + 1, 0).getDate();
      const end = `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      return { start, end };
    }
    // List view: next 60 days
    const now = new Date();
    const start = now.toISOString().split('T')[0];
    const future = new Date(now.getTime() + 60 * 86400000);
    const end = future.toISOString().split('T')[0];
    return { start, end };
  }, [viewMode, calendarMonth]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCalendarItems(clientId, dateRange.start, dateRange.end);
      setItems(data);
    } catch (err) {
      console.warn('Error loading calendar items:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId, dateRange]);

  useEffect(() => { loadItems(); }, [loadItems]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const { year, month } = calendarMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;

    const days: { date: string; day: number; isCurrentMonth: boolean; items: CalendarItem[] }[] = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d.toISOString().split('T')[0], day: d.getDate(), isCurrentMonth: false, items: [] });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date: dateStr, day: d, isCurrentMonth: true, items: [] });
    }

    for (const item of items) {
      const dayEntry = days.find(d => d.date === item.date);
      if (dayEntry) dayEntry.items.push(item);
    }

    while (days.length % 7 !== 0) {
      const d = new Date(year, month + 1, days.length - lastDay.getDate() - startOffset + 1);
      days.push({ date: d.toISOString().split('T')[0], day: d.getDate(), isCurrentMonth: false, items: [] });
    }

    return days;
  }, [calendarMonth, items]);

  const selectedDayItems = selectedDay ? items.filter(i => i.date === selectedDay) : [];

  // List view: group by date
  const groupedItems = useMemo(() => {
    const groups: { date: string; items: CalendarItem[] }[] = [];
    for (const item of items) {
      const last = groups[groups.length - 1];
      if (last && last.date === item.date) {
        last.items.push(item);
      } else {
        groups.push({ date: item.date, items: [item] });
      }
    }
    return groups;
  }, [items]);

  const navigateMonth = (dir: number) => {
    setCalendarMonth(prev => {
      let m = prev.month + dir;
      let y = prev.year;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      return { year: y, month: m };
    });
    setSelectedDay(null);
  };

  // Shared event card
  const EventCard = ({ item }: { item: CalendarItem }) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 flex gap-3 shadow-sm">
      <div className="flex-shrink-0 mt-1">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
            style={{ backgroundColor: item.color + '20', color: item.color }}
          >
            {item.category}
          </span>
          <span className="text-[9px] font-semibold text-slate-400 uppercase">
            {SOURCE_LABELS[item.source]}
          </span>
        </div>
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">{item.title}</p>
        {item.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{item.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-3 mt-2">
          {item.time && (
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatTime(item.time)}{item.endTime ? ` - ${formatTime(item.endTime)}` : ''}
            </span>
          )}
          {item.speaker && (
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <User className="w-3 h-3" /> {item.speaker}
            </span>
          )}
          {item.location && (
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {item.location}
            </span>
          )}
        </div>
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-brand-green bg-brand-mint/40 hover:bg-brand-mint/70 px-3 py-1.5 rounded-xl transition-colors"
          >
            <Video className="w-3.5 h-3.5" /> Unirse
          </a>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-black text-brand-dark dark:text-white text-xl">Agenda</h2>
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-brand-green text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <CalendarDays className="w-3.5 h-3.5" /> Calendario
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-brand-green text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <List className="w-3.5 h-3.5" /> Lista
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && viewMode === 'calendar' && (
        <div className="space-y-4">
          {/* Month nav */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => navigateMonth(-1)} className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-100 transition-colors">
                <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
              <h3 className="font-heading font-black text-brand-dark dark:text-white text-base">
                {MONTH_NAMES[calendarMonth.month]} {calendarMonth.year}
              </h3>
              <button onClick={() => navigateMonth(1)} className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-100 transition-colors">
                <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAY_NAMES.map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                const isToday = day.date === todayStr;
                const isSelected = day.date === selectedDay;
                const hasItems = day.items.length > 0;

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(isSelected ? null : day.date)}
                    className={`
                      aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-all relative
                      ${!day.isCurrentMonth ? 'text-slate-300 dark:text-slate-600' : 'text-slate-700 dark:text-slate-300'}
                      ${isToday ? 'ring-2 ring-brand-green ring-offset-1' : ''}
                      ${isSelected ? 'bg-brand-mint dark:bg-brand-green/20 font-black' : hasItems ? 'hover:bg-slate-50 dark:hover:bg-slate-700' : ''}
                    `}
                  >
                    <span>{day.day}</span>
                    {hasItems && (
                      <div className="flex gap-0.5">
                        {day.items.slice(0, 3).map((item, j) => (
                          <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                        ))}
                        {day.items.length > 3 && (
                          <span className="text-[7px] text-slate-400 font-bold">+{day.items.length - 3}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 px-1">
            {[
              { label: 'Eventos', color: '#6BA06B' },
              { label: 'Tratamiento', color: '#7c3aed' },
              { label: 'Cita coach', color: '#3b82f6' },
            ].map(l => (
              <span key={l.label} className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                {l.label}
              </span>
            ))}
          </div>

          {/* Selected day detail */}
          {selectedDay && (
            <div className="space-y-3">
              <h4 className="font-heading font-bold text-sm text-slate-600 dark:text-slate-300 capitalize px-1">
                {formatDateLabel(selectedDay)}
              </h4>
              {selectedDayItems.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 text-center">
                  <p className="text-sm text-slate-400">Sin eventos este día</p>
                </div>
              ) : (
                selectedDayItems.map(item => <EventCard key={item.id} item={item} />)
              )}
            </div>
          )}
        </div>
      )}

      {!loading && viewMode === 'list' && (
        <div className="space-y-4">
          {groupedItems.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-8 text-center">
              <CalendarDays className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">No hay eventos próximos</p>
              <p className="text-xs text-slate-300 mt-1">Los próximos 60 días están libres</p>
            </div>
          ) : (
            groupedItems.map(group => (
              <div key={group.date}>
                <h4 className="font-heading font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide px-1 mb-2 capitalize">
                  {formatDateLabel(group.date)}
                  <span className="text-slate-300 ml-2 normal-case">
                    {new Date(group.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </span>
                </h4>
                <div className="space-y-2">
                  {group.items.map(item => <EventCard key={item.id} item={item} />)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
