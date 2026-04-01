import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Clock, User, Video, Sparkles } from 'lucide-react';
import { CalendarItem } from '../../types';
import { getCalendarItems } from '../../services/eventService';

interface AgendaViewProps {
  clientId: string;
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function formatTime(time?: string): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  return `${h}:${m}`;
}

function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  if (diff > 1 && diff <= 6) return `En ${diff} días`;
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

function getWeekDays(baseDate: Date): { date: string; day: number; dayName: string; isToday: boolean }[] {
  const monday = new Date(baseDate);
  const dayOfWeek = monday.getDay();
  monday.setDate(monday.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    days.push({
      date: dateStr,
      day: d.getDate(),
      dayName: DAY_NAMES_SHORT[d.getDay()],
      isToday: dateStr === todayStr,
    });
  }
  return days;
}

export function AgendaView({ clientId }: AgendaViewProps) {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekBase, setWeekBase] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const weekDays = useMemo(() => getWeekDays(weekBase), [weekBase]);

  // Fetch 90 days of events from today
  const dateRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
    const end = new Date(now.getTime() + 90 * 86400000).toISOString().split('T')[0];
    return { start, end };
  }, []);

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

  // Events for the week strip (dots)
  const weekEventDates = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of items) {
      const existing = map.get(item.date) || [];
      existing.push(item);
      map.set(item.date, existing);
    }
    return map;
  }, [items]);

  // Items for selected day or upcoming list
  const displayItems = useMemo(() => {
    if (selectedDay) {
      return items.filter(i => i.date === selectedDay);
    }
    // Show upcoming (from today onwards)
    return items.filter(i => i.date >= todayStr);
  }, [items, selectedDay, todayStr]);

  // Group by date
  const groupedItems = useMemo(() => {
    const groups: { date: string; items: CalendarItem[] }[] = [];
    for (const item of displayItems) {
      const last = groups[groups.length - 1];
      if (last && last.date === item.date) {
        last.items.push(item);
      } else {
        groups.push({ date: item.date, items: [item] });
      }
    }
    return groups;
  }, [displayItems]);

  const navigateWeek = (dir: number) => {
    setWeekBase(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + dir * 7);
      return d;
    });
  };

  const goToToday = () => {
    setWeekBase(new Date());
    setSelectedDay(null);
  };

  // Week label
  const weekLabel = useMemo(() => {
    const first = weekDays[0];
    const last = weekDays[6];
    const fDate = new Date(first.date + 'T12:00:00');
    const lDate = new Date(last.date + 'T12:00:00');
    if (fDate.getMonth() === lDate.getMonth()) {
      return `${fDate.getDate()} - ${lDate.getDate()} ${MONTH_NAMES[fDate.getMonth()]} ${fDate.getFullYear()}`;
    }
    return `${fDate.getDate()} ${MONTH_NAMES[fDate.getMonth()]} - ${lDate.getDate()} ${MONTH_NAMES[lDate.getMonth()]}`;
  }, [weekDays]);

  const isCurrentWeek = weekDays.some(d => d.isToday);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-black text-brand-dark dark:text-white text-xl">Agenda</h2>
        {!isCurrentWeek && (
          <button
            onClick={goToToday}
            className="text-[11px] font-bold text-brand-green bg-brand-mint/50 hover:bg-brand-mint px-3 py-1.5 rounded-xl transition-colors"
          >
            Hoy
          </button>
        )}
      </div>

      {/* Week strip */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Week nav */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-700">
          <button onClick={() => navigateWeek(-1)} className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-100 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
          </button>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{weekLabel}</span>
          <button onClick={() => navigateWeek(1)} className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-100 transition-colors">
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>

        {/* Day pills */}
        <div className="flex justify-around px-2 py-3">
          {weekDays.map(day => {
            const dayEvents = weekEventDates.get(day.date) || [];
            const hasEvents = dayEvents.length > 0;
            const isSelected = selectedDay === day.date;
            const isToday = day.isToday;

            return (
              <button
                key={day.date}
                onClick={() => setSelectedDay(isSelected ? null : day.date)}
                className={`
                  flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all min-w-[40px]
                  ${isSelected ? 'bg-brand-green text-white shadow-md scale-105' : ''}
                  ${isToday && !isSelected ? 'bg-brand-mint/50 dark:bg-brand-green/10' : ''}
                  ${!isSelected && !isToday ? 'hover:bg-slate-50 dark:hover:bg-slate-700' : ''}
                `}
              >
                <span className={`text-[9px] font-bold uppercase ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                  {day.dayName}
                </span>
                <span className={`text-sm font-black ${isSelected ? 'text-white' : isToday ? 'text-brand-green' : 'text-slate-700 dark:text-slate-300'}`}>
                  {day.day}
                </span>
                <div className="flex gap-0.5 h-1.5">
                  {hasEvents && dayEvents.slice(0, 3).map((item, j) => (
                    <div
                      key={j}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : item.color }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Content */}
      {!loading && (
        <>
          {/* Section header */}
          {selectedDay ? (
            <div className="flex items-center justify-between px-1">
              <h3 className="font-heading font-bold text-sm text-slate-600 dark:text-slate-300 capitalize">
                {formatRelativeDate(selectedDay)}
                <span className="text-slate-300 ml-1.5 normal-case text-xs font-normal">
                  {new Date(selectedDay + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                </span>
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600"
              >
                Ver todos
              </button>
            </div>
          ) : (
            <h3 className="font-heading font-bold text-sm text-slate-600 dark:text-slate-300 px-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
              Próximos eventos
            </h3>
          )}

          {/* Event list */}
          {groupedItems.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-8 text-center">
              <CalendarDays className="w-8 h-8 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-medium">
                {selectedDay ? 'Sin eventos este día' : 'No hay eventos próximos'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {groupedItems.map(group => (
                <div key={group.date}>
                  {!selectedDay && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-1.5 capitalize">
                      {formatRelativeDate(group.date)}
                      {group.date !== todayStr && (
                        <span className="text-slate-300 ml-1.5 normal-case">
                          {new Date(group.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </p>
                  )}
                  <div className="space-y-2">
                    {group.items.map(item => (
                      <EventCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EventCard({ item }: { item: CalendarItem }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        {/* Time column */}
        <div className="flex-shrink-0 w-14 text-center pt-0.5">
          {item.time ? (
            <>
              <p className="text-sm font-black text-slate-800 dark:text-slate-200 leading-tight">{formatTime(item.time)}</p>
              {item.endTime && (
                <p className="text-[9px] text-slate-400 font-medium">{formatTime(item.endTime)}</p>
              )}
            </>
          ) : (
            <p className="text-[10px] font-bold text-slate-400 mt-1">Todo el día</p>
          )}
        </div>

        {/* Color bar */}
        <div className="w-1 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
              style={{ backgroundColor: item.color + '18', color: item.color }}
            >
              {item.category}
            </span>
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">{item.title}</p>
          {item.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{item.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2.5 mt-1.5">
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
              className="inline-flex items-center gap-1.5 mt-2.5 text-[11px] font-bold text-white bg-brand-green hover:bg-brand-green/90 px-4 py-2 rounded-xl transition-colors shadow-sm"
            >
              <Video className="w-3.5 h-3.5" /> Unirme
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
